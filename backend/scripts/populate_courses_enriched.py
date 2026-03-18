import os
import sys
import json
import django
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.courses.models import Course, University, CourseUniversity

def populate():
    # File paths
    base_dir = Path(os.getcwd()).parent
    enriched_path = base_dir / 'data' / 'courses data' / 'enriched_courses.json'
    
    with open(enriched_path, 'r', encoding='utf-8') as f:
        courses_data = json.load(f)
        
    print(f"Loaded {len(courses_data)} programme records.")
    
    # Pre-fetch universities to avoid hitting the DB constantly
    # To handle slight name mismatches, we can stick to exact matches for now,
    # or create missing ones.
    universities_cache = {u.name.lower(): u for u in University.objects.all()}
    
    courses_cached = {}
    
    print("Clearing old data (this will delete Course and CourseUniversity)...")
    CourseUniversity.objects.all().delete()
    Course.objects.all().delete()
    print("Old data deleted.")
    
    created_universities = 0
    created_courses = 0
    created_programmes = 0
    
    for idx, item in enumerate(courses_data):
        category = item.get('category', 'Uncategorized')
        prog_name = item.get('programme', '')
        inst_name = item.get('institution', '')
        code = item.get('code', '')
        reqs = item.get('requirements', {})
        cut_offs = item.get('cutoffs', {})
        enrich = item.get('enrichment', {})
        
        if not category: category = 'Uncategorized'
        
        # 1. Get or Create Course (Canonical)
        if category not in courses_cached:
            c = Course.objects.create(
                name=category,
                category=category[:100],  # just in case
                duration='4 years',
                cluster_points=0.0,
                description=enrich.get('description', ''),
                pros=enrich.get('pros', []),
                cons=enrich.get('cons', []),
                careers=enrich.get('careers', [])
            )
            courses_cached[category] = c
            created_courses += 1
        else:
            c = courses_cached[category]
            # Only update enrichment if it was empty initially, to avoid overwriting 
            # if a later item in the json has better enrichment
            if not c.description and enrich.get('description'):
                c.description = enrich.get('description', '')
                c.pros = enrich.get('pros', [])
                c.cons = enrich.get('cons', [])
                c.careers = enrich.get('careers', [])
                c.save()
        
        # 2. Get or Create University
        inst_lower = inst_name.lower().strip()
        if inst_lower not in universities_cache:
            u = University.objects.create(
                name=inst_name.strip(),
                short_name=inst_name.strip()[:50],
                type='Public' if 'university' in inst_lower else 'Private',
                location='Kenya',
                established=2000,
                ranking=999,
                students='10,000+',
                website='https://example.com',
                description=f'{inst_name} is an institution of higher learning in Kenya.',
                accreditation='Accredited'
            )
            universities_cache[inst_lower] = u
            created_universities += 1
        
        u = universities_cache[inst_lower]
        
        # 3. Create CourseUniversity (Programme)
        # Handle decimal limits
        def parse_cutoff(val):
            if not val or val == '_': return None
            try:
                return float(val)
            except:
                return None
                
        c22 = parse_cutoff(cut_offs.get('2022', None))
        c23 = parse_cutoff(cut_offs.get('2023', None))
        
        try:
            CourseUniversity.objects.create(
                course=c,
                university=u,
                program_code=code,
                programme_name=prog_name,
                requirements=reqs,
                cutoffs=cut_offs,
                cutoff_2022=c22,
                cutoff_2023=c23,
                fees_ksh=0.00,
                cutoff_points=c23 if c23 else (c22 if c22 else 0.0)
            )
            created_programmes += 1
        except Exception as e:
            # might hit unique constraint if same programme exists multiple times
            pass
            
        if idx > 0 and idx % 1000 == 0:
            print(f"Processed {idx} records...")
            
    print("Done!")
    print(f"Universities created: {created_universities}")
    print(f"Canonical Courses created: {created_courses}")
    print(f"Programmes linked: {created_programmes}")

if __name__ == '__main__':
    populate()
