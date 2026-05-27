from django.urls import path
from .views import (
    apply_associate,
    hub_associates,
    associate_posts,
    create_associate_post,
    create_report,
    follow_associate,
    unfollow_associate,
    list_followed_associates,
    get_associate_details,
    get_my_associate_profile,
    get_my_application_status,
    update_my_associate_profile,
    create_my_associate_post,
    delete_my_associate_post,
    associate_posts_by_tag,
)
from .admin_views import (
    dashboard_stats,
    recent_student_posts,
    recent_associate_posts,
    hub_health,
    hub_student_posts,
    hub_associate_posts,
    hub_reports,
    hide_post,
    warn_student,
    dismiss_post_reports,
    hide_associate_post,
    strike_associate,
    dismiss_associate_post_reports,
    associate_applications,
    approve_application,
    reject_application,
    request_application_info,
)

urlpatterns = [
    # Public application
    path('apply/', apply_associate, name='apply-associate'),

    # Hub associates (public)
    path('hubs/<uuid:hub_id>/associates/', hub_associates, name='hub-associates'),

    # Associate details
    path('<int:associate_id>/', get_associate_details, name='associate-details'),

    # Associate posts (public list)
    path('<int:associate_id>/posts/', associate_posts, name='associate-posts'),

    # Follow endpoints (authenticated)
    path('<int:associate_id>/follow/', follow_associate, name='follow-associate'),
    path('<int:associate_id>/unfollow/', unfollow_associate, name='unfollow-associate'),
    path('followed/', list_followed_associates, name='list-followed-associates'),

    # Admin-only post creation
    path('<int:associate_id>/posts/create/', create_associate_post, name='create-associate-post'),

    # Associate self-service (owner only)
    path('me/', get_my_associate_profile, name='my-associate-profile'),
    path('me/status/', get_my_application_status, name='my-application-status'),
    path('me/update/', update_my_associate_profile, name='update-my-associate-profile'),
    path('me/posts/', create_my_associate_post, name='create-my-associate-post'),
    path('me/posts/<int:post_id>/delete/', delete_my_associate_post, name='delete-my-associate-post'),

    # Public tag filtering
    path('posts/by_tag/', associate_posts_by_tag, name='associate-posts-by-tag'),

    # Moderation reports (authenticated)
    path('reports/', create_report, name='create-report'),

    # Admin-only dashboard endpoints
    path('admin/dashboard-stats/', dashboard_stats, name='admin-dashboard-stats'),
    path('admin/recent-student-posts/', recent_student_posts, name='admin-recent-student-posts'),
    path('admin/recent-associate-posts/', recent_associate_posts, name='admin-recent-associate-posts'),
    path('admin/hub-health/', hub_health, name='admin-hub-health'),

    # Hub moderation endpoints
    path('admin/hubs/<uuid:hub_id>/student-posts/', hub_student_posts, name='admin-hub-student-posts'),
    path('admin/hubs/<uuid:hub_id>/associate-posts/', hub_associate_posts, name='admin-hub-associate-posts'),
    path('admin/hubs/<uuid:hub_id>/reports/', hub_reports, name='admin-hub-reports'),

    # Post moderation actions
    path('admin/posts/<uuid:post_id>/hide/', hide_post, name='admin-hide-post'),
    path('admin/posts/<uuid:post_id>/warn/', warn_student, name='admin-warn-student'),
    path('admin/posts/<uuid:post_id>/dismiss-reports/', dismiss_post_reports, name='admin-dismiss-post-reports'),

    # Associate post moderation actions
    path('admin/associate-posts/<int:post_id>/hide/', hide_associate_post, name='admin-hide-associate-post'),
    path('admin/associate-posts/<int:post_id>/strike/', strike_associate, name='admin-strike-associate'),
    path('admin/associate-posts/<int:post_id>/dismiss-reports/', dismiss_associate_post_reports, name='admin-dismiss-associate-reports'),

    # Associate applications
    path('admin/applications/', associate_applications, name='admin-associate-applications'),
    path('admin/applications/<int:associate_id>/approve/', approve_application, name='admin-approve-application'),
    path('admin/applications/<int:associate_id>/reject/', reject_application, name='admin-reject-application'),
    path('admin/applications/<int:associate_id>/request-info/', request_application_info, name='admin-request-application-info'),
]
