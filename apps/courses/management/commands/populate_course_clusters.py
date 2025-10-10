from django.core.management.base import BaseCommand
from apps.courses.models import Course


class Command(BaseCommand):
    help = 'Populate missing cluster subjects and points for courses'

    def handle(self, *args, **kwargs):
        # Sample cluster data for different course types
        cluster_data = {
            'Computer Science': {
                'cluster_subjects': ['MATH', 'PHYS', 'CHEM', 'ENG'],
                'cluster_points': 40.0
            },
            'Medicine': {
                'cluster_subjects': ['BIO', 'CHEM', 'PHYS', 'MATH'],
                'cluster_points': 45.0
            },
            'Engineering': {
                'cluster_subjects': ['MATH', 'PHYS', 'CHEM', 'ENG'],
                'cluster_points': 38.0
            },
            'Civil Engineering': {
                'cluster_subjects': ['MATH', 'PHYS', 'CHEM', 'ENG'],
                'cluster_points': 35.0
            },
            'default': {
                'cluster_subjects': ['MATH', 'ENG', 'BIO', 'CHEM'],
                'cluster_points': 30.0
            }
        }
        
        courses = Course.objects.all()
        updated_count = 0
        
        for course in courses:
            updated = False
            
            # Determine cluster data based on course name
            course_lower = course.name.lower()
            cluster_info = cluster_data.get('default')
            
            if 'computer' in course_lower or 'cs' in course_lower:
                cluster_info = cluster_data['Computer Science']
            elif 'medicine' in course_lower or 'medical' in course_lower:
                cluster_info = cluster_data['Medicine']
            elif 'engineering' in course_lower:
                if 'civil' in course_lower:
                    cluster_info = cluster_data['Civil Engineering']
                else:
                    cluster_info = cluster_data['Engineering']
            
            # Update cluster subjects if missing
            if not course.cluster_subjects:
                course.cluster_subjects = cluster_info['cluster_subjects']
                updated = True
                self.stdout.write(f"Updated cluster subjects for {course.name}: {cluster_info['cluster_subjects']}")
            
            # Update cluster points if missing or invalid
            try:
                if course.cluster_points:
                    float(course.cluster_points)
            except (TypeError, ValueError):
                course.cluster_points = cluster_info['cluster_points']
                updated = True
                self.stdout.write(f"Updated cluster points for {course.name}: {cluster_info['cluster_points']}")
            
            if not course.cluster_points:
                course.cluster_points = cluster_info['cluster_points']
                updated = True
                self.stdout.write(f"Updated cluster points for {course.name}: {cluster_info['cluster_points']}")
            
            if updated:
                course.save()
                updated_count += 1
        
        self.stdout.write(self.style.SUCCESS(f"Updated {updated_count} courses with cluster data"))
        
        # Verify the updates
        self.stdout.write("\nVerifying updates...")
        courses_with_issues = 0
        for course in Course.objects.all():
            issues = []
            if not course.cluster_subjects:
                issues.append("Missing cluster_subjects")
            if not course.cluster_points:
                issues.append("Missing cluster_points")
            else:
                try:
                    float(course.cluster_points)
                except (TypeError, ValueError):
                    issues.append(f"Invalid cluster_points: {course.cluster_points}")
            
            if issues:
                courses_with_issues += 1
                self.stdout.write(f"  - {course.name}: {', '.join(issues)}")
        
        if courses_with_issues == 0:
            self.stdout.write(self.style.SUCCESS("All courses now have valid cluster data!"))
        else:
            self.stdout.write(self.style.WARNING(f"{courses_with_issues} courses still have issues"))
