from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    interests = Column(String, nullable=True)  # JSON or comma-separated
    motivation = Column(String, nullable=True)
    social_role = Column(String, nullable=True)
    writing_voice = Column(String, nullable=True)

class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    application_type = Column(String)  # e.g., "Early Action", "Regular Decision"
    deadline = Column(DateTime, nullable=True)

    prompts = relationship("Prompt", back_populates="college")

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id"))
    text = Column(Text)
    word_count_max = Column(Integer)
    is_optional = Column(Boolean, default=False)
    prompt_type = Column(String, nullable=True) # e.g. "Why Major"

    college = relationship("College", back_populates="prompts")
    essays = relationship("Essay", back_populates="prompt")

class Essay(Base):
    __tablename__ = "essays"

    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"))
    content = Column(Text, default="")
    last_updated = Column(DateTime, default=datetime.utcnow)

    prompt = relationship("Prompt", back_populates="essays")
    suggestions = relationship("StorySuggestion", back_populates="essay")

class PersonalLensNote(Base):
    __tablename__ = "personal_lens_notes"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class StorySuggestion(Base):
    __tablename__ = "story_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    essay_id = Column(Integer, ForeignKey("essays.id"), nullable=True)
    note_id = Column(Integer, ForeignKey("personal_lens_notes.id"), nullable=True)
    content = Column(Text)
    source_type = Column(String) # "essay_context" or "personal_lens"

    essay = relationship("Essay", back_populates="suggestions")
