from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from ..services import ai_service

router = APIRouter(
    prefix="/api",
    tags=["ai"]
)

class GenerateRequest(BaseModel):
    prompt_text: str
    essay_content: Optional[str] = ""
    # context/notes can be fetched from DB for the user, or passed in. 
    # For MVP, let's fetch from DB if not passed.

@router.post("/generate-suggestions", response_model=schemas.StorySuggestion)
def generate_suggestions_api(request: GenerateRequest, db: Session = Depends(get_db)):
    # 1. Fetch User Notes (Context)
    # Assumes single user for MVP or uses all notes
    notes = db.query(models.PersonalLensNote).all()
    note_texts = [n.content for n in notes]
    
    # 2. Call AI Service
    suggestion_content = ai_service.generate_story_suggestions(
        essay_content=request.essay_content,
        prompt_text=request.prompt_text,
        user_notes=note_texts
    )
    
    # 3. Save to DB (Log it)
    # We might not have an essay_id yet if it's just a draft in the UI. 
    # So we'll save it as a standalone suggestion or linked if possible.
    # For now, create a record.
    db_suggestion = models.StorySuggestion(
        content=suggestion_content,
        source_type="ai_generated_api"
    )
    db.add(db_suggestion)
    db.commit()
    db.refresh(db_suggestion)
    
    return db_suggestion
