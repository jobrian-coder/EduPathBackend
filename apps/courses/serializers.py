from rest_framework import serializers
from .models import University, Course, CourseUniversity


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = '__all__'


class UniversityListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing universities"""
    class Meta:
        model = University
        fields = ['id', 'name', 'short_name', 'type', 'location', 'logo', 'ranking']


class CourseSerializer(serializers.ModelSerializer):
    universities = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = '__all__'
    
    def get_universities(self, obj):
        course_universities = CourseUniversity.objects.filter(course=obj).select_related('university')
        return CourseUniversitySerializer(course_universities, many=True).data


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing courses"""
    class Meta:
        model = Course
        fields = ['id', 'name', 'category', 'duration', 'cluster_points']


class CourseUniversitySerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)  # Use lightweight serializer to avoid circular reference
    university = UniversitySerializer(read_only=True)
    
    class Meta:
        model = CourseUniversity
        fields = '__all__'
