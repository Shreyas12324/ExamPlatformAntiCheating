"""
FastAPI Main Application for Interview Service
Provides conversational interview with anti-cheating integration
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import interview_router, cheating_router
from utils.config import settings
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Interview Practice Partner API",
    description="Conversational AI Interview Simulator with Anti-Cheating Integration",
    version="1.0.0",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interview_router.router, prefix="/interview", tags=["Interview"])
app.include_router(
    cheating_router.router, prefix="/cheating", tags=["Cheating Detection"]
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Interview Practice Partner API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "llm_provider": settings.LLM_PROVIDER,
        "ml_service_url": settings.ML_SERVICE_URL,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
