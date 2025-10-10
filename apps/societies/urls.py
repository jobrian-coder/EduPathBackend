from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SocietyViewSet, SocietyPostViewSet

router = DefaultRouter()
router.register(r'posts', SocietyPostViewSet, basename='society-post')
router.register(r'', SocietyViewSet, basename='society')

urlpatterns = [
    path('', include(router.urls)),
]
