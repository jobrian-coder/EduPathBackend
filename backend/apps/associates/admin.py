from django.contrib import admin
from .models import Associate, AssociatePost, ModerationReport


@admin.register(Associate)
class AssociateAdmin(admin.ModelAdmin):
    list_display = ('name', 'associate_type', 'hub', 'application_status', 'is_verified', 'is_suspended', 'strike_count', 'created_at')
    list_filter = ('associate_type', 'hub', 'application_status', 'is_verified', 'is_suspended')
    search_fields = ('name', 'contact_email')
    list_editable = ('is_verified', 'is_suspended', 'application_status')
    readonly_fields = ('created_at',)
    fieldsets = (
        (None, {'fields': ('name', 'associate_type', 'bio', 'hub', 'contact_email')}),
        ('Profile', {'fields': ('profile_image', 'website', 'location')}),
        ('Status', {'fields': ('application_status', 'is_verified', 'is_suspended', 'strike_count')}),
        ('Admin', {'fields': ('rejection_reason', 'admin_notes')}),
        ('Meta', {'fields': ('created_at',)}),
    )


@admin.register(AssociatePost)
class AssociatePostAdmin(admin.ModelAdmin):
    list_display = ['id', 'associate', 'post_type', 'title', 'upvotes', 'is_visible', 'created_at']
    list_filter = ['post_type', 'is_visible', 'created_at']
    search_fields = ['associate__name', 'title', 'body']
    readonly_fields = ['upvotes', 'created_at']

    fieldsets = (
        (None, {
            'fields': ('associate', 'post_type', 'title', 'body')
        }),
        ('Additional Fields', {
            'fields': ('image_url', 'external_url', 'cta_label', 'deadline'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_visible', 'upvotes', 'created_at')
        }),
    )


@admin.register(ModerationReport)
class ModerationReportAdmin(admin.ModelAdmin):
    list_display = ('reporter', 'associate_post', 'status', 'created_at')
    list_filter = ('status',)
    list_editable = ('status',)
    readonly_fields = ('reporter', 'associate_post', 'reason', 'created_at')
