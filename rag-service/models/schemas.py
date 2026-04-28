"""
Pydantic Models / Schemas
=========================
Request and response models for the RAG service API.

All models include validation and documentation for Swagger UI.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# =============================================================================
# ENUMS
# =============================================================================

class ResponseStyle(str, Enum):
    """Response style options for the AI tutor."""
    CONCISE = "concise"
    DETAILED = "detailed"


class ProcessingStatus(str, Enum):
    """Document processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# =============================================================================
# DOCUMENT MODELS
# =============================================================================

class DocumentMetadata(BaseModel):
    """Metadata for a processed document."""
    filename: str
    pages: int = Field(..., description="Number of pages in the document")
    characters: int = Field(..., description="Total character count")
    chunks: int = Field(..., description="Number of chunks created")
    has_text: bool = Field(default=True, description="Whether text was extractable")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class ProcessingStats(BaseModel):
    """Statistics from document processing."""
    total_files: int
    total_pages: int
    total_chunks: int
    total_characters: int
    processing_time_seconds: float
    empty_documents: int = Field(default=0, description="Documents with no extractable text")


class UploadResponse(BaseModel):
    """Response after uploading documents."""
    session_id: str
    files_received: int
    filenames: List[str]
    message: str


class ProcessRequest(BaseModel):
    """Request to process uploaded documents."""
    session_id: str = Field(..., min_length=36, max_length=36, description="UUID session identifier")


class ProcessResponse(BaseModel):
    """Response after processing documents."""
    session_id: str
    status: ProcessingStatus
    stats: ProcessingStats
    documents: List[DocumentMetadata]
    message: str
    warnings: List[str] = Field(default_factory=list, description="Any processing warnings")


# =============================================================================
# CHAT MODELS
# =============================================================================

class ChatRequest(BaseModel):
    """Request for asking a question."""
    session_id: str = Field(..., min_length=36, max_length=36)
    question: str = Field(
        ..., 
        min_length=1, 
        max_length=2000,
        description="Question to ask about the documents"
    )
    response_style: ResponseStyle = Field(
        default=ResponseStyle.CONCISE,
        description="concise for brief answers, detailed for comprehensive explanations"
    )
    
    @field_validator('question')
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        """Ensure question has meaningful content."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Question cannot be empty or whitespace only")
        return stripped


class SourceChunk(BaseModel):
    """A source chunk used in the answer."""
    source: str = Field(..., description="Filename")
    chunk_id: int
    content_preview: str = Field(..., description="First 300 chars of chunk")
    page_number: Optional[int] = Field(default=None, description="Page number if available")


class SourceDocument(BaseModel):
    """Grouped sources by document."""
    filename: str
    chunks_used: int
    chunks: List[SourceChunk]


class ChatResponse(BaseModel):
    """
    Response to a chat question.
    
    Contains the answer, source attribution, and metadata about
    how the answer was generated.
    """
    session_id: str
    question: str
    answer: str
    response_style: ResponseStyle
    sources: List[SourceDocument] = Field(
        ..., 
        description="Source documents and chunks used"
    )
    retrieved_chunks: int = Field(
        ..., 
        description="Number of unique chunks retrieved for context"
    )
    context_used: bool = Field(
        ..., 
        description="True if answer uses document context, False if info not found"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatHistoryItem(BaseModel):
    """Single item in chat history."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str
    timestamp: datetime


class ChatHistoryResponse(BaseModel):
    """Full chat history for a session."""
    session_id: str
    history: List[ChatHistoryItem]
    total_messages: int


# =============================================================================
# SESSION MODELS
# =============================================================================

class SessionInfo(BaseModel):
    """Information about an active session."""
    session_id: str
    created_at: datetime
    last_active: datetime
    documents_loaded: int
    total_chunks: int
    chat_messages: int
    is_ready: bool = Field(..., description="Whether documents are processed and ready for chat")


class SessionListResponse(BaseModel):
    """List of active sessions (for admin/debug)."""
    sessions: List[SessionInfo]
    total_sessions: int


class DeleteSessionResponse(BaseModel):
    """Response after deleting a session."""
    session_id: str
    message: str
    deleted: bool


# =============================================================================
# ERROR MODELS
# =============================================================================

class ErrorResponse(BaseModel):
    """Standard error response format."""
    detail: str = Field(..., description="Human-readable error message")
    error_code: Optional[str] = Field(default=None, description="Error code for programmatic handling")
    session_id: Optional[str] = Field(default=None, description="Session ID if applicable")
