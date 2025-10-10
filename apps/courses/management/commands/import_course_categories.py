from django.core.management.base import BaseCommand
from apps.courses.models import Course
import pandas as pd
import os


class Command(BaseCommand):
    help = 'Import course categories from Excel sheet names'

    def handle(self, *args, **kwargs):
        # Path to the Excel file - try multiple possible locations
        possible_paths = [
            os.path.join('..', 'kuccps data', 'Programmes_By_Category.xlsx'),
            os.path.join('..', '..', 'backend', 'kuccps data', 'Programmes_By_Category.xlsx'),
            'backend/kuccps data/Programmes_By_Category.xlsx',
            'kuccps data/Programmes_By_Category.xlsx'
        ]
        
        excel_path = None
        for path in possible_paths:
            if os.path.exists(path):
                excel_path = path
                break
        
        if not excel_path:
            # Try to find the file in the project directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            while current_dir != os.path.dirname(current_dir):
                test_path = os.path.join(current_dir, 'backend', 'kuccps data', 'Programmes_By_Category.xlsx')
                if os.path.exists(test_path):
                    excel_path = test_path
                    break
                current_dir = os.path.dirname(current_dir)
        
        if not excel_path or not os.path.exists(excel_path):
            self.stdout.write(self.style.ERROR(f'Excel file not found: {excel_path}'))
            return
        
        try:
            # Read the Excel file to get sheet names
            excel_file = pd.ExcelFile(excel_path)
            sheet_names = excel_file.sheet_names
            
            self.stdout.write(f'Found {len(sheet_names)} course categories in Excel file')
            
            created_count = 0
            updated_count = 0
            
            # Process each sheet name (course category)
            for sheet_name in sheet_names:
                # Clean the sheet name
                course_name = sheet_name.strip()
                
                # Skip empty names
                if not course_name:
                    continue
                
                # Try to find existing course by name
                existing_course = Course.objects.filter(name__iexact=course_name).first()
                
                if existing_course:
                    # Update existing course
                    existing_course.name = course_name
                    existing_course.category = course_name  # Set category same as name
                    existing_course.save()
                    updated_count += 1
                    self.stdout.write(self.style.SUCCESS(f'Updated: {course_name}'))
                else:
                    # Create new course
                    course = Course.objects.create(
                        name=course_name,
                        category=course_name,
                        description=f'Course category: {course_name}',
                        duration='4 years',  # Default duration
                        cluster_points=30.0,  # Default cluster points
                        cluster_subjects=['MATH', 'ENG', 'BIO', 'CHEM'],  # Default subjects
                        cluster_formula='Standard KUCCPS formula'
                    )
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f'Created: {course_name}'))
            
            # Summary
            self.stdout.write(self.style.SUCCESS(f'\nSummary:'))
            self.stdout.write(f'Created: {created_count} new courses')
            self.stdout.write(f'Updated: {updated_count} existing courses')
            self.stdout.write(f'Total courses in database: {Course.objects.count()}')
            
            # Show sample of created/updated courses
            self.stdout.write(self.style.SUCCESS(f'\nSample courses:'))
            sample_courses = Course.objects.all()[:10]
            for course in sample_courses:
                self.stdout.write(f'  - {course.name} (Category: {course.category})')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing Excel file: {str(e)}'))
