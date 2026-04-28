"""
Chat Router
===========
API endpoints for asking questions and managing chat history.

Features:
- Session validation before chat
- Response style switching (concise/detailed)
- Source attribution with page numbers
- Chat history management
"""

import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException

from models.schemas import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ChatHistoryItem,
    SourceDocument,
    SourceChunk,
    ResponseStyle,
)
from utils.session_manager import session_manager
from services.rag_chain import rag_chain_service
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest):
    """
    Ask a question about the uploaded documents.
    
    Requirements:
    - Session must exist and have processed documents
    - Question must be 1-2000 characters
    
    Returns answer with source attribution and context usage indicator.
    """
    # Validate session exists
    session = session_manager.get_session(request.session_id)
    
    if not session:
        logger.warning(f"CHAT: Invalid session ID: {request.session_id}")
        raise HTTPException(
            status_code=404, 
            detail="Session not found. Please upload documents first."
        )
    
    # Validate documents are processed
    if not session.is_ready():
        logger.warning(f"CHAT: Session {request.session_id} not ready for chat")
        raise HTTPException(
            status_code=400,
            detail="Documents not processed yet. Call /documents/process first."
        )
    
    response_style = request.response_style.value
    
    # Build or rebuild chain if needed (style changed or first query)
    if (session.conversation_chain is None or 
        session.current_response_style != response_style):
        
        logger.info(f"CHAT: Building chain for session {request.session_id[:8]}... with '{response_style}' style")
        try:
            session.conversation_chain = rag_chain_service.build_chain(
                session.vectorstore,
                response_style
            )
            session.current_response_style = response_style
        except ValueError as e:
            logger.error(f"CHAT: Failed to build chain: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Ask the question
    question_preview = request.question[:80] + "..." if len(request.question) > 80 else request.question
    logger.info(f"CHAT: Session {request.session_id[:8]}... | Q: {question_preview}")
    
    result = rag_chain_service.ask_question(
        session.conversation_chain,
        request.question
    )
    
    # Check for LLM errors
    if not result.get("success", True):
        logger.error(f"CHAT: RAG chain error for session {request.session_id[:8]}...")
    
    # Store in chat history
    session.add_chat_message("user", request.question)
    session.add_chat_message("assistant", result["answer"])
    
    # Format sources for response (with optional page numbers)
    sources = []
    for src in result.get("sources", []):
        chunks = []
        for chunk in src.get("chunks", []):
            chunk_data = SourceChunk(
                source=src["filename"],
                chunk_id=chunk["chunk_id"],
                content_preview=chunk["content_preview"],
                page_number=chunk.get("page_number")  # May be None
            )
            chunks.append(chunk_data)
        
        sources.append(SourceDocument(
            filename=src["filename"],
            chunks_used=src["chunks_used"],
            chunks=chunks
        ))
    
    logger.info(
        f"CHAT: Response generated | chunks={result.get('retrieved_chunks', 0)} | "
        f"context_used={result.get('context_used', True)} | "
        f"answer_len={len(result['answer'])}"
    )
    
    return ChatResponse(
        session_id=request.session_id,
        question=request.question,
        answer=result["answer"],
        response_style=request.response_style,
        sources=sources,
        retrieved_chunks=result.get("retrieved_chunks", len(sources)),
        context_used=result.get("context_used", True),
        timestamp=datetime.utcnow()
    )


@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    """
    Get the full chat history for a session.
    """
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = [
        ChatHistoryItem(
            role=msg["role"],
            content=msg["content"],
            timestamp=msg["timestamp"]
        )
        for msg in session.chat_history
    ]
    
    return ChatHistoryResponse(
        session_id=session_id,
        history=history,
        total_messages=len(history)
    )


@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str):
    """
    Clear chat history for a session (but keep documents).
    Rebuilds the conversation chain to reset memory.
    """
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Clear chat history
    session.chat_history = []
    
    # Rebuild chain to reset LangChain memory
    if session.is_ready():
        session.conversation_chain = rag_chain_service.build_chain(
            session.vectorstore,
            session.current_response_style
        )
    
    logger.info(f"Session {session_id}: Chat history cleared")
    
    return {
        "session_id": session_id,
        "message": "Chat history cleared successfully"
    }
