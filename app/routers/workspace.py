from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..services import ai_service

router = APIRouter(
    prefix="/workspace",
    tags=["workspace"]
)

@router.get("/essays/{prompt_id}", response_model=schemas.Essay)
def get_essay(prompt_id: int, db: Session = Depends(get_db)):
    essay = db.query(models.Essay).filter(models.Essay.prompt_id == prompt_id).first()
    if not essay:
        # Create empty if not exists? Or return 404? 
        # Typically workspace opens an existing prompt. 
        # If no essay started, we can return null content or create one.
        # Let's create one.
        essay = models.Essay(prompt_id=prompt_id, content="")
        db.add(essay)
        db.commit()
        db.refresh(essay)
    return essay

@router.post("/essays/{prompt_id}", response_model=schemas.Essay)
def save_essay(prompt_id: int, essay_data: schemas.EssayUpdate, db: Session = Depends(get_db)):
    essay = db.query(models.Essay).filter(models.Essay.prompt_id == prompt_id).first()
    if not essay:
        essay = models.Essay(prompt_id=prompt_id, content=essay_data.content)
        db.add(essay)
    else:
        essay.content = essay_data.content
        essay.last_updated = models.datetime.utcnow()
    
    db.commit()
    db.refresh(essay)
    return essay

@router.post("/essays/{prompt_id}/suggest", response_model=schemas.StorySuggestion)
def generate_suggestion(prompt_id: int, db: Session = Depends(get_db)):
    # 1. Get Essay and Prompt
    essay = db.query(models.Essay).filter(models.Essay.prompt_id == prompt_id).first()
    prompt = db.query(models.Prompt).filter(models.Prompt.id == prompt_id).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
        
    essay_content = essay.content if essay else ""
    
    # 2. Get User Notes
    notes = db.query(models.PersonalLensNote).all()
    note_texts = [n.content for n in notes]
    
    # 3. Call AI Service
    suggestion_text = ai_service.generate_story_suggestions(
        essay_content=essay_content,
        prompt_text=prompt.text,
        user_notes=note_texts
    )
    
    # 4. Save Suggestion
    suggestion = models.StorySuggestion(
        essay_id=essay.id if essay else None,
        content=suggestion_text,
        source_type="ai_generated"
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    
    return suggestion
