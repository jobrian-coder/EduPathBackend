from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Society, SocietyPost
from .serializers import SocietySerializer, SocietyPostSerializer, SocietyPostCreateSerializer
from apps.authentication.permissions import IsContributorOrReadOnly, IsAuthorOrReadOnly
from apps.hubs.models import Vote


class SocietyViewSet(viewsets.ReadOnlyModelViewSet):
    """Society CRUD"""
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type']
    search_fields = ['name', 'acronym', 'full_name', 'description']
    ordering_fields = ['name', 'created_at']


class SocietyPostViewSet(viewsets.ModelViewSet):
    """Society post CRUD and voting"""

    queryset = SocietyPost.objects.filter(is_deleted=False)
    serializer_class = SocietyPostSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['society', 'post_type', 'author']
    search_fields = ['title', 'content', 'tags']
    ordering_fields = ['created_at', 'upvotes']

    def get_permissions(self):
        if self.action == 'create':
            return [IsContributorOrReadOnly()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthorOrReadOnly()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_serializer_class(self):
        if self.action == 'create':
            return SocietyPostCreateSerializer
        return SocietyPostSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        post = self.get_object()
        vote_type = request.data.get('vote_type')

        if vote_type not in ['upvote', 'downvote']:
            return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)

        Vote.objects.filter(user=request.user, votable_type='society_post', votable_id=post.id).delete()

        Vote.objects.create(
            user=request.user,
            votable_type='society_post',
            votable_id=post.id,
            vote_type=vote_type,
        )

        post.upvotes = Vote.objects.filter(votable_type='society_post', votable_id=post.id, vote_type='upvote').count()
        post.downvotes = Vote.objects.filter(votable_type='society_post', votable_id=post.id, vote_type='downvote').count()
        post.save(update_fields=['upvotes', 'downvotes'])

        serializer = self.get_serializer(post)
        return Response({'status': 'voted', 'post': serializer.data})

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def unvote(self, request, pk=None):
        post = self.get_object()
        Vote.objects.filter(user=request.user, votable_type='society_post', votable_id=post.id).delete()

        post.upvotes = Vote.objects.filter(votable_type='society_post', votable_id=post.id, vote_type='upvote').count()
        post.downvotes = Vote.objects.filter(votable_type='society_post', votable_id=post.id, vote_type='downvote').count()
        post.save(update_fields=['upvotes', 'downvotes'])

        serializer = self.get_serializer(post)
        return Response({'status': 'unvoted', 'post': serializer.data})
