from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UniversityViewSet, CourseViewSet, CourseUniversityViewSet, ClusterCalculationView

router = DefaultRouter()
router.register(r'universities', UniversityViewSet, basename='university')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'course-universities', CourseUniversityViewSet, basename='course-university')

urlpatterns = [
    path('', include(router.urls)),
    path('calculate-cluster/', ClusterCalculationView.as_view(), name='calculate-cluster'),
]
