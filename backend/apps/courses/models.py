from django.db import models
import uuid


class University(models.Model):
    """University information"""
    
    TYPE_CHOICES = [
        ('Public', 'Public'),
        ('Private', 'Private'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=10, unique=True, help_text='University code (e.g., AA01)')
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=50)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    location = models.CharField(max_length=200)
    logo = models.CharField(max_length=10, default='🎓')  # Emoji or image URL
    established = models.IntegerField()
    ranking = models.IntegerField()
    students = models.CharField(max_length=20)  # "84,000+"
    website = models.URLField()
    description = models.TextField()
    facilities = models.JSONField(default=list)
    accreditation = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'universities'
        ordering = ['ranking']
        verbose_name_plural = 'Universities'
    
    def __str__(self):
        return self.name


class Course(models.Model):
    """Course information"""
    
    CATEGORY_CHOICES = [
        ('Technology', 'Technology'),
        ('Medicine', 'Medicine'),
        ('Engineering', 'Engineering'),
        ('Law', 'Law'),
        ('Business', 'Business'),
        ('Education', 'Education'),
        ('Healthcare', 'Healthcare'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=300)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    duration = models.CharField(max_length=20)  # "4 years"
    cluster_points = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField()
    modules = models.JSONField(default=list)
    career_paths = models.JSONField(default=list)
    mandatory_subjects = models.JSONField(default=list)
    alternative_subjects = models.JSONField(default=list)
    cluster_subjects = models.JSONField(default=list)  # e.g., ["MAT", "PHY", "CHE", "ENG"]
    cluster_formula = models.JSONField(default=dict, blank=True)  # optional metadata (weights, notes)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['cluster_points']),
        ]
    
    def __str__(self):
        return self.name


class CourseUniversity(models.Model):
    """Many-to-many relationship between courses and universities"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='universities')
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='courses')
    fees_ksh = models.DecimalField(max_digits=12, decimal_places=2)
    cutoff_points = models.DecimalField(max_digits=5, decimal_places=2)
    application_deadline = models.DateField(blank=True, null=True)
    course_url = models.URLField(blank=True, null=True)
    
    class Meta:
        db_table = 'course_universities'
        unique_together = ['course', 'university']
    
    def __str__(self):
        return f"{self.course.name} at {self.university.short_name}"
