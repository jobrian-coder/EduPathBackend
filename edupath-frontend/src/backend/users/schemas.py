from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    profile_pic: Optional[str] = None
    hobbies: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    schools_attended: Optional[List[str]] = None
    grades: Optional[dict] = None

class UserOut(UserBase):
    id: int
    profile_pic: Optional[str] = None
    hobbies: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    schools_attended: Optional[List[str]] = None
    grades: Optional[dict] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
