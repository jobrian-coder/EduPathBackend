"""
populate_courses_enriched.py
----------------------------
Full clear-and-replace of the Course table from course_data.json.

Run from the backend directory:
    python scripts/populate_courses_enriched.py

Expects:
    EduPath/data/courses data/course_data.json  (29 concatenated JSON objects)
"""

import os
import sys
import json
import django
from pathlib import Path
from decimal import Decimal, InvalidOperation

# ── Django setup ────────────────────────────────────────────────────────────
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.courses.models import Course  # noqa: E402  (after django.setup)

# ── Hub keyword mapping (priority order — first match wins) ─────────────────
HUB_KEYWORDS = {
    'Medicine & Health': [
        'MEDICINE', 'SURGERY', 'NURSING', 'PHARMACY', 'DENTAL', 'HEALTH',
        'PHYSIOTHERAPY', 'RADIOGRAPHY', 'CLINICAL', 'NUTRITION', 'MEDICAL',
        'OPTOMETRY', 'MIDWIFERY',
    ],
    'Engineering & Technology': [
        'ENGINEERING', 'MECHANICAL', 'ELECTRICAL', 'CIVIL', 'CHEMICAL',
        'AERONAUTICAL', 'MANUFACTURING', 'MECHATRONIC', 'AUTOMOTIVE', 'TECHNOLOGY',
    ],
    'Computing & IT': [
        'COMPUTER', 'COMPUTING', 'INFORMATION TECHNOLOGY', 'SOFTWARE',
        'INFORMATION SYSTEMS', 'NETWORKS', 'INFORMATICS', 'ICT',
    ],
    'Business & Finance': [
        'BUSINESS', 'COMMERCE', 'ACCOUNTING', 'FINANCE', 'ECONOMICS',
        'MANAGEMENT', 'ENTREPRENEURSHIP', 'PROCUREMENT', 'ACTUARIAL', 'LOGISTICS',
    ],
    'Law & Social Sciences': [
        'LAW', 'CRIMINOLOGY', 'POLITICAL', 'SOCIOLOGY', 'SOCIAL WORK',
        'DIPLOMACY', 'INTERNATIONAL RELATIONS', 'GOVERNANCE', 'PUBLIC ADMINISTRATION',
        'CONFLICT', 'PEACE', 'HUMAN RIGHTS',
    ],
    'Education & Teaching': [
        'EDUCATION', 'TEACHING', 'EARLY CHILDHOOD', 'SPECIAL NEEDS',
    ],
    'Agriculture & Environment': [
        'AGRICULTURE', 'AGRICULTURAL', 'AGRIBUSINESS', 'AGRONOMY', 'HORTICULTURE',
        'FORESTRY', 'WILDLIFE', 'VETERINARY', 'ANIMAL', 'FISHERIES', 'CROP',
        'SOIL', 'ENVIRONMENTAL', 'NATURAL RESOURCE', 'WATER RESOURCE',
    ],
    'Arts & Design': [
        'FINE ART', 'DESIGN', 'ARCHITECTURE', 'MUSIC', 'JOURNALISM',
        'COMMUNICATION', 'MEDIA', 'FILM', 'THEATRE', 'LINGUISTICS', 'LANGUAGE',
        'PHILOSOPHY', 'THEOLOGY', 'RELIGIOUS', 'KISWAHILI', 'ARABIC',
        'LITERATURE', 'ARTS',
    ],
    'Hospitality & Tourism': [
        'HOSPITALITY', 'TOURISM', 'HOTEL', 'TRAVEL', 'RECREATION', 'LEISURE',
    ],
}
DEFAULT_HUB = 'Science & Research'

FEE_MAP = {
    'Medicine & Health': 225000,
    'Engineering & Technology': 160000,
    'Law & Social Sciences': 140000,
    'Computing & IT': 115000,
    'Business & Finance': 120000,
    'Education & Teaching': 70000,
    'Agriculture & Environment': 95000,
    'Arts & Design': 80000,
    'Hospitality & Tourism': 90000,
    'Science & Research': 100000,
}


# ── Helpers ──────────────────────────────────────────────────────────────────
def assign_hub(category: str) -> str:
    upper = category.upper()
    for hub, keywords in HUB_KEYWORDS.items():
        if any(kw in upper for kw in keywords):
            return hub
    return DEFAULT_HUB


def parse_cutoff(val) -> float | None:
    """Return float or None. Never stores 0, 0.0, '', or '_'."""
    if val is None or val == '_' or val == '':
        return None
    try:
        f = float(val)
        return None if f == 0.0 else f
    except (TypeError, ValueError):
        return None


def safe_list(val) -> list | None:
    """Return list or None — never []."""
    if isinstance(val, list) and len(val) > 0:
        return val
    return None


def safe_str(val) -> str | None:
    """Return cleaned string or None — never ''."""
    if val and str(val).strip() and str(val).strip() != '_':
        return str(val).strip()
    return None


# ── Step 0 — Parse 29 concatenated JSON objects ──────────────────────────────
data_file = backend_dir.parent / 'data' / 'courses data' / 'course_data.json'
if not data_file.exists():
    print(f"ERROR: course_data.json not found at {data_file}")
    print("Looking for alternative paths...")
    alt_paths = list((backend_dir.parent / 'data').glob('**/*course_data*'))
    if alt_paths:
        print(f"Found: {alt_paths[0]}")
        data_file = alt_paths[0]
    else:
        sys.exit(1)

print(f"Reading: {data_file}")
with open(data_file, encoding='utf-8') as f:
    content = f.read().strip()

decoder = json.JSONDecoder()
combined = {}
pos = 0
while pos < len(content):
    while pos < len(content) and content[pos] in ' \t\n\r':
        pos += 1
    if pos >= len(content):
        break
    obj, end_pos = decoder.raw_decode(content, pos)
    combined.update(obj)
    pos = end_pos

print(f"Parsed {len(combined)} categories from JSON.")

# ── Step 1 — Fix CourseUniversity FKs before clearing ───────────────────────
# (The FK is now SET_NULL so Course.objects.all().delete() won't cascade-fail)

# ── Step 2 — Clear Course table only ────────────────────────────────────────
print("Clearing Course table...")
deleted_count, _ = Course.objects.all().delete()
print(f"Deleted {deleted_count} old Course rows.")

# ── Step 3 — Build Course records ───────────────────────────────────────────
records = []
hub_counts = {hub: 0 for hub in list(HUB_KEYWORDS.keys()) + [DEFAULT_HUB]}
categories_seen = set()

for cat_key, cat_data in combined.items():
    enrichment = cat_data.get('enrichment', {}) or {}
    programmes = cat_data.get('programmes', []) or []
    categories_seen.add(cat_key)

    hub = assign_hub(cat_key)
    avg_fee = FEE_MAP[hub]

    # Shared enrichment values for every programme under this category
    description = safe_str(enrichment.get('description'))
    pros = safe_list(enrichment.get('pros'))
    cons = safe_list(enrichment.get('cons'))
    careers = safe_list(enrichment.get('careers'))

    for prog in programmes:
        reqs = prog.get('subject_requirements', []) or []

        records.append(Course(
            name=safe_str(prog.get('programme_name')) or cat_key,
            category=cat_key,
            description=description,
            pros=pros,
            cons=cons,
            careers=careers,
            institution=safe_str(prog.get('institution')),
            cutoff_2023=parse_cutoff(prog.get('cutoff_2023')),
            cutoff_2022=parse_cutoff(prog.get('cutoff_2022')),
            subject_requirement_1=safe_str(reqs[0]) if len(reqs) > 0 else None,
            subject_requirement_2=safe_str(reqs[1]) if len(reqs) > 1 else None,
            subject_requirement_3=safe_str(reqs[2]) if len(reqs) > 2 else None,
            subject_requirement_4=safe_str(reqs[3]) if len(reqs) > 3 else None,
            programme_code=safe_str(prog.get('prog_code')),
            related_hub=hub,
            avg_fees_ksh=avg_fee,
            is_enriched=True,
            # Legacy fields — all NULL
            duration=None,
            cluster_points=None,
            modules=None,
            career_paths=None,
            mandatory_subjects=None,
            alternative_subjects=None,
            cluster_subjects=None,
            cluster_formula=None,
        ))
        hub_counts[hub] += 1

# ── Bulk insert ──────────────────────────────────────────────────────────────
print(f"Inserting {len(records)} Course records (batch_size=200)...")
Course.objects.bulk_create(records, batch_size=200)

# ── Summary ──────────────────────────────────────────────────────────────────
print("\n" + "=" * 55)
print(f"Course records created: {len(records)}")
print(f"Categories covered:     {len(categories_seen)}")
print(f"Enriched:               {len(records)}")
print("Hub assignments:")
for hub, count in hub_counts.items():
    if count:
        print(f"  {hub}: {count}")
print("=" * 55)
print("\nDone! Run python scripts/index_courses.py to rebuild ChromaDB.")
