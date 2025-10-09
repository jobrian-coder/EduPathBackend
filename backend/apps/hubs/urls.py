from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CareerHubViewSet, PostViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'hubs', CareerHubViewSet, basename='hub')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
]
