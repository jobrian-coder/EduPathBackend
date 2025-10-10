from django.db import models
from django.utils.text import slugify
from apps.authentication.models import User
import uuid


class CareerHub(models.Model):
    """Career-specific community hubs"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True, null=True)
    field = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True)
    icon = models.CharField(max_length=10, default='💼')
    icon_url = models.CharField(max_length=500, blank=True, null=True)  # For storing icon image path
    color = models.CharField(max_length=50)
    banner_image = models.ImageField(upload_to='hub_banners/', blank=True, null=True)
    description = models.TextField()
    rules = models.TextField(blank=True, null=True)
    related_societies = models.JSONField(default=list, blank=True, help_text='List of related professional societies')
    members = models.ManyToManyField(User, related_name='joined_hubs', blank=True)
    member_count = models.IntegerField(default=0)
    active_posts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'career_hubs'
        ordering = ['-member_count']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            base_slug = slugify(self.name)
            slug_candidate = base_slug
            counter = 1

            while CareerHub.objects.filter(slug=slug_candidate).exclude(pk=self.pk).exists():
                counter += 1
                slug_candidate = f"{base_slug}-{counter}"

            self.slug = slug_candidate

        super().save(*args, **kwargs)

    def update_member_count(self):
        self.member_count = self.members.count()
        self.save(update_fields=['member_count'])

    def get_active_posts_count(self):
        """Get the actual count of posts in this hub"""
        return self.posts.filter(is_deleted=False).count()

    def update_active_posts(self):
        self.active_posts = self.posts.count()
        self.save(update_fields=['active_posts'])


class Post(models.Model):
    """Forum posts"""
    
    POST_TYPES = [
        ('question', 'Question'),
        ('guide', 'Guide'),
        ('discussion', 'Discussion'),
        ('success_story', 'Success Story'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hub = models.ForeignKey(CareerHub, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='posts')
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=350, unique=True, blank=True, null=True)
    content = models.TextField()
    post_type = models.CharField(max_length=20, choices=POST_TYPES)
    is_expert_post = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    
    # Vote tracking
    upvotes = models.IntegerField(default=0)
    downvotes = models.IntegerField(default=0)
    score = models.IntegerField(default=0, help_text='Cached upvotes - downvotes')
    
    # Engagement metrics
    view_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    
    # Flags
    is_pinned = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)  # Manual update to track content changes
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    edited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='edited_posts')
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hub', '-created_at']),
            models.Index(fields=['post_type']),
            models.Index(fields=['slug']),
            models.Index(fields=['-score', '-created_at']),
            models.Index(fields=['is_deleted', '-created_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        from django.utils import timezone
        
        # Auto-generate slug from title
        if not self.slug and self.title:
            base_slug = slugify(self.title)[:300]
            slug_candidate = base_slug
            counter = 1
            
            while Post.objects.filter(slug=slug_candidate).exclude(pk=self.pk).exists():
                counter += 1
                slug_candidate = f"{base_slug}-{counter}"
            
            self.slug = slug_candidate
        
        # Update score cache
        self.score = self.upvotes - self.downvotes
        
        # Set updated_at manually on content change
        if self.pk:
            original = Post.objects.filter(pk=self.pk).first()
            if original and (original.content != self.content or original.title != self.title):
                self.updated_at = timezone.now()
                self.is_edited = True
            # Don't update updated_at for vote changes
        else:
            # New post - always set updated_at
            self.updated_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def update_score(self):
        """Recalculate score from votes table"""
        from django.db.models import Count, Q
        votes = Vote.objects.filter(votable_type='post', votable_id=self.id).aggregate(
            upvotes=Count('id', filter=Q(vote_type='upvote')),
            downvotes=Count('id', filter=Q(vote_type='downvote'))
        )
        self.upvotes = votes['upvotes'] or 0
        self.downvotes = votes['downvotes'] or 0
        self.score = self.upvotes - self.downvotes
        self.save(update_fields=['upvotes', 'downvotes', 'score'])


class Comment(models.Model):
    """Threaded comments on posts"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='comments')
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    
    # Thread optimization
    depth = models.IntegerField(default=0, help_text='Nesting level for optimization')
    path = models.CharField(max_length=500, blank=True, null=True, help_text='Ancestry path like 1.3.5 for nested retrieval')
    
    # Vote tracking
    upvotes = models.IntegerField(default=0)
    downvotes = models.IntegerField(default=0)
    score = models.IntegerField(default=0, help_text='Cached upvotes - downvotes')
    
    # Engagement
    reply_count = models.IntegerField(default=0)
    mention_list = models.JSONField(default=list, blank=True, help_text='Tagged usernames')
    
    # Flags
    is_deleted = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)  # Manual update
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'comments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post', 'parent_comment']),
            models.Index(fields=['path']),
        ]
    
    def __str__(self):
        return f"Comment by {self.author.username if self.author else 'Deleted User'}"
    
    def save(self, *args, **kwargs):
        from django.utils import timezone
        
        # Update score cache
        self.score = self.upvotes - self.downvotes
        
        # Calculate depth and path for threading
        if self.parent_comment:
            self.depth = self.parent_comment.depth + 1
            if self.parent_comment.path:
                self.path = f"{self.parent_comment.path}.{self.parent_comment.id}"
            else:
                self.path = str(self.parent_comment.id)
        else:
            self.depth = 0
            self.path = None
        
        # Set updated_at manually on content change
        if self.pk:
            original = Comment.objects.filter(pk=self.pk).first()
            if original and original.content != self.content:
                self.updated_at = timezone.now()
                self.is_edited = True
            # Don't update updated_at for vote changes
        else:
            # New comment - always set updated_at
            self.updated_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def update_score(self):
        """Recalculate score from votes table"""
        from django.db.models import Count, Q
        votes = Vote.objects.filter(votable_type='comment', votable_id=self.id).aggregate(
            upvotes=Count('id', filter=Q(vote_type='upvote')),
            downvotes=Count('id', filter=Q(vote_type='downvote'))
        )
        self.upvotes = votes['upvotes'] or 0
        self.downvotes = votes['downvotes'] or 0
        self.score = self.upvotes - self.downvotes
        self.save(update_fields=['upvotes', 'downvotes', 'score'])


class Vote(models.Model):
    """Track user votes on posts and comments"""
    
    VOTABLE_TYPES = [
        ('post', 'Post'),
        ('comment', 'Comment'),
        ('society_post', 'Society Post'),
    ]
    
    VOTE_TYPES = [
        ('upvote', 'Upvote'),
        ('downvote', 'Downvote'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes')
    votable_type = models.CharField(max_length=20, choices=VOTABLE_TYPES)
    votable_id = models.UUIDField()
    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'votes'
        unique_together = ['user', 'votable_type', 'votable_id']
    
    def __str__(self):
        return f"{self.user.username} {self.vote_type}d {self.votable_type}"
