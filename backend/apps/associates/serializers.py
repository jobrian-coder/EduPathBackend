from rest_framework import serializers
from .models import Associate, AssociatePost, ModerationReport, Follow


class AssociateApplicationSerializer(serializers.ModelSerializer):
    """Serializer for public apply endpoint — strips admin-only fields."""
    hub_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Associate
        fields = ['name', 'associate_type', 'bio', 'website', 'location', 'contact_email', 'hub_id']

    def create(self, validated_data):
        hub_id = validated_data.pop('hub_id')
        from apps.hubs.models import CareerHub
        from rest_framework.serializers import ValidationError as VE
        try:
            hub = CareerHub.objects.get(id=hub_id)
        except CareerHub.DoesNotExist:
            raise VE({'hub_id': 'No hub found with that ID.'})
        return Associate.objects.create(
            hub=hub,
            is_verified=False,
            is_suspended=False,
            strike_count=0,
            **validated_data
        )


class AssociatePublicSerializer(serializers.ModelSerializer):
    """Serializer for public-facing Associate data — no admin fields."""
    follower_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Associate
        fields = ['id', 'user', 'name', 'associate_type', 'bio', 'profile_image', 'website', 'location', 'follower_count', 'is_following', 'created_at']
        read_only_fields = fields

    def get_user(self, obj):
        """Return user ID if linked, None otherwise."""
        return str(obj.user.id) if obj.user else None

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(student=request.user, associate=obj).exists()
        return False


class AssociatePostPublicSerializer(serializers.ModelSerializer):
    """Serializer for public-facing AssociatePost data."""
    associate_name = serializers.CharField(source='associate.name', read_only=True)
    associate_type = serializers.CharField(source='associate.associate_type', read_only=True)
    associate_image = serializers.CharField(source='associate.profile_image', read_only=True)

    class Meta:
        model = AssociatePost
        fields = ['id', 'post_type', 'title', 'body', 'image_url', 'external_url', 'cta_label', 'deadline', 'upvotes', 'created_at', 'associate_name', 'associate_type', 'associate_image']
        read_only_fields = fields


class AssociatePostCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin-only post creation."""
    class Meta:
        model = AssociatePost
        fields = ['post_type', 'title', 'body', 'image', 'image_url', 'external_url', 'cta_label', 'deadline']
        read_only_fields = ['is_visible']

    def validate_post_type(self, value):
        allowed = {t[0] for t in AssociatePost.POST_TYPES}
        if value not in allowed:
            raise serializers.ValidationError(f"Invalid post_type. Must be one of: {', '.join(allowed)}")
        return value

    def validate(self, data):
        post_type = data.get('post_type')
        # Opportunity requires external_url and cta_label
        if post_type == 'OPPORTUNITY':
            if not data.get('external_url'):
                raise serializers.ValidationError({'external_url': 'Required for Opportunity posts'})
            if not data.get('cta_label'):
                raise serializers.ValidationError({'cta_label': 'Required for Opportunity posts'})
        # Event requires external_url and cta_label
        if post_type == 'EVENT':
            if not data.get('external_url'):
                raise serializers.ValidationError({'external_url': 'Required for Event posts'})
            if not data.get('cta_label'):
                raise serializers.ValidationError({'cta_label': 'Required for Event posts'})
        # Resource requires external_url and cta_label
        if post_type == 'RESOURCE':
            if not data.get('external_url'):
                raise serializers.ValidationError({'external_url': 'Required for Resource posts'})
            if not data.get('cta_label'):
                raise serializers.ValidationError({'cta_label': 'Required for Resource posts'})
        return data

    def create(self, validated_data):
        return AssociatePost.objects.create(
            is_visible=True,
            upvotes=0,
            **validated_data
        )


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for follow/unfollow operations."""
    class Meta:
        model = Follow
        fields = ['id', 'student', 'associate', 'created_at']
        read_only_fields = ['id', 'student', 'created_at']


class ModerationReportSerializer(serializers.ModelSerializer):
    """Serializer for creating moderation reports."""
    associate_post_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ModerationReport
        fields = ['associate_post_id', 'reason']

    def create(self, validated_data):
        post_id = validated_data.pop('associate_post_id')
        from .models import AssociatePost
        try:
            post = AssociatePost.objects.get(id=post_id)
        except AssociatePost.DoesNotExist:
            # Silently succeed — do not reveal to the reporter whether the post ID was valid
            return None

        request = self.context.get('request')
        reporter = request.user if request and request.user.is_authenticated else None

        return ModerationReport.objects.create(
            reporter=reporter,
            associate_post=post,
            status='OPEN',
            reason=validated_data.get('reason', '')
        )
