from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CareerViewSet

router = DefaultRouter()
router.register(r'', CareerViewSet, basename='career')

urlpatterns = [
    path('', include(router.urls)),
]
