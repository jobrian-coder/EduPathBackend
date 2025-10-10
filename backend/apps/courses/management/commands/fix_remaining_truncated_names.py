from django.core.management.base import BaseCommand
from apps.courses.models import Course


class Command(BaseCommand):
    help = 'Fix the remaining truncated course names with specific mappings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without actually updating',
        )

    def handle(self, *args, **options):
        # Specific mappings for remaining truncated names
        name_fixes = {
            'BACHELOR OF ARTS IN CHILD AND Y': 'BACHELOR OF ARTS IN CHILD AND YOUTH STUDIES',
            'BACHELOR OF COMMUNICATION AND P': 'BACHELOR OF COMMUNICATION AND PUBLIC RELATIONS',
            'BACHELOR OF EDUCATION ARTS (HOM': 'BACHELOR OF EDUCATION ARTS (HOME ECONOMICS)',
            'BACHELOR OF MUSIC IN MUSIC EDUC': 'BACHELOR OF MUSIC IN MUSIC EDUCATION',
        }
        
        updated_count = 0
        
        for truncated_name, full_name in name_fixes.items():
            courses = Course.objects.filter(name__icontains=truncated_name)
            
            for course in courses:
                if course.name.strip() == truncated_name:
                    self.stdout.write(f'Updating: "{course.name}" -> "{full_name}"')
                    
                    if not options['dry_run']:
                        course.name = full_name
                        course.save()
                    
                    updated_count += 1
                else:
                    # Check if it's a partial match that needs updating
                    if truncated_name in course.name and len(course.name) < len(full_name):
                        self.stdout.write(f'Updating: "{course.name}" -> "{full_name}"')
                        
                        if not options['dry_run']:
                            course.name = full_name
                            course.save()
                        
                        updated_count += 1
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING(f'\nDRY RUN: Would update {updated_count} courses.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nSuccessfully updated {updated_count} courses.'))
            
            # Verify the fixes
            self.stdout.write(self.style.SUCCESS('\nVerifying fixes:'))
            for truncated_name, full_name in name_fixes.items():
                remaining = Course.objects.filter(name__icontains=truncated_name)
                if remaining.exists():
                    for course in remaining:
                        self.stdout.write(f'  Still truncated: "{course.name}"')
                else:
                    self.stdout.write(f'  Fixed: {full_name}')
            
            self.stdout.write(f'\nTotal courses in database: {Course.objects.count()}')
