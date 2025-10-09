from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from ..core.db import get_db
from ..core.auth import get_current_user
from .models import Society, SocietyPost
from .schemas import SocietyOut, SocietyCreate, PostCreate, PostOut
from ..users.models import User

router = APIRouter()


def parse_json_list(s: str):
    if not s:
        return None
    try:
        return json.loads(s)
    except Exception:
        return None


@router.get('/', response_model=List[SocietyOut])
def list_societies(db: Session = Depends(get_db)):
    items = db.query(Society).order_by(Society.name.asc()).all()
    for it in items:
        it.associated_orgs = parse_json_list(it.associated_orgs)
        it.contributors = parse_json_list(it.contributors)
        it.experts = parse_json_list(it.experts)
    return items


@router.get('/{sid}', response_model=SocietyOut)
def get_society(sid: int, db: Session = Depends(get_db)):
    s = db.query(Society).get(sid)
    if not s:
        raise HTTPException(status_code=404, detail='Society not found')
    s.associated_orgs = parse_json_list(s.associated_orgs)
    s.contributors = parse_json_list(s.contributors)
    s.experts = parse_json_list(s.experts)
    return s


@router.post('/', response_model=SocietyOut)
def create_society(soc_in: SocietyCreate, db: Session = Depends(get_db)):
    s = Society(
        name=soc_in.name,
        field=soc_in.field,
        description=soc_in.description,
        associated_orgs=json.dumps(soc_in.associated_orgs) if soc_in.associated_orgs is not None else None,
        contributors=json.dumps(soc_in.contributors) if soc_in.contributors is not None else None,
        experts=json.dumps(soc_in.experts) if soc_in.experts is not None else None,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    s.associated_orgs = parse_json_list(s.associated_orgs)
    s.contributors = parse_json_list(s.contributors)
    s.experts = parse_json_list(s.experts)
    return s


@router.post('/join/{sid}')
def join_society(sid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(Society).get(sid)
    if not s:
        raise HTTPException(status_code=404, detail='Society not found')
    if s not in user.societies:
        user.societies.append(s)
        db.add(user)
        db.commit()
    return {"status": "joined", "society_id": sid}


@router.post('/leave/{sid}')
def leave_society(sid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(Society).get(sid)
    if not s:
        raise HTTPException(status_code=404, detail='Society not found')
    if s in user.societies:
        user.societies.remove(s)
        db.add(user)
        db.commit()
    return {"status": "left", "society_id": sid}


@router.get('/me', response_model=List[SocietyOut])
def my_societies(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Societies via relationship
    out = []
    for s in user.societies:
        s.associated_orgs = parse_json_list(s.associated_orgs)
        s.contributors = parse_json_list(s.contributors)
        s.experts = parse_json_list(s.experts)
        out.append(s)
    return out


# Basic posts CRUD (placeholder)
@router.get('/{sid}/posts', response_model=List[PostOut])
def list_posts(sid: int, db: Session = Depends(get_db)):
    posts = db.query(SocietyPost).filter(SocietyPost.society_id == sid).all()
    return posts


@router.post('/{sid}/posts', response_model=PostOut)
def create_post(sid: int, post: PostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(Society).get(sid)
    if not s:
        raise HTTPException(status_code=404, detail='Society not found')
    p = SocietyPost(society_id=sid, author=user.username, title=post.title, content=post.content)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
