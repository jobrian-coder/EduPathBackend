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
    class Meta:
        model = Course
        fields = '__all__'


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing courses"""
    class Meta:
        model = Course
        fields = ['id', 'name', 'category', 'duration', 'cluster_points']


class CourseUniversitySerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    university = UniversitySerializer(read_only=True)
    
    class Meta:
        model = CourseUniversity
        fields = '__all__'
