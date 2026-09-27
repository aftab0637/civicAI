from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.connection import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.prediction import (
    get_accident_hotspots,
    get_complaint_forecast,
    get_disaster_risk_index,
    get_decision_recommendations
)

router = APIRouter(prefix="/api/predictions", tags=["Predictive Analytics"])

# Help check: ensures that only admin accounts can access predictions
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin credentials required."
        )
    return current_user

@router.get("/hotspots", response_model=List[Dict[str, Any]])
def hotspots_endpoint(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Exposes coordinates of accident density clusters.
    """
    try:
        return get_accident_hotspots(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotspots calculation failed: {str(e)}"
        )

@router.get("/forecast", response_model=Dict[str, Any])
def forecast_endpoint(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Exposes weekly historical data and future predictions.
    """
    try:
        return get_complaint_forecast(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Volume forecasting failed: {str(e)}"
        )

@router.get("/disaster-risk", response_model=List[Dict[str, Any]])
def disaster_risk_endpoint(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Exposes coordinates mapped to emergency risk values.
    """
    try:
        return get_disaster_risk_index(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disaster risk assessment failed: {str(e)}"
        )

@router.get("/recommendations", response_model=List[Dict[str, Any]])
def recommendations_endpoint(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Exposes AI decision recommendations for resource dispatch and staff allocation.
    """
    try:
        return get_decision_recommendations(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendations generation failed: {str(e)}"
        )
