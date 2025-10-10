GRADE_POINTS_MAP = {
    'A': 12,
    'A-': 11,
    'B+': 10,
    'B': 9,
    'B-': 8,
    'C+': 7,
    'C': 6,
    'C-': 5,
    'D+': 4,
    'D': 3,
    'D-': 2,
    'E': 1,
}


def grade_to_points(grade: str):
    """Convert KCSE grade to points. Returns None if grade unknown."""
    if not grade:
        return None
    return GRADE_POINTS_MAP.get(str(grade).strip().upper())


def normalize_grades(grades):
    """
    Normalize grades input into subject_code -> points mapping.
    Accepts dictionary {subject_code: grade} or iterable of objects with
    `subject_code`/`grade` keys.
    """
    if not grades:
        return {}

    points_map = {}

    if isinstance(grades, dict):
        iterable = grades.items()
    else:
        iterable = []
        for entry in grades:
            if isinstance(entry, dict):
                subject_code = entry.get('subject_code') or entry.get('subject') or entry.get('code')
                grade_value = entry.get('grade')
                if subject_code:
                    iterable.append((subject_code, grade_value))

    for subject_code, grade_value in iterable:
        points = grade_to_points(grade_value)
        if points is not None:
            normalized_code = str(subject_code).strip().upper()
            points_map[normalized_code] = points

    return points_map


def calculate_mean_points(points_map):
    """Compute mean points out of 84 using best 7 subjects."""
    if not points_map:
        return None
    top_seven = sorted(points_map.values(), reverse=True)[:7]
    if not top_seven:
        return None
    return sum(top_seven)


def calculate_raw_cluster(points_map, required_subjects):
    """Return raw cluster total and list of missing required subjects."""
    if not required_subjects:
        return 0, []

    total = 0
    missing = []
    for code in required_subjects:
        normalized = str(code).strip().upper()
        points = points_map.get(normalized)
        if points is None:
            missing.append(normalized)
        else:
            total += points
    return total, missing


def calculate_cluster_points(raw_cluster_total, mean_points):
    """Apply KUCCPS formula to derive cluster points on 0-48 scale."""
    if raw_cluster_total is None or mean_points is None:
        return None
    
    if raw_cluster_total <= 0 or mean_points <= 0:
        return None
    
    try:
        base = (raw_cluster_total * mean_points) / (48 * 84)
        if base <= 0:
            return 0
        return (base ** 0.5) * 48
    except (TypeError, ValueError, ZeroDivisionError):
        return None
