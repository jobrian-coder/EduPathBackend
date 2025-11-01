from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import ChatConversation, ChatMessage, CareerProsCons, ChatbotSettings
from .serializers import (
    ChatConversationSerializer, ChatConversationCreateSerializer,
    ChatMessageSerializer, ChatMessageCreateSerializer,
    AICareerProsConsSerializer, AICareerProsConsCreateSerializer,
    ChatbotSettingsSerializer
)
from .services import ChatbotService, AIProsConsService


class ChatConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing chat conversations"""
    serializer_class = ChatConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatConversation.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChatConversationCreateSerializer
        return ChatConversationSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message to a conversation and get AI response"""
        conversation = self.get_object()
        
        # Create user message
        user_message = ChatMessage.objects.create(
            conversation=conversation,
            sender_type='user',
            content=request.data.get('content', ''),
            metadata=request.data.get('metadata', {})
        )
        
        # Get AI response
        try:
            chatbot_service = ChatbotService()
            ai_response = chatbot_service.generate_response(
                conversation=conversation,
                user_message=user_message.content,
                context_type=conversation.context_type
            )
            
            # Create AI message
            ai_message = ChatMessage.objects.create(
                conversation=conversation,
                sender_type='ai',
                content=ai_response['content'],
                metadata=ai_response.get('metadata', {})
            )
            
            # Update conversation timestamp
            conversation.save()
            
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'ai_message': ChatMessageSerializer(ai_message).data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate AI response: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def start_new_conversation(self, request):
        """Start a new conversation"""
        serializer = ChatConversationCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            conversation = serializer.save()
            return Response(
                ChatConversationSerializer(conversation).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatMessageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for reading chat messages"""
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            return ChatMessage.objects.filter(
                conversation__id=conversation_id,
                conversation__user=self.request.user
            )
        return ChatMessage.objects.filter(conversation__user=self.request.user)


class AICareerProsConsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing AI career pros and cons"""
    serializer_class = AICareerProsConsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CareerProsCons.objects.all()
    
    @action(detail=False, methods=['post'])
    def generate_pros_cons(self, request):
        """Generate pros and cons for a career or course"""
        serializer = AICareerProsConsCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            ai_service = AIProsConsService()
            pros_cons = ai_service.generate_pros_cons(
                career_name=serializer.validated_data['career_name'],
                course_name=serializer.validated_data.get('course_name'),
                context=serializer.validated_data.get('context', '')
            )
            
            # Save to database
            career_pros_cons = CareerProsCons.objects.create(
                career_name=serializer.validated_data['career_name'],
                course_name=serializer.validated_data.get('course_name'),
                pros=pros_cons['pros'],
                cons=pros_cons['cons'],
                context=serializer.validated_data.get('context', ''),
                generated_by='ai_chatbot'
            )
            
            return Response(AICareerProsConsSerializer(career_pros_cons).data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate pros and cons: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatbotSettingsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for chatbot settings (admin only)"""
    serializer_class = ChatbotSettingsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatbotSettings.objects.filter(is_active=True)
