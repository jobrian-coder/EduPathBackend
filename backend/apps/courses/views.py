from django.db.models import Q
from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action, api_view
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
        """Get all programs offered by a specific university using flat Course rows"""
        university = self.get_object()

        # Query flat Course rows whose institution matches the university name or short_name
        courses = Course.objects.filter(
            Q(institution__iexact=university.name) |
            Q(institution__iexact=university.short_name) |
            Q(institution__icontains=university.short_name)
        )

        category = request.query_params.get('category')
        if category:
            courses = courses.filter(category__icontains=category)

        search = request.query_params.get('search')
        if search:
            courses = courses.filter(
                Q(name__icontains=search) | Q(category__icontains=search)
            )

        ordering = request.query_params.get('ordering', 'category')
        ordering_map = {
            'course__name': 'category',
            '-course__name': '-category',
            'fees_ksh': 'avg_fees_ksh',
            '-fees_ksh': '-avg_fees_ksh',
            'cutoff_points': 'cutoff_2023',
            '-cutoff_points': '-cutoff_2023',
        }
        courses = courses.order_by(ordering_map.get(ordering, 'category'))

        serializer = CourseSerializer(courses, many=True)
        return Response({
            'university': UniversitySerializer(university).data,
            'programs': serializer.data,
            'total_programs': courses.count()
        })


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """Course CRUD — returns flat rows (one per programme)"""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'related_hub', 'institution']
    search_fields = ['name', 'category', 'description', 'institution']

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

        if not course.cluster_points:
            return Response(
                {'error': 'This course does not have cluster points defined (new KUCCPS data uses cutoff_2023 instead).'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
    """Course-University relationships (legacy)"""
    queryset = CourseUniversity.objects.all()
    serializer_class = CourseUniversitySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course', 'university']
    ordering_fields = ['fees_ksh', 'cutoff_points']


# ── New grouped endpoints (category-level presentation) ──────────────────────

def _build_programme_entry(course):
    return {
        'programme_code':        course.programme_code,
        'name':                  course.name,
        'institution':           course.institution,
        'cutoff_2023':           float(course.cutoff_2023) if course.cutoff_2023 is not None else None,
        'cutoff_2022':           float(course.cutoff_2022) if course.cutoff_2022 is not None else None,
        'subject_requirement_1': course.subject_requirement_1,
        'subject_requirement_2': course.subject_requirement_2,
        'subject_requirement_3': course.subject_requirement_3,
        'subject_requirement_4': course.subject_requirement_4,
    }


@api_view(['GET'])
def course_list_grouped(request):
    """
    Returns one entry per category for the frontend discovery page.
    All programme offerings for a category are nested under 'programmes'.

    Query params:
        q   — filter by category name (case-insensitive contains)
        hub — filter by related_hub (exact)
    """
    import traceback
    try:
        search = request.query_params.get('q', '').strip()
        hub    = request.query_params.get('hub', '').strip()

        from django.db.models import Case, When, Value, IntegerField
        
        qs = Course.objects.all()
        if search:
            qs = qs.filter(
                Q(category__icontains=search) |
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(institution__icontains=search)
            ).annotate(
                match_rank=Case(
                    When(category__istartswith=search, then=Value(1)),
                    When(category__icontains=search, then=Value(2)),
                    When(name__icontains=search, then=Value(3)),
                    default=Value(4),
                    output_field=IntegerField(),
                )
            ).order_by('match_rank', 'category', 'cutoff_2023')
        else:
            qs = qs.order_by('category', 'cutoff_2023')
        if hub:
            qs = qs.filter(related_hub=hub)

        grouped = {}
        for course in qs:
            cat = course.category
            if cat not in grouped:
                grouped[cat] = {
                    'category':     cat,
                    'description':  course.description,
                    'pros':         course.pros,
                    'cons':         course.cons,
                    'careers':      course.careers,
                    'related_hub':  course.related_hub,
                    'avg_fees_ksh': course.avg_fees_ksh,
                    'is_enriched':  course.is_enriched,
                    'programmes':   [],
                }
            grouped[cat]['programmes'].append(_build_programme_entry(course))

        return Response(list(grouped.values()))
    except Exception as e:
        print(f"ERROR in course_list_grouped: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def course_detail_grouped(request, category):
    """
    Returns full detail for one category, including all programme offerings
    ordered by cutoff_2023 ascending (best cutoff last).
    """
    courses = Course.objects.filter(category=category).order_by('cutoff_2023')
    if not courses.exists():
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    first = courses.first()
    return Response({
        'category':     first.category,
        'description':  first.description,
        'pros':         first.pros,
        'cons':         first.cons,
        'careers':      first.careers,
        'related_hub':  first.related_hub,
        'avg_fees_ksh': first.avg_fees_ksh,
        'is_enriched':  first.is_enriched,
        'programmes':   [_build_programme_entry(c) for c in courses],
    })


# ── Legacy ClusterCalculationView (kept for backward compat) ─────────────────

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

        if use_profile and request.user and request.user.is_authenticated:
            try:
                profile = request.user.academic_profile
                if not grades:
                    grades = profile.kcse_grades
                if not mean_points:
                    mean_points = profile.kcse_mean_points
            except AcademicProfile.DoesNotExist:
                pass

        if not grades:
            return Response({'error': 'grades are required to compute cluster points'}, status=status.HTTP_400_BAD_REQUEST)

        points_map = normalize_grades(grades)
        if not points_map:
            return Response({
                'error': 'No valid grades found.',
                'received_grades': grades
            }, status=status.HTTP_400_BAD_REQUEST)

        if not course.cluster_subjects:
            return Response({
                'error': 'Course does not have cluster subjects defined',
                'course_id': str(course.id),
                'course_name': course.name
            }, status=status.HTTP_400_BAD_REQUEST)

        raw_cluster_total, missing_subjects = calculate_raw_cluster(points_map, course.cluster_subjects)

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
                return Response({'error': 'Unable to calculate mean points from provided grades'}, status=status.HTTP_400_BAD_REQUEST)

        cluster_score = calculate_cluster_points(raw_cluster_total, numeric_mean_points)
        if cluster_score is None:
            return Response({'error': 'Unable to compute cluster score with provided data'}, status=status.HTTP_400_BAD_REQUEST)

        if not course.cluster_points:
            return Response({
                'error': 'Course does not have cluster points defined',
                'course_id': str(course.id),
                'course_name': course.name
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            required_points = float(course.cluster_points)
        except (TypeError, ValueError):
            return Response({'error': 'Course has invalid cluster points value'}, status=status.HTTP_400_BAD_REQUEST)

        eligible = cluster_score >= required_points

        return Response({
            'course_id':         str(course.id),
            'course_name':       course.name,
            'cluster_points':    round(cluster_score, 2),
            'raw_cluster_total': raw_cluster_total,
            'mean_points':       round(numeric_mean_points, 2),
            'required_points':   required_points,
            'eligible':          eligible,
            'missing_subjects':  missing_subjects,
            'cluster_subjects':  course.cluster_subjects,
            'points_map':        points_map,
        })
