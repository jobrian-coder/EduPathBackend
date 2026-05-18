from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UniversityViewSet,
    CourseViewSet,
    CourseUniversityViewSet,
    ClusterCalculationView,
    course_list_grouped,
    course_detail_grouped,
)
from .admin_views import (
    AdminUniversityViewSet,
    AdminCourseViewSet,
    AdminCourseUniversityViewSet,
)

# Public router (read-only)
router = DefaultRouter()
router.register(r'universities', UniversityViewSet, basename='university')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'course-universities', CourseUniversityViewSet, basename='course-university')

# Admin router (full CRUD, requires admin role)
admin_router = DefaultRouter()
admin_router.register(r'universities', AdminUniversityViewSet, basename='admin-university')
admin_router.register(r'courses', AdminCourseViewSet, basename='admin-course')
admin_router.register(r'course-universities', AdminCourseUniversityViewSet, basename='admin-course-university')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include(admin_router.urls)),
    path('calculate-cluster/', ClusterCalculationView.as_view(), name='calculate-cluster'),
    # Category-grouped endpoints (frontend primary API)
    path('grouped/', course_list_grouped, name='course-list-grouped'),
    path('grouped/<str:category>/', course_detail_grouped, name='course-detail-grouped'),
]
