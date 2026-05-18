"""
Admin API endpoints for managing courses and universities.
These endpoints require admin role authentication.
"""

from rest_framework import viewsets, status, filters, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from .models import University, Course, CourseUniversity
from .serializers import (
    CourseUniversitySerializer,
)
from apps.authentication.permissions import IsAdmin


class AdminCourseSerializer(drf_serializers.ModelSerializer):
    """Full course serializer for admin — all model fields, no expensive reverse relations."""
    class Meta:
        model = Course
        fields = '__all__'


class AdminUniversitySerializer(drf_serializers.ModelSerializer):
    """Full university serializer for admin — all model fields."""
    class Meta:
        model = University
        fields = '__all__'


class AdminUniversityViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint for full CRUD operations on universities.
    Requires admin role.
    """
    queryset = University.objects.all()
    serializer_class = AdminUniversitySerializer
    permission_classes = [IsAdmin]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'location']
    search_fields = ['name', 'short_name', 'description']
    ordering_fields = ['ranking', 'established', 'name']
    
    @action(detail=True, methods=['post'])
    def bulk_update_programs(self, request, pk=None):
        """
        Bulk update or create programs for a university.
        Expects: { "programs": [{"course_id": "...", "fees_ksh": 100000, "cutoff_points": 35}, ...] }
        """
        university = self.get_object()
        programs_data = request.data.get('programs', [])
        
        created = []
        updated = []
        errors = []
        
        for prog_data in programs_data:
            course_id = prog_data.get('course_id')
            if not course_id:
                errors.append({"error": "course_id required", "data": prog_data})
                continue
                
            try:
                course = Course.objects.get(id=course_id)
                
                # Try to get existing relationship
                try:
                    cu = CourseUniversity.objects.get(university=university, course=course)
                    # Update existing
                    cu.fees_ksh = prog_data.get('fees_ksh', cu.fees_ksh)
                    cu.cutoff_points = prog_data.get('cutoff_points', cu.cutoff_points)
                    cu.course_url = prog_data.get('course_url', cu.course_url)
                    cu.save()
                    updated.append(str(cu.id))
                except CourseUniversity.DoesNotExist:
                    # Create new
                    cu = CourseUniversity.objects.create(
                        university=university,
                        course=course,
                        fees_ksh=prog_data.get('fees_ksh'),
                        cutoff_points=prog_data.get('cutoff_points'),
                        course_url=prog_data.get('course_url', '')
                    )
                    created.append(str(cu.id))
                    
            except Course.DoesNotExist:
                errors.append({"error": f"Course {course_id} not found"})
            except Exception as e:
                errors.append({"error": str(e), "data": prog_data})
        
        return Response({
            'created': len(created),
            'updated': len(updated),
            'errors': errors
        })


class AdminCourseViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint for full CRUD operations on courses.
    Requires admin role.
    """
    queryset = Course.objects.all().order_by('-created_at')
    serializer_class = AdminCourseSerializer
    permission_classes = [IsAdmin]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'related_hub', 'institution']
    search_fields = ['name', 'category', 'description', 'institution']
    ordering_fields = ['name', 'category', 'cutoff_2023', 'created_at']
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Bulk create courses.
        Expects: { "courses": [{"name": "...", "category": "..."}, ...] }
        """
        courses_data = request.data.get('courses', [])
        created = []
        errors = []
        
        for course_data in courses_data:
            try:
                # Remove id if provided to avoid conflicts
                course_data.pop('id', None)
                course = Course.objects.create(**course_data)
                created.append({
                    'id': str(course.id),
                    'name': course.name,
                    'category': course.category
                })
            except Exception as e:
                errors.append({"error": str(e), "data": course_data})
        
        return Response({
            'created_count': len(created),
            'created': created,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Bulk update courses.
        Expects: { "courses": [{"id": "...", "cutoff_2023": 35}, ...] }
        """
        courses_data = request.data.get('courses', [])
        updated = []
        errors = []
        
        for course_data in courses_data:
            course_id = course_data.get('id')
            if not course_id:
                errors.append({"error": "id required", "data": course_data})
                continue
            
            try:
                course = Course.objects.get(id=course_id)
                # Update fields
                for field, value in course_data.items():
                    if field != 'id' and hasattr(course, field):
                        setattr(course, field, value)
                course.save()
                updated.append({
                    'id': str(course.id),
                    'name': course.name
                })
            except Course.DoesNotExist:
                errors.append({"error": f"Course {course_id} not found"})
            except Exception as e:
                errors.append({"error": str(e), "data": course_data})
        
        return Response({
            'updated_count': len(updated),
            'updated': updated,
            'errors': errors
        })


class AdminCourseUniversityViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint for managing Course-University relationships.
    Requires admin role.
    """
    queryset = CourseUniversity.objects.all()
    serializer_class = CourseUniversitySerializer
    permission_classes = [IsAdmin]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course', 'university']
    ordering_fields = ['fees_ksh', 'cutoff_points', 'created_at']
