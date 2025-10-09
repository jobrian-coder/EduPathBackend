from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import json

from ..core.db import get_db
from ..core.auth import get_current_user
from .models import Course
from ..users.models import User
from .schemas import CourseOut, CourseCreate, CourseCompareOut

router = APIRouter()


def parse_json_list(s: Optional[str]):
    if not s:
        return None
    try:
        return json.loads(s)
    except Exception:
        return None


@router.get('/', response_model=List[CourseOut])
def list_courses(db: Session = Depends(get_db), q: Optional[str] = Query(None)):
    qs = db.query(Course)
    if q:
        qs = qs.filter(Course.name.ilike(f"%{q}%"))
    items = qs.order_by(Course.name.asc()).all()
    for c in items:
        c.pros = parse_json_list(c.pros)
        c.cons = parse_json_list(c.cons)
    return items


@router.get('/{course_id}', response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    c = db.query(Course).get(course_id)
    if not c:
        raise HTTPException(status_code=404, detail='Course not found')
    c.pros = parse_json_list(c.pros)
    c.cons = parse_json_list(c.cons)
    return c


@router.post('/', response_model=CourseOut)
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    c = Course(
        name=course_in.name,
        description=course_in.description,
        university=course_in.university,
        duration=course_in.duration,
        cluster_points=course_in.cluster_points,
        pros=json.dumps(course_in.pros) if course_in.pros is not None else None,
        cons=json.dumps(course_in.cons) if course_in.cons is not None else None,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    c.pros = parse_json_list(c.pros)
    c.cons = parse_json_list(c.cons)
    return c


@router.get('/compare', response_model=CourseCompareOut)
def compare_courses(a: int = Query(...), b: int = Query(...), db: Session = Depends(get_db)):
    ca = db.query(Course).get(a)
    cb = db.query(Course).get(b)
    if not ca or not cb:
        raise HTTPException(status_code=404, detail='Course not found')
    # Build metrics (example metrics based on available fields)
    metrics = [
        {"metric": "Duration (yrs)", "a": ca.duration or 0, "b": cb.duration or 0},
        {"metric": "Cluster Points", "a": ca.cluster_points or 0, "b": cb.cluster_points or 0},
    ]
    out = {
        "a": CourseOut.from_orm(ca),
        "b": CourseOut.from_orm(cb),
        "metrics": metrics,
        "pros_cons": {
            "a": {"pros": parse_json_list(ca.pros) or [], "cons": parse_json_list(ca.cons) or []},
            "b": {"pros": parse_json_list(cb.pros) or [], "cons": parse_json_list(cb.cons) or []},
        },
    }
    return out


@router.post('/{course_id}/bookmark')
def bookmark_course(course_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.query(Course).get(course_id)
    if not c:
        raise HTTPException(status_code=404, detail='Course not found')
    if c not in user.bookmarked_courses:
        user.bookmarked_courses.append(c)
        db.add(user)
        db.commit()
    return {"status": "bookmarked", "course_id": course_id}


@router.delete('/{course_id}/bookmark')
def unbookmark_course(course_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.query(Course).get(course_id)
    if not c:
        raise HTTPException(status_code=404, detail='Course not found')
    if c in user.bookmarked_courses:
        user.bookmarked_courses.remove(c)
        db.add(user)
        db.commit()
    return {"status": "unbookmarked", "course_id": course_id}
