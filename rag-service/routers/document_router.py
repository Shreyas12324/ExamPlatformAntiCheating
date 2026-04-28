"""
Document Router
===============
API endpoints for document upload and processing.

Features:
- PDF upload with size and type validation
- Document processing with empty PDF detection
- Session management endpoints
- Structured logging for debugging
"""

import time
import logging
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from datetime import datetime

from models.schemas import (
    UploadResponse,
    ProcessRequest,
    ProcessResponse,
    ProcessingStatus,
    ProcessingStats,
    DocumentMetadata,
    SessionInfo,
    SessionListResponse,
    DeleteSessionResponse,
)
from utils.session_manager import session_manager, is_valid_session_id
from services.pdf_service import pdf_service
from services.chunking_service import chunking_service
from services.embedding_service import embedding_service
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_documents(
    files: List[UploadFile] = File(..., description="PDF files to upload")
):
    """
    Upload PDF documents for processing.
    
    Creates a new session and stores the uploaded files.
    Files are validated for:
    - PDF extension
    - Maximum file size
    
    Returns a session_id to use for processing and chat.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    logger.info(f"UPLOAD: Received {len(files)} file(s)")
    
    # Validate files
    filenames = []
    total_size_mb = 0
    
    for file in files:
        # Check extension
        if not file.filename.lower().endswith(".pdf"):
            logger.warning(f"UPLOAD: Rejected non-PDF file: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.filename}. Only PDF files are allowed."
            )
        
        # Check file size (read content to check)
        content = await file.read()
        size_mb = len(content) / (1024 * 1024)
        total_size_mb += size_mb
        
        if size_mb > settings.MAX_FILE_SIZE_MB:
            logger.warning(f"UPLOAD: File too large: {file.filename} ({size_mb:.1f}MB)")
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB"
            )
        
        # Reset file position for later reading
        await file.seek(0)
        filenames.append(file.filename)
        
        logger.debug(f"UPLOAD: Validated {file.filename} ({size_mb:.2f}MB)")
    
    # Create new session
    session_id = session_manager.create_session()
    session = session_manager.get_session(session_id)
    
    if not session:
        logger.error("UPLOAD: Failed to create session")
        raise HTTPException(status_code=500, detail="Failed to create session")
    
    # Store uploaded files in session
    for file in files:
        content = await file.read()
        session.add_uploaded_file(file.filename, content)
    
    logger.info(f"UPLOAD: Session {session_id[:8]}... | {len(files)} files | {total_size_mb:.1f}MB total")
    
    return UploadResponse(
        session_id=session_id,
        files_received=len(files),
        filenames=filenames,
        message="Files uploaded successfully. Call /documents/process to process them."
    )


@router.post("/process", response_model=ProcessResponse)
async def process_documents(request: ProcessRequest):
    """
    Process uploaded documents: extract text, create chunks, build vector store.
    
    This must be called after uploading documents and before chatting.
    
    Handles:
    - Empty/scanned PDFs with no extractable text
    - Large documents with efficient chunking
    - Detailed progress logging
    """
    # Validate session ID format
    if not is_valid_session_id(request.session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    
    session = session_manager.get_session(request.session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    if not session.uploaded_files:
        raise HTTPException(
            status_code=400,
            detail="No files to process. Upload files first."
        )
    
    if session.is_processed:
        raise HTTPException(
            status_code=400,
            detail="Documents already processed. Create a new session to process new documents."
        )
    
    start_time = time.time()
    warnings: List[str] = []
    
    logger.info(f"PROCESS: Starting for session {request.session_id[:8]}... ({len(session.uploaded_files)} files)")
    
    try:
        # Step 1: Extract text from PDFs
        logger.info(f"PROCESS: Step 1/3 - Extracting text from PDFs...")
        documents = pdf_service.extract_multiple(session.uploaded_files)
        
        if not documents:
            raise HTTPException(
                status_code=400,
                detail="Failed to extract text from any documents. Files may be corrupted."
            )
        
        # Check for documents without extractable text (scanned PDFs)
        docs_with_text = [d for d in documents if d.get("has_text", True)]
        empty_docs = [d for d in documents if not d.get("has_text", True)]
        
        if empty_docs:
            empty_names = [d["filename"] for d in empty_docs]
            warnings.append(f"No extractable text in: {', '.join(empty_names)} (may be scanned/image PDFs)")
            logger.warning(f"PROCESS: {len(empty_docs)} documents have no extractable text")
        
        if not docs_with_text:
            raise HTTPException(
                status_code=400,
                detail="None of the uploaded documents contain extractable text. They may be scanned images. Please upload searchable PDFs."
            )
        
        # Step 2: Create chunks (only for documents with text)
        logger.info(f"PROCESS: Step 2/3 - Chunking {len(docs_with_text)} documents...")
        chunks, metadata = chunking_service.chunk_documents(documents)
        
        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No text chunks created from documents. Documents may be empty."
            )
        
        # Step 3: Create vector store
        logger.info(f"PROCESS: Step 3/3 - Creating vector store with {len(chunks)} chunks...")
        vectorstore = embedding_service.create_vectorstore(chunks, metadata)
        
        # Store results in session
        session.vectorstore = vectorstore
        session.documents = [
            {
                "filename": doc["filename"],
                "pages": doc.get("page_count", doc.get("pages", 0)),
                "characters": doc["characters"],
                "chunks": sum(1 for m in metadata if m["source"] == doc["filename"]),
                "has_text": doc.get("has_text", True)
            }
            for doc in documents
        ]
        
        processing_time = round(time.time() - start_time, 2)
        
        session.stats = {
            "total_files": len(documents),
            "total_pages": sum(doc.get("page_count", doc.get("pages", 0)) for doc in documents),
            "total_chunks": len(chunks),
            "total_characters": sum(doc["characters"] for doc in documents),
            "processing_time_seconds": processing_time,
            "empty_documents": len(empty_docs)
        }
        
        session.is_processed = True
        
        # Clear uploaded files to free memory (we have vectorstore now)
        session.uploaded_files = []
        
        logger.info(
            f"PROCESS: Complete for session {request.session_id[:8]}... | "
            f"{len(chunks)} chunks | {processing_time}s"
        )
        
        return ProcessResponse(
            session_id=request.session_id,
            status=ProcessingStatus.COMPLETED,
            stats=ProcessingStats(**session.stats),
            documents=[
                DocumentMetadata(
                    filename=doc["filename"],
                    pages=doc["pages"],
                    characters=doc["characters"],
                    chunks=doc["chunks"],
                    has_text=doc.get("has_text", True)
                )
                for doc in session.documents
            ],
            message="Documents processed successfully. You can now use /chat/ask to ask questions.",
            warnings=warnings
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PROCESS: Failed for session {request.session_id[:8]}... - {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions():
    """
    List all active sessions (for admin/debugging).
    """
    sessions = session_manager.list_sessions()
    
    return SessionListResponse(
        sessions=[SessionInfo(**s) for s in sessions],
        total_sessions=len(sessions)
    )


@router.get("/sessions/{session_id}", response_model=SessionInfo)
async def get_session_info(session_id: str):
    """
    Get information about a specific session.
    """
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionInfo(**session.get_info())


@router.delete("/sessions/{session_id}", response_model=DeleteSessionResponse)
async def delete_session(session_id: str):
    """
    Delete a session and free its resources.
    """
    deleted = session_manager.delete_session(session_id)
    
    return DeleteSessionResponse(
        session_id=session_id,
        deleted=deleted,
        message="Session deleted successfully" if deleted else "Session not found"
    )


@router.post("/cleanup")
async def cleanup_expired_sessions():
    """
    Clean up expired sessions (can be called periodically or via cron).
    """
    count = session_manager.cleanup_expired_sessions()
    
    return {
        "message": f"Cleaned up {count} expired sessions",
        "sessions_removed": count
    }
