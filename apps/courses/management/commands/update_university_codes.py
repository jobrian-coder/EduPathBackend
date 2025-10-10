from django.core.management.base import BaseCommand
from apps.courses.models import University
import pandas as pd
import os


class Command(BaseCommand):
    help = 'Update university names and codes from KUCCPS data CSV file'

    def handle(self, *args, **kwargs):
        # Path to the CSV file - try multiple possible locations
        possible_paths = [
            os.path.join('..', 'kuccps data', 'university_codes.csv'),
            os.path.join('..', '..', 'backend', 'kuccps data', 'university_codes.csv'),
            'backend/kuccps data/university_codes.csv',
            'kuccps data/university_codes.csv'
        ]
        
        csv_path = None
        for path in possible_paths:
            if os.path.exists(path):
                csv_path = path
                break
        
        if not csv_path:
            # Try to find the file in the project directory
            import django
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(django.__file__)))
            # Go up to find the project root
            current_dir = os.path.dirname(os.path.abspath(__file__))
            while current_dir != os.path.dirname(current_dir):
                test_path = os.path.join(current_dir, 'backend', 'kuccps data', 'university_codes.csv')
                if os.path.exists(test_path):
                    csv_path = test_path
                    break
                current_dir = os.path.dirname(current_dir)
        
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_path}'))
            return
        
        try:
            # Read the CSV file
            df = pd.read_csv(csv_path)
            
            self.stdout.write(f'Found {len(df)} universities in CSV file')
            
            # Clear existing codes to avoid conflicts
            self.stdout.write('Clearing existing university codes...')
            # Set codes to NULL first to avoid unique constraint issues
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("UPDATE universities SET code = NULL")
            
            updated_count = 0
            created_count = 0
            not_found_count = 0
            
            # Process each university from CSV
            for _, row in df.iterrows():
                csv_name = row['UniversityName'].strip()
                csv_code = row['UniversityCode'].strip()
                
                # Try to find existing university by name (case-insensitive)
                university = None
                
                # First try exact match
                universities = University.objects.filter(name__iexact=csv_name)
                if universities.exists():
                    university = universities.first()
                else:
                    # Try to find by similar name (remove extra spaces, handle newlines)
                    clean_csv_name = csv_name.replace('\n', ' ').replace('  ', ' ').strip()
                    universities = University.objects.filter(name__icontains=clean_csv_name)
                    if universities.exists():
                        university = universities.first()
                    else:
                        # Try to find by partial match
                        words = clean_csv_name.split()
                        if len(words) > 1:
                            for word in words:
                                if len(word) > 3:  # Only try words longer than 3 characters
                                    universities = University.objects.filter(name__icontains=word)
                                    if universities.exists():
                                        university = universities.first()
                                        break
                
                if university:
                    # Update existing university
                    university.name = csv_name
                    university.code = csv_code
                    university.save()
                    updated_count += 1
                    self.stdout.write(self.style.SUCCESS(f'Updated: {csv_name} -> {csv_code}'))
                else:
                    # Create new university if not found
                    # Use default values for required fields
                    university = University.objects.create(
                        name=csv_name,
                        code=csv_code,
                        short_name=csv_name[:50],  # Truncate for short_name
                        type='Public',  # Default to Public
                        location='Kenya',  # Default location
                        established=2000,  # Default year
                        ranking=100,  # Default ranking
                        students='N/A',
                        website='https://example.com',
                        description=f'University: {csv_name}',
                        facilities=[],
                        accreditation='Accredited by Commission for University Education'
                    )
                    created_count += 1
                    self.stdout.write(self.style.WARNING(f'Created: {csv_name} -> {csv_code}'))
            
            # Check for universities in database not in CSV
            db_universities = University.objects.all()
            csv_names = set(df['UniversityName'].str.strip())
            
            for db_uni in db_universities:
                if db_uni.name not in csv_names:
                    not_found_count += 1
                    self.stdout.write(self.style.ERROR(f'Not in CSV: {db_uni.name}'))
            
            # Summary
            self.stdout.write(self.style.SUCCESS(f'\nSummary:'))
            self.stdout.write(f'Updated: {updated_count} universities')
            self.stdout.write(f'Created: {created_count} universities')
            self.stdout.write(f'Not found in CSV: {not_found_count} universities')
            self.stdout.write(f'Total in database: {University.objects.count()} universities')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing CSV: {str(e)}'))
