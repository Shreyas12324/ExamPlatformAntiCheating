"""
Embedding Service
=================
Handles vector embeddings and FAISS vector store management.

Features:
- Singleton embedding model (loaded once, reused)
- Eager loading option for startup preloading
- Efficient FAISS vector store creation
"""

import logging
from typing import List, Dict, Any, Optional
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from config.settings import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Service for creating and managing vector embeddings.
    
    Uses HuggingFace sentence-transformers with FAISS for efficient
    similarity search. The embedding model is loaded once and reused
    across all sessions for memory efficiency.
    """
    
    _instance = None
    
    def __new__(cls):
        """Singleton pattern ensures one embedding model instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._embeddings: Optional[HuggingFaceEmbeddings] = None
        self._model_loaded: bool = False
        self._initialized = True
    
    @property
    def embeddings(self) -> HuggingFaceEmbeddings:
        """
        Lazy-load embeddings model.
        
        The model is loaded once and reused across all sessions.
        Call preload_model() at startup for eager loading.
        
        Returns:
            HuggingFaceEmbeddings: Initialized embedding model
        """
        if self._embeddings is None:
            self._load_model()
        return self._embeddings
    
    def _load_model(self) -> None:
        """Internal method to load the embedding model."""
        logger.info(f"EMBEDDING MODEL: Loading {settings.EMBEDDING_MODEL}...")
        
        self._embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},  # Explicit CPU, change if GPU available
            encode_kwargs={"normalize_embeddings": True}  # Better cosine similarity
        )
        
        self._model_loaded = True
        logger.info("EMBEDDING MODEL: Loaded successfully")
    
    def preload_model(self) -> bool:
        """
        Eagerly load the embedding model at startup.
        
        Call this during service startup to avoid first-request latency.
        
        Returns:
            bool: True if model loaded successfully
        """
        try:
            _ = self.embeddings  # Trigger lazy loading
            return self._model_loaded
        except Exception as e:
            logger.error(f"Failed to preload embedding model: {e}")
            return False
    
    def is_ready(self) -> bool:
        """Check if embedding model is loaded and ready."""
        return self._model_loaded and self._embeddings is not None
    
    def create_vectorstore(
        self,
        chunks: List[str],
        metadata: List[Dict[str, Any]]
    ) -> FAISS:
        """
        Create a FAISS vector store from text chunks.
        
        Args:
            chunks: List of text chunks to embed
            metadata: List of metadata dicts for each chunk (must match length)
            
        Returns:
            FAISS: Vector store instance ready for similarity search
            
        Raises:
            ValueError: If chunks is empty or metadata length doesn't match
        """
        if not chunks:
            raise ValueError("No chunks provided for vectorstore creation")
        
        if len(chunks) != len(metadata):
            raise ValueError(f"Chunks ({len(chunks)}) and metadata ({len(metadata)}) length mismatch")
        
        # Prepare metadata for FAISS (include all available fields)
        metadatas = []
        for meta in metadata:
            meta_dict = {
                "source": meta.get("source", "Unknown"),
                "chunk_id": meta.get("chunk_id", 0)
            }
            # Include page_number if available
            if "page_number" in meta:
                meta_dict["page_number"] = meta["page_number"]
            metadatas.append(meta_dict)
        
        logger.info(f"VECTORSTORE: Creating with {len(chunks)} embeddings...")
        
        vectorstore = FAISS.from_texts(
            texts=chunks,
            embedding=self.embeddings,
            metadatas=metadatas
        )
        
        logger.info("VECTORSTORE: Created successfully")
        return vectorstore
    
    def similarity_search(
        self,
        vectorstore: FAISS,
        query: str,
        k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search on a vector store.
        
        Args:
            vectorstore: FAISS vector store to search
            query: Search query text
            k: Number of results (default from settings.RETRIEVAL_TOP_K)
            
        Returns:
            List of matching documents with content and metadata
        """
        k = k or settings.RETRIEVAL_TOP_K
        
        logger.debug(f"Similarity search: k={k}, query='{query[:50]}...'")
        
        results = vectorstore.similarity_search(query, k=k)
        
        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata
            }
            for doc in results
        ]


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================
embedding_service = EmbeddingService()


# Singleton instance
embedding_service = EmbeddingService()
