import os
import pandas as pd
from django.core.management.base import BaseCommand
from apps.courses.models import Course


class Command(BaseCommand):
    help = 'Fix remaining truncated course names using the full category names CSV'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without actually updating',
        )

    def handle(self, *args, **options):
        # Path to the CSV file
        possible_paths = [
            os.path.join('..', 'kuccps data', 'full_category_names.csv'),
            os.path.join('..', '..', 'backend', 'kuccps data', 'full_category_names.csv'),
            'backend/kuccps data/full_category_names.csv',
            'kuccps data/full_category_names.csv'
        ]
        
        csv_path = None
        for path in possible_paths:
            if os.path.exists(path):
                csv_path = path
                break
        
        if not csv_path:
            # Try to find the file in the project directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            while current_dir != os.path.dirname(current_dir):
                test_path = os.path.join(current_dir, 'backend', 'kuccps data', 'full_category_names.csv')
                if os.path.exists(test_path):
                    csv_path = test_path
                    break
                current_dir = os.path.dirname(current_dir)
        
        if not csv_path or not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_path}'))
            return
        
        try:
            # Read the CSV file
            df = pd.read_csv(csv_path)
            
            self.stdout.write(f'Found {len(df)} full category names in CSV file')
            
            # Create a mapping of partial names to full names
            name_mapping = {}
            for _, row in df.iterrows():
                full_name = row['Full_Category_Name'].strip()
                # Remove quotes if present
                if full_name.startswith('"') and full_name.endswith('"'):
                    full_name = full_name[1:-1]
                
                # Create multiple partial keys for matching
                words = full_name.split()
                if len(words) >= 3:
                    # Try first 3, 4, 5 words as keys
                    for i in range(3, min(6, len(words) + 1)):
                        partial = ' '.join(words[:i])
                        name_mapping[partial] = full_name
                
                # Also try without parentheses content for some cases
                if '(' in full_name:
                    base_name = full_name.split('(')[0].strip()
                    name_mapping[base_name] = full_name
            
            self.stdout.write(f'Created {len(name_mapping)} name mappings')
            
            # Find courses that might be truncated
            all_courses = Course.objects.all()
            updated_count = 0
            
            for course in all_courses:
                current_name = course.name.strip()
                
                # Check if this course name appears to be truncated
                # (ends with incomplete words, parentheses, or abbreviations)
                is_truncated = (
                    current_name.endswith((' WIT', ' STU', ' MAN', ' EDU', ' TEC', ' COMM', ' ADMIN', ' MA', ' SCI', ' TECH', ' MICRO', ' PHYS', ' RECORDS', ' SOILS', ' SUGAR', ' TOURISM')) or
                    current_name.endswith((' (', ' (')) or
                    current_name.endswith((' &', ' AND')) or
                    len(current_name.split()) < 4  # Very short names
                )
                
                if is_truncated:
                    # Try to find a better full name
                    best_match = None
                    best_score = 0
                    
                    # Try exact partial matches first
                    for partial, full_name in name_mapping.items():
                        if current_name == partial:
                            best_match = full_name
                            best_score = 100
                            break
                    
                    # If no exact match, try fuzzy matching
                    if not best_match:
                        current_words = current_name.split()
                        for partial, full_name in name_mapping.items():
                            partial_words = partial.split()
                            
                            # Calculate match score
                            match_count = 0
                            for word in current_words:
                                if word in partial_words:
                                    match_count += 1
                            
                            if match_count >= 2 and match_count > best_score:
                                best_score = match_count
                                best_match = full_name
                    
                    if best_match and best_match != current_name:
                        self.stdout.write(f'Updating: "{current_name}" -> "{best_match}"')
                        
                        if not options['dry_run']:
                            course.name = best_match
                            course.save()
                        
                        updated_count += 1
            
            if options['dry_run']:
                self.stdout.write(self.style.WARNING(f'\nDRY RUN: Would update {updated_count} courses.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'\nSuccessfully updated {updated_count} courses.'))
                self.stdout.write(f'Total courses in database: {Course.objects.count()}')
                
                # Show sample updated courses
                self.stdout.write(self.style.SUCCESS('\nSample updated courses:'))
                for course in Course.objects.all().order_by('name')[:10]:
                    self.stdout.write(f'  - {course.name}')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing CSV: {e}'))
