from django.db import models
from apps.authentication.models import User
from apps.hubs.models import CareerHub
import uuid


class ChatConversation(models.Model):
    """Chat conversations between users and AI chatbot"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_conversations')
    hub = models.ForeignKey(CareerHub, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_conversations')
    title = models.CharField(max_length=200, blank=True)
    context_type = models.CharField(
        max_length=50,
        choices=[
            ('hub_general', 'Hub General Chat'),
            ('career_guidance', 'Career Guidance'),
            ('course_comparison', 'Course Comparison'),
            ('society_info', 'Society Information'),
        ],
        default='hub_general'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_conversations'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Chat: {self.user.username} - {self.title or 'Untitled'}"


class ChatMessage(models.Model):
    """Individual messages in a chat conversation"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(
        max_length=20,
        choices=[
            ('user', 'User'),
            ('ai', 'AI Assistant'),
        ]
    )
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)  # Store additional data like pros/cons
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender_type}: {self.content[:50]}..."


class CareerProsCons(models.Model):
    """AI-generated pros and cons for careers/courses"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    career_name = models.CharField(max_length=200)
    course_name = models.CharField(max_length=200, blank=True, null=True)
    pros = models.JSONField(default=list, help_text='List of advantages')
    cons = models.JSONField(default=list, help_text='List of disadvantages')
    context = models.TextField(blank=True, help_text='Additional context or notes')
    generated_by = models.CharField(max_length=50, default='ai_chatbot')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_career_pros_cons'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pros/Cons: {self.career_name}"


class ChatbotSettings(models.Model):
    """Settings for chatbot behavior and AI integration"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ai_provider = models.CharField(
        max_length=50,
        choices=[
            ('openai', 'OpenAI'),
            ('anthropic', 'Anthropic Claude'),
            ('google', 'Google Gemini'),
            ('local', 'Local LLM'),
        ],
        default='openai'
    )
    ai_model = models.CharField(max_length=100, default='gpt-3.5-turbo')
    max_tokens = models.IntegerField(default=1000)
    temperature = models.FloatField(default=0.7)
    system_prompt = models.TextField(
        default="You are EduPath AI, a helpful assistant for students exploring career paths and educational opportunities in Kenya. Provide accurate, helpful information about careers, courses, universities, and professional societies."
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chatbot_settings'
    
    def __str__(self):
        return f"Chatbot Settings: {self.ai_provider}"
