from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import University, Course, CourseUniversity
from .serializers import (
    UniversitySerializer, UniversityListSerializer,
    CourseSerializer, CourseListSerializer, CourseUniversitySerializer
)
from .utils import (
    normalize_grades,
    calculate_mean_points,
    calculate_raw_cluster,
    calculate_cluster_points,
)
from apps.authentication.models import AcademicProfile


class UniversityViewSet(viewsets.ReadOnlyModelViewSet):
    """University CRUD"""
    queryset = University.objects.all()
    serializer_class = UniversitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'location']
    search_fields = ['name', 'short_name', 'description']
    ordering_fields = ['ranking', 'established']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UniversityListSerializer
        return UniversitySerializer
    
    @action(detail=True, methods=['get'])
    def programs(self, request, pk=None):
        """Get all programs offered by a specific university"""
        university = self.get_object()
        
        # Get all CourseUniversity relationships for this university
        course_universities = CourseUniversity.objects.filter(university=university).select_related('course')
        
        # Apply filters if provided
        category = request.query_params.get('category')
        if category:
            course_universities = course_universities.filter(course__category=category)
        
        # Apply search if provided
        search = request.query_params.get('search')
        if search:
            course_universities = course_universities.filter(
                course__name__icontains=search
            )
        
        # Apply ordering
        ordering = request.query_params.get('ordering', 'course__name')
        if ordering in ['course__name', '-course__name', 'fees_ksh', '-fees_ksh', 'cutoff_points', '-cutoff_points']:
            course_universities = course_universities.order_by(ordering)
        
        # Serialize the data
        serializer = CourseUniversitySerializer(course_universities, many=True)
        
        return Response({
            'university': UniversitySerializer(university).data,
            'programs': serializer.data,
            'total_programs': course_universities.count()
        })


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """Course CRUD"""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'description']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    @action(detail=True, methods=['post'])
    def check_eligibility(self, request, pk=None):
        """Check if user is eligible for a course based on cluster points"""
        course = self.get_object()
        user_cluster_points = request.data.get('cluster_points')

        if not user_cluster_points:
            return Response({'error': 'cluster_points required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_points = float(user_cluster_points)
            course_points = float(course.cluster_points)

            eligible = user_points >= course_points
            difference = user_points - course_points

            return Response({
                'eligible': eligible,
                'user_points': user_points,
                'required_points': course_points,
                'difference': difference,
                'message': 'You are eligible!' if eligible else f'You need {abs(difference)} more points'
            })
        except (ValueError, TypeError):
            return Response({'error': 'Invalid cluster_points value'}, status=status.HTTP_400_BAD_REQUEST)


class CourseUniversityViewSet(viewsets.ReadOnlyModelViewSet):
    """Course-University relationships"""
    queryset = CourseUniversity.objects.all()
    serializer_class = CourseUniversitySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course', 'university']
    ordering_fields = ['fees_ksh', 'cutoff_points']


class ClusterCalculationView(APIView):
    """Calculate cluster points and eligibility for a given course."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        course_id = request.data.get('course_id')
        grades = request.data.get('grades')
        mean_points = request.data.get('mean_points')
        use_profile = request.data.get('use_profile', False)

        if not course_id:
            return Response({'error': 'course_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

        # Pull data from user's academic profile if requested
        if use_profile and request.user and request.user.is_authenticated:
            try:
                profile = request.user.academic_profile
                if not grades:
                    grades = profile.kcse_grades
                if not mean_points:
                    mean_points = profile.kcse_mean_points
            except AcademicProfile.DoesNotExist:
                pass

        # Validate grades data
        if not grades:
            return Response({'error': 'grades are required to compute cluster points'}, status=status.HTTP_400_BAD_REQUEST)

        points_map = normalize_grades(grades)
        if not points_map:
            return Response({
                'error': 'No valid grades found. Please provide grades in format: {"subject_code": "grade"} or [{"subject_code": "code", "grade": "A"}]',
                'received_grades': grades
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate course has cluster subjects
        if not course.cluster_subjects:
            return Response({
                'error': 'Course does not have cluster subjects defined',
                'course_id': str(course.id),
                'course_name': course.name
            }, status=status.HTTP_400_BAD_REQUEST)

        raw_cluster_total, missing_subjects = calculate_raw_cluster(points_map, course.cluster_subjects)

        # Calculate mean points
        numeric_mean_points = None
        if mean_points is not None:
            try:
                numeric_mean_points = float(mean_points)
                if numeric_mean_points <= 0:
                    return Response({'error': 'mean_points must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError):
                return Response({'error': 'mean_points must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            numeric_mean_points = calculate_mean_points(points_map)
            if numeric_mean_points is None or numeric_mean_points <= 0:
                return Response({
                    'error': 'Unable to calculate mean points from provided grades',
                    'points_map': points_map,
                    'available_subjects': list(points_map.keys())
                }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate cluster score
        cluster_score = calculate_cluster_points(raw_cluster_total, numeric_mean_points)
        if cluster_score is None:
            return Response({
                'error': 'Unable to compute cluster score with provided data',
                'debug_info': {
                    'raw_cluster_total': raw_cluster_total,
                    'mean_points': numeric_mean_points,
                    'cluster_subjects': course.cluster_subjects,
                    'points_map': points_map,
                    'missing_subjects': missing_subjects
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate course has cluster points
        if not course.cluster_points:
            return Response({
                'error': 'Course does not have cluster points defined',
                'course_id': str(course.id),
                'course_name': course.name
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            required_points = float(course.cluster_points)
        except (TypeError, ValueError):
            return Response({
                'error': 'Course has invalid cluster points value',
                'course_id': str(course.id),
                'course_name': course.name,
                'cluster_points': course.cluster_points
            }, status=status.HTTP_400_BAD_REQUEST)

        eligible = cluster_score >= required_points

        return Response({
            'course_id': str(course.id),
            'course_name': course.name,
            'cluster_points': round(cluster_score, 2),
            'raw_cluster_total': raw_cluster_total,
            'mean_points': round(numeric_mean_points, 2),
            'required_points': required_points,
            'eligible': eligible,
            'missing_subjects': missing_subjects,
            'cluster_subjects': course.cluster_subjects,
            'points_map': points_map,
        })
