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
        from apps.authentication.models import User
        user = request.user if request.user.is_authenticated else None
        if not user:
            contact_email = serializer.validated_data.get('contact_email')
            if contact_email:
                try:
                    user = User.objects.get(email__iexact=contact_email)
                except User.DoesNotExist:
                    pass
        
        # Avoid IntegrityError if the user already has an Associate profile
        if user and Associate.objects.filter(user=user).exists():
            user = None
            
        serializer.save(user=user)
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
    POST /api/associates/{associate_id}/posts/create/
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


def _get_associate_profile(user):
    """Get the verified, non-suspended Associate profile for a user, auto-linking if necessary."""
    try:
        return Associate.objects.get(user=user, is_verified=True, is_suspended=False)
    except Associate.DoesNotExist:
        try:
            assoc = Associate.objects.get(contact_email__iexact=user.email, is_verified=True, is_suspended=False)
            assoc.user = user
            assoc.save()
            return assoc
        except Associate.DoesNotExist:
            raise Associate.DoesNotExist


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_associate_profile(request):
    """
    GET /api/associates/me/
    Returns the Associate profile owned by the current user, or 404.
    """
    try:
        associate = _get_associate_profile(request.user)
    except Associate.DoesNotExist:
        return Response({'detail': 'No verified associate profile found for this account.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AssociatePublicSerializer(associate, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_application_status(request):
    """
    GET /api/associates/me/status/
    Returns the current user's associate application status.
    Returns 404 if no application exists.
    """
    try:
        try:
            associate = Associate.objects.get(user=request.user)
        except Associate.DoesNotExist:
            associate = Associate.objects.get(contact_email__iexact=request.user.email)
            associate.user = request.user
            associate.save()
        return Response({
            'has_application': True,
            'is_verified': associate.is_verified,
            'application_status': associate.application_status,
            'is_suspended': associate.is_suspended,
            'rejection_reason': associate.rejection_reason,
            'tier': associate.tier,
            'associate_id': associate.id,
        })
    except Associate.DoesNotExist:
        return Response({
            'has_application': False,
            'is_verified': False,
            'application_status': None,
        })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_my_associate_profile(request):
    """
    PATCH /api/associates/me/update/
    Allows the owning user to update their associate bio, website, location, profile_image.
    """
    try:
        associate = _get_associate_profile(request.user)
    except Associate.DoesNotExist:
        return Response({'detail': 'No verified associate profile found for this account.'}, status=status.HTTP_404_NOT_FOUND)

    allowed_fields = {'bio', 'website', 'location', 'profile_image'}
    data = {k: v for k, v in request.data.items() if k in allowed_fields}
    for field, value in data.items():
        setattr(associate, field, value)
    associate.save()
    serializer = AssociatePublicSerializer(associate, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_my_associate_post(request):
    """
    POST /api/associates/me/posts/
    Allows the owning user to create a post for their associate profile.
    Also creates a corresponding hub Post so it appears in the hub feed.
    Supports multipart/form-data for image uploads.
    """
    try:
        associate = _get_associate_profile(request.user)
    except Associate.DoesNotExist:
        return Response({'detail': 'No verified associate profile found for this account.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AssociatePostCreateSerializer(data=request.data)
    if serializer.is_valid():
        tier = associate.tier
        post_type = serializer.validated_data.get('post_type', 'UPDATE')
        
        # 1. Post type restriction for FREE tier
        if tier == 'FREE' and post_type != 'UPDATE':
            return Response(
                {'detail': 'Only Text Updates are allowed on the Free plan. Upgrade to Standard or Premium to post opportunities, events, or resources.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # 2. Monthly count limit
        monthly_limit = 3 if tier == 'FREE' else (10 if tier == 'STANDARD' else None)
        if monthly_limit is not None:
            current_count = associate.get_monthly_post_count()
            if current_count >= monthly_limit:
                return Response(
                    {'detail': f'Monthly post limit of {monthly_limit} reached for your {tier.capitalize()} plan. Upgrade to post more.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        # Parse hashtags from body
        body = serializer.validated_data.get('body', '')
        from apps.courses.utils import parse_hashtags
        tags = parse_hashtags(body)
        associate_post = serializer.save(associate=associate, tags=tags)
        
        # If image was uploaded, set image_url to the uploaded image URL
        if associate_post.image:
            associate_post.image_url = request.build_absolute_uri(associate_post.image.url)
            associate_post.save()
        
        # Also create a hub Post so it appears in the hub feed
        from apps.hubs.models import Post
        import uuid
        
        # Check if user is a member of the hub (required for hub posts)
        if not associate.hub.members.filter(id=request.user.id).exists():
            # Add user to hub if not already a member
            associate.hub.members.add(request.user)
        
        # Map associate post type to hub post type
        post_type_map = {
            'UPDATE': 'discussion',
            'OPPORTUNITY': 'discussion',
            'EVENT': 'discussion',
            'RESOURCE': 'guide',
        }
        
        # Generate title if not provided
        post_title = serializer.validated_data.get('title')
        if not post_title:
            post_type_display = dict(AssociatePost.POST_TYPES).get(serializer.validated_data.get('post_type', 'UPDATE'), 'Update')
            post_title = f'{associate.name} - {post_type_display}'
        
        hub_post = Post.objects.create(
            hub=associate.hub,
            author=request.user,
            title=post_title,
            content=body,
            post_type=post_type_map.get(serializer.validated_data.get('post_type', 'UPDATE'), 'discussion'),
            is_expert_post=True,  # Mark as expert/associate post
            tags=tags,
            upvotes=associate_post.upvotes,
        )
        
        return Response(AssociatePostPublicSerializer(associate_post).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_my_associate_post(request, post_id):
    """
    DELETE /api/associates/me/posts/{post_id}/
    Allows the owning user to delete one of their own associate posts.
    """
    try:
        associate = _get_associate_profile(request.user)
    except Associate.DoesNotExist:
        return Response({'detail': 'No verified associate profile found for this account.'}, status=status.HTTP_404_NOT_FOUND)

    post = get_object_or_404(AssociatePost, id=post_id, associate=associate)
    post.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)



@api_view(['GET'])
@permission_classes([AllowAny])
def associate_posts_by_tag(request):
    """
    GET /api/associates/posts/by_tag/?tag=computer-science
    Public endpoint — returns associate posts filtered by course tag.
    """
    tag_slug = request.query_params.get('tag')
    if not tag_slug:
        return Response({'error': 'tag parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    from django.db.models import Q
    posts_qs = AssociatePost.objects.filter(
        is_visible=True,
        associate__is_verified=True,
        associate__is_suspended=False
    ).filter(
        Q(tags__contains=[{'tag': tag_slug}]) | Q(tags__contains=[{'tag': tag_slug.lower()}])
    ).select_related('associate').order_by('-created_at')

    serializer = AssociatePostPublicSerializer(posts_qs, many=True)
    return Response(serializer.data)


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upgrade_tier(request):
    """
    POST /api/associates/me/upgrade/
    Allows upgrading subscription tier (FREE, STANDARD, PREMIUM).
    """
    try:
        associate = _get_associate_profile(request.user)
    except Associate.DoesNotExist:
        try:
            associate = Associate.objects.get(user=request.user)
        except Associate.DoesNotExist:
            try:
                associate = Associate.objects.get(contact_email__iexact=request.user.email)
                associate.user = request.user
                associate.save()
            except Associate.DoesNotExist:
                return Response({'detail': 'No associate profile found for this account.'}, status=status.HTTP_404_NOT_FOUND)
        
    tier = request.data.get('tier')
    if tier not in ['FREE', 'STANDARD', 'PREMIUM']:
        return Response({'detail': 'Invalid subscription tier.'}, status=status.HTTP_400_BAD_REQUEST)
        
    associate.tier = tier
    associate.save()
    
    # Return updated profile data
    serializer = AssociatePublicSerializer(associate, context={'request': request})
    return Response(serializer.data)
