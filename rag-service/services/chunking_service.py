"""
Chunking Service
================
Handles text splitting with metadata preservation for RAG retrieval.

Features:
- RecursiveCharacterTextSplitter for better semantic chunking
- Page number preservation in metadata
- Empty document handling
- Chunk summary statistics
"""

import logging
from typing import Dict, Any, List, Tuple
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config.settings import settings

logger = logging.getLogger(__name__)


class ChunkingService:
    """
    Service for splitting documents into chunks with metadata.
    
    Uses RecursiveCharacterTextSplitter which tries to split on natural
    boundaries (\n\n, \n, sentences, words) before falling back to characters.
    """
    
    def __init__(self):
        """Initialize the text splitter with configured chunk size and overlap."""
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],  # Natural boundaries first
            keep_separator=True
        )
        logger.info(f"ChunkingService initialized: chunk_size={settings.CHUNK_SIZE}, overlap={settings.CHUNK_OVERLAP}")
    
    def chunk_documents(
        self, 
        documents: List[Dict[str, Any]]
    ) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Split documents into chunks with metadata including page numbers.
        
        Args:
            documents: List of document dicts with:
                - 'filename': Source filename
                - 'text': Full text content OR
                - 'pages': List of {page_number, text} for page-level text
            
        Returns:
            Tuple of (chunks list, metadata list)
            
        Note:
            Empty documents are skipped with a warning.
        """
        all_chunks: List[str] = []
        all_metadata: List[Dict[str, Any]] = []
        skipped_docs: List[str] = []
        
        for doc in documents:
            filename = doc["filename"]
            
            # Check for page-level text (preferred) or full text
            if "pages" in doc and doc["pages"]:
                # Process page by page for accurate page number metadata
                chunks, metadata = self._chunk_with_pages(filename, doc["pages"])
            elif "text" in doc and doc["text"]:
                # Fall back to full text without page numbers
                chunks, metadata = self._chunk_full_text(filename, doc["text"])
            else:
                # Empty document
                skipped_docs.append(filename)
                logger.warning(f"Skipping empty/scanned document with no extractable text: {filename}")
                continue
            
            all_chunks.extend(chunks)
            all_metadata.extend(metadata)
            
            logger.info(f"PDF CHUNKING: {filename} -> {len(chunks)} chunks")
        
        if skipped_docs:
            logger.warning(f"Skipped {len(skipped_docs)} empty documents: {skipped_docs}")
        
        logger.info(f"CHUNKING COMPLETE: {len(all_chunks)} total chunks from {len(documents) - len(skipped_docs)} documents")
        
        return all_chunks, all_metadata
    
    def _chunk_with_pages(
        self,
        filename: str,
        pages: List[Dict[str, Any]]
    ) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Chunk document with page-level granularity for accurate page metadata.
        
        Args:
            filename: Source filename
            pages: List of {page_number, text} dicts
            
        Returns:
            Tuple of (chunks, metadata with page_number)
        """
        chunks: List[str] = []
        metadata: List[Dict[str, Any]] = []
        chunk_id = 0
        
        for page_info in pages:
            page_num = page_info.get("page_number", 0)
            page_text = page_info.get("text", "").strip()
            
            if not page_text:
                continue
            
            # Split this page's text
            page_chunks = self.splitter.split_text(page_text)
            
            for chunk in page_chunks:
                chunks.append(chunk)
                metadata.append({
                    "source": filename,
                    "chunk_id": chunk_id,
                    "chunk_size": len(chunk),
                    "page_number": page_num
                })
                chunk_id += 1
        
        return chunks, metadata
    
    def _chunk_full_text(
        self,
        filename: str,
        text: str
    ) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Chunk full document text (page numbers not available).
        
        Args:
            filename: Source filename
            text: Full document text
            
        Returns:
            Tuple of (chunks, metadata without page_number)
        """
        text = text.strip()
        if not text:
            return [], []
        
        # Split text into chunks
        chunks = self.splitter.split_text(text)
        
        # Create metadata for each chunk
        metadata = []
        for i, chunk in enumerate(chunks):
            metadata.append({
                "source": filename,
                "chunk_id": i,
                "chunk_size": len(chunk)
                # page_number intentionally omitted - not available
            })
        
        return chunks, metadata
    
    def get_chunking_summary(
        self, 
        metadata: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Generate summary statistics for chunks by source.
        
        Args:
            metadata: List of chunk metadata dicts
            
        Returns:
            Dict mapping source filename to stats:
            - count: Number of chunks
            - total_size: Total characters
            - pages: Set of page numbers (if available)
        """
        summary: Dict[str, Dict[str, Any]] = {}
        
        for meta in metadata:
            source = meta["source"]
            if source not in summary:
                summary[source] = {"count": 0, "total_size": 0, "pages": set()}
            
            summary[source]["count"] += 1
            summary[source]["total_size"] += meta["chunk_size"]
            
            if "page_number" in meta:
                summary[source]["pages"].add(meta["page_number"])
        
        # Convert page sets to sorted lists for JSON serialization
        for source in summary:
            summary[source]["pages"] = sorted(summary[source]["pages"])
        
        return summary


# =============================================================================
# SINGLETON INSTANCE  
# =============================================================================
chunking_service = ChunkingService()
