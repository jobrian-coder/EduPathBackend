from rest_framework import serializers
from .models import CareerHub, Post, Comment, Vote
from apps.authentication.serializers import UserSerializer


class CareerHubSerializer(serializers.ModelSerializer):
    member_count = serializers.ReadOnlyField()
    active_posts = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = CareerHub
        fields = [
            'id',
            'name',
            'slug',
            'field',
            'category',
            'icon',
            'icon_url',
            'color',
            'banner_image',
            'description',
            'rules',
            'related_societies',
            'member_count',
            'active_posts',
            'created_at',
            'updated_at',
            'is_member',
        ]
        read_only_fields = [
            'member_count',
            'active_posts',
            'created_at',
            'updated_at',
            'is_member',
        ]

    def get_active_posts(self, obj):
        """Get the actual count of posts in this hub"""
        return obj.get_active_posts_count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return obj.members.filter(pk=user.pk).exists()


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    score = serializers.ReadOnlyField()
    is_member = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'hub',
            'author',
            'title',
            'slug',
            'content',
            'post_type',
            'is_expert_post',
            'tags',
            'upvotes',
            'downvotes',
            'score',
            'view_count',
            'comment_count',
            'is_pinned',
            'is_featured',
            'is_deleted',
            'is_edited',
            'edited_at',
            'edited_by',
            'created_at',
            'updated_at',
            'deleted_at',
            'is_member',
            'user_vote',
        ]
        read_only_fields = [
            'id',
            'author',
            'slug',
            'upvotes',
            'downvotes',
            'score',
            'view_count',
            'comment_count',
            'is_edited',
            'edited_at',
            'edited_by',
            'created_at',
            'updated_at',
            'deleted_at',
            'is_member',
            'user_vote',
        ]

    def get_is_member(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return obj.hub.members.filter(pk=user.pk).exists()

    def get_user_vote(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        vote = Vote.objects.filter(user=user, votable_type='post', votable_id=obj.id).first()
        return vote.vote_type if vote else None


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['hub', 'title', 'content', 'post_type', 'is_expert_post', 'tags']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id',
            'post',
            'author',
            'parent_comment',
            'content',
            'depth',
            'path',
            'upvotes',
            'downvotes',
            'score',
            'reply_count',
            'mention_list',
            'is_deleted',
            'is_pinned',
            'is_edited',
            'edited_at',
            'created_at',
            'updated_at',
            'deleted_at',
            'replies',
        ]
        read_only_fields = [
            'id',
            'author',
            'depth',
            'path',
            'upvotes',
            'downvotes',
            'score',
            'reply_count',
            'is_edited',
            'edited_at',
            'created_at',
            'updated_at',
            'deleted_at',
            'replies',
        ]

    def get_replies(self, obj):
        """
        Recursively fetch all nested replies with proper prefetching
        This supports unlimited nesting depth (replies to replies to replies...)
        """
        queryset = obj.replies.filter(is_deleted=False).select_related('author').order_by('created_at')
        if not queryset:
            return []
        # Recursively serialize nested replies - this supports unlimited depth
        return CommentSerializer(queryset, many=True, context=self.context).data

class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['post', 'parent_comment', 'content']

    def validate(self, attrs):
        parent = attrs.get('parent_comment')
        post = attrs.get('post')
        if parent and parent.post_id != post.id:
            raise serializers.ValidationError('Parent comment must belong to the same post.')
        return attrs


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['votable_type', 'votable_id', 'vote_type']
