"""
Session Manager
===============
Manages in-memory session state for RAG conversations.
Similar to the interview-service's active_interviews pattern.

Features:
- Thread-safe singleton session manager
- Automatic session timeout and cleanup
- Session validation helpers
- Memory leak prevention

In production, consider using Redis for distributed session management.
"""

import uuid
import re
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List, Tuple
from threading import Lock
import gc

from config.settings import settings

logger = logging.getLogger(__name__)

# UUID validation pattern
UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE
)


def is_valid_session_id(session_id: str) -> bool:
    """
    Validate that a session ID is a properly formatted UUID.
    
    Args:
        session_id: The session ID to validate
        
    Returns:
        bool: True if valid UUID format
    """
    if not session_id or not isinstance(session_id, str):
        return False
    return bool(UUID_PATTERN.match(session_id))


class SessionState:
    """
    Represents the state of a single RAG session.
    
    Holds uploaded files, vectorstore, conversation chain, and history.
    Implements proper cleanup to prevent memory leaks.
    """
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = datetime.utcnow()
        self.last_active = datetime.utcnow()
        
        # Document storage (before processing)
        self.uploaded_files: List[Dict[str, Any]] = []  # [{filename, content_bytes}]
        
        # Processed document metadata
        self.documents: List[Dict[str, Any]] = []  # [{filename, pages, characters, chunks}]
        
        # Vector store and chain (set after processing)
        self.vectorstore = None
        self.conversation_chain = None
        self.current_response_style: str = "concise"
        
        # Chat history for display
        self.chat_history: List[Dict[str, Any]] = []
        
        # Processing stats
        self.stats: Optional[Dict[str, Any]] = None
        self.is_processed: bool = False
        
        logger.debug(f"SessionState created: {session_id}")
    
    def update_activity(self) -> None:
        """Update last active timestamp."""
        self.last_active = datetime.utcnow()
    
    def add_uploaded_file(self, filename: str, content: bytes) -> None:
        """
        Add an uploaded file to the session.
        
        Args:
            filename: Original filename
            content: File content as bytes
        """
        self.uploaded_files.append({
            "filename": filename,
            "content": content
        })
        self.update_activity()
        logger.debug(f"Session {self.session_id[:8]}...: Added file {filename}")
    
    def add_chat_message(self, role: str, content: str) -> None:
        """
        Add a message to chat history.
        
        Args:
            role: "user" or "assistant"
            content: Message content
        """
        self.chat_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow()
        })
        self.update_activity()
    
    def is_ready(self) -> bool:
        """Check if session is ready for chat (documents processed)."""
        return self.is_processed and self.vectorstore is not None
    
    def is_expired(self, timeout_minutes: int) -> bool:
        """
        Check if session has expired based on last activity.
        
        Args:
            timeout_minutes: Number of minutes of inactivity before expiration
            
        Returns:
            bool: True if session is expired
        """
        timeout = timedelta(minutes=timeout_minutes)
        return datetime.utcnow() - self.last_active > timeout
    
    def get_info(self) -> Dict[str, Any]:
        """Get session info for API response."""
        return {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "last_active": self.last_active,
            "documents_loaded": len(self.documents),
            "total_chunks": self.stats.get("total_chunks", 0) if self.stats else 0,
            "chat_messages": len(self.chat_history),
            "is_ready": self.is_ready()
        }
    
    def cleanup(self) -> None:
        """
        Release resources held by this session.
        Call before deleting the session to prevent memory leaks.
        """
        self.vectorstore = None
        self.conversation_chain = None
        self.uploaded_files = []
        self.chat_history = []
        logger.debug(f"Session {self.session_id[:8]}...: Resources cleaned up")


class SessionManager:
    """
    Manages all active RAG sessions.
    
    Thread-safe singleton implementation with automatic cleanup
    and session validation helpers.
    """
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        """Singleton pattern - ensures one session manager across the app."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._sessions: Dict[str, SessionState] = {}
        self._session_lock = Lock()
        self._initialized = True
        logger.info("SESSION MANAGER: Initialized")
    
    def create_session(self) -> str:
        """
        Create a new session and return its ID.
        
        Automatically cleans up oldest sessions if at capacity.
        
        Returns:
            str: UUID session identifier
        """
        session_id = str(uuid.uuid4())
        
        with self._session_lock:
            # Cleanup old sessions if at capacity
            if len(self._sessions) >= settings.MAX_SESSIONS:
                logger.warning(f"SESSION MANAGER: At capacity ({settings.MAX_SESSIONS}), cleaning up")
                self._cleanup_oldest_sessions()
            
            self._sessions[session_id] = SessionState(session_id)
        
        logger.info(f"SESSION MANAGER: Created session {session_id[:8]}...")
        return session_id
    
    def get_session(self, session_id: str) -> Optional[SessionState]:
        """
        Get a session by ID.
        
        Validates the session ID format and updates activity timestamp.
        
        Args:
            session_id: UUID session identifier
            
        Returns:
            SessionState or None if not found/invalid
        """
        # Validate session ID format
        if not is_valid_session_id(session_id):
            logger.warning(f"SESSION MANAGER: Invalid session ID format: {session_id[:20]}...")
            return None
        
        with self._session_lock:
            session = self._sessions.get(session_id)
            if session:
                # Check if expired
                if session.is_expired(settings.SESSION_TIMEOUT_MINUTES):
                    logger.info(f"SESSION MANAGER: Session expired: {session_id[:8]}...")
                    self._delete_session_internal(session_id)
                    return None
                session.update_activity()
            return session
    
    def validate_session(self, session_id: str) -> Tuple[bool, str]:
        """
        Validate a session exists and return details.
        
        Args:
            session_id: UUID session identifier
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not is_valid_session_id(session_id):
            return False, "Invalid session ID format"
        
        session = self.get_session(session_id)
        if not session:
            return False, "Session not found or expired"
        
        return True, ""
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session by ID.
        
        Args:
            session_id: UUID session identifier
            
        Returns:
            bool: True if deleted, False if not found
        """
        with self._session_lock:
            return self._delete_session_internal(session_id)
    
    def _delete_session_internal(self, session_id: str) -> bool:
        """Internal method to delete session (must hold lock)."""
        if session_id in self._sessions:
            session = self._sessions[session_id]
            session.cleanup()
            del self._sessions[session_id]
            logger.info(f"SESSION MANAGER: Deleted session {session_id[:8]}...")
            return True
        return False
    
    def list_sessions(self) -> List[Dict[str, Any]]:
        """
        List all active sessions (for admin/debug).
        
        Returns:
            List of session info dicts
        """
        with self._session_lock:
            return [session.get_info() for session in self._sessions.values()]
    
    def get_session_count(self) -> int:
        """Get the number of active sessions."""
        with self._session_lock:
            return len(self._sessions)
    
    def _cleanup_oldest_sessions(self) -> int:
        """
        Remove oldest sessions to make room for new ones.
        Must hold _session_lock when calling.
        
        Returns:
            Number of sessions removed
        """
        if not self._sessions:
            return 0
        
        # Sort by last_active and remove oldest 10%
        sorted_sessions = sorted(
            self._sessions.items(),
            key=lambda x: x[1].last_active
        )
        
        num_to_remove = max(1, len(sorted_sessions) // 10)
        removed = 0
        
        for session_id, session in sorted_sessions[:num_to_remove]:
            session.cleanup()
            del self._sessions[session_id]
            logger.info(f"SESSION MANAGER: Cleaned up inactive session: {session_id[:8]}...")
            removed += 1
        
        # Force garbage collection to free memory
        gc.collect()
        
        return removed
    
    def cleanup_expired_sessions(self) -> int:
        """
        Remove sessions that have been inactive for too long.
        
        Should be called periodically (e.g., via scheduled task or endpoint).
        
        Returns:
            Number of sessions cleaned up
        """
        timeout = settings.SESSION_TIMEOUT_MINUTES
        
        with self._session_lock:
            expired = [
                sid for sid, session in self._sessions.items()
                if session.is_expired(timeout)
            ]
            
            for session_id in expired:
                self._delete_session_internal(session_id)
        
        if expired:
            logger.info(f"SESSION MANAGER: Cleaned up {len(expired)} expired sessions")
            gc.collect()
        
        return len(expired)


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================
session_manager = SessionManager()
