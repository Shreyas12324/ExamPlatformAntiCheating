"""
Configuration Management
Loads environment variables and provides application settings
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv


load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # LLM Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    

    # ML Service Configuration
    ML_SERVICE_URL: str = os.getenv("ML_SERVICE_URL", "http://localhost:8001")

    # Server Configuration
    PORT: int = int(os.getenv("PORT", "8005"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Interview Configuration
    MAX_QUESTIONS: int = int(os.getenv("MAX_QUESTIONS", "7"))
    MIN_QUESTIONS: int = int(os.getenv("MIN_QUESTIONS", "5"))

    # Cheating Detection Configuration
    CHEATING_CHECK_INTERVAL: int = int(
        os.getenv("CHEATING_CHECK_INTERVAL", "3")
    )  # seconds

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Validation
def validate_settings():
    """Validate critical settings"""
    errors = []

    if settings.LLM_PROVIDER == "groq" and not settings.GROQ_API_KEY:
        errors.append("GROQ_API_KEY is required when LLM_PROVIDER is 'groq'")

    if not settings.ML_SERVICE_URL:
        errors.append("ML_SERVICE_URL is required")

    if errors:
        raise ValueError(f"Configuration errors:\n" + "\n".join(errors))

    return True


# Running validation on import
try:
    validate_settings()
    print("Configuration validated successfully")
except ValueError as e:
    print(f"Configuration warning: {e}")
