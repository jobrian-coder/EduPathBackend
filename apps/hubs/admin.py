from django.contrib import admin
from .models import CareerHub, Post, Comment, Vote, HubMembership, AffiliatedInstitution


@admin.register(CareerHub)
class CareerHubAdmin(admin.ModelAdmin):
    list_display = ['name', 'field', 'member_count', 'active_posts', 'created_at']
    list_filter = ['field', 'created_at']
    search_fields = ['name', 'field', 'description']
    ordering = ['-member_count']


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'hub', 'author', 'post_type', 'upvotes', 'downvotes', 'comment_count', 'is_pinned', 'created_at']
    list_filter = ['post_type', 'is_pinned', 'is_deleted', 'created_at']
    search_fields = ['title', 'content', 'author__username']
    ordering = ['-created_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['post', 'author', 'upvotes', 'downvotes', 'is_deleted', 'created_at']
    list_filter = ['is_deleted', 'created_at']
    search_fields = ['content', 'author__username']
    ordering = ['-created_at']


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'votable_type', 'votable_id', 'vote_type', 'created_at']
    list_filter = ['votable_type', 'vote_type', 'created_at']
    search_fields = ['user__username']
    ordering = ['-created_at']


@admin.register(HubMembership)
class HubMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'hub', 'role', 'joined_at', 'role_granted_by']
    list_filter = ['role', 'hub']
    search_fields = ['user__username', 'hub__name']
    ordering = ['-joined_at']


@admin.register(AffiliatedInstitution)
class AffiliatedInstitutionAdmin(admin.ModelAdmin):
    list_display = ['name', 'institution_type', 'hub', 'is_verified', 'added_at']
    list_filter = ['institution_type', 'is_verified', 'hub']
    search_fields = ['name', 'hub__name', 'description']
    ordering = ['-is_verified', 'name']
