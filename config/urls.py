"""
URL configuration for EduPath Career Guide project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.search.views import GlobalSearchView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Global Search
    path('api/search/', GlobalSearchView.as_view(), name='global-search'),
    
    # API endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/careers/', include('apps.careers.urls')),
    path('api/courses/', include('apps.courses.urls')),
    path('api/hubs/', include('apps.hubs.urls')),
    path('api/societies/', include('apps.societies.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
