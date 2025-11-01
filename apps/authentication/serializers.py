from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AcademicProfile, UserInterest, Bookmark, Achievement, UserAchievement, UserActivity

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    profile_completion = serializers.SerializerMethodField()
    profile_completion_details = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'role', 'profile_picture', 'bio', 'location', 'created_at',
                  'profile_completion', 'profile_completion_details']
        read_only_fields = ['id', 'created_at', 'profile_completion', 'profile_completion_details']
    
    def get_profile_completion(self, obj):
        return obj.get_profile_completion_percentage()
    
    def get_profile_completion_details(self, obj):
        return obj.get_profile_completion_details()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 
                  'first_name', 'last_name']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class AcademicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class UserInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInterest
        fields = '__all__'
        read_only_fields = ['user']


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'title', 'description', 'icon', 'color']


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'earned_at', 'is_displayed']
        read_only_fields = ['id', 'earned_at']


class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ['id', 'activity_type', 'target_id', 'target_type', 
                  'description', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']
