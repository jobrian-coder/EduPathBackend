from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Career, CareerProsCons
from .serializers import (
    CareerSerializer, CareerListSerializer, CareerComparisonSerializer
)


class CareerViewSet(viewsets.ReadOnlyModelViewSet):
    """Career CRUD and comparison"""
    queryset = Career.objects.all()
    serializer_class = CareerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'description']
    ordering_fields = ['avg_salary_ksh', 'job_demand_score', 'growth_rate']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CareerListSerializer
        return CareerSerializer
    
    @action(detail=False, methods=['post'])
    def compare(self, request):
        """Compare multiple careers"""
        serializer = CareerComparisonSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        career_ids = serializer.validated_data['career_ids']
        careers = Career.objects.filter(id__in=career_ids)
        
        if careers.count() != len(career_ids):
            return Response({'error': 'One or more career IDs not found'}, status=404)
        
        # Get pros/cons for each career
        careers_data = []
        for career in careers:
            career_dict = CareerSerializer(career).data
            pros = CareerProsCons.objects.filter(career=career, type='pros').first()
            cons = CareerProsCons.objects.filter(career=career, type='cons').first()
            career_dict['pros'] = pros.items if pros else []
            career_dict['cons'] = cons.items if cons else []
            careers_data.append(career_dict)
        
        return Response(careers_data)
