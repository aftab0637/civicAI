import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintOut, ComplaintUpdate
from app.services.auth import get_current_user
from app.services.ml import analyze_issue

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(
    description: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_path = None
    target_path = None
    if image:
        # Basic check to verify if the file has content and correct extension
        ext = os.path.splitext(image.filename)[1].lower() if image.filename else ""
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP, GIF."
            )
        
        # Ensure upload folder exists
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
            
        file_name = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(UPLOAD_DIR, file_name)
        
        try:
            with open(target_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_path = f"uploads/{file_name}"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save image: {str(e)}"
            )

    ml_results = analyze_issue(description, image_path=target_path)

    new_complaint = Complaint(
        user_id=current_user.id,
        description=description,
        image_path=image_path,
        latitude=latitude,
        longitude=longitude,
        status="PENDING",
        category=ml_results["predicted_category"],
        severity=ml_results["predicted_severity"]
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@router.get("/my", response_model=List[ComplaintOut])
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).filter(Complaint.user_id == current_user.id).order_by(Complaint.created_at.desc()).all()
    return complaints

@router.get("", response_model=List[ComplaintOut])
def get_all_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privilege required."
        )
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return complaints

@router.get("/{id}", response_model=ComplaintOut)
def get_complaint_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    if current_user.role != "ADMIN" and complaint.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this complaint."
        )
    return complaint

@router.put("/{id}", response_model=ComplaintOut)

def update_complaint(
    id: int,
    complaint_data: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privilege required."
        )
    
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    if complaint_data.status is not None:
        complaint.status = complaint_data.status
    if complaint_data.severity is not None:
        complaint.severity = complaint_data.severity
    if complaint_data.assigned_to is not None:
        complaint.assigned_to = complaint_data.assigned_to
    if complaint_data.admin_notes is not None:
        complaint.admin_notes = complaint_data.admin_notes
        
    db.commit()
    db.refresh(complaint)
    return complaint
