from django.contrib import admin
from .models import University, Course, CourseUniversity


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ['name', 'short_name', 'type', 'location', 'ranking', 'established']
    list_filter = ['type', 'location']
    search_fields = ['name', 'short_name', 'description']
    ordering = ['ranking']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'duration', 'cluster_points']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']


@admin.register(CourseUniversity)
class CourseUniversityAdmin(admin.ModelAdmin):
    list_display = ['course', 'university', 'fees_ksh', 'cutoff_points', 'application_deadline']
    list_filter = ['university', 'application_deadline']
    search_fields = ['course__name', 'university__name']
    ordering = ['course__name']
