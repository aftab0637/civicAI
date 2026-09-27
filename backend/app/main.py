import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import auth, users, complaints, predictions

app = FastAPI(
    title="CivicAI API",
    description="Backend API for CivicAI - Smart Citizen Analytics & Disaster Response Platform",
    version="1.0.0"
)

# CORS middleware configuration
# Allow React frontend (default http://localhost:5173 or other local hosts) to make API requests
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount the static uploads directory to serve images at /uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(complaints.router)
app.include_router(predictions.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to CivicAI API!",
        "status": "Running",
        "docs_url": "/docs"
    }
