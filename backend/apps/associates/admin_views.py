from django.db import models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from apps.authentication.permissions import IsAdmin
from apps.hubs.models import CareerHub, Post
from apps.authentication.models import User
from .models import Associate, AssociatePost, ModerationReport


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def dashboard_stats(request):
    """Admin dashboard overview: students, verified associates, open reports, pending applications."""
    total_students = User.objects.filter(role__in=['novice', 'contributor', 'expert']).count()
    verified_associates = Associate.objects.filter(is_verified=True, is_suspended=False).count()
    open_reports = ModerationReport.objects.filter(status='OPEN').count()
    pending_applications = Associate.objects.filter(application_status='PENDING').count()

    return Response({
        'total_students': total_students,
        'verified_associates': verified_associates,
        'open_reports': open_reports,
        'pending_applications': pending_applications,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def recent_student_posts(request):
    """5 most recent student posts across all hubs."""
    posts = Post.objects.select_related('author', 'hub').order_by('-created_at')[:5]
    data = []
    for post in posts:
        data.append({
            'id': str(post.id),
            'title': post.title,
            'content': post.content[:200],
            'author': post.author.username if post.author else 'Anonymous',
            'hub': post.hub.name if post.hub else 'Unknown',
            'created_at': post.created_at.isoformat(),
            'upvotes': post.upvotes,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def recent_associate_posts(request):
    """5 most recent associate posts across all hubs."""
    posts = AssociatePost.objects.select_related('associate', 'associate__hub').filter(is_visible=True).order_by('-created_at')[:5]
    data = []
    for post in posts:
        data.append({
            'id': str(post.id),
            'content': (post.body or '')[:200],
            'associate': post.associate.name,
            'associate_type': post.associate.associate_type,
            'hub': post.associate.hub.name if post.associate.hub else 'Unknown',
            'created_at': post.created_at.isoformat(),
            'upvotes': post.upvotes,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def hub_health(request):
    """Health indicators for all 10 hubs (posts last 7 days, associate posts last 7 days, open reports)."""
    seven_days_ago = timezone.now() - timedelta(days=7)
    hubs = CareerHub.objects.all()
    data = []

    for hub in hubs:
        student_posts_7d = Post.objects.filter(hub=hub, created_at__gte=seven_days_ago).count()
        # Associate posts in this hub
        associate_ids = Associate.objects.filter(hub=hub, is_verified=True, is_suspended=False).values_list('id', flat=True)
        associate_posts_7d = AssociatePost.objects.filter(associate_id__in=associate_ids, created_at__gte=seven_days_ago, is_visible=True).count()
        # Open reports for posts in this hub
        open_reports = ModerationReport.objects.filter(
            associate_post__associate__hub=hub,
            status='OPEN'
        ).count()

        # Traffic light
        if open_reports == 0:
            traffic_light = 'green'
        elif open_reports <= 2:
            traffic_light = 'amber'
        else:
            traffic_light = 'red'

        data.append({
            'id': str(hub.id),
            'name': hub.name,
            'category': hub.category,
            'student_posts_7d': student_posts_7d,
            'associate_posts_7d': associate_posts_7d,
            'open_reports': open_reports,
            'traffic_light': traffic_light,
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def hub_student_posts(request, hub_id):
    """All student posts in a hub, reverse chronological. Highlight by report count (simulated)."""
    hub = CareerHub.objects.get(id=hub_id)
    posts = Post.objects.filter(hub=hub).select_related('author').order_by('-created_at')

    data = []
    for post in posts:
        # Note: Post model doesn't have direct report tracking in this implementation
        # We'll return 0 for now - could be extended with a separate model
        data.append({
            'id': str(post.id),
            'title': post.title,
            'content': post.content,
            'author': post.author.username if post.author else 'Anonymous',
            'upvotes': post.upvotes,
            'downvotes': post.downvotes,
            'report_count': 0,  # Placeholder - would need a PostReport model
            'created_at': post.created_at.isoformat(),
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def hub_associate_posts(request, hub_id):
    """All associate posts in a hub, reverse chronological. Highlight by report count."""
    hub = CareerHub.objects.get(id=hub_id)
    associate_ids = Associate.objects.filter(hub=hub, is_verified=True, is_suspended=False).values_list('id', flat=True)
    posts = AssociatePost.objects.filter(associate_id__in=associate_ids).select_related('associate').order_by('-created_at')

    data = []
    for post in posts:
        report_count = ModerationReport.objects.filter(associate_post=post, status='OPEN').count()
        data.append({
            'id': str(post.id),
            'content': post.body or '',
            'image_url': post.image_url,
            'external_url': post.external_url,
            'associate': post.associate.name,
            'associate_id': post.associate.id,
            'associate_type': post.associate.associate_type,
            'upvotes': post.upvotes,
            'report_count': report_count,
            'is_visible': post.is_visible,
            'created_at': post.created_at.isoformat(),
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def hub_reports(request, hub_id):
    """All open moderation reports for a hub, grouped by post."""
    hub = CareerHub.objects.get(id=hub_id)
    associate_ids = Associate.objects.filter(hub=hub).values_list('id', flat=True)

    # Get posts with open reports
    posts_with_reports = AssociatePost.objects.filter(
        id__in=ModerationReport.objects.filter(
            associate_post__associate_id__in=associate_ids,
            status='OPEN'
        ).values_list('associate_post_id', flat=True)
    ).select_related('associate').distinct()

    data = []
    for post in posts_with_reports:
        reports = ModerationReport.objects.filter(associate_post=post, status='OPEN').select_related('reporter')
        report_data = []
        for report in reports:
            report_data.append({
                'id': report.id,
                'reporter': report.reporter.username if report.reporter else 'Anonymous',
                'reason': report.reason,
                'created_at': report.created_at.isoformat(),
            })

        data.append({
            'post_id': post.id,
            'post_content': post.content[:150],
            'associate': post.associate.name,
            'associate_type': post.associate.associate_type,
            'reports': report_data,
            'report_count': len(report_data),
        })

    # Sort by report count descending
    data.sort(key=lambda x: x['report_count'], reverse=True)

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def hide_post(request, post_id):
    """Hide a student post (set is_visible=False - would need field on Post model)."""
    # Post model doesn't have is_visible field in current implementation
    # This is a placeholder - would require adding is_visible to Post model
    return Response({'message': 'Post hidden (requires is_visible field on Post model)'}, status=status.HTTP_501_NOT_IMPLEMENTED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def warn_student(request, post_id):
    """Send warning email to student author of a post."""
    # Placeholder - would integrate with email backend
    return Response({'message': 'Warning email sent (requires email integration)'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def dismiss_post_reports(request, post_id):
    """Dismiss all reports against a student post (placeholder)."""
    # Placeholder - would need PostReport model
    return Response({'message': 'Reports dismissed (requires PostReport model)'}, status=status.HTTP_501_NOT_IMPLEMENTED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def hide_associate_post(request, post_id):
    """Hide an associate post."""
    post = AssociatePost.objects.get(id=post_id)
    post.is_visible = False
    post.save()
    return Response({'message': 'Associate post hidden'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def strike_associate(request, post_id):
    """Increment strike count for the associate."""
    post = AssociatePost.objects.get(id=post_id)
    associate = post.associate
    associate.strike_count += 1
    associate.save()
    return Response({'message': 'Strike incremented', 'strike_count': associate.strike_count})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def dismiss_associate_post_reports(request, post_id):
    """Dismiss all open reports against an associate post."""
    ModerationReport.objects.filter(associate_post_id=post_id, status='OPEN').update(status='DISMISSED')
    return Response({'message': 'Reports dismissed'})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def associate_applications(request):
    """List associate applications by status (pending, awaiting_response, history)."""
    status_filter = request.query_params.get('status', 'pending')

    if status_filter == 'pending':
        qs = Associate.objects.filter(application_status='PENDING').order_by('created_at')
    elif status_filter == 'awaiting':
        qs = Associate.objects.filter(application_status='AWAITING_RESPONSE').order_by('-created_at')
    elif status_filter == 'history':
        qs = Associate.objects.filter(application_status__in=['APPROVED', 'REJECTED']).order_by('-created_at')
    else:
        qs = Associate.objects.all().order_by('-created_at')

    data = []
    for assoc in qs:
        data.append({
            'id': assoc.id,
            'name': assoc.name,
            'associate_type': assoc.associate_type,
            'hub': assoc.hub.name,
            'hub_id': str(assoc.hub.id),
            'contact_email': assoc.contact_email,
            'bio': assoc.bio,
            'website': assoc.website,
            'location': assoc.location,
            'profile_image': assoc.profile_image,
            'application_status': assoc.application_status,
            'rejection_reason': assoc.rejection_reason,
            'admin_notes': assoc.admin_notes,
            'created_at': assoc.created_at.isoformat(),
        })

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def approve_application(request, associate_id):
    """Approve an associate application and link to existing user account by contact email."""
    associate = Associate.objects.get(id=associate_id)
    associate.is_verified = True
    associate.application_status = 'APPROVED'
    # Auto-link to a User account if one exists with the same contact email
    if not associate.user:
        try:
            linked_user = User.objects.get(email=associate.contact_email)
            associate.user = linked_user
        except User.DoesNotExist:
            pass
    associate.save()
    # TODO: Send confirmation email
    return Response({'message': 'Application approved'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def reject_application(request, associate_id):
    """Reject an associate application with reason."""
    reason = request.data.get('reason', '')
    associate = Associate.objects.get(id=associate_id)
    associate.application_status = 'REJECTED'
    associate.rejection_reason = reason
    associate.save()
    # TODO: Send rejection email
    return Response({'message': 'Application rejected'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def request_application_info(request, associate_id):
    """Request more information from applicant."""
    question = request.data.get('question', '')
    associate = Associate.objects.get(id=associate_id)
    associate.application_status = 'AWAITING_RESPONSE'
    associate.admin_notes = question
    associate.save()
    # TODO: Send email with question
    return Response({'message': 'Information requested'})
