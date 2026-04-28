"""
RAG Chain Service
=================
Handles conversational retrieval chain creation and management.
Uses Groq LLM with LangChain for question answering.

Features:
- Strict context adherence with external knowledge flagging
- Tutoring-oriented explanations
- Duplicate chunk deduplication
- Robust error handling
"""

import logging
from typing import Dict, Any, List, Optional, Set
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.vectorstores import FAISS

from config.settings import settings

logger = logging.getLogger(__name__)


# =============================================================================
# PROMPT TEMPLATES
# =============================================================================
# These prompts enforce strict context adherence while allowing tutoring expansions

SYSTEM_PREAMBLE = """You are an expert AI tutor helping students understand their study materials.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. **PRIORITIZE THE PROVIDED CONTEXT**: Your answer MUST be based primarily on the context provided below.
2. **FLAG EXTERNAL KNOWLEDGE**: If you add any explanation, analogy, or example NOT directly from the context, you MUST prefix it with "[Additional Explanation]" or state "Based on general knowledge...".
3. **ADMIT LIMITATIONS**: If the context does not contain information to answer the question, clearly state: "The uploaded documents do not contain information about this topic."
4. **BE EDUCATIONAL**: When explaining concepts from the context, break down complex ideas, provide step-by-step reasoning, and ensure the student understands.
5. **CITE SOURCES**: When possible, indicate which part of the context supports your answer."""

PROMPT_TEMPLATES = {
    "concise": f"""{SYSTEM_PREAMBLE}

For this response: Be **brief and concise** (2-3 sentences). Give direct answers from the context.

---
CONTEXT FROM UPLOADED DOCUMENTS:
{{context}}
---

STUDENT'S QUESTION: {{question}}

YOUR ANSWER (remember to flag any external knowledge):""",
    
    "detailed": f"""{SYSTEM_PREAMBLE}

For this response: Provide a **comprehensive, detailed explanation** with:
- Clear breakdown of concepts from the context
- Step-by-step explanations where relevant
- Examples (flag with [Additional Explanation] if not from context)
- Connections between related concepts in the documents

---
CONTEXT FROM UPLOADED DOCUMENTS:
{{context}}
---

STUDENT'S QUESTION: {{question}}

YOUR DETAILED ANSWER (remember to flag any external knowledge):"""
}

# Indicators that suggest external knowledge was used
EXTERNAL_KNOWLEDGE_INDICATORS = [
    "[additional explanation]",
    "based on general knowledge",
    "generally speaking",
    "in general",
    "typically",
    "it's commonly known",
    "outside of the documents",
    "not mentioned in the documents"
]


class RAGChainService:
    """
    Service for building and managing conversational retrieval chains.
    
    Features:
    - Lazy-loaded LLM instance (reused across sessions)
    - Support for concise/detailed response styles
    - Duplicate chunk deduplication
    - External knowledge detection
    """
    
    def __init__(self):
        self._llm: Optional[ChatGroq] = None
        self._llm_initialized: bool = False
    
    @property
    def llm(self) -> ChatGroq:
        """
        Lazy-load LLM instance.
        Reuses the same LLM instance across all chains for efficiency.
        
        Returns:
            ChatGroq: Initialized LLM instance
            
        Raises:
            ValueError: If GROQ_API_KEY is not configured
        """
        if self._llm is None:
            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY not configured. Set it in .env file.")
            
            logger.info(f"Initializing LLM: {settings.LLM_MODEL}")
            self._llm = ChatGroq(
                model=settings.LLM_MODEL,
                temperature=settings.LLM_TEMPERATURE,
                api_key=settings.GROQ_API_KEY,
                max_retries=2,
                timeout=30.0
            )
            self._llm_initialized = True
            logger.info("LLM initialized successfully")
        return self._llm
    
    def is_llm_ready(self) -> bool:
        """Check if LLM is initialized and ready."""
        return self._llm_initialized and self._llm is not None
    
    def build_chain(
        self,
        vectorstore: FAISS,
        response_style: str = "concise"
    ) -> ConversationalRetrievalChain:
        """
        Build a conversational retrieval chain.
        
        Args:
            vectorstore: FAISS vector store containing document embeddings
            response_style: "concise" for brief answers, "detailed" for comprehensive explanations
            
        Returns:
            ConversationalRetrievalChain: Configured chain ready for queries
            
        Raises:
            ValueError: If vectorstore is None or invalid response_style
        """
        if vectorstore is None:
            raise ValueError("Cannot build chain: vectorstore is None")
        
        if response_style not in PROMPT_TEMPLATES:
            logger.warning(f"Unknown response_style '{response_style}', defaulting to 'concise'")
            response_style = "concise"
        
        # Get appropriate prompt template
        template = PROMPT_TEMPLATES[response_style]
        qa_prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
        
        # Create memory for conversation history
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer"
        )
        
        # Build the chain
        chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=vectorstore.as_retriever(
                search_kwargs={"k": settings.RETRIEVAL_TOP_K}
            ),
            memory=memory,
            return_source_documents=True,
            combine_docs_chain_kwargs={"prompt": qa_prompt}
        )
        
        logger.info(f"Built conversation chain with '{response_style}' style")
        return chain
    
    def ask_question(
        self,
        chain: ConversationalRetrievalChain,
        question: str
    ) -> Dict[str, Any]:
        """
        Ask a question using the conversation chain.
        
        Handles:
        - Question length validation/truncation
        - LLM API error handling with retry info
        - Duplicate source chunk deduplication
        - External knowledge detection
        
        Args:
            chain: ConversationalRetrievalChain instance
            question: User's question (max 2000 chars enforced by schema)
            
        Returns:
            Dict containing:
            - answer: The LLM's response
            - sources: Deduplicated source documents grouped by file
            - retrieved_chunks: Number of unique chunks retrieved
            - context_used: Whether context was used (vs external knowledge only)
            - success: Whether the query succeeded
        """
        # Validate question length (additional safeguard)
        if len(question) > settings.MAX_QUESTION_LENGTH:
            logger.warning(f"Question truncated from {len(question)} to {settings.MAX_QUESTION_LENGTH} chars")
            question = question[:settings.MAX_QUESTION_LENGTH]
        
        try:
            logger.info(f"RAG query: '{question[:100]}...' ({len(question)} chars)")
            
            response = chain({"question": question})
            
            # Extract and deduplicate source documents
            raw_sources = response.get("source_documents", [])
            sources, unique_chunk_count = self._format_and_deduplicate_sources(raw_sources)
            
            answer = response.get("answer", "")
            
            # Detect if external knowledge was used
            context_used = self._detect_context_usage(answer, raw_sources)
            
            logger.info(f"RAG response: {len(answer)} chars, {unique_chunk_count} unique chunks, context_used={context_used}")
            
            return {
                "answer": answer,
                "sources": sources,
                "retrieved_chunks": unique_chunk_count,
                "context_used": context_used,
                "success": True
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"RAG chain error: {error_msg}")
            
            # Provide user-friendly error messages
            if "rate_limit" in error_msg.lower() or "429" in error_msg:
                user_message = "The AI service is currently busy. Please wait a moment and try again."
            elif "timeout" in error_msg.lower():
                user_message = "The request timed out. Please try a shorter question or try again later."
            elif "api_key" in error_msg.lower() or "auth" in error_msg.lower():
                user_message = "There's a configuration issue with the AI service. Please contact support."
            else:
                user_message = f"I encountered an error processing your question. Please try again."
            
            return {
                "answer": user_message,
                "sources": [],
                "retrieved_chunks": 0,
                "context_used": False,
                "success": False,
                "error": error_msg  # Include for debugging
            }
    
    def _detect_context_usage(
        self,
        answer: str,
        source_docs: List[Any]
    ) -> bool:
        """
        Detect whether the answer primarily uses document context or external knowledge.
        
        Returns True if context was meaningfully used, False if answer appears to be
        mostly external knowledge or the documents didn't contain relevant info.
        """
        answer_lower = answer.lower()
        
        # Check for explicit "not in documents" statements
        no_context_phrases = [
            "documents do not contain",
            "not mentioned in the documents",
            "no information about this",
            "cannot find this in the",
            "the uploaded documents don't",
            "outside the scope of",
            "not covered in the provided"
        ]
        
        for phrase in no_context_phrases:
            if phrase in answer_lower:
                return False
        
        # If we have source documents and no "not found" indicators, context was used
        return len(source_docs) > 0
    
    def _format_and_deduplicate_sources(
        self,
        source_docs: List[Any]
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Format and deduplicate source documents for API response.
        
        Deduplication is based on (source, chunk_id) pairs to avoid
        showing the same chunk multiple times in sources.
        
        Args:
            source_docs: List of LangChain Document objects from retrieval
            
        Returns:
            Tuple of (formatted sources grouped by file, unique chunk count)
        """
        # Track seen chunks for deduplication
        seen_chunks: Set[tuple] = set()
        sources_by_file: Dict[str, List[Dict[str, Any]]] = {}
        
        for doc in source_docs:
            source = doc.metadata.get("source", "Unknown")
            chunk_id = doc.metadata.get("chunk_id", 0)
            page_number = doc.metadata.get("page_number", None)
            
            # Deduplicate by (source, chunk_id)
            chunk_key = (source, chunk_id)
            if chunk_key in seen_chunks:
                logger.debug(f"Skipping duplicate chunk: {source}#{chunk_id}")
                continue
            seen_chunks.add(chunk_key)
            
            # Create content preview
            content = doc.page_content
            content_preview = content[:300] + "..." if len(content) > 300 else content
            
            if source not in sources_by_file:
                sources_by_file[source] = []
            
            chunk_info = {
                "chunk_id": chunk_id,
                "content_preview": content_preview
            }
            
            # Add page number if available
            if page_number is not None:
                chunk_info["page_number"] = page_number
            
            sources_by_file[source].append(chunk_info)
        
        # Convert to list format
        formatted = []
        for filename, chunks in sources_by_file.items():
            formatted.append({
                "filename": filename,
                "chunks_used": len(chunks),
                "chunks": sorted(chunks, key=lambda x: x["chunk_id"])
            })
        
        unique_count = len(seen_chunks)
        logger.debug(f"Deduplicated sources: {len(source_docs)} -> {unique_count} unique chunks")
        
        return formatted, unique_count


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================
rag_chain_service = RAGChainService()
