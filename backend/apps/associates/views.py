from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.admin.views.decorators import staff_member_required
from rest_framework.exceptions import NotFound

from apps.authentication.permissions import IsAdmin
from apps.hubs.models import CareerHub
from .models import Associate, AssociatePost, ModerationReport, Follow
from .serializers import (
    AssociateApplicationSerializer,
    AssociatePublicSerializer,
    AssociatePostPublicSerializer,
    AssociatePostCreateSerializer,
    ModerationReportSerializer,
    FollowSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def apply_associate(request):
    """
    POST /api/associates/apply/
    Public endpoint — anyone can apply to become an Associate.
    Creates an unverified Associate record.
    """
    serializer = AssociateApplicationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Application received. You will be contacted at your provided email once reviewed."},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def hub_associates(request, hub_id):
    """
    GET /api/hubs/{hub_id}/associates/
    Public endpoint — returns verified, non-suspended Associates for a hub.
    """
    hub = get_object_or_404(CareerHub, id=hub_id)
    associates = Associate.objects.filter(
        hub=hub,
        is_verified=True,
        is_suspended=False,
    ).order_by('-created_at')

    serializer = AssociatePublicSerializer(associates, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def associate_posts(request, associate_id):
    """
    GET /api/associates/{associate_id}/posts/
    Public endpoint — returns visible posts for a verified, non-suspended Associate.
    Returns 404 if the Associate fails either condition.
    """
    try:
        associate = Associate.objects.get(
            id=associate_id,
            is_verified=True,
            is_suspended=False,
        )
    except Associate.DoesNotExist:
        raise NotFound("Associate not found.")

    posts = AssociatePost.objects.filter(
        associate=associate,
        is_visible=True,
    ).order_by('-created_at')

    serializer = AssociatePostPublicSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_associate_post(request, associate_id):
    """
    POST /api/associates/{associate_id}/posts/
    Admin-only endpoint — creates a post on behalf of an Associate.
    """
    associate = get_object_or_404(Associate, id=associate_id)

    serializer = AssociatePostCreateSerializer(data=request.data)
    if serializer.is_valid():
        post = serializer.save(associate=associate)
        return Response(
            AssociatePostPublicSerializer(post).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    """
    POST /api/reports/
    Authenticated endpoint — students can report an Associate post.
    Silently succeeds even if the post does not exist.
    """
    serializer = ModerationReportSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Report submitted. Thank you for helping keep EduPath safe."},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_associate(request, associate_id):
    """
    POST /api/associates/{associate_id}/follow/
    Authenticated endpoint — follow an Associate.
    """
    associate = get_object_or_404(Associate, id=associate_id, is_verified=True, is_suspended=False)
    
    # Check if already following
    if Follow.objects.filter(student=request.user, associate=associate).exists():
        return Response({"message": "Already following"}, status=status.HTTP_200_OK)
    
    Follow.objects.create(student=request.user, associate=associate)
    return Response({"message": "Followed"}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unfollow_associate(request, associate_id):
    """
    DELETE /api/associates/{associate_id}/follow/
    Authenticated endpoint — unfollow an Associate.
    """
    associate = get_object_or_404(Associate, id=associate_id)
    
    try:
        follow = Follow.objects.get(student=request.user, associate=associate)
        follow.delete()
        return Response({"message": "Unfollowed"}, status=status.HTTP_200_OK)
    except Follow.DoesNotExist:
        return Response({"message": "Not following"}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_followed_associates(request):
    """
    GET /api/associates/followed/
    Authenticated endpoint — list Associates followed by the student.
    """
    follows = Follow.objects.filter(student=request.user).select_related('associate')
    associates = [f.associate for f in follows if f.associate.is_verified and not f.associate.is_suspended]
    
    serializer = AssociatePublicSerializer(associates, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_associate_details(request, associate_id):
    """
    GET /api/associates/{associate_id}/
    Authenticated endpoint — get Associate details with follow status.
    """
    associate = get_object_or_404(Associate, id=associate_id, is_verified=True, is_suspended=False)
    serializer = AssociatePublicSerializer(associate, context={'request': request})
    return Response(serializer.data)
