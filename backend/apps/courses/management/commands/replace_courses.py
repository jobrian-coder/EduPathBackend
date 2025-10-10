import pandas as pd
import os
from django.core.management.base import BaseCommand
from apps.courses.models import Course, CourseUniversity
from django.db import transaction


class Command(BaseCommand):
    help = 'Replace all courses in the database with courses from COURSE NAME AND CODE.xlsx'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually updating the database.',
        )
        parser.add_argument(
            '--keep-relationships',
            action='store_true',
            help='Keep existing CourseUniversity relationships (not recommended).',
        )

    def handle(self, *args, **kwargs):
        # Path to the Excel file
        excel_path = os.path.join("kuccps data", "COURSE NAME AND CODE.xlsx")
        
        if not os.path.exists(excel_path):
            self.stdout.write(self.style.ERROR(f'Excel file not found: {excel_path}'))
            return

        try:
            # Read the Excel file
            df = pd.read_excel(excel_path)
            self.stdout.write(f'Found {len(df)} courses in Excel file')
            
            # Show sample data
            self.stdout.write('\nSample courses from Excel:')
            for i, row in df.head(5).iterrows():
                self.stdout.write(f'  {i+1}. {row["PROGRAMME NAME"]}')
            
            if kwargs['dry_run']:
                self.stdout.write(self.style.WARNING('\nDRY RUN: No changes will be made to the database.'))
                return
            
            # Get current course count
            current_count = Course.objects.count()
            self.stdout.write(f'\nCurrent courses in database: {current_count}')
            
            # Confirm deletion
            if not kwargs['keep_relationships']:
                self.stdout.write(self.style.WARNING(
                    '\nWARNING: This will delete ALL existing courses and their relationships!'
                ))
                self.stdout.write('This includes all CourseUniversity relationships.')
                
                # In a real scenario, you might want to add user confirmation here
                # For now, we'll proceed automatically
                self.stdout.write('Proceeding with replacement...')
            
            with transaction.atomic():
                # Delete existing courses and relationships
                if not kwargs['keep_relationships']:
                    # Delete CourseUniversity relationships first (foreign key constraint)
                    course_uni_count = CourseUniversity.objects.count()
                    CourseUniversity.objects.all().delete()
                    self.stdout.write(f'Deleted {course_uni_count} CourseUniversity relationships')
                
                # Delete existing courses
                deleted_count, _ = Course.objects.all().delete()
                self.stdout.write(f'Deleted {deleted_count} existing courses')
                
                # Create new courses
                created_count = 0
                for _, row in df.iterrows():
                    course_name = str(row['PROGRAMME NAME']).strip()
                    
                    if not course_name or course_name.lower() in ['nan', 'none', '']:
                        continue
                    
                    # Determine category based on course name
                    category = self.determine_category(course_name)
                    
                    # Create the course
                    course = Course.objects.create(
                        name=course_name,
                        category=category,
                        description=f'A comprehensive program in {category.lower()}',
                        duration='4 years',  # Default duration
                        cluster_points=0,  # Will be updated later
                        cluster_subjects=[],  # Will be updated later
                        modules=[],  # Default empty
                        career_paths=[],  # Default empty
                        mandatory_subjects=[],  # Default empty
                        alternative_subjects=[],  # Default empty
                    )
                    
                    created_count += 1
                    if created_count % 50 == 0:  # Progress indicator
                        self.stdout.write(f'Created {created_count} courses...')
                
                self.stdout.write(f'Successfully created {created_count} new courses')
            
            # Summary
            self.stdout.write(self.style.SUCCESS(f'\n=== REPLACEMENT SUMMARY ==='))
            self.stdout.write(self.style.SUCCESS(f'Deleted: {deleted_count} old courses'))
            self.stdout.write(self.style.SUCCESS(f'Created: {created_count} new courses'))
            self.stdout.write(f'Total courses in database: {Course.objects.count()}')
            
            # Show sample of new courses
            self.stdout.write(self.style.SUCCESS(f'\n=== SAMPLE NEW COURSES ==='))
            for course in Course.objects.all().order_by('name')[:10]:
                self.stdout.write(f'  - {course.name} (Category: {course.category})')
            
            if Course.objects.count() > 10:
                self.stdout.write(f'  ... and {Course.objects.count() - 10} more courses')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing Excel file: {e}'))
            import traceback
            self.stdout.write(traceback.format_exc())

    def determine_category(self, course_name):
        """Determine the category based on course name"""
        course_name_lower = course_name.lower()
        
        # Engineering courses
        if any(keyword in course_name_lower for keyword in [
            'engineering', 'civil', 'mechanical', 'electrical', 'electronic', 
            'computer', 'software', 'architecture', 'quantity surveying'
        ]):
            return 'Engineering'
        
        # Medicine and Health
        if any(keyword in course_name_lower for keyword in [
            'medicine', 'nursing', 'pharmacy', 'dental', 'medical', 'health',
            'physiotherapy', 'paramedic', 'biomedical'
        ]):
            return 'Medicine & Health'
        
        # Business and Commerce
        if any(keyword in course_name_lower for keyword in [
            'business', 'commerce', 'management', 'accounting', 'finance',
            'marketing', 'economics', 'entrepreneurship', 'administration'
        ]):
            return 'Business & Commerce'
        
        # Education
        if any(keyword in course_name_lower for keyword in [
            'education', 'teaching', 'pedagogy'
        ]):
            return 'Education'
        
        # Science
        if any(keyword in course_name_lower for keyword in [
            'science', 'biology', 'chemistry', 'physics', 'mathematics',
            'statistics', 'environmental', 'agriculture', 'forestry'
        ]):
            return 'Science'
        
        # Arts and Humanities
        if any(keyword in course_name_lower for keyword in [
            'arts', 'humanities', 'philosophy', 'history', 'literature',
            'languages', 'psychology', 'sociology', 'anthropology'
        ]):
            return 'Arts & Humanities'
        
        # Law
        if any(keyword in course_name_lower for keyword in [
            'law', 'legal', 'jurisprudence'
        ]):
            return 'Law'
        
        # Technology
        if any(keyword in course_name_lower for keyword in [
            'technology', 'information', 'computing', 'data', 'cyber'
        ]):
            return 'Technology'
        
        # Social Sciences
        if any(keyword in course_name_lower for keyword in [
            'social work', 'criminology', 'development', 'public administration'
        ]):
            return 'Social Sciences'
        
        # Default category
        return 'General'
