from django.contrib import admin
from .models import ChatConversation, ChatMessage, CareerProsCons, ChatbotSettings


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'hub', 'title', 'context_type', 'is_active', 'created_at']
    list_filter = ['context_type', 'is_active', 'created_at']
    search_fields = ['user__username', 'hub__name', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['user', 'hub']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender_type', 'content_preview', 'created_at']
    list_filter = ['sender_type', 'created_at']
    search_fields = ['conversation__user__username', 'content']
    readonly_fields = ['id', 'created_at']
    raw_id_fields = ['conversation']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'


@admin.register(CareerProsCons)
class CareerProsConsAdmin(admin.ModelAdmin):
    list_display = ['id', 'career_name', 'course_name', 'pros_count', 'cons_count', 'generated_by', 'created_at']
    list_filter = ['generated_by', 'created_at']
    search_fields = ['career_name', 'course_name']
    readonly_fields = ['id', 'created_at']
    
    def pros_count(self, obj):
        return len(obj.pros) if obj.pros else 0
    pros_count.short_description = 'Pros Count'
    
    def cons_count(self, obj):
        return len(obj.cons) if obj.cons else 0
    cons_count.short_description = 'Cons Count'


@admin.register(ChatbotSettings)
class ChatbotSettingsAdmin(admin.ModelAdmin):
    list_display = ['id', 'ai_provider', 'ai_model', 'is_active', 'created_at']
    list_filter = ['ai_provider', 'is_active']
    readonly_fields = ['id', 'created_at', 'updated_at']
