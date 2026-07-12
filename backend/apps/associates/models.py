from django.db import models
from apps.authentication.models import User
from apps.hubs.models import CareerHub


class Associate(models.Model):
    ASSOCIATE_TYPES = [
        ('MENTOR', 'Mentor'),
        ('SOCIETY', 'Society'),
        ('SCHOOL', 'School'),
    ]

    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='associate_profile')
    name = models.CharField(max_length=255)
    associate_type = models.CharField(max_length=20, choices=ASSOCIATE_TYPES)
    bio = models.TextField()
    profile_image = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    contact_email = models.EmailField()
    hub = models.ForeignKey(CareerHub, on_delete=models.CASCADE, related_name='associates')
    is_verified = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    strike_count = models.IntegerField(default=0)

    APPLICATION_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('AWAITING_RESPONSE', 'Awaiting Response'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    application_status = models.CharField(max_length=20, choices=APPLICATION_STATUS_CHOICES, default='PENDING')
    rejection_reason = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'associates'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class AssociatePost(models.Model):
    # KNOWN LIMITATION: Associates do not have login accounts in this version.
    # All Associate posting is done by the admin through the Django admin panel.
    # Associate self-posting is noted as the immediate next development priority.
    POST_TYPES = [
        ('UPDATE', 'Update'),
        ('OPPORTUNITY', 'Opportunity'),
        ('EVENT', 'Event'),
        ('RESOURCE', 'Resource'),
    ]

    id = models.AutoField(primary_key=True)
    associate = models.ForeignKey(Associate, on_delete=models.CASCADE, related_name='posts')
    post_type = models.CharField(max_length=20, choices=POST_TYPES)
    title = models.CharField(max_length=150, blank=True, null=True)  # Required for all types (nullable for migration)
    body = models.TextField()  # Required for all types
    image = models.ImageField(upload_to='associate_posts/', blank=True, null=True)  # Upload image from device
    image_url = models.URLField(blank=True, null=True)  # External image URL (optional fallback)
    external_url = models.URLField(blank=True, null=True)
    cta_label = models.CharField(max_length=60, blank=True, null=True)  # Call-to-action button label
    deadline = models.DateField(blank=True, null=True)  # Application deadline or event date
    tags = models.JSONField(default=list, blank=True, help_text='List of course tags from hashtags')
    upvotes = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'associate_posts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.associate.name} — {self.title}"


class Follow(models.Model):
    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followed_associates')
    associate = models.ForeignKey(Associate, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'follows'
        unique_together = ['student', 'associate']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.username} follows {self.associate.name}"


class ModerationReport(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('ACTIONED', 'Actioned'),
        ('DISMISSED', 'Dismissed'),
    ]

    id = models.AutoField(primary_key=True)
    reporter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    associate_post = models.ForeignKey(AssociatePost, on_delete=models.CASCADE)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'moderation_reports'
        ordering = ['-created_at']

    def __str__(self):
        return f"Report on post {self.associate_post_id} — {self.status}"
