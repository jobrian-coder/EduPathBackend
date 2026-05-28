"""
Management command: backdate_records
Spreads associate created_at, associate post created_at, and user date_joined
chronologically across the past 2 months so sorting demo data looks realistic.
"""
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import connection


class Command(BaseCommand):
    help = 'Spread associates, associate posts, and user join dates across the past 2 months'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without saving',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()
        two_months_ago = now - timedelta(days=60)

        def rand_dt(earliest=two_months_ago, latest=now):
            delta = latest - earliest
            offset = timedelta(seconds=random.randint(0, int(delta.total_seconds())))
            return earliest + offset

        # ── Associates ───────────────────────────────────────────────────────
        from apps.associates.models import Associate, AssociatePost

        associates = list(Associate.objects.all().order_by('id'))
        total_assoc = len(associates)
        self.stdout.write(f'Found {total_assoc} associates')

        # Sort into chronological slots spread evenly across 60 days
        for i, assoc in enumerate(associates):
            # Evenly space them plus a small random jitter (±3 days)
            base_offset = timedelta(days=(60 * i / max(total_assoc, 1)))
            jitter = timedelta(hours=random.randint(-72, 72))
            new_dt = two_months_ago + base_offset + jitter
            new_dt = max(two_months_ago, min(now - timedelta(hours=1), new_dt))

            if not dry_run:
                # created_at is auto_now_add — bypass via queryset update
                Associate.objects.filter(pk=assoc.pk).update(created_at=new_dt)
            self.stdout.write(f'  Associate [{assoc.pk}] {assoc.name[:40]:<40} → {new_dt.strftime("%Y-%m-%d %H:%M")}')

        # ── Associate Posts ───────────────────────────────────────────────────
        posts = list(AssociatePost.objects.all().order_by('associate_id', 'id'))
        total_posts = len(posts)
        self.stdout.write(f'\nFound {total_posts} associate posts')

        for i, post in enumerate(posts):
            # Posts should be AFTER their associate's join — use a random date
            base_offset = timedelta(days=(55 * i / max(total_posts, 1)))
            jitter = timedelta(hours=random.randint(0, 240))
            new_dt = two_months_ago + timedelta(days=5) + base_offset + jitter
            new_dt = max(two_months_ago, min(now - timedelta(minutes=30), new_dt))

            if not dry_run:
                AssociatePost.objects.filter(pk=post.pk).update(created_at=new_dt)

            # Also spread upvotes for more realistic engagement
            upvotes = random.randint(0, 120)
            if not dry_run:
                AssociatePost.objects.filter(pk=post.pk).update(upvotes=upvotes)

            self.stdout.write(
                f'  Post [{post.pk}] {str(post.title or post.body or "")[:35]:<35} '
                f'→ {new_dt.strftime("%Y-%m-%d %H:%M")} | ▲{upvotes}'
            )

        # ── Users ─────────────────────────────────────────────────────────────
        from apps.authentication.models import User

        users = list(User.objects.filter(is_superuser=False).order_by('id'))
        total_users = len(users)
        self.stdout.write(f'\nFound {total_users} non-superuser users')

        for i, user in enumerate(users):
            base_offset = timedelta(days=(58 * i / max(total_users, 1)))
            jitter = timedelta(hours=random.randint(-36, 36))
            new_dt = two_months_ago + base_offset + jitter
            new_dt = max(two_months_ago, min(now - timedelta(minutes=5), new_dt))

            if not dry_run:
                User.objects.filter(pk=user.pk).update(date_joined=new_dt)
            self.stdout.write(
                f'  User [{user.pk}] {user.username:<25} → {new_dt.strftime("%Y-%m-%d %H:%M")}'
            )

        # ── Hub posts (student posts) ─────────────────────────────────────────
        from apps.hubs.models import Post

        hub_posts = list(Post.objects.all().order_by('id'))
        total_hub_posts = len(hub_posts)
        self.stdout.write(f'\nFound {total_hub_posts} hub/student posts')

        for i, post in enumerate(hub_posts):
            base_offset = timedelta(days=(58 * i / max(total_hub_posts, 1)))
            jitter = timedelta(hours=random.randint(0, 96))
            new_dt = two_months_ago + base_offset + jitter
            new_dt = max(two_months_ago, min(now - timedelta(minutes=10), new_dt))

            upvotes = random.randint(0, 200)
            downvotes = random.randint(0, max(1, upvotes // 5))
            comment_count = random.randint(0, 30)

            if not dry_run:
                Post.objects.filter(pk=post.pk).update(
                    created_at=new_dt,
                    upvotes=upvotes,
                    downvotes=downvotes,
                    comment_count=comment_count,
                )

        if dry_run:
            self.stdout.write(self.style.WARNING('\n[DRY RUN] No changes saved.'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'\nDone! Backdated {total_assoc} associates, {total_posts} associate posts, '
                f'{total_users} users, {total_hub_posts} hub posts.'
            ))
