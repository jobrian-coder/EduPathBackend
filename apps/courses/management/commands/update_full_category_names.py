import os
import pandas as pd
from django.core.management.base import BaseCommand
from apps.courses.models import Course


class Command(BaseCommand):
    help = 'Update course names with full category names from KUCCPS data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without actually updating',
        )

    def handle(self, *args, **options):
        # Path to the CSV file - try multiple possible locations
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
            
            updated_count = 0
            
            # Process each course
            for _, row in df.iterrows():
                full_name = row['Full_Category_Name'].strip()
                
                # Try to find existing course by partial name match
                # Look for courses that start with the same words
                name_words = full_name.split()
                if len(name_words) >= 3:  # Only try if we have at least 3 words
                    search_term = ' '.join(name_words[:3])  # Use first 3 words for search
                    
                    # Find courses that contain this search term
                    courses = Course.objects.filter(name__icontains=search_term)
                    
                    if courses.exists():
                        course = courses.first()
                        old_name = course.name
                        course.name = full_name
                        
                        if not options['dry_run']:
                            course.save()
                        
                        self.stdout.write(f'Updated: "{old_name}" -> "{full_name}"')
                        updated_count += 1
                    else:
                        # If no match found, create a new course
                        if not options['dry_run']:
                            Course.objects.create(
                                name=full_name,
                                category=full_name,
                                description=f'A program in {full_name}',
                                duration='4 years',
                                cluster_points=30.0,
                                cluster_subjects=['MATH', 'ENG', 'BIO', 'CHEM'],
                                cluster_formula='Standard KUCCPS formula'
                            )
                        
                        self.stdout.write(f'Created new course: "{full_name}"')
                        updated_count += 1
            
            if options['dry_run']:
                self.stdout.write(self.style.WARNING(f'\nDRY RUN: Would update/create {updated_count} courses.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'\nSuccessfully updated/created {updated_count} courses.'))
                self.stdout.write(f'Total courses in database: {Course.objects.count()}')
                
                # Show sample updated courses
                self.stdout.write(self.style.SUCCESS('\nSample updated courses:'))
                for course in Course.objects.all().order_by('name')[:10]:
                    self.stdout.write(f'  - {course.name}')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing CSV: {e}'))
