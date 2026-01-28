"""
CobranzasPro Backend - Main Application
Refactored with Layered Architecture (MVC Pattern)

New Structure:
- app/api/ - API endpoints (routers)
- app/services/ - Business logic
- app/repositories/ - Data access
- app/schemas.py - DTOs (Pydantic models)
- app/config.py - Configuration
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv(dotenv_path="../.env")
load_dotenv()  # Fallback to current directory

# Import app components
from app.config import get_settings
from app.api import dashboard, clients, crm, portal, admin

# Initialize settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="Collection Management API with Layered Architecture"
)

# === CORS Configuration ===
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Include Routers ===
app.include_router(dashboard.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(crm.router, prefix="/api")
app.include_router(portal.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# === Health Check ===
@app.get("/health", tags=["health"])
def health_check():
    """
    Health check endpoint
    
    Returns:
        Status and service information
    """
    return {
        "status": "ok",
        "service": settings.api_title,
        "version": settings.api_version
    }

# === Root Endpoint ===
@app.get("/", tags=["root"])
def root():
    """
    Root endpoint with API information
    
    Returns:
        API welcome message and documentation link
    """
    return {
        "message": "CobranzasPro API",
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
