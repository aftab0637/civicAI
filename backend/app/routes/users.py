from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from app.database.connection import get_db
from app.schemas.user import UserOut
from app.models.user import User
from app.services.auth import get_current_user, get_password_hash, verify_password

router = APIRouter(prefix="/api/users", tags=["Users"])

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    old_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=6, max_length=50)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.name is not None:
        current_user.name = update_data.name
        
    if update_data.new_password is not None:
        if not update_data.old_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Old password is required to update password."
              )
        if not verify_password(update_data.old_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect old password."
            )
        current_user.password = get_password_hash(update_data.new_password)
        
    db.commit()
    db.refresh(current_user)
    return current_user
