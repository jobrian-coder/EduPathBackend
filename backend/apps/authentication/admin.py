from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AcademicProfile, UserInterest, Bookmark


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'created_at']
    list_filter = ['role', 'email_verified', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'role', 'profile_picture', 'bio', 'location', 'email_verified', 'mfa_enabled')}),
    )


@admin.register(AcademicProfile)
class AcademicProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'kcse_year', 'cluster_points', 'created_at']
    search_fields = ['user__email', 'user__username']
    list_filter = ['kcse_year']


@admin.register(UserInterest)
class UserInterestAdmin(admin.ModelAdmin):
    list_display = ['user', 'updated_at']
    search_fields = ['user__email', 'user__username']


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ['user', 'bookmark_type', 'bookmark_id', 'created_at']
    list_filter = ['bookmark_type', 'created_at']
    search_fields = ['user__email', 'user__username']
