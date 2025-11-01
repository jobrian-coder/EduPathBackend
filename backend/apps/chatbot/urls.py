from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChatConversationViewSet, ChatMessageViewSet, 
    AICareerProsConsViewSet, ChatbotSettingsViewSet
)

router = DefaultRouter()
router.register(r'conversations', ChatConversationViewSet, basename='chatbot-conversations')
router.register(r'messages', ChatMessageViewSet, basename='chatbot-messages')
router.register(r'pros-cons', AICareerProsConsViewSet, basename='ai-career-pros-cons')
router.register(r'settings', ChatbotSettingsViewSet, basename='chatbot-settings')

urlpatterns = [
    path('', include(router.urls)),
]
