from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from ..core.db import get_db
from ..core.auth import get_current_user
from ..users.models import User
from ..courses.models import Course
from ..societies.models import Society

router = APIRouter()


def parse_json(val):
    try:
        return json.loads(val) if val else None
    except Exception:
        return None


@router.get('/me')
def full_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Base user info
    profile = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "profile_pic": user.profile_pic,
        "hobbies": parse_json(user.hobbies) or [],
        "interests": parse_json(user.interests) or [],
        "schools_attended": parse_json(user.schools_attended) or [],
        "grades": parse_json(user.grades) or {},
    }

    # Bookmarked courses
    profile["bookmarked_courses"] = [
        {
            "id": c.id,
            "name": c.name,
            "university": c.university,
            "duration": c.duration,
            "cluster_points": c.cluster_points,
            "pros": parse_json(c.pros) or [],
            "cons": parse_json(c.cons) or [],
        }
        for c in user.bookmarked_courses
    ]

    # Joined societies
    profile["societies"] = [
        {
            "id": s.id,
            "name": s.name,
            "field": s.field,
            "description": s.description,
            "associated_orgs": parse_json(s.associated_orgs) or [],
            "contributors": parse_json(s.contributors) or [],
            "experts": parse_json(s.experts) or [],
        }
        for s in user.societies
    ]

    return profile
