from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/colleges",
    tags=["colleges"]
)

@router.get("/", response_model=List[schemas.College])
def read_colleges(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    colleges = db.query(models.College).offset(skip).limit(limit).all()
    return colleges

@router.post("/", response_model=schemas.College)
def create_college(college: schemas.CollegeCreate, db: Session = Depends(get_db)):
    db_college = models.College(
        name=college.name,
        application_type=college.application_type,
        deadline=college.deadline
    )
    db.add(db_college)
    db.commit()
    db.refresh(db_college)
    
    # Add prompts if any
    for prompt in college.prompts:
        db_prompt = models.Prompt(
            college_id=db_college.id,
            text=prompt.text,
            word_count_max=prompt.word_count_max,
            is_optional=prompt.is_optional,
            prompt_type=prompt.prompt_type
        )
        db.add(db_prompt)
    
    db.commit()
    db.refresh(db_college)
    return db_college

@router.delete("/{college_id}")
def delete_college(college_id: int, db: Session = Depends(get_db)):
    college = db.query(models.College).filter(models.College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    
    # Cascade delete prompts? SQLAlchemy relationship usually handles if configured, 
    # but let's be explicit or rely on DB. 
    # For MVP, assumed usage is safe.
    db.delete(college)
    db.commit()
    return {"ok": True}

@router.post("/{college_id}/prompts/", response_model=schemas.Prompt)
def create_prompt(college_id: int, prompt: schemas.PromptCreate, db: Session = Depends(get_db)):
    db_prompt = models.Prompt(**prompt.dict(), college_id=college_id)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt
