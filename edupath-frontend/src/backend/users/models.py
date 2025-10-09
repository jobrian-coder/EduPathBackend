from sqlalchemy import Column, Integer, String, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from ..core.db import Base

# Association tables
user_course_bookmarks = Table(
    'user_course_bookmarks', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True)
)

user_society_members = Table(
    'user_society_members', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('society_id', Integer, ForeignKey('societies.id'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    profile_pic = Column(String(512), nullable=True)
    # JSON-like fields stored as JSON string
    hobbies = Column(Text, nullable=True)
    interests = Column(Text, nullable=True)
    schools_attended = Column(Text, nullable=True)
    grades = Column(Text, nullable=True)

    bookmarked_courses = relationship(
        'Course', secondary=user_course_bookmarks, back_populates='bookmarked_by'
    )

    societies = relationship(
        'Society', secondary=user_society_members, back_populates='members'
    )
