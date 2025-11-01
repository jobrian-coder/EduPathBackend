from django.contrib import admin
from .models import Society


@admin.register(Society)
class SocietyAdmin(admin.ModelAdmin):
    list_display = ['acronym', 'name', 'type', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['name', 'acronym', 'full_name', 'description']
    ordering = ['name']
    filter_horizontal = ['hubs']
