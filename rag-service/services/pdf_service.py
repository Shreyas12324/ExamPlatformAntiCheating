"""
PDF Service
===========
Handles PDF text extraction with page-level metadata preservation.

Features:
- Page-by-page text extraction for accurate page attribution
- Empty/scanned PDF detection
- Robust error handling with detailed messages
"""

import io
import logging
from typing import Dict, Any, List, Optional

from PyPDF2 import PdfReader
from PyPDF2.errors import PdfReadError

logger = logging.getLogger(__name__)


# Minimum characters per page to consider it "has content"
MIN_PAGE_CONTENT_LENGTH = 10


class PDFService:
    """
    Service for extracting text from PDF files.
    
    Extracts text page-by-page to enable accurate page number attribution
    in RAG source citations.
    """
    
    @staticmethod
    def extract_text(filename: str, content: bytes) -> Dict[str, Any]:
        """
        Extract text from a PDF file with page-level granularity.
        
        Args:
            filename: Original filename for metadata
            content: PDF file content as bytes
            
        Returns:
            Dict containing:
            - filename: Source filename
            - text: Full concatenated text (for backwards compatibility)
            - pages: List of {page_number, text} for page-level access
            - page_count: Total number of pages
            - characters: Total character count
            - has_text: Whether meaningful text was extracted
            
        Raises:
            ValueError: If PDF cannot be read or is corrupted
        """
        try:
            # Create file-like object from bytes
            pdf_file = io.BytesIO(content)
            
            try:
                reader = PdfReader(pdf_file)
            except PdfReadError as e:
                logger.error(f"PDF read error for {filename}: {e}")
                raise ValueError(f"Cannot read PDF '{filename}': File may be corrupted or encrypted")
            
            page_count = len(reader.pages)
            
            if page_count == 0:
                logger.warning(f"PDF has no pages: {filename}")
                raise ValueError(f"PDF '{filename}' has no pages")
            
            # Extract text page by page
            pages: List[Dict[str, Any]] = []
            full_text_parts: List[str] = []
            total_chars = 0
            empty_pages = 0
            
            for page_num, page in enumerate(reader.pages, start=1):
                try:
                    page_text = page.extract_text() or ""
                except Exception as e:
                    logger.warning(f"Error extracting page {page_num} from {filename}: {e}")
                    page_text = ""
                
                page_text = page_text.strip()
                
                if len(page_text) < MIN_PAGE_CONTENT_LENGTH:
                    empty_pages += 1
                
                pages.append({
                    "page_number": page_num,
                    "text": page_text
                })
                
                full_text_parts.append(page_text)
                total_chars += len(page_text)
            
            full_text = "\n\n".join(full_text_parts)
            has_meaningful_text = total_chars > (MIN_PAGE_CONTENT_LENGTH * page_count // 2)
            
            # Log extraction results
            if empty_pages == page_count:
                logger.warning(f"PDF appears to be scanned/image-only (no extractable text): {filename}")
            elif empty_pages > 0:
                logger.info(f"PDF {filename}: {page_count} pages, {empty_pages} empty pages, {total_chars} chars")
            else:
                logger.info(f"PDF EXTRACTED: {filename} -> {page_count} pages, {total_chars} chars")
            
            return {
                "filename": filename,
                "text": full_text,
                "pages": pages,
                "page_count": page_count,
                "characters": total_chars,
                "has_text": has_meaningful_text,
                "empty_pages": empty_pages
            }
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error extracting text from {filename}: {str(e)}")
            raise ValueError(f"Failed to process PDF '{filename}': {str(e)}")
    
    @staticmethod
    def extract_multiple(files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract text from multiple PDF files.
        
        Args:
            files: List of {filename, content} dicts
            
        Returns:
            List of extracted document dicts (only successful extractions)
            
        Note:
            Documents with no extractable text are included but flagged
            with has_text=False. The chunking service will handle them.
        """
        documents: List[Dict[str, Any]] = []
        errors: List[Dict[str, str]] = []
        
        logger.info(f"PDF EXTRACTION: Processing {len(files)} files...")
        
        for file_info in files:
            filename = file_info["filename"]
            try:
                doc = PDFService.extract_text(filename, file_info["content"])
                documents.append(doc)
                
                if not doc["has_text"]:
                    logger.warning(f"Document has no extractable text (may be scanned): {filename}")
                    
            except Exception as e:
                error_msg = str(e)
                errors.append({
                    "filename": filename,
                    "error": error_msg
                })
                logger.error(f"Failed to extract '{filename}': {error_msg}")
        
        # Log summary
        successful = len(documents)
        with_text = sum(1 for d in documents if d["has_text"])
        
        logger.info(
            f"PDF EXTRACTION COMPLETE: {successful}/{len(files)} successful, "
            f"{with_text} with extractable text, {len(errors)} failed"
        )
        
        if errors:
            logger.warning(f"Failed files: {[e['filename'] for e in errors]}")
        
        return documents
    
    @staticmethod
    def validate_has_content(documents: List[Dict[str, Any]]) -> tuple[bool, str]:
        """
        Validate that at least one document has extractable content.
        
        Args:
            documents: List of extracted document dicts
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not documents:
            return False, "No documents were successfully processed"
        
        docs_with_text = [d for d in documents if d.get("has_text", False)]
        
        if not docs_with_text:
            scanned_hint = " The PDFs may be scanned images without selectable text."
            return False, f"None of the {len(documents)} documents contain extractable text.{scanned_hint}"
        
        return True, ""


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================
pdf_service = PDFService()
