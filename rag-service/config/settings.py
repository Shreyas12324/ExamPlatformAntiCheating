"""
Configuration Settings
======================
Centralized configuration management using environment variables.
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Provides defaults for development, override via .env in production.
    """
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8002  # Different port from other services (exam: 5000, interview: 8005, ml: 8001)
    ENVIRONMENT: str = "development"
    
    # CORS - Frontend origins allowed to access this service
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative frontend
        "http://127.0.0.1:5173",
    ]
    
    # LLM Configuration (Groq)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    LLM_MODEL: str = "llama-3.1-8b-instant"
    LLM_TEMPERATURE: float = 0.7
    
    # Embedding Configuration
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Chunking Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Retrieval Configuration
    RETRIEVAL_TOP_K: int = 4  # Number of chunks to retrieve per query
    
    # Question Configuration
    MAX_QUESTION_LENGTH: int = 2000  # Maximum characters for user questions
    
    # Session Configuration
    SESSION_TIMEOUT_MINUTES: int = 60  # Auto-cleanup inactive sessions
    MAX_SESSIONS: int = 100  # Maximum concurrent sessions
    
    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
