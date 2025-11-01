from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import F, Count, Prefetch
from .models import CareerHub, Post, Comment, Vote
from apps.courses.models import Course
from apps.courses.serializers import CourseListSerializer
from .serializers import (
    CareerHubSerializer, PostSerializer, PostCreateSerializer,
    CommentSerializer, CommentCreateSerializer, VoteSerializer
)
from apps.authentication.permissions import IsContributorOrReadOnly, IsAuthorOrReadOnly


class CareerHubViewSet(viewsets.ReadOnlyModelViewSet):
    """Career Hub CRUD"""
    queryset = CareerHub.objects.all().prefetch_related('members')
    serializer_class = CareerHubSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'field', 'description']
    ordering_fields = ['member_count', 'active_posts', 'created_at']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        hub = self.get_object()
        hub.members.add(request.user)
        hub.update_member_count()
        serializer = self.get_serializer(hub, context={'request': request})
        return Response({'status': 'joined', 'hub': serializer.data})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        hub = self.get_object()
        hub.members.remove(request.user)
        hub.update_member_count()
        serializer = self.get_serializer(hub, context={'request': request})
        return Response({'status': 'left', 'hub': serializer.data})

    @action(detail=True, methods=['get'])
    def overview(self, request, pk=None):
        hub = self.get_object()
        hub_serializer = self.get_serializer(hub, context={'request': request})

        posts_qs = hub.posts.filter(is_deleted=False).select_related('author').order_by('-created_at')[:5]
        posts = PostSerializer(posts_qs, many=True, context={'request': request}).data

        related_courses_qs = Course.objects.filter(category__iexact=hub.category).order_by('name')[:6]
        courses = CourseListSerializer(related_courses_qs, many=True, context={'request': request}).data

        return Response({
            'hub': hub_serializer.data,
            'recent_posts': posts,
            'related_courses': courses,
        })

    @action(detail=True, methods=['get'])
    def related_courses(self, request, pk=None):
        hub = self.get_object()
        limit = int(request.query_params.get('limit', 12))
        courses_qs = Course.objects.filter(category__iexact=hub.category).order_by('name')
        if limit:
            courses_qs = courses_qs[:limit]
        serializer = CourseListSerializer(courses_qs, many=True, context={'request': request})
        return Response({'results': serializer.data})

    @action(detail=True, methods=['get'])
    def recent_posts(self, request, pk=None):
        hub = self.get_object()
        limit = int(request.query_params.get('limit', 10))
        posts_qs = hub.posts.filter(is_deleted=False).select_related('author').order_by('-created_at')
        if limit:
            posts_qs = posts_qs[:limit]
        serializer = PostSerializer(posts_qs, many=True, context={'request': request})
        return Response({'results': serializer.data})


class PostViewSet(viewsets.ModelViewSet):
    """Post CRUD and voting"""
    queryset = Post.objects.filter(is_deleted=False)
    serializer_class = PostSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['hub', 'post_type', 'author']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'upvotes', 'comment_count']
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthorOrReadOnly()]
        return [permissions.IsAuthenticatedOrReadOnly()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Override to increment view count asynchronously"""
        instance = self.get_object()
        
        # Increment view count (async-safe using F() expression)
        from django.db.models import F
        Post.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        
        # Refresh instance to get updated view_count
        instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        # Check if user is a member of the hub
        hub = serializer.validated_data.get('hub')
        if hub and not hub.members.filter(id=self.request.user.id).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must be a member of this hub to create posts.")
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        """Vote on a post"""
        post = self.get_object()
        vote_type = request.data.get('vote_type')
        
        if vote_type not in ['upvote', 'downvote']:
            return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Remove existing vote if any
        Vote.objects.filter(user=request.user, votable_type='post', votable_id=post.id).delete()
        
        # Create new vote
        Vote.objects.create(
            user=request.user,
            votable_type='post',
            votable_id=post.id,
            vote_type=vote_type
        )
        
        # Update post vote counts
        post.upvotes = Vote.objects.filter(votable_type='post', votable_id=post.id, vote_type='upvote').count()
        post.downvotes = Vote.objects.filter(votable_type='post', votable_id=post.id, vote_type='downvote').count()
        post.save()
        
        return Response({'status': 'voted', 'upvotes': post.upvotes, 'downvotes': post.downvotes})
    
    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def unvote(self, request, pk=None):
        """Remove vote from a post"""
        post = self.get_object()
        Vote.objects.filter(user=request.user, votable_type='post', votable_id=post.id).delete()
        
        # Update post vote counts
        post.upvotes = Vote.objects.filter(votable_type='post', votable_id=post.id, vote_type='upvote').count()
        post.downvotes = Vote.objects.filter(votable_type='post', votable_id=post.id, vote_type='downvote').count()
        
        return Response({'status': 'unvoted', 'upvotes': post.upvotes, 'downvotes': post.downvotes})


class CommentViewSet(viewsets.ModelViewSet):
    """Comment CRUD, replies, and voting with unlimited nesting support"""
    queryset = Comment.objects.filter(is_deleted=False)
    serializer_class = CommentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['post', 'author', 'parent_comment']
    ordering_fields = ['created_at', 'upvotes']
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        return CommentSerializer
    
    def get_queryset(self):
        """
        Optimize queryset for nested reply prefetching
        Uses select_related for author and filters for replies
        """
        queryset = super().get_queryset().select_related('author')
        parent = self.request.query_params.get('parent_comment')
        if parent:
            return queryset.filter(parent_comment=parent)
        return queryset.filter(parent_comment__isnull=True)

    @transaction.atomic
    def perform_create(self, serializer):
        """Create comment with atomic updates to counts"""
        comment = serializer.save(author=self.request.user)
        
        # Update parent comment's reply_count atomically if this is a reply
        if comment.parent_comment:
            Comment.objects.filter(pk=comment.parent_comment.pk).update(
                reply_count=F('reply_count') + 1
            )
        
        # Update post comment count atomically
        Post.objects.filter(pk=comment.post.pk).update(
            comment_count=F('comment_count') + 1
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        """Handle comment deletion with proper count updates"""
        # Mark as deleted instead of actually deleting to preserve thread structure
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])
        
        # Decrement parent's reply_count if this is a reply
        if instance.parent_comment:
            Comment.objects.filter(pk=instance.parent_comment.pk).update(
                reply_count=F('reply_count') - 1
            )
        
        # Decrement post's comment count
        Post.objects.filter(pk=instance.post.pk).update(
            comment_count=F('comment_count') - 1
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        """Vote on a comment"""
        comment = self.get_object()
        vote_type = request.data.get('vote_type')
        if vote_type not in ['upvote', 'downvote']:
            return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Remove existing vote if any
        Vote.objects.filter(user=request.user, votable_type='comment', votable_id=comment.id).delete()
        
        # Create new vote
        Vote.objects.create(
            user=request.user,
            votable_type='comment',
            votable_id=comment.id,
            vote_type=vote_type
        )
        
        # Update comment vote counts
        comment.upvotes = Vote.objects.filter(votable_type='comment', votable_id=comment.id, vote_type='upvote').count()
        comment.downvotes = Vote.objects.filter(votable_type='comment', votable_id=comment.id, vote_type='downvote').count()
        comment.save()
        
        return Response({'status': 'voted', 'upvotes': comment.upvotes, 'downvotes': comment.downvotes})
