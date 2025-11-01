from django.core.management.base import BaseCommand
from apps.hubs.models import CareerHub


class Command(BaseCommand):
    help = 'Remove specific hubs from the database'

    def handle(self, *args, **kwargs):
        # Hubs to remove
        hubs_to_remove = [
            'Technology Hub',
            'Creatives Hub'
        ]
        
        removed_count = 0
        
        for hub_name in hubs_to_remove:
            try:
                hub = CareerHub.objects.get(name=hub_name)
                hub.delete()
                removed_count += 1
                self.stdout.write(self.style.SUCCESS(f'Removed hub: {hub_name}'))
            except CareerHub.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Hub not found: {hub_name}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nCompleted! Removed {removed_count} hubs from database'))
        
        # Show remaining hubs
        remaining_hubs = CareerHub.objects.all().order_by('name')
        if remaining_hubs.exists():
            self.stdout.write(self.style.SUCCESS(f'\nRemaining hubs ({remaining_hubs.count()}):'))
            for hub in remaining_hubs:
                self.stdout.write(f'  - {hub.name}')
        else:
            self.stdout.write(self.style.WARNING('No hubs remaining in database'))
