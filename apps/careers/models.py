from django.db import models
import uuid


class Career(models.Model):
    """Career information with metrics"""
    
    CATEGORY_CHOICES = [
        ('Technology', 'Technology'),
        ('Healthcare', 'Healthcare'),
        ('Engineering', 'Engineering'),
        ('Legal', 'Legal'),
        ('Finance', 'Finance'),
        ('Education', 'Education'),
        ('Creative', 'Creative Arts'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    icon = models.CharField(max_length=10, default='💼')  # Emoji
    description = models.TextField()
    
    # Metrics
    avg_salary_ksh = models.DecimalField(max_digits=12, decimal_places=2)
    job_demand_score = models.IntegerField(help_text="Score 1-100")
    growth_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage")
    work_life_balance_score = models.IntegerField(help_text="Score 1-100")
    entry_requirements_score = models.IntegerField(help_text="Score 1-100")
    job_satisfaction_score = models.IntegerField(help_text="Score 1-100")
    
    # Additional info
    education_required = models.TextField()
    experience_required = models.TextField()
    key_skills = models.JSONField(default=list)
    top_employers = models.JSONField(default=list)
    work_environment = models.CharField(max_length=200)
    certifications = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'careers'
        ordering = ['name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['avg_salary_ksh']),
        ]
    
    def __str__(self):
        return self.name


class CareerProsCons(models.Model):
    """Pros and cons for each career"""
    
    TYPE_CHOICES = [
        ('pros', 'Pros'),
        ('cons', 'Cons'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    career = models.ForeignKey(Career, on_delete=models.CASCADE, related_name='pros_cons')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    items = models.JSONField(default=list)  # List of strings
    
    class Meta:
        db_table = 'career_pros_cons'
        unique_together = ['career', 'type']
    
    def __str__(self):
        return f"{self.career.name} - {self.type}"
