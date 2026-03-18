from django.db import models
from apps.authentication.models import User
import uuid


class AdvisorSession(models.Model):
    """A single student advisory interview session."""

    STATUS_CHOICES = [
        ('interviewing', 'Interviewing'),
        ('complete', 'Complete'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='advisor_sessions',
        null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='interviewing'
    )
    question_count = models.IntegerField(
        default=0, help_text='Number of questions answered so far (0–10)'
    )
    profile_text = models.TextField(
        blank=True,
        help_text='Synthesised natural-language student profile after interview'
    )
    # Store rolling LLM message history as JSON list of {role, content} dicts
    message_history = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'advisor_sessions'
        ordering = ['-created_at']

    def __str__(self):
        return f"AdvisorSession({self.user.username}, Q{self.question_count}, {self.status})"


class AdvisorMessage(models.Model):
    """Individual turn within an advisor session."""

    ROLE_CHOICES = [
        ('assistant', 'Assistant'),
        ('user', 'User'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        AdvisorSession, on_delete=models.CASCADE, related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'advisor_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:60]}"
