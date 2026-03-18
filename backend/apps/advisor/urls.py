from django.urls import path
from .views import StartAdvisorView, AdvisorMessageView, RecommendationsView

urlpatterns = [
    path('start/', StartAdvisorView.as_view(), name='advisor-start'),
    path('<uuid:pk>/message/', AdvisorMessageView.as_view(), name='advisor-message'),
    path('<uuid:pk>/recommendations/', RecommendationsView.as_view(), name='advisor-recommendations'),
]
