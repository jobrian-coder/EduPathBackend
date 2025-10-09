#!/usr/bin/env python
"""
Populate EduPath database with sample data
Run with: python populate_db.py
"""

import os
import django
from decimal import Decimal
from pathlib import Path
import random
import re
import uuid
import json
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent


def main():
    # Setup Django environment
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    django.setup()
    
    from apps.authentication.models import User
    from apps.careers.models import Career, CareerProsCons
    from apps.courses.models import University, Course
    from apps.hubs.models import CareerHub, Post, Comment
    from apps.societies.models import Society
    
    print("=== Populating EduPath Database ===")

    # === Helper functions from friend's script (adapted) ===
    CATEGORY_KEYWORDS = {
        'Technology': ['computer', 'information technology', 'software', 'cyber', 'data', 'network', 'telecommunication'],
        'Medicine': ['medicine', 'surgery', 'dental', 'pharmacy', 'nursing', 'clinical', 'health', 'medical', 'physiotherapy'],
        'Engineering': ['engineering', 'architecture', 'quantity surveying', 'construction', 'mechatronic'],
        'Law': ['law', 'legal'],
        'Business': ['business', 'commerce', 'economics', 'finance', 'accounting', 'marketing', 'management', 'entrepreneurship'],
        'Education': ['education', 'teaching'],
        'Healthcare': ['public health', 'community health', 'nutrition', 'dietetics', 'environmental health']
    }

    def determine_category(course_name: str) -> str:
        name_lower = course_name.lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword in name_lower for keyword in keywords):
                return category
        return 'Technology'

    def extract_cluster_subjects(mandatory_subjects):
        cluster = []
        for subj in mandatory_subjects:
            if ':' in subj:
                code = subj.split(':')[0]
                cluster.append(code)
        return cluster[:4]

    def generate_modules(course_name: str, category: str):
        base_modules = {
            'Technology': [
                'Introduction to Programming','Data Structures and Algorithms','Database Management Systems','Software Engineering','Web Development','Computer Networks','Operating Systems','Final Year Project'
            ],
            'Medicine': ['Human Anatomy','Physiology','Biochemistry','Pharmacology','Pathology','Clinical Medicine','Surgery','Research Project'],
            'Engineering': ['Engineering Mathematics','Engineering Drawing','Mechanics','Thermodynamics','Material Science','Design Project','Industrial Training','Final Year Project'],
            'Business': ['Principles of Management','Financial Accounting','Marketing Management','Business Law','Organizational Behavior','Strategic Management','Business Research','Internship'],
            'Education': ['Educational Psychology','Curriculum Development','Teaching Methods','Assessment and Evaluation','Educational Technology','Classroom Management','Teaching Practice','Research Project'],
            'Healthcare': ['Public Health Principles','Epidemiology','Health Policy','Community Health','Health Education','Research Methods','Fieldwork','Capstone Project']
        }
        return base_modules.get(category, base_modules['Technology'])

    def generate_career_paths(course_name: str, category: str):
        career_map = {
            'Technology': ['Software Developer','Systems Analyst','Database Administrator','IT Consultant','Network Engineer','Cybersecurity Analyst'],
            'Medicine': ['Medical Doctor','Surgeon','Clinical Officer','Medical Researcher','Hospital Administrator','Public Health Officer'],
            'Engineering': ['Design Engineer','Project Engineer','Consulting Engineer','Research Engineer','Quality Assurance Engineer','Engineering Manager'],
            'Business': ['Business Analyst','Marketing Manager','Financial Analyst','Human Resource Manager','Entrepreneur','Business Consultant'],
            'Education': ['Secondary School Teacher','Curriculum Developer','Educational Administrator','Education Officer','Academic Coordinator','Education Consultant'],
            'Healthcare': ['Public Health Officer','Health Educator','Community Health Worker','Health Program Manager','Epidemiologist','Health Policy Analyst']
        }
        return career_map.get(category, career_map['Technology'])

    def generate_description(course_name: str, category: str):
        descriptions = {
            'Technology': f"{course_name} is a comprehensive program designed to equip students with cutting-edge skills in computing and information technology. Students will learn programming, system design, and emerging technologies.",
            'Medicine': f"{course_name} prepares students for careers in healthcare through rigorous training in medical sciences, clinical practice, and patient care. Graduates are equipped to serve communities with professional medical expertise.",
            'Engineering': f"{course_name} provides students with technical knowledge and practical skills in engineering principles, design, and implementation. The program emphasizes innovation and problem-solving.",
            'Business': f"{course_name} develops strategic thinking and management skills essential for modern business environments. Students gain expertise in business operations, finance, and organizational leadership.",
            'Education': f"{course_name} prepares future educators with pedagogical skills, subject knowledge, and classroom management expertise. Graduates are ready to inspire and educate the next generation.",
            'Healthcare': f"{course_name} focuses on public health, community wellness, and healthcare management. Students learn to promote health, prevent disease, and improve healthcare systems."
        }
        return descriptions.get(category, descriptions['Technology'])

    def parse_course_lines(pdf_text: str):
        """Very lenient parser: expects each course on a line containing 'BACHELOR', with optional subject tokens like MAT(101):B"""
        courses = []
        mappings = []  # (course_name, institution, cutoff)
        for raw in pdf_text.strip().split('\n'):
            line = raw.strip()
            if not line or 'PROG CODE' in line:
                continue
            if 'BACHELOR' not in line:
                continue
            # naive institution and course extraction
            parts = line.split()
            try:
                institution = None
                if 'BACHELOR' in parts:
                    idx = parts.index('BACHELOR')
                    institution = ' '.join(parts[1:idx]) if idx > 1 else 'Generic University'
                course_name = line[line.index('BACHELOR'):].split('  ')[0].strip()
            except Exception:
                course_name = 'Bachelor Programme'
                institution = 'Generic University'

            # cutoff
            cutoff = None
            for p in parts[::-1]:
                try:
                    if p.replace('.', '', 1).isdigit():
                        cutoff = float(p)
                        break
                except Exception:
                    pass

            # subjects like MAT(101):B
            subject_codes = re.findall(r'([A-Z]+)\((\d+)\):([A-Z][+-]?)', line)
            mandatory = [f"{code}:{grade}" for code, num, grade in subject_codes[:2]]
            alternative = [f"{code}:{grade}" for code, num, grade in subject_codes[2:]]

            category = determine_category(course_name)
            cluster_subjects = extract_cluster_subjects(mandatory)
            course = {
                'name': course_name,
                'category': category,
                'duration': '4 years',
                'cluster_points': Decimal(str(cutoff if cutoff else 22.0)),
                'description': generate_description(course_name, category),
                'modules': generate_modules(course_name, category),
                'career_paths': generate_career_paths(course_name, category),
                'mandatory_subjects': mandatory or ['MAT:B', 'ENG:B'],
                'alternative_subjects': alternative or ['PHY:C+', 'CHE:C+'],
                'cluster_subjects': cluster_subjects or ['MAT','ENG','PHY','CHE'],
                'cluster_formula': {'type': 'weighted_average', 'weights': {'MAT': 1.0, 'PHY': 1.0, 'CHE': 1.0, 'ENG': 1.0}},
            }
            courses.append(course)
            mappings.append((course_name, institution, course['cluster_points']))
        return courses, mappings

    def try_seed_from_text():
        """Attempt to read a degree programmes text file and seed via ORM."""
        candidate_paths = [
            os.path.join(BASE_DIR, 'degree_programmes.txt'),
            os.path.join(BASE_DIR, 'data', 'degree_programmes.txt'),
            os.path.join(os.getcwd(), 'degree_programmes.txt'),
        ]
        source_path = next((p for p in candidate_paths if os.path.exists(p)), None)
        if not source_path:
            print('No degree_programmes.txt found; skipping parser-based seeding.')
            return 0, 0
        print(f"Parsing degree programs from: {source_path}")
        with open(source_path, 'r', encoding='utf-8') as f:
            pdf_text = f.read()
        parsed_courses, mappings = parse_course_lines(pdf_text)
        created_courses = 0
        created_links = 0
        # Create or get a simple University per mapping institution
        uni_cache = {}
        for course_data in parsed_courses:
            course, c_created = Course.objects.get_or_create(
                name=course_data['name'],
                defaults=course_data,
            )
            if c_created:
                created_courses += 1
        # link fees/cutoff per course to an institution row
        from apps.courses.models import CourseUniversity
        for course_name, institution, cutoff in mappings:
            course = Course.objects.filter(name=course_name).first()
            if not course:
                continue
            if institution not in uni_cache:
                uni_defaults = {
                    'short_name': re.sub(r'[^A-Za-z]', '', institution)[:6] or 'UNIV',
                    'type': 'Public',
                    'location': 'Nairobi',
                    'logo': '🎓',
                    'established': 1990,
                    'ranking': 100,
                    'students': '10000+',
                    'website': f"https://{re.sub(r'\s+', '', institution.lower())}.example.com",
                    'description': f'{institution} auto-generated from dataset.',
                    'facilities': ['Library','Labs','Sports'],
                    'accreditation': 'CUE Accredited',
                }
                uni_cache[institution], _ = University.objects.get_or_create(name=institution, defaults=uni_defaults)
            uni = uni_cache[institution]
            fees = Decimal(str(random.randint(90000, 300000)))
            cutoff_val = Decimal(str(cutoff)) if isinstance(cutoff, (int, float, Decimal)) else Decimal('30.00')
            _, cu_created = CourseUniversity.objects.get_or_create(
                course=course,
                university=uni,
                defaults={
                    'fees_ksh': fees,
                    'cutoff_points': cutoff_val,
                }
            )
            if cu_created:
                created_links += 1
        print(f"Parser-based seeding: courses created {created_courses}, links created {created_links}")
        return created_courses, created_links

    def ingest_from_json():
        """Load normalized JSON from data/parsed_courses.json and upsert via ORM."""
        candidate = [
            os.path.join(BASE_DIR, 'data', 'parsed_courses.json'),
            os.path.join(BASE_DIR, 'parsed_courses.json'),
        ]
        json_path = next((p for p in candidate if os.path.exists(p)), None)
        if not json_path:
            print('No parsed_courses.json found; skipping JSON ingestion.')
            return (0, 0, 0)
        print(f"Ingesting normalized JSON from: {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        unis = data.get('universities', [])
        courses = data.get('courses', [])
        links = data.get('course_universities', [])

        created_u = created_c = created_l = 0

        # Universities
        for u in unis:
            uid = u.get('id')
            defaults = {
                'name': u.get('name', 'University'),
                'short_name': u.get('short_name', 'UNIV'),
                'type': u.get('type', 'Public'),
                'location': u.get('location', 'Nairobi'),
                'logo': u.get('logo', '🎓'),
                'established': u.get('established', 1995),
                'ranking': u.get('ranking', 100),
                'students': u.get('students', '10000+'),
                'website': u.get('website', 'https://example.com'),
                'description': u.get('description', ''),
                'facilities': u.get('facilities', []),
                'accreditation': u.get('accreditation', 'CUE Accredited'),
            }
            obj, created = University.objects.update_or_create(
                id=uid if uid else uuid.uuid4(),
                defaults=defaults,
            )
            if created:
                created_u += 1

        # Courses
        for c in courses:
            cid = c.get('id')
            defaults = {
                'name': c.get('name', 'Course'),
                'category': c.get('category', 'Technology'),
                'duration': c.get('duration', '4 years'),
                'cluster_points': Decimal(str(c.get('cluster_points', '30.00'))),
                'description': c.get('description', ''),
                'modules': c.get('modules', []),
                'career_paths': c.get('career_paths', []),
                'mandatory_subjects': c.get('mandatory_subjects', []),
                'alternative_subjects': c.get('alternative_subjects', []),
                'cluster_subjects': c.get('cluster_subjects', []),
                'cluster_formula': c.get('cluster_formula', {}),
            }
            obj, created = Course.objects.update_or_create(
                id=cid if cid else uuid.uuid4(),
                defaults=defaults,
            )
            if created:
                created_c += 1

        # Course-University links
        from apps.courses.models import CourseUniversity
        for l in links:
            lid = l.get('id')
            course_id = l.get('course')
            univ_id = l.get('university')
            try:
                course = Course.objects.get(id=course_id)
                uni = University.objects.get(id=univ_id)
            except Course.DoesNotExist:
                continue
            except University.DoesNotExist:
                continue

            defaults = {
                'course': course,
                'university': uni,
                'fees_ksh': Decimal(str(l.get('fees_ksh', '300000'))),
                'cutoff_points': Decimal(str(l.get('cutoff_points', '30.00'))),
                'application_deadline': l.get('application_deadline', None),
                'course_url': l.get('course_url', None),
            }
            obj, created = CourseUniversity.objects.update_or_create(
                id=lid if lid else uuid.uuid4(),
                defaults=defaults,
            )
            if created:
                created_l += 1

        print(f"JSON ingestion completed: universities={created_u} (new), courses={created_c} (new), links={created_l} (new)")
        return created_u, created_c, created_l
    
    # Create superuser if not exists
    if not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin",
            email="admin@edupath.com",
            password="admin123",
            first_name="Admin",
            last_name="User"
        )
        print("Created superuser: admin")
    
    # Create 15 careers (include all required non-nullable fields)
    career_categories = ["Technology", "Healthcare", "Engineering", "Legal", "Finance", "Education", "Creative"]
    careers = []
    for i in range(1, 16):
        cat = career_categories[(i - 1) % len(career_categories)]
        careers.append({
            "name": f"Career {i}",
            "category": cat,
            "description": f"Description for career {i} in {cat} category.",
            "avg_salary_ksh": Decimal(str(150000 + i * 5000) + ".00"),
            "job_demand_score": 60 + (i % 40),
            "growth_rate": Decimal(str(3.00 + (i % 12))),
            "work_life_balance_score": 55 + (i % 30),
            "entry_requirements_score": 50 + (i % 40),
            "job_satisfaction_score": 50 + (i % 45),
            "education_required": "Bachelor's degree or higher depending on specialization",
            "experience_required": f"{i % 5} - {(i % 5) + 2} years of relevant experience",
            "key_skills": [f"Skill A{i}", f"Skill B{i}", f"Skill C{i}"],
            "top_employers": [f"Employer{i}", f"Company{i}"],
            "work_environment": "Varies by industry; mix of office and field work",
            "certifications": [f"Certification{i}"]
        })
    for career_data in careers:
        career, created = Career.objects.get_or_create(
            name=career_data["name"],
            defaults=career_data,
        )
        if created:
            CareerProsCons.objects.create(
                career=career,
                type="pros",
                items=["Strong market demand", "Career growth", "Impactful work"]
            )
            CareerProsCons.objects.create(
                career=career,
                type="cons",
                items=["Competitive entry", "Steep learning curve", "Work pressure"]
            )
            print(f"Created career: {career.name}")
    
    # Create 15 universities (include all required fields)
    universities = []
    for i in range(1, 16):
        universities.append({
            "name": f"University {i}",
            "short_name": f"U{i}",
            "type": "Public" if i % 2 else "Private",
            "location": "Nairobi",
            "established": 1960 + i,
            "ranking": i,
            "students": f"{5000 * i}+",
            "website": f"https://u{i}.example.com",
            "description": f"Description for University {i}.",
            "facilities": ["Library", "Labs", "Sports"],
            "accreditation": "CUE Accredited"
        })
    for uni_data in universities:
        uni, created = University.objects.get_or_create(
            name=uni_data["name"],
            defaults=uni_data,
        )
        if created:
            print(f"Created university: {uni.name}")
    
    # Try parser-based seeding first (if source text is available)
    try:
        try_seed_from_text()
    except Exception as e:
        print(f"Parser-based seeding failed: {e}")

    # Create 15 courses (include all required fields) as baseline synthetic data
    course_categories = ["Technology", "Healthcare", "Engineering", "Law", "Business", "Education", "Healthcare"]
    courses = []
    for i in range(1, 16):
        cat = course_categories[(i - 1) % len(course_categories)]
        courses.append({
            "name": f"Course {i}",
            "category": cat,
            "duration": f"{3 + (i % 4)} years",
            "cluster_points": Decimal(str(35 + (i % 15)) + ".00"),
            "description": f"Description for course {i} in category {cat}.",
            "modules": [f"Module{i}A", f"Module{i}B", f"Module{i}C"],
            "career_paths": [f"Career Path {i}A", f"Career Path {i}B"],
            "mandatory_subjects": ["Mathematics", "English"],
            "alternative_subjects": ["Physics", "Chemistry"]
        })
    for course_data in courses:
        course, created = Course.objects.get_or_create(
            name=course_data["name"],
            defaults=course_data,
        )
        if created:
            print(f"Created course: {course.name}")
    
    # Link courses to universities via CourseUniversity (2–3 per course)
    from apps.courses.models import CourseUniversity
    all_courses = list(Course.objects.all())
    all_unis = list(University.objects.all())
    for idx, course in enumerate(all_courses, start=1):
        # pick 2–3 universities in a round-robin fashion
        attach_unis = [all_unis[(idx - 1) % len(all_unis)], all_unis[(idx) % len(all_unis)]]
        if (idx % 3) == 0 and len(all_unis) >= 3:
            attach_unis.append(all_unis[(idx + 1) % len(all_unis)])
        for j, uni in enumerate(attach_unis, start=1):
            fees = Decimal(str(90000 + (idx * 15000) + (j * 5000)) + ".00")
            cutoff = Decimal(str(38 + ((idx + j) % 12)) + ".00")
            cu, created = CourseUniversity.objects.get_or_create(
                course=course,
                university=uni,
                defaults={
                    "fees_ksh": fees,
                    "cutoff_points": cutoff,
                }
            )
            if created:
                print(f"Linked {course.name} to {uni.short_name} (fees {fees}, cutoff {cutoff})")
    
    # Create 10 hubs with icons in public/assets/hubs
    hubs = [
        {
            "name": "Agriculture Hub",
            "field": "Agriculture",
            "description": "For students and professionals interested in farming, agribusiness, food production, and sustainability.",
            "icon": "/assets/hubs/agriculturehubicon.jpeg",
            "color": "from-emerald-500 to-lime-600",
            "member_count": 1543,
            "active_posts": 327,
        },
        {
            "name": "Education Hub",
            "field": "Education",
            "description": "Study techniques, teaching resources, scholarship info, and education-related discussions.",
            "icon": "/assets/hubs/eduhubicon.jpeg",
            "color": "from-indigo-500 to-sky-600",
            "member_count": 2011,
            "active_posts": 512,
        },
        {
            "name": "Engineering Hub",
            "field": "Engineering",
            "description": "Civil, mechanical, electrical, software, and other engineering disciplines.",
            "icon": "/assets/hubs/engineeringhubicon.png",
            "color": "from-cyan-500 to-blue-600",
            "member_count": 2875,
            "active_posts": 764,
        },
        {
            "name": "Technology Hub",
            "field": "Technology",
            "description": "Coding, software development, AI, cybersecurity, gadgets, and digital innovation.",
            "icon": "/assets/hubs/techhubicon.jpeg",
            "color": "from-fuchsia-500 to-purple-600",
            "member_count": 3421,
            "active_posts": 1054,
        },
        {
            "name": "Health Hub",
            "field": "Healthcare",
            "description": "Medicine, public health, fitness, mental health, and healthcare careers.",
            "icon": "/assets/hubs/healthhubicon.png",
            "color": "from-rose-500 to-red-600",
            "member_count": 1769,
            "active_posts": 389,
        },
        {
            "name": "Aviation Hub",
            "field": "Aviation",
            "description": "Flying, aircraft mechanics, air traffic control, aeronautical engineering, and airline careers.",
            "icon": "/assets/hubs/aviationhubicon.jpeg",
            "color": "from-sky-500 to-blue-600",
            "member_count": 932,
            "active_posts": 146,
        },
        {
            "name": "Law Hub",
            "field": "Law",
            "description": "Legal discussions, case studies, policy analysis, and law career guidance.",
            "icon": "/assets/hubs/lawhubicon.png",
            "color": "from-amber-600 to-orange-600",
            "member_count": 1214,
            "active_posts": 275,
        },
        {
            "name": "Creatives Hub",
            "field": "Creative",
            "description": "Art, music, writing, film, photography, design, and other creative industries.",
            "icon": "/assets/hubs/creativehubicon.jpeg",
            "color": "from-pink-500 to-rose-600",
            "member_count": 1673,
            "active_posts": 433,
        },
        {
            "name": "Hospitality Hub",
            "field": "Hospitality",
            "description": "Hotel management, tourism, culinary arts, and event planning discussions.",
            "icon": "/assets/hubs/hospitalityhubicon.png",
            "color": "from-teal-500 to-emerald-600",
            "member_count": 842,
            "active_posts": 198,
        },
        {
            "name": "Business Hub",
            "field": "Business",
            "description": "Entrepreneurship, finance, marketing, startups, and business management.",
            "icon": "/assets/hubs/businesshubicon.png",
            "color": "from-slate-600 to-neutral-800",
            "member_count": 2639,
            "active_posts": 603,
        },
    ]
    for hub_data in hubs:
        hub, created = CareerHub.objects.get_or_create(
            name=hub_data["name"],
            defaults=hub_data,
        )
        if created:
            print(f"Created hub: {hub.name}")
    
    # Create 15 societies (include required fields)
    societies = []
    for i in range(1, 16):
        societies.append({
            "name": f"Society {i}",
            "acronym": f"S{i}",
            "full_name": f"Professional Society {i}",
            "type": "Professional Body",
            "description": f"Description for Society {i}",
            "website": f"https://society{i}.example.com",
        })
    for society_data in societies:
        society, created = Society.objects.get_or_create(
            name=society_data["name"],
            defaults=society_data,
        )
        if created:
            print(f"Created society: {society.name}")
    
    # Create dense posts across hubs and add comments
    all_hubs = list(CareerHub.objects.all())
    admin_user = User.objects.filter(username="admin").first()
    post_types = ["question", "guide", "discussion", "success_story"]
    created_posts = 0
    for h_index, hub in enumerate(all_hubs, start=1):
        # 10 posts per hub
        for i in range(1, 11):
            title = f"{hub.field} Insights {h_index}-{i}"
            defaults = {
                "hub": hub,
                "author": admin_user,
                "title": title,
                "content": f"Detailed {hub.field.lower()} discussion thread number {i} for {hub.name}.",
                "post_type": post_types[(i - 1) % len(post_types)],
                "tags": [hub.field.lower(), f"topic{i % 6}"]
            }
            post, created = Post.objects.get_or_create(
                hub=hub,
                title=title,
                defaults=defaults,
            )
            if created:
                created_posts += 1
                # Add 2-5 comments per post
                for c in range(1, (i % 4) + 2):
                    Comment.objects.get_or_create(
                        post=post,
                        content=f"Comment {c} on {title}",
                        author=admin_user,
                    )
    print(f"Created/ensured posts across hubs: {created_posts}")
    
    print("=== Database population complete! ===")

if __name__ == "__main__":
    main()
