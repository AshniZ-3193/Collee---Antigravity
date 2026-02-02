from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    interests: Optional[str] = None
    motivation: Optional[str] = None
    social_role: Optional[str] = None
    writing_voice: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

# Prompt Schemas
class PromptBase(BaseModel):
    text: str
    word_count_max: int
    is_optional: bool = False
    prompt_type: Optional[str] = None

class PromptCreate(PromptBase):
    pass

class Prompt(PromptBase):
    id: int
    college_id: int
    class Config:
        orm_mode = True

# College Schemas
class CollegeBase(BaseModel):
    name: str
    application_type: str
    deadline: Optional[datetime] = None

class CollegeCreate(CollegeBase):
    prompts: List[PromptCreate] = []

class College(CollegeBase):
    id: int
    prompts: List[Prompt] = []
    class Config:
        orm_mode = True

# Essay Schemas
class EssayBase(BaseModel):
    content: str

class EssayUpdate(EssayBase):
    pass

class Essay(EssayBase):
    id: int
    prompt_id: int
    last_updated: datetime
    class Config:
        orm_mode = True

# Lens Schemas
class PersonalLensNoteBase(BaseModel):
    content: str

class PersonalLensNoteCreate(PersonalLensNoteBase):
    pass

class PersonalLensNote(PersonalLensNoteBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

# Story Suggestion Schemas
class StorySuggestionBase(BaseModel):
    content: str
    source_type: str

class StorySuggestionCreate(StorySuggestionBase):
    essay_id: Optional[int] = None
    note_id: Optional[int] = None

class StorySuggestion(StorySuggestionBase):
    id: int
    class Config:
        orm_mode = True
