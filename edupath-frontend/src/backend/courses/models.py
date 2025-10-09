from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from ..core.db import Base

class Course(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    university = Column(String(255), nullable=True)
    duration = Column(Integer, nullable=True)
    cluster_points = Column(Integer, nullable=True)
    pros = Column(Text, nullable=True)  # JSON string list
    cons = Column(Text, nullable=True)  # JSON string list

    bookmarked_by = relationship('User', secondary='user_course_bookmarks', back_populates='bookmarked_courses')
