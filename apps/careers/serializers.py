from rest_framework import serializers
from .models import Career, CareerProsCons


class CareerProsConsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerProsCons
        fields = ['type', 'items']


class CareerSerializer(serializers.ModelSerializer):
    pros_cons = CareerProsConsSerializer(many=True, read_only=True)
    
    class Meta:
        model = Career
        fields = '__all__'


class CareerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing careers"""
    class Meta:
        model = Career
        fields = ['id', 'name', 'category', 'icon', 'avg_salary_ksh', 
                  'job_demand_score', 'growth_rate']


class CareerComparisonSerializer(serializers.Serializer):
    """Serializer for career comparison endpoint"""
    career_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=2,
        max_length=4
    )
