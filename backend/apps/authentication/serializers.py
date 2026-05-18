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
                  'is_active', 'is_staff', 'is_superuser', 'date_joined',
                  'profile_completion', 'profile_completion_details']
        read_only_fields = ['id', 'created_at', 'date_joined', 'profile_completion', 'profile_completion_details']
    
    def get_profile_completion(self, obj):
        return obj.get_profile_completion_percentage()
    
    def get_profile_completion_details(self, obj):
        return obj.get_profile_completion_details()


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'profile_picture', 'bio', 'location',
            'is_active', 'is_staff', 'is_superuser', 'email_verified',
            'phone_number', 'created_at', 'updated_at', 'date_joined',
            'last_login', 'password',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'date_joined', 'last_login']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


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
