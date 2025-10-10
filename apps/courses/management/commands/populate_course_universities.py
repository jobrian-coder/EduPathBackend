from django.core.management.base import BaseCommand
from apps.courses.models import Course, University, CourseUniversity
import random
from decimal import Decimal


class Command(BaseCommand):
    help = 'Populate sample course-university relationships with realistic data'

    def handle(self, *args, **options):
        courses = Course.objects.all()
        universities = University.objects.all()
        
        if not courses.exists():
            self.stdout.write(self.style.ERROR('No courses found. Please populate courses first.'))
            return
        
        if not universities.exists():
            self.stdout.write(self.style.ERROR('No universities found. Please populate universities first.'))
            return
        
        # Clear existing relationships
        CourseUniversity.objects.all().delete()
        self.stdout.write(self.style.WARNING('Cleared existing course-university relationships'))
        
        created_count = 0
        
        # Sample data for different course types
        sample_data = {
            'BACHELOR OF SCIENCE (COMPUTER SCIENCE)': {
                'fees_range': (120000, 450000),
                'cutoff_range': (35.0, 45.0),
                'universities': min(8, universities.count())
            },
            'BACHELOR OF MEDICINE': {
                'fees_range': (200000, 800000),
                'cutoff_range': (40.0, 48.0),
                'universities': min(5, universities.count())
            },
            'BACHELOR OF ENGINEERING': {
                'fees_range': (150000, 500000),
                'cutoff_range': (38.0, 46.0),
                'universities': min(6, universities.count())
            },
            'BACHELOR OF BUSINESS ADMINISTRATION': {
                'fees_range': (100000, 400000),
                'cutoff_range': (32.0, 42.0),
                'universities': min(10, universities.count())
            },
            'BACHELOR OF EDUCATION': {
                'fees_range': (80000, 300000),
                'cutoff_range': (30.0, 40.0),
                'universities': min(7, universities.count())
            }
        }
        
        for course in courses:
            # Get specific data for known course types, or use defaults
            course_data = None
            for key, data in sample_data.items():
                if key.lower() in course.name.lower():
                    course_data = data
                    break
            
            if not course_data:
                # Default data for unknown course types
                course_data = {
                    'fees_range': (100000, 400000),
                    'cutoff_range': (30.0, 45.0),
                    'universities': min(5, universities.count())
                }
            
            # Select random universities for this course
            selected_universities = random.sample(
                list(universities), 
                min(course_data['universities'], universities.count())
            )
            
            for university in selected_universities:
                # Generate realistic fees based on university type and course
                base_fee = random.uniform(*course_data['fees_range'])
                
                # Adjust fees based on university type
                if university.type == 'Public':
                    base_fee *= 0.6  # Public universities are generally cheaper
                elif university.ranking <= 5:
                    base_fee *= 1.5  # Top-ranked universities are more expensive
                
                fees = Decimal(str(round(base_fee, 0)))
                
                # Generate cutoff points
                cutoff = Decimal(str(round(random.uniform(*course_data['cutoff_range']), 2)))
                
                # Generate application deadline (random date in the future)
                from datetime import date, timedelta
                deadline = date.today() + timedelta(days=random.randint(30, 365))
                
                # Create course-university relationship
                CourseUniversity.objects.create(
                    course=course,
                    university=university,
                    fees_ksh=fees,
                    cutoff_points=cutoff,
                    application_deadline=deadline,
                    course_url=f"https://{university.short_name.lower().replace(' ', '')}.ac.ke/courses/{course.name.lower().replace(' ', '-')}"
                )
                
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {created_count} course-university relationships'))
        
        # Show sample results
        self.stdout.write(self.style.SUCCESS('\nSample relationships:'))
        for rel in CourseUniversity.objects.select_related('course', 'university')[:5]:
            self.stdout.write(f'  - {rel.course.name} at {rel.university.name}')
            self.stdout.write(f'    Fees: KSh {rel.fees_ksh:,}, Cutoff: {rel.cutoff_points}, Deadline: {rel.application_deadline}')
        
        self.stdout.write(f'\nTotal courses with university relationships: {Course.objects.filter(universities__isnull=False).distinct().count()}')
        self.stdout.write(f'Total universities offering courses: {University.objects.filter(courses__isnull=False).distinct().count()}')
