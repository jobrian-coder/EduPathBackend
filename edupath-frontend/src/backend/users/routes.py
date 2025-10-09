from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from ..core.db import get_db
from ..core.auth import get_password_hash, verify_password, create_access_token, get_current_user
from . import schemas
from .models import User
from ..core.config import settings
import json

router = APIRouter()

@router.post('/register', response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first():
        raise HTTPException(status_code=400, detail='Username or email already registered')
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post('/login', response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect username or password')
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get('/me', response_model=schemas.UserOut)
def me(current: User = Depends(get_current_user)):
    # Convert JSON text fields to lists/dicts
    def parse_json(val):
        try:
            return json.loads(val) if val else None
        except Exception:
            return None
    current.hobbies = parse_json(current.hobbies)
    current.interests = parse_json(current.interests)
    current.schools_attended = parse_json(current.schools_attended)
    current.grades = parse_json(current.grades)
    return current

@router.put('/me', response_model=schemas.UserOut)
def update_me(update: schemas.UserUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if update.profile_pic is not None:
        current.profile_pic = update.profile_pic
    if update.hobbies is not None:
        current.hobbies = json.dumps(update.hobbies)
    if update.interests is not None:
        current.interests = json.dumps(update.interests)
    if update.schools_attended is not None:
        current.schools_attended = json.dumps(update.schools_attended)
    if update.grades is not None:
        current.grades = json.dumps(update.grades)
    db.add(current)
    db.commit()
    db.refresh(current)
    return current
