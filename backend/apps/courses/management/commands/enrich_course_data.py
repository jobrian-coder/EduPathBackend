import pandas as pd
import os
from django.core.management.base import BaseCommand
from apps.courses.models import CourseUniversity, Course, University


class Command(BaseCommand):
    help = 'Enrich existing CourseUniversity data with Excel information'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually updating any records.',
        )

    def handle(self, *args, **kwargs):
        # Path to the Excel file
        excel_path = os.path.join("kuccps data", "DEGREE_UNI_CLUSTER EDUPATH.xlsx")
        
        if not os.path.exists(excel_path):
            self.stdout.write(self.style.ERROR(f'Excel file not found: {excel_path}'))
            return

        try:
            # Read the Excel file
            df = pd.read_excel(excel_path)
            self.stdout.write(f'Found {len(df)} rows in Excel file')
            
            total_updated = 0
            total_created = 0
            total_not_found = 0
            
            # Filter out category header rows (rows with NaN in # column)
            df = df.dropna(subset=['#'])
            self.stdout.write(f'Processing {len(df)} data rows')
            
            for _, row in df.iterrows():
                try:
                    # Extract data from Excel row
                    program_code = str(row.get('PROG\nCODE', '')).strip() if pd.notna(row.get('PROG\nCODE')) else None
                    university_name = str(row.get('UNIVERSITYNAME', '')).strip() if pd.notna(row.get('UNIVERSITYNAME')) else None
                    programme_name = str(row.get('PROGRAMME NAME', '')).strip() if pd.notna(row.get('PROGRAMME NAME')) else None
                    cutoff_2023 = row.get('CUTOFF - 2023') if pd.notna(row.get('CUTOFF - 2023')) else None
                    cutoff_2022 = row.get('CUTOFF2022') if pd.notna(row.get('CUTOFF2022')) else None
                    
                    # Extract subjects
                    subjects = []
                    for i in range(1, 5):
                        subject = row.get(f'SUBJECT{i}')
                        if pd.notna(subject) and str(subject).strip():
                            subjects.append(str(subject).strip())
                    
                    all_subjects = str(row.get('ALLSUBJECTS', '')).strip() if pd.notna(row.get('ALLSUBJECTS')) else None
                    
                    if not university_name or not programme_name:
                        continue
                    
                    # Find matching university
                    university = self.find_university(university_name)
                    if not university:
                        self.stdout.write(self.style.WARNING(f'University not found: {university_name}'))
                        total_not_found += 1
                        continue
                    
                    # Find matching course
                    course = self.find_course(programme_name)
                    if not course:
                        self.stdout.write(self.style.WARNING(f'Course not found: {programme_name}'))
                        total_not_found += 1
                        continue
                    
                    # Find or create CourseUniversity record
                    course_university, created = CourseUniversity.objects.get_or_create(
                        course=course,
                        university=university,
                        defaults={
                            'fees_ksh': 0,  # Default value, will be updated later
                            'cutoff_points': cutoff_2023 or 0,
                            'program_code': program_code,
                            'cutoff_2022': cutoff_2022,
                            'cluster_subjects': subjects,
                            'all_subjects': all_subjects,
                        }
                    )
                    
                    if created:
                        total_created += 1
                        self.stdout.write(f'Created: {course.name} at {university.name}')
                    else:
                        # Update existing record with new data
                        updated = False
                        if program_code and not course_university.program_code:
                            course_university.program_code = program_code
                            updated = True
                        if cutoff_2022 and not course_university.cutoff_2022:
                            course_university.cutoff_2022 = cutoff_2022
                            updated = True
                        if subjects and not course_university.cluster_subjects:
                            course_university.cluster_subjects = subjects
                            updated = True
                        if all_subjects and not course_university.all_subjects:
                            course_university.all_subjects = all_subjects
                            updated = True
                        if cutoff_2023 and course_university.cutoff_points != cutoff_2023:
                            course_university.cutoff_points = cutoff_2023
                            updated = True
                        
                        if updated:
                            if not kwargs['dry_run']:
                                course_university.save()
                            total_updated += 1
                            self.stdout.write(f'Updated: {course.name} at {university.name}')
                
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error processing row: {e}'))
                    continue
            
            # Summary
            self.stdout.write(self.style.SUCCESS(f'\n=== SUMMARY ==='))
            self.stdout.write(self.style.SUCCESS(f'Updated: {total_updated} records'))
            self.stdout.write(self.style.SUCCESS(f'Created: {total_created} records'))
            self.stdout.write(self.style.WARNING(f'Not found: {total_not_found} records'))
            
            if kwargs['dry_run']:
                self.stdout.write(self.style.WARNING('\nDRY RUN: No records were actually updated.'))
            
            # Show sample of enriched data
            self.stdout.write(self.style.SUCCESS(f'\n=== SAMPLE ENRICHED DATA ==='))
            sample_records = CourseUniversity.objects.filter(
                program_code__isnull=False
            ).select_related('course', 'university')[:5]
            
            for record in sample_records:
                self.stdout.write(f'Course: {record.course.name}')
                self.stdout.write(f'University: {record.university.name}')
                self.stdout.write(f'Program Code: {record.program_code}')
                self.stdout.write(f'Cutoff 2023: {record.cutoff_points}')
                self.stdout.write(f'Cutoff 2022: {record.cutoff_2022}')
                self.stdout.write(f'Subjects: {record.cluster_subjects}')
                self.stdout.write('---')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing Excel file: {e}'))

    def find_university(self, name):
        """Find university by name with simple matching"""
        # First try exact match
        universities = University.objects.filter(name__iexact=name)
        if universities.exists():
            return universities.first()
        
        # Try partial match
        universities = University.objects.filter(name__icontains=name)
        if universities.exists():
            return universities.first()
        
        # Try reverse partial match (Excel name contains DB name)
        all_universities = University.objects.all()
        for uni in all_universities:
            if uni.name.lower() in name.lower():
                return uni
        
        return None

    def find_course(self, name):
        """Find course by name with simple matching"""
        # First try exact match
        courses = Course.objects.filter(name__iexact=name)
        if courses.exists():
            return courses.first()
        
        # Try partial match
        courses = Course.objects.filter(name__icontains=name)
        if courses.exists():
            return courses.first()
        
        # Try reverse partial match (Excel name contains DB name)
        all_courses = Course.objects.all()
        for course in all_courses:
            if course.name.lower() in name.lower():
                return course
        
        return None
