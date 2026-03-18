from rest_framework import serializers
from .models import AdvisorSession, AdvisorMessage


class AdvisorMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvisorMessage
        fields = ['id', 'role', 'content', 'created_at']


class AdvisorSessionSerializer(serializers.ModelSerializer):
    messages = AdvisorMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AdvisorSession
        fields = [
            'id', 'status', 'question_count', 'profile_text',
            'created_at', 'updated_at', 'messages',
        ]
        read_only_fields = fields


class StartSessionResponseSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    question = serializers.CharField()
    question_number = serializers.IntegerField()
    done = serializers.BooleanField()


class MessageRequestSerializer(serializers.Serializer):
    content = serializers.CharField(
        max_length=2000,
        help_text="The student's answer to the current question."
    )


class MessageResponseSerializer(serializers.Serializer):
    question = serializers.CharField(allow_null=True)
    question_number = serializers.IntegerField()
    done = serializers.BooleanField()
    profile = serializers.CharField(allow_null=True, required=False)


class RecommendationSerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    course_name = serializers.CharField()
    institution = serializers.CharField()
    hub_category = serializers.CharField()
    match_explanation = serializers.CharField()
    career_paths = serializers.ListField(child=serializers.CharField())
    cutoff_2023 = serializers.FloatField(allow_null=True)
    cutoff_2022 = serializers.FloatField(allow_null=True)
    avg_fees_ksh = serializers.FloatField(allow_null=True)
    match_score = serializers.IntegerField()


class RecommendationsResponseSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    profile_text = serializers.CharField()
    recommendations = RecommendationSerializer(many=True)
