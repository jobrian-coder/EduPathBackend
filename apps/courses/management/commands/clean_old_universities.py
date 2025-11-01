from django.core.management.base import BaseCommand
from apps.courses.models import University


class Command(BaseCommand):
    help = 'Remove old generic universities without KUCCPS codes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        # Find universities without codes (the old generic ones)
        old_universities = University.objects.filter(code__isnull=True)
        
        if not old_universities.exists():
            self.stdout.write(self.style.SUCCESS('No old universities found to clean up.'))
            return
        
        self.stdout.write(f'Found {old_universities.count()} universities without codes:')
        
        for uni in old_universities:
            self.stdout.write(f'  - {uni.name}')
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('\nDRY RUN: No universities were deleted.'))
            return
        
        # Auto-proceed with deletion
        self.stdout.write('\nProceeding with deletion...')
        
        # Delete the old universities
        deleted_count, _ = old_universities.delete()
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully deleted {deleted_count} old universities.'))
        self.stdout.write(f'Remaining universities: {University.objects.count()}')
        
        # Show remaining universities
        self.stdout.write(self.style.SUCCESS('\nRemaining universities:'))
        remaining = University.objects.filter(code__isnull=False).order_by('name')[:10]
        for uni in remaining:
            self.stdout.write(f'  - {uni.name} ({uni.code})')
        
        if University.objects.count() > 10:
            self.stdout.write(f'  ... and {University.objects.count() - 10} more')
