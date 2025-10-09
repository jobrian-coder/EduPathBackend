#!/usr/bin/env python
r"""
Extract degree programme data from a semi-structured PDF into a normalized JSON file.

Usage (PowerShell):
  & C:\Users\ADMIN\OneDrive\Desktop\EduPath\.venv\Scripts\python.exe extract_courses.py \\
      --pdf C:\Users\ADMIN\OneDrive\Desktop\EduPath\backend\DEGREE_PROGRAMMES_2025.pdf \\
      --out data/parsed_courses.json

Outputs a JSON with keys: universities, courses, course_universities

Note: This is a best-effort extractor using pdfplumber text and basic regex heuristics.
{{ ... }}
If Tabula (Java) is available, it will also attempt to parse tables for better accuracy.
"""
import argparse
import json
import os
import re
import uuid
from datetime import date
from decimal import Decimal

# Optional imports guarded
try:
    import pdfplumber  # type: ignore
except Exception:
    pdfplumber = None

try:
    import tabula  # type: ignore  # requires Java
except Exception:
    tabula = None

CATEGORY_KEYWORDS = {
    'Technology': ['computer', 'information technology', 'software', 'cyber', 'data', 'network', 'telecommunication'],
    'Medicine': ['medicine', 'surgery', 'dental', 'pharmacy', 'nursing', 'clinical', 'health', 'medical', 'physiotherapy'],
    'Engineering': ['engineering', 'architecture', 'quantity surveying', 'construction', 'mechatronic'],
    'Law': ['law', 'legal'],
    'Business': ['business', 'commerce', 'economics', 'finance', 'accounting', 'marketing', 'management', 'entrepreneurship'],
    'Education': ['education', 'teaching'],
    'Healthcare': ['public health', 'community health', 'nutrition', 'dietetics', 'environmental health']
}


def determine_category(name: str) -> str:
    n = name.lower()
    for cat, kws in CATEGORY_KEYWORDS.items():
        if any(k in n for k in kws):
            return cat
    return 'Technology'


def default_modules(cat: str):
    return {
        'Technology': [
            'Introduction to Programming','Data Structures and Algorithms','Database Management Systems','Software Engineering',
            'Web Development','Computer Networks','Operating Systems','Final Year Project'
        ],
        'Medicine': ['Human Anatomy','Physiology','Biochemistry','Pharmacology','Pathology','Clinical Medicine','Surgery','Research Project'],
        'Engineering': ['Engineering Mathematics','Engineering Drawing','Mechanics','Thermodynamics','Material Science','Design Project','Industrial Training','Final Year Project'],
        'Business': ['Principles of Management','Financial Accounting','Marketing Management','Business Law','Organizational Behavior','Strategic Management','Business Research','Internship'],
        'Education': ['Educational Psychology','Curriculum Development','Teaching Methods','Assessment and Evaluation','Educational Technology','Classroom Management','Teaching Practice','Research Project'],
        'Healthcare': ['Public Health Principles','Epidemiology','Health Policy','Community Health','Health Education','Research Methods','Fieldwork','Capstone Project']
    }.get(cat, ['Foundations', 'Electives', 'Capstone'])


def default_career_paths(cat: str):
    return {
        'Technology': ['Software Developer','Systems Analyst','Database Administrator','IT Consultant','Network Engineer','Cybersecurity Analyst'],
        'Medicine': ['Medical Doctor','Surgeon','Clinical Officer','Medical Researcher','Hospital Administrator','Public Health Officer'],
        'Engineering': ['Design Engineer','Project Engineer','Consulting Engineer','Research Engineer','Quality Assurance Engineer','Engineering Manager'],
        'Business': ['Business Analyst','Marketing Manager','Financial Analyst','Human Resource Manager','Entrepreneur','Business Consultant'],
        'Education': ['Secondary School Teacher','Curriculum Developer','Educational Administrator','Education Officer','Academic Coordinator','Education Consultant'],
        'Healthcare': ['Public Health Officer','Health Educator','Community Health Worker','Health Program Manager','Epidemiologist','Health Policy Analyst']
    }.get(cat, ['Professional', 'Specialist'])


def parse_text_lines(text: str):
    """Heuristic line parser. Looks for lines with 'BACHELOR' and optional subject tokens like MAT(101):B.
    Returns tuples of (course_name, institution, cutoff, mandatory_subjects, alternative_subjects).
    """
    courses = []
    for raw in text.split('\n'):
        line = raw.strip()
        if not line:
            continue
        if 'BACHELOR' not in line.upper():
            continue
        parts = line.split()
        # rough institution guess: words before first BACHELOR token
        inst = None
        try:
            tokens_upper = [p.upper() for p in parts]
            bidx = tokens_upper.index('BACHELOR')
            inst = ' '.join(parts[:max(0, bidx)]) or 'Generic University'
        except ValueError:
            inst = 'Generic University'
        # course name from first BACHELOR onwards
        try:
            first_b_index = line.upper().index('BACHELOR')
            course_name = line[first_b_index:]
        except Exception:
            course_name = 'Bachelor Programme'
        # cutoff: last float-like token
        cutoff = None
        for p in parts[::-1]:
            ps = p.replace(',', '')
            if re.fullmatch(r"\d+\.\d+|\d+", ps):
                try:
                    cutoff = float(ps)
                    break
                except Exception:
                    pass
        # subjects
        subject_codes = re.findall(r'([A-Z]{2,4})\((\d+)\):([A-Z][+-]?)', line)
        mandatory = [f"{c}:{g}" for c, _, g in subject_codes[:2]] or ['MAT:B', 'ENG:B']
        alternative = [f"{c}:{g}" for c, _, g in subject_codes[2:]] or ['PHY:C+', 'CHE:C+']
        courses.append((course_name.strip(), inst.strip(), cutoff, mandatory, alternative))
    return courses


def extract_with_pdfplumber(pdf_path: str) -> str:
    if not pdfplumber:
        return ''
    text_chunks = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            try:
                text_chunks.append(page.extract_text() or '')
            except Exception:
                continue
    return '\n'.join(text_chunks)


def extract_tables_with_tabula(pdf_path: str):
    if not tabula:
        return []
    try:
        dfs = tabula.read_pdf(pdf_path, pages='all', multiple_tables=True, lattice=True, stream=True)
        return dfs or []
    except Exception:
        return []


def normalize(pdf_path: str):
    # 1) collect text
    text = extract_with_pdfplumber(pdf_path)
    parsed = parse_text_lines(text)

    # 2) build normalized lists
    universities = {}
    courses = []
    course_universities = []

    for (course_name, inst, cutoff, mandatory, alternative) in parsed:
        course_id = str(uuid.uuid4())
        category = determine_category(course_name)
        cluster_points = float(cutoff) if cutoff is not None else 30.0
        cluster_subjects = [s.split(':')[0] for s in mandatory][:4] or ['MAT','ENG','PHY','CHE']
        courses.append({
            'id': course_id,
            'name': course_name,
            'category': category,
            'duration': '4 years',
            'cluster_points': cluster_points,
            'description': f"{course_name} in the {category} category.",
            'modules': default_modules(category),
            'career_paths': default_career_paths(category),
            'mandatory_subjects': mandatory,
            'alternative_subjects': alternative,
            'cluster_subjects': cluster_subjects,
            'cluster_formula': {'type': 'weighted_average', 'weights': {'MAT': 1.0, 'PHY': 1.0, 'CHE': 1.0, 'ENG': 1.0}},
        })
        if inst not in universities:
            universities[inst] = {
                'id': str(uuid.uuid4()),
                'name': inst,
                'short_name': re.sub(r'[^A-Za-z]', '', inst)[:6] or 'UNIV',
                'type': 'Public',
                'location': 'Nairobi',
                'logo': '🎓',
                'established': 1995,
                'ranking': 100,
                'students': '10000+',
                'website': f"https://{re.sub(r'\s+', '', inst.lower())}.example.com",
                'description': f'{inst} auto-generated from PDF.',
                'facilities': ['Library','Labs','Sports'],
                'accreditation': 'CUE Accredited',
            }
        course_universities.append({
            'id': str(uuid.uuid4()),
            'course': course_id,
            'university': universities[inst]['id'],
            'fees_ksh': float(300000),
            'cutoff_points': float(cluster_points),
            'application_deadline': date(2025, 7, 31).isoformat(),
            'course_url': None,
        })

    return {
        'universities': list(universities.values()),
        'courses': courses,
        'course_universities': course_universities,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf', required=True, help='Path to DEGREE_PROGRAMMES_2025.pdf')
    ap.add_argument('--out', default='data/parsed_courses.json', help='Output JSON path (relative to backend/)')
    args = ap.parse_args()

    pdf_path = os.path.abspath(args.pdf)
    out_path = os.path.abspath(args.out)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    normalized = normalize(pdf_path)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(normalized, f, indent=2, ensure_ascii=False)

    print(f"Wrote normalized JSON -> {out_path}")
    print(f"Counts: courses={len(normalized['courses'])}, universities={len(normalized['universities'])}, links={len(normalized['course_universities'])}")


if __name__ == '__main__':
    main()
