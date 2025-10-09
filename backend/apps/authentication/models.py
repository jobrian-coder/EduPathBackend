from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """Extended user model with role-based access"""
    
    ROLE_CHOICES = [
        ('novice', 'Novice'),
        ('contributor', 'Contributor'),
        ('expert', 'Expert'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='novice')
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    def get_profile_completion_percentage(self):
        """Calculate profile completion percentage"""
        total_fields = 8  # Total fields to track
        completed_fields = 0
        
        # Basic profile fields
        if self.first_name and self.last_name:
            completed_fields += 1
        if self.email:
            completed_fields += 1
        if self.profile_picture:
            completed_fields += 1
        if self.bio:
            completed_fields += 1
        if self.location:
            completed_fields += 1
        if self.phone_number:
            completed_fields += 1
        
        # Academic profile
        if hasattr(self, 'academic_profile') and self.academic_profile.kcse_grades:
            completed_fields += 1
        
        # Career interests
        if hasattr(self, 'interests') and self.interests.career_interests:
            completed_fields += 1
        
        return round((completed_fields / total_fields) * 100)
    
    def get_profile_completion_details(self):
        """Get detailed profile completion breakdown"""
        return {
            'basic_info': bool(self.first_name and self.last_name),
            'email': bool(self.email),
            'profile_picture': bool(self.profile_picture),
            'bio': bool(self.bio),
            'location': bool(self.location),
            'phone': bool(self.phone_number),
            'academic_profile': bool(hasattr(self, 'academic_profile') and self.academic_profile.kcse_grades),
            'career_interests': bool(hasattr(self, 'interests') and self.interests.career_interests),
        }


class AcademicProfile(models.Model):
    """User's KCSE grades and academic information"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='academic_profile')
    kcse_year = models.IntegerField(blank=True, null=True)
    kcse_school = models.CharField(max_length=255, blank=True, null=True)
    kcse_grades = models.JSONField(blank=True, null=True)  # {"mathematics": "A", "english": "B+"}
    kcse_mean_points = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    cluster_points = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    strengths = models.JSONField(default=list, blank=True)  # ["analytical", "creative"]
    interests = models.JSONField(default=list, blank=True)  # ["technology", "healthcare"]
    career_goals = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'academic_profiles'
    
    def __str__(self):
        return f"{self.user.email}'s Academic Profile"


class UserInterest(models.Model):
    """User's hobbies and career interests"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='interests')
    hobbies = models.JSONField(default=list, blank=True)
    career_interests = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_interests'
    
    def __str__(self):
        return f"{self.user.username}'s Interests"


class Bookmark(models.Model):
    """User bookmarks for courses, universities, posts, societies"""
    
    BOOKMARK_TYPES = [
        ('course', 'Course'),
        ('university', 'University'),
        ('post', 'Post'),
        ('society', 'Society'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    bookmark_type = models.CharField(max_length=20, choices=BOOKMARK_TYPES)
    bookmark_id = models.UUIDField()  # ID of the bookmarked item
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'bookmarks'
        unique_together = ['user', 'bookmark_type', 'bookmark_id']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} bookmarked {self.bookmark_type}"


class Achievement(models.Model):
    """Achievement badges that users can earn"""
    
    ACHIEVEMENT_TYPES = [
        ('first_post', 'First Post'),
        ('helpful_contributor', 'Helpful Contributor'),
        ('active_member', 'Active Member'),
        ('knowledge_seeker', 'Knowledge Seeker'),
        ('community_builder', 'Community Builder'),
        ('goal_setter', 'Goal Setter'),
        ('profile_complete', 'Profile Complete'),
        ('streak_7', '7-Day Streak'),
        ('top_contributor', 'Top Contributor'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, choices=ACHIEVEMENT_TYPES)
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=20, default='🏆')  # Emoji icon
    color = models.CharField(max_length=20, default='bg-yellow-100')  # Tailwind color
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'achievements'
    
    def __str__(self):
        return self.title


class UserAchievement(models.Model):
    """User's earned achievements"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    is_displayed = models.BooleanField(default=True)  # Show on profile
    
    class Meta:
        db_table = 'user_achievements'
        unique_together = ['user', 'achievement']
        ordering = ['-earned_at']
    
    def __str__(self):
        return f"{self.user.username} earned {self.achievement.title}"


class UserActivity(models.Model):
    """Track user activities for analytics and activity feed"""
    
    ACTIVITY_TYPES = [
        ('post_created', 'Post Created'),
        ('comment_made', 'Comment Made'),
        ('post_upvoted', 'Post Upvoted'),
        ('comment_upvoted', 'Comment Upvoted'),
        ('hub_joined', 'Hub Joined'),
        ('bookmark_added', 'Bookmark Added'),
        ('profile_updated', 'Profile Updated'),
        ('achievement_earned', 'Achievement Earned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    target_id = models.UUIDField(blank=True, null=True)  # ID of related object
    target_type = models.CharField(max_length=50, blank=True, null=True)  # Type of related object
    description = models.TextField()  # Human-readable description
    metadata = models.JSONField(default=dict, blank=True)  # Additional data
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_activities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['activity_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_type}"
