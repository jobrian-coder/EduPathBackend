from django.core.management.base import BaseCommand
from apps.authentication.models import Achievement


class Command(BaseCommand):
    help = 'Populate database with achievement badges'

    def handle(self, *args, **kwargs):
        # Delete existing achievements
        Achievement.objects.all().delete()
        self.stdout.write(self.style.WARNING('Deleted all existing achievements'))

        achievements_data = [
            {
                'name': 'first_post',
                'title': 'First Post',
                'description': 'Created your first post in a career hub',
                'icon': '✍️',
                'color': 'bg-blue-100 text-blue-800'
            },
            {
                'name': 'helpful_contributor',
                'title': 'Helpful Contributor',
                'description': 'Received 10+ upvotes on your posts',
                'icon': '⭐',
                'color': 'bg-yellow-100 text-yellow-800'
            },
            {
                'name': 'active_member',
                'title': 'Active Member',
                'description': 'Joined 5+ career hubs',
                'icon': '👥',
                'color': 'bg-green-100 text-green-800'
            },
            {
                'name': 'knowledge_seeker',
                'title': 'Knowledge Seeker',
                'description': 'Asked 10+ questions in career hubs',
                'icon': '📚',
                'color': 'bg-purple-100 text-purple-800'
            },
            {
                'name': 'community_builder',
                'title': 'Community Builder',
                'description': 'Made 50+ comments across all hubs',
                'icon': '🏗️',
                'color': 'bg-indigo-100 text-indigo-800'
            },
            {
                'name': 'goal_setter',
                'title': 'Goal Setter',
                'description': 'Set your career goals in your profile',
                'icon': '🎯',
                'color': 'bg-red-100 text-red-800'
            },
            {
                'name': 'profile_complete',
                'title': 'Profile Complete',
                'description': 'Completed 100% of your profile',
                'icon': '✅',
                'color': 'bg-emerald-100 text-emerald-800'
            },
            {
                'name': 'streak_7',
                'title': '7-Day Streak',
                'description': 'Active on the platform for 7 consecutive days',
                'icon': '🔥',
                'color': 'bg-orange-100 text-orange-800'
            },
            {
                'name': 'top_contributor',
                'title': 'Top Contributor',
                'description': 'Top contributor in a career hub this month',
                'icon': '👑',
                'color': 'bg-amber-100 text-amber-800'
            }
        ]

        for achievement_data in achievements_data:
            achievement, created = Achievement.objects.get_or_create(
                name=achievement_data['name'],
                defaults=achievement_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created achievement: {achievement.title}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Achievement already exists: {achievement.title}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully populated {len(achievements_data)} achievements')
        )
