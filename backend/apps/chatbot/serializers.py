from rest_framework import serializers
from .models import ChatConversation, ChatMessage, CareerProsCons, ChatbotSettings


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender_type', 'content', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatConversationSerializer(serializers.ModelSerializer):
    """Serializer for chat conversations"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    hub_name = serializers.CharField(source='hub.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ChatConversation
        fields = [
            'id', 'user', 'hub', 'hub_name', 'user_username', 'title', 
            'context_type', 'is_active', 'created_at', 'updated_at', 'messages'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChatConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat conversations"""
    
    class Meta:
        model = ChatConversation
        fields = ['hub', 'context_type', 'title']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat messages"""
    
    class Meta:
        model = ChatMessage
        fields = ['conversation', 'content', 'metadata']
    
    def create(self, validated_data):
        validated_data['sender_type'] = 'user'
        return super().create(validated_data)


class AICareerProsConsSerializer(serializers.ModelSerializer):
    """Serializer for AI career pros and cons"""
    
    class Meta:
        model = CareerProsCons
        fields = [
            'id', 'career_name', 'course_name', 'pros', 'cons', 
            'context', 'generated_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AICareerProsConsCreateSerializer(serializers.Serializer):
    """Serializer for generating AI pros and cons"""
    career_name = serializers.CharField(max_length=200)
    course_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    context = serializers.CharField(required=False, allow_blank=True)


class ChatbotSettingsSerializer(serializers.ModelSerializer):
    """Serializer for chatbot settings"""
    
    class Meta:
        model = ChatbotSettings
        fields = [
            'id', 'ai_provider', 'ai_model', 'max_tokens', 
            'temperature', 'system_prompt', 'is_active'
        ]
        read_only_fields = ['id']
