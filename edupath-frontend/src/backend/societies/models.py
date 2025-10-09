from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..core.db import Base

class Society(Base):
    __tablename__ = 'societies'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    field = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    associated_orgs = Column(Text, nullable=True)  # JSON list
    contributors = Column(Text, nullable=True)     # JSON list
    experts = Column(Text, nullable=True)          # JSON list

    members = relationship('User', secondary='user_society_members', back_populates='societies')
    posts = relationship('SocietyPost', back_populates='society', cascade='all, delete-orphan')

class SocietyPost(Base):
    __tablename__ = 'society_posts'

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey('societies.id'), nullable=False)
    author = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)

    society = relationship('Society', back_populates='posts')
