from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/onboarding",
    tags=["onboarding"]
)

@router.get("/user", response_model=schemas.User)
def get_user_profile(db: Session = Depends(get_db)):
    # Simple MVP: Assumes single user with ID 1
    user = db.query(models.User).filter(models.User.id == 1).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/user", response_model=schemas.User)
def create_or_update_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == 1).first()
    if not user:
        user = models.User(id=1, **user_data.dict())
        db.add(user)
    else:
        for key, value in user_data.dict().items():
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user
