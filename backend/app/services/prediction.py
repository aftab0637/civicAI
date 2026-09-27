import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sklearn.cluster import DBSCAN
from sklearn.linear_model import LinearRegression

from app.models.complaint import Complaint

def get_accident_hotspots(db: Session) -> List[Dict[str, Any]]:
    """
    Finds geographic clusters of accidents/hazards using DBSCAN.
    """
    # Query all complaints related to accidents or safety hazards
    complaints = db.query(Complaint).filter(
        Complaint.latitude.isnot(None),
        Complaint.longitude.isnot(None)
    ).all()
    
    if not complaints:
        return []
        
    data = []
    for c in complaints:
        # Check description or category for accident/hazard markers
        is_accident = False
        desc_lower = c.description.lower()
        if c.category == "Public Safety & Hazards" or any(kw in desc_lower for kw in ["accident", "crash", "collision", "hazard", "wreck"]):
            is_accident = True
            
        data.append({
            "id": c.id,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "description": c.description,
            "is_accident": is_accident
        })
        
    df = pd.DataFrame(data)
    if df.empty:
        return []
        
    # We prioritize clustering actual accidents, but fallback to general hazards if needed
    accident_df = df[df["is_accident"] == True]
    if len(accident_df) < 2:
        # If too few actual accidents, use all complaints to show density grouping
        accident_df = df
        
    if len(accident_df) < 2:
        # Single point cannot cluster, return as individual hotspot
        return [{
            "center": {"lat": row["latitude"], "lng": row["longitude"]},
            "count": 1,
            "severity": "MEDIUM",
            "complaint_ids": [int(row["id"])],
            "description": f"Isolated incident reported: {row['description'][:50]}..."
        } for _, row in accident_df.iterrows()]
        
    # Convert lat/lng coordinates to radians for DBSCAN metric='haversine'
    coords = np.radians(accident_df[["latitude", "longitude"]].values)
    
    # Earth's radius in km is ~6371. Max distance (eps) is 0.5km.
    kms_per_radian = 6371.0088
    epsilon = 0.5 / kms_per_radian
    
    dbscan = DBSCAN(eps=epsilon, min_samples=2, metric='haversine')
    labels = dbscan.fit_predict(coords)
    
    accident_df = accident_df.copy()
    accident_df["cluster"] = labels
    
    hotspots = []
    # Process clustered points (label >= 0)
    grouped = accident_df[accident_df["cluster"] >= 0].groupby("cluster")
    for cluster_id, group in grouped:
        center_lat = float(group["latitude"].mean())
        center_lng = float(group["longitude"].mean())
        count = len(group)
        severity = "CRITICAL" if count >= 5 else "HIGH"
        
        hotspots.append({
            "center": {"lat": center_lat, "lng": center_lng},
            "count": count,
            "severity": severity,
            "complaint_ids": [int(id_) for id_ in group["id"].tolist()],
            "description": f"Cluster of {count} public safety incidents."
        })
        
    # Add noise points as low-severity isolated hotspots
    noise_points = accident_df[accident_df["cluster"] == -1]
    for _, row in noise_points.iterrows():
        hotspots.append({
            "center": {"lat": float(row["latitude"]), "lng": float(row["longitude"])},
            "count": 1,
            "severity": "LOW",
            "complaint_ids": [int(row["id"])],
            "description": f"Isolated hazard: {row['description'][:50]}..."
        })
        
    return hotspots

def get_complaint_forecast(db: Session) -> Dict[str, Any]:
    """
    Forecasts weekly complaint volume for the next 4 weeks using Linear Regression.
    """
    complaints = db.query(Complaint.created_at).all()
    
    # Fallback/Dummy data if database is empty or has too few entries
    if len(complaints) < 5:
        # Generate generic baseline trend
        base_date = datetime.now(timezone.utc)
        historical = []
        for i in range(4, 0, -1):
            date = base_date - timedelta(weeks=i)
            historical.append({"date": date.strftime("%Y-%m-%d"), "count": 10 + i * 2})
            
        forecast = []
        for i in range(1, 5):
            date = base_date + timedelta(weeks=i)
            forecast.append({"date": date.strftime("%Y-%m-%d"), "count": 18 + i * 2})
            
        return {"historical": historical, "forecast": forecast}
        
    # Load into pandas and process
    dates = [c.created_at.date() for c in complaints]
    df = pd.DataFrame({"date": pd.to_datetime(dates)})
    df["count"] = 1
    
    # Resample by week
    weekly = df.resample("W", on="date").sum().reset_index()
    
    if len(weekly) < 2:
        # Fallback if all complaints fall within a single week
        base_date = weekly["date"].iloc[0]
        historical = [{"date": base_date.strftime("%Y-%m-%d"), "count": int(weekly["count"].iloc[0])}]
        forecast = [{"date": (base_date + timedelta(weeks=i)).strftime("%Y-%m-%d"), "count": int(weekly["count"].iloc[0] + i)} for i in range(1, 5)]
        return {"historical": historical, "forecast": forecast}
        
    # Fit Linear Regression
    X = np.array(weekly.index).reshape(-1, 1)
    y = weekly["count"].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict next 4 weeks
    last_idx = weekly.index[-1]
    next_indices = np.array([last_idx + i for i in range(1, 5)]).reshape(-1, 1)
    predictions = model.predict(next_indices)
    predictions = np.clip(predictions, 0, None)  # Ensure no negative predictions
    
    historical = []
    for _, row in weekly.iterrows():
        historical.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "count": int(row["count"])
        })
        
    forecast = []
    last_date = weekly["date"].iloc[-1]
    for i, pred in enumerate(predictions):
        future_date = last_date + timedelta(weeks=i+1)
        forecast.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "count": int(round(pred))
        })
        
    return {"historical": historical, "forecast": forecast}

def get_disaster_risk_index(db: Session) -> List[Dict[str, Any]]:
    """
    Computes a risk index map based on density of high-hazard complaints.
    """
    complaints = db.query(Complaint).filter(
        Complaint.latitude.isnot(None),
        Complaint.longitude.isnot(None)
    ).all()
    
    if not complaints:
        return []
        
    risk_list = []
    for c in complaints:
        # Determine base risk based on severity
        base_score = 0.2
        if c.severity == "CRITICAL":
            base_score = 0.9
        elif c.severity == "HIGH":
            base_score = 0.6
        elif c.severity == "MEDIUM":
            base_score = 0.4
            
        # Boost risk score if related to fire/floods/structural damage
        desc = c.description.lower()
        if any(kw in desc for kw in ["flood", "waterlogging", "inundation"]):
            base_score = min(1.0, base_score + 0.1)
        if any(kw in desc for kw in ["fire", "smoke", "spark", "explosion"]):
            base_score = min(1.0, base_score + 0.15)
            
        risk_list.append({
            "lat": c.latitude,
            "lng": c.longitude,
            "risk_score": base_score,
            "category": c.category or "General",
            "description": c.description[:60]
        })
        
    return risk_list

def get_decision_recommendations(db: Session) -> List[Dict[str, Any]]:
    """
    Translates prediction insights into concrete municipal actions.
    """
    complaints = db.query(Complaint).all()
    
    recommendations = []
    
    # 1. Analyze Garbage / Sanitation Issues
    garbage_reports = [c for c in complaints if c.category == "Waste Management & Sanitation" and c.status != "RESOLVED"]
    if len(garbage_reports) >= 3:
        recommendations.append({
            "id": "rec_waste_01",
            "title": "Increase Waste Collection Frequency",
            "description": f"AI detected {len(garbage_reports)} active waste overflow filings. Recommend increasing waste truck dispatches to these sectors by 50%.",
            "department": "Waste Management & Sanitation",
            "priority": "HIGH",
            "impact": "Reduces public sanitation hazard and odor issues."
        })
        
    # 2. Analyze Accident Hotspots
    hotspots = get_accident_hotspots(db)
    high_density_hotspots = [h for h in hotspots if h["count"] >= 3]
    if high_density_hotspots:
        recommendations.append({
            "id": "rec_safety_01",
            "title": "Traffic Control & Patrol Deployment",
            "description": f"AI identified {len(high_density_hotspots)} high-density accident hotspot clusters. Recommend deploying safety patrols and installing speed reduction signs.",
            "department": "Public Safety & Hazards",
            "priority": "CRITICAL",
            "impact": "Decreases accident probability at recurring collision coordinates."
        })
        
    # 3. Analyze Utilities Leakages
    utility_reports = [c for c in complaints if c.category == "Utilities & Lighting" and c.status != "RESOLVED"]
    water_leaks = [c for c in utility_reports if any(kw in c.description.lower() for kw in ["leak", "water", "pipe", "burst"])]
    if len(water_leaks) >= 2:
        recommendations.append({
            "id": "rec_utility_01",
            "title": "Inspect Utility Pipelines",
            "description": f"AI grouped {len(water_leaks)} active water pipe leakage complaints. Recommend immediate valve inspection to avoid road erosion.",
            "department": "Utilities & Lighting",
            "priority": "MEDIUM",
            "impact": "Conserves city clean water and protects adjacent road infrastructure."
        })
        
    # 4. General forecasting suggestion
    forecast = get_complaint_forecast(db)
    hist_avg = np.mean([h["count"] for h in forecast["historical"]]) if forecast["historical"] else 0
    fore_avg = np.mean([f["count"] for f in forecast["forecast"]]) if forecast["forecast"] else 0
    
    if fore_avg > hist_avg * 1.15:
        recommendations.append({
            "id": "rec_staff_01",
            "title": "Staffing Alert: High Ticket Forecast",
            "description": "Weekly forecasting model projects a significant increase in complaint tickets. Recommend putting emergency dispatch teams on standby.",
            "department": "Administration",
            "priority": "HIGH",
            "impact": "Maintains resolution SLA times during high-volume periods."
        })
        
    # Baseline fallback recommendation if no data triggers are met
    if not recommendations:
        recommendations.append({
            "id": "rec_base_01",
            "title": "Regular Infrastructure Diagnostics",
            "description": "Overall city systems showing normal incident ratios. Recommend performing scheduled preventive inspections on public lights.",
            "department": "Roads & Infrastructure",
            "priority": "LOW",
            "impact": "Ensures city utility systems remain stable."
        })
        
    return recommendations
