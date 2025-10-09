from typing import List, Optional
from pydantic import BaseModel

class CourseBase(BaseModel):
  name: str
  description: Optional[str] = None
  university: Optional[str] = None
  duration: Optional[int] = None
  cluster_points: Optional[int] = None
  pros: Optional[List[str]] = None
  cons: Optional[List[str]] = None

class CourseCreate(CourseBase):
  pass

class CourseOut(CourseBase):
  id: int
  class Config:
    orm_mode = True

class CourseCompareOut(BaseModel):
  a: CourseOut
  b: CourseOut
  metrics: List[dict]
  pros_cons: dict
