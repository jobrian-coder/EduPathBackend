from rest_framework import serializers
from .models import Society, SocietyPost
from apps.authentication.serializers import UserSerializer
from apps.hubs.models import Vote


class SocietySerializer(serializers.ModelSerializer):
    class Meta:
        model = Society
        fields = '__all__'


class SocietyPostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    score = serializers.ReadOnlyField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = SocietyPost
        fields = '__all__'
        read_only_fields = [
            'author',
            'upvotes',
            'downvotes',
            'created_at',
            'updated_at',
            'score',
            'user_vote',
        ]

    def get_user_vote(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        vote = Vote.objects.filter(user=user, votable_type='society_post', votable_id=obj.id).first()
        return vote.vote_type if vote else None


class SocietyPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocietyPost
        fields = ['society', 'title', 'content', 'post_type', 'tags']
