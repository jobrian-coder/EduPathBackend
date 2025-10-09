from typing import List, Optional
from pydantic import BaseModel

class SocietyBase(BaseModel):
    name: str
    field: Optional[str] = None
    description: Optional[str] = None
    associated_orgs: Optional[List[str]] = None
    contributors: Optional[List[str]] = None
    experts: Optional[List[str]] = None

class SocietyCreate(SocietyBase):
    pass

class SocietyOut(SocietyBase):
    id: int
    class Config:
        orm_mode = True

class PostBase(BaseModel):
    title: str
    content: Optional[str] = None

class PostCreate(PostBase):
    society_id: int

class PostOut(PostBase):
    id: int
    society_id: int
    author: str
    class Config:
        orm_mode = True
