from django.core.management.base import BaseCommand
from apps.courses.models import Course


class Command(BaseCommand):
    help = 'Check course data integrity for cluster calculation'

    def handle(self, *args, **kwargs):
        courses = Course.objects.all()
        
        self.stdout.write(f"Checking {courses.count()} courses...")
        
        issues = []
        
        for course in courses:
            course_issues = []
            
            # Check cluster subjects
            if not course.cluster_subjects:
                course_issues.append("Missing cluster_subjects")
            
            # Check cluster points
            if not course.cluster_points:
                course_issues.append("Missing cluster_points")
            else:
                try:
                    float(course.cluster_points)
                except (TypeError, ValueError):
                    course_issues.append(f"Invalid cluster_points: {course.cluster_points}")
            
            if course_issues:
                issues.append({
                    'course': course,
                    'issues': course_issues
                })
        
        if issues:
            self.stdout.write(self.style.WARNING(f"Found {len(issues)} courses with issues:"))
            for issue in issues:
                self.stdout.write(f"  - {issue['course'].name} (ID: {issue['course'].id})")
                for problem in issue['issues']:
                    self.stdout.write(f"    * {problem}")
        else:
            self.stdout.write(self.style.SUCCESS("All courses have valid cluster data!"))
        
        # Show sample of valid courses
        valid_courses = Course.objects.filter(
            cluster_subjects__isnull=False,
            cluster_points__isnull=False
        ).exclude(cluster_subjects='')[:5]
        
        if valid_courses:
            self.stdout.write(self.style.SUCCESS("\nSample valid courses:"))
            for course in valid_courses:
                self.stdout.write(f"  - {course.name}")
                self.stdout.write(f"    Cluster Points: {course.cluster_points}")
                self.stdout.write(f"    Cluster Subjects: {course.cluster_subjects}")
                self.stdout.write("")
