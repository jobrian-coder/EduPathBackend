from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from apps.careers.models import Career
from apps.courses.models import Course, University
from apps.hubs.models import Post
from apps.societies.models import Society


class GlobalSearchView(APIView):
    """
    Global search across careers, courses, universities, posts, and societies
    GET /api/search/?q=engineering&type=all
    """
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'all')
        
        if not query:
            return Response({'error': 'Query parameter "q" is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        results = {}
        
        # Search careers
        if search_type in ['all', 'careers']:
            careers = Career.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )[:10]
            results['careers'] = [{
                'id': str(c.id),
                'name': c.name,
                'category': c.category,
                'icon': c.icon,
                'type': 'career'
            } for c in careers]
        
        # Search courses
        if search_type in ['all', 'courses']:
            courses = Course.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )[:10]
            results['courses'] = [{
                'id': str(c.id),
                'name': c.name,
                'category': c.category,
                'duration': c.duration,
                'type': 'course'
            } for c in courses]
        
        # Search universities
        if search_type in ['all', 'universities']:
            universities = University.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )[:10]
            results['universities'] = [{
                'id': str(u.id),
                'name': u.name,
                'location': u.location,
                'ranking': u.ranking,
                'type': 'university'
            } for u in universities]
        
        # Search posts
        if search_type in ['all', 'posts']:
            posts = Post.objects.filter(
                Q(title__icontains=query) | Q(content__icontains=query),
                is_deleted=False
            )[:10]
            results['posts'] = [{
                'id': str(p.id),
                'title': p.title,
                'hub': p.hub.name if p.hub else None,
                'author': p.author.username if p.author else 'Deleted',
                'type': 'post'
            } for p in posts]
        
        # Search societies
        if search_type in ['all', 'societies']:
            societies = Society.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )[:10]
            results['societies'] = [{
                'id': str(s.id),
                'name': s.name,
                'acronym': s.acronym,
                'type': 'society'
            } for s in societies]
        
        # Calculate total results
        total = sum(len(v) for v in results.values())
        
        return Response({
            'query': query,
            'total_results': total,
            'results': results
        })
