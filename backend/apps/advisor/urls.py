from django.urls import path
from .views import (
    StartAdvisorView, 
    AdvisorMessageView, 
    RecommendationsView,
    ChatStartView,
    ChatMessageView,
    ChatHistoryView,
    ChatDetailView
)

urlpatterns = [
    # Structured interview endpoints
    path('start/', StartAdvisorView.as_view(), name='advisor-start'),
    path('<uuid:pk>/message/', AdvisorMessageView.as_view(), name='advisor-message'),
    path('<uuid:pk>/recommendations/', RecommendationsView.as_view(), name='advisor-recommendations'),
    
    # Free-form chat endpoints
    path('chat/start/', ChatStartView.as_view(), name='chat-start'),
    path('chat/<uuid:pk>/message/', ChatMessageView.as_view(), name='chat-message'),
    path('chat/<uuid:pk>/', ChatDetailView.as_view(), name='chat-detail'),
    path('chat/history/', ChatHistoryView.as_view(), name='chat-history'),
]
