from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.db import models
from .models import AcademicProfile, UserInterest, Bookmark, Achievement, UserAchievement, UserActivity
from .serializers import (
    UserSerializer, UserRegistrationSerializer, AcademicProfileSerializer,
    UserInterestSerializer, BookmarkSerializer, AchievementSerializer,
    UserAchievementSerializer, UserActivitySerializer
)

User = get_user_model()


class AuthViewSet(viewsets.GenericViewSet):
    """Authentication endpoints"""
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(request, username=email, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile management"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'post', 'put'])
    def academic_profile(self, request):
        """Manage academic profile"""
        try:
            profile = request.user.academic_profile
        except AcademicProfile.DoesNotExist:
            profile = None
        
        if request.method == 'GET':
            if not profile:
                # Return empty profile data instead of 404
                return Response({
                    'kcse_year': None,
                    'kcse_school': None,
                    'kcse_grades': {},
                    'kcse_mean_points': None,
                    'cluster_points': None,
                    'strengths': [],
                    'interests': [],
                    'career_goals': None,
                })
            serializer = AcademicProfileSerializer(profile)
            return Response(serializer.data)
        
        elif request.method in ['POST', 'PUT']:
            if profile:
                serializer = AcademicProfileSerializer(profile, data=request.data, partial=True)
            else:
                serializer = AcademicProfileSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'put'])
    def interests(self, request):
        """Manage user interests and hobbies"""
        interest, _ = UserInterest.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = UserInterestSerializer(interest)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = UserInterestSerializer(interest, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'post'])
    def bookmarks(self, request):
        """Manage bookmarks"""
        if request.method == 'GET':
            bookmarks = Bookmark.objects.filter(user=request.user)
            serializer = BookmarkSerializer(bookmarks, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = BookmarkSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'], url_path='bookmarks/(?P<bookmark_id>[^/.]+)')
    def delete_bookmark(self, request, bookmark_id=None):
        """Delete a bookmark"""
        try:
            bookmark = Bookmark.objects.get(id=bookmark_id, user=request.user)
            bookmark.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Bookmark.DoesNotExist:
            return Response({'detail': 'Bookmark not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def achievements(self, request):
        """Get user's achievements"""
        achievements = UserAchievement.objects.filter(user=request.user, is_displayed=True)
        serializer = UserAchievementSerializer(achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def activities(self, request):
        """Get user's activity feed"""
        activities = UserActivity.objects.filter(user=request.user)[:50]  # Last 50 activities
        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get user analytics"""
        from django.db.models import Count, Q
        from apps.hubs.models import Post, Comment
        
        # Basic stats
        posts_count = Post.objects.filter(author=request.user).count()
        comments_count = Comment.objects.filter(author=request.user).count()
        upvotes_received = Post.objects.filter(author=request.user).aggregate(
            total_upvotes=models.Sum('upvotes')
        )['total_upvotes'] or 0
        
        # Recent activity (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_posts = Post.objects.filter(author=request.user, created_at__gte=thirty_days_ago).count()
        recent_comments = Comment.objects.filter(author=request.user, created_at__gte=thirty_days_ago).count()
        
        return Response({
            'total_posts': posts_count,
            'total_comments': comments_count,
            'upvotes_received': upvotes_received,
            'recent_posts': recent_posts,
            'recent_comments': recent_comments,
            'profile_completion': request.user.get_profile_completion_percentage(),
            'member_since': request.user.created_at,
        })
