"""
RAG Service - AI Tutor Microservice
====================================
FastAPI-based microservice for PDF-based question answering with source attribution.
Follows the same architecture as Interview and Exam platforms.

Features:
- PDF upload and processing with page-level metadata
- Conversational RAG with source attribution
- Session-based architecture with automatic cleanup
- Structured logging for debugging
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
import os

from config.settings import settings
from routers import document_router, chat_router
from services.embedding_service import embedding_service
from utils.session_manager import session_manager

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for the FastAPI app.
    
    Startup:
    - Preloads the embedding model to avoid first-request latency
    - Validates configuration
    
    Shutdown:
    - Cleans up expired sessions
    """
    # =========== STARTUP ===========
    logger.info("=" * 60)
    logger.info("RAG SERVICE STARTING UP")
    logger.info("=" * 60)
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"LLM Model: {settings.LLM_MODEL}")
    logger.info(f"Embedding Model: {settings.EMBEDDING_MODEL}")
    
    # Validate API key
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set! LLM features will fail.")
    
    # Preload embedding model (avoids cold start on first request)
    logger.info("Preloading embedding model...")
    if embedding_service.preload_model():
        logger.info("Embedding model preloaded successfully")
    else:
        logger.warning("Failed to preload embedding model - will load on first use")
    
    logger.info("RAG Service ready to accept requests")
    logger.info("=" * 60)
    
    yield  # App runs here
    
    # =========== SHUTDOWN ===========
    logger.info("=" * 60)
    logger.info("RAG SERVICE SHUTTING DOWN")
    logger.info("=" * 60)
    
    # Cleanup expired sessions
    expired_count = session_manager.cleanup_expired_sessions()
    if expired_count > 0:
        logger.info(f"Cleaned up {expired_count} expired sessions")
    
    logger.info("RAG Service shutdown complete")


app = FastAPI(
    title="RAG AI Tutor Service",
    description="PDF-based question answering microservice with source attribution",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - matches other services
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(document_router.router, prefix="/documents", tags=["Documents"])
app.include_router(chat_router.router, prefix="/chat", tags=["Chat"])

# Serve static files (frontend)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", tags=["Health"])
async def root():
    """Serve the chat UI or return health check"""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "service": "RAG AI Tutor",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "llm_model": settings.LLM_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )
