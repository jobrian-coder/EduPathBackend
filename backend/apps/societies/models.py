from django.db import models
from apps.hubs.models import CareerHub
from apps.authentication.models import User
import uuid


class Society(models.Model):
    """Professional societies and organizations"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    acronym = models.CharField(max_length=20)
    full_name = models.TextField()
    logo = models.CharField(max_length=10, default='🏛️')
    type = models.CharField(max_length=100)  # Professional Body, Union, etc.
    description = models.TextField()
    website = models.URLField(blank=True, null=True)
    hubs = models.ManyToManyField(CareerHub, related_name='societies', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'societies'
        verbose_name_plural = 'Societies'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.acronym} - {self.name}"


class SocietyPost(models.Model):
    """Posts shared within a society."""

    POST_TYPES = [
        ('announcement', 'Announcement'),
        ('question', 'Question'),
        ('opportunity', 'Opportunity'),
        ('discussion', 'Discussion'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='society_posts')
    title = models.CharField(max_length=300)
    content = models.TextField()
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='discussion')
    tags = models.JSONField(default=list, blank=True)
    upvotes = models.IntegerField(default=0)
    downvotes = models.IntegerField(default=0)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'society_posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['society', '-created_at']),
            models.Index(fields=['post_type']),
        ]

    def __str__(self):
        return f"{self.title}"

    @property
    def score(self):
        return self.upvotes - self.downvotes
