from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ComplaintBase(BaseModel):
    description: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintOut(ComplaintBase):
    id: int
    user_id: int
    address: Optional[str] = None
    image_path: Optional[str] = None
    status: str
    category: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None

class ComplaintRating(BaseModel):
    rating: int
    feedback: Optional[str] = None

