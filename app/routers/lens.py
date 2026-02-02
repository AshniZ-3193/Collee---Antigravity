from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/lens",
    tags=["lens"]
)

@router.get("/", response_model=List[schemas.PersonalLensNote])
def get_lens_notes(db: Session = Depends(get_db)):
    return db.query(models.PersonalLensNote).order_by(models.PersonalLensNote.created_at.desc()).all()

@router.post("/", response_model=schemas.PersonalLensNote)
def create_lens_note(note: schemas.PersonalLensNoteCreate, db: Session = Depends(get_db)):
    db_note = models.PersonalLensNote(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note
