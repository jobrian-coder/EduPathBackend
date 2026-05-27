from django.db import models
from django.utils.text import slugify
import uuid


class University(models.Model):
    """University information"""

    TYPE_CHOICES = [
        ('Public', 'Public'),
        ('Private', 'Private'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=10, unique=True, null=True, blank=True, help_text='University code (e.g., U001)')
    short_name = models.CharField(max_length=50)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    location = models.CharField(max_length=200)
    logo = models.CharField(max_length=10, default='🎓', blank=True)  # Emoji or image URL
    established = models.IntegerField(default=0)
    ranking = models.IntegerField(default=0)
    students = models.CharField(max_length=50, blank=True, default='')  # "84,000+"
    website = models.URLField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    facilities = models.JSONField(default=list)
    accreditation = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'universities'
        ordering = ['ranking']
        verbose_name_plural = 'Universities'

    def __str__(self):
        return self.name


class Course(models.Model):
    """
    Course information — one row per institution-programme combination.
    The category field is the canonical course name shared across institutions.
    The API groups by category to present one card per category to the frontend.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # --- Core identity ---
    name = models.CharField(max_length=300)           # institution-specific programme title
    category = models.CharField(max_length=300)       # canonical category / course group (display title)

    # --- Enrichment (shared across all rows in the same category) ---
    description = models.TextField(blank=True, null=True)
    pros = models.JSONField(default=None, blank=True, null=True)
    cons = models.JSONField(default=None, blank=True, null=True)
    careers = models.JSONField(default=None, blank=True, null=True)

    # --- Institution-specific fields (flat — one row per programme) ---
    institution = models.CharField(max_length=300, blank=True, null=True)
    cutoff_2023 = models.DecimalField(max_digits=6, decimal_places=3, blank=True, null=True)
    cutoff_2022 = models.DecimalField(max_digits=6, decimal_places=3, blank=True, null=True)
    subject_requirement_1 = models.CharField(max_length=150, blank=True, null=True)
    subject_requirement_2 = models.CharField(max_length=150, blank=True, null=True)
    subject_requirement_3 = models.CharField(max_length=150, blank=True, null=True)
    subject_requirement_4 = models.CharField(max_length=150, blank=True, null=True)
    programme_code = models.CharField(max_length=30, blank=True, null=True)

    # --- Hub / fee assignment ---
    related_hub = models.CharField(max_length=100, blank=True, null=True)
    avg_fees_ksh = models.IntegerField(blank=True, null=True)
    is_enriched = models.BooleanField(default=False)

    # --- Legacy fields (kept null for backward compat, not used in new data) ---
    duration = models.CharField(max_length=20, blank=True, null=True)
    cluster_points = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    modules = models.JSONField(default=None, blank=True, null=True)
    career_paths = models.JSONField(default=None, blank=True, null=True)
    mandatory_subjects = models.JSONField(default=None, blank=True, null=True)
    alternative_subjects = models.JSONField(default=None, blank=True, null=True)
    cluster_subjects = models.JSONField(default=None, blank=True, null=True)
    cluster_formula = models.JSONField(default=None, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'courses'
        ordering = ['category', 'cutoff_2023']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['related_hub']),
            models.Index(fields=['institution']),
            models.Index(fields=['cutoff_2023']),
        ]

    def __str__(self):
        return f"{self.category} — {self.institution or 'Unknown'}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)


class CourseUniversity(models.Model):
    """
    Legacy join table — retained to avoid breaking existing queries.
    After the flat-Course migration, course FK will be NULL for all rows.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='universities')
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='courses')
    fees_ksh = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cutoff_points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    application_deadline = models.DateField(blank=True, null=True)
    course_url = models.URLField(blank=True, null=True)

    # KUCCPS data fields (now superseded by flat Course fields)
    program_code = models.CharField(max_length=20, blank=True, null=True, help_text='KUCCPS program code')
    programme_name = models.CharField(max_length=300, blank=True, null=True)
    requirements = models.JSONField(default=dict, blank=True)
    cutoffs = models.JSONField(default=dict, blank=True)
    cutoff_2022 = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    cutoff_2023 = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    cluster_subjects = models.JSONField(default=list, blank=True)
    all_subjects = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'course_universities'

    def __str__(self):
        course_name = self.course.name if self.course else 'N/A'
        return f"{course_name} at {self.university.short_name}"
