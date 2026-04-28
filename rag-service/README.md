# RAG Service - AI Tutor Microservice

PDF-based question answering microservice with source attribution. Part of the Online Exam Platform.

## Overview

This service enables users to:
1. Upload PDF documents
2. Process them into searchable chunks with embeddings
3. Ask questions and receive answers with source attribution

## Architecture

```
rag-service/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── config/
│   └── settings.py        # Environment configuration
├── routers/
│   ├── document_router.py # Upload & processing endpoints
│   └── chat_router.py     # Question answering endpoints
├── services/
│   ├── pdf_service.py     # PDF text extraction
│   ├── chunking_service.py # Text splitting
│   ├── embedding_service.py # Vector store management
│   └── rag_chain.py       # Conversational retrieval
├── models/
│   └── schemas.py         # Pydantic request/response models
└── utils/
    └── session_manager.py # Session state management
```

## Quick Start

### 1. Install Dependencies

```bash
cd rag-service
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Run the Service

```bash
python main.py
# Or with uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

### 4. Access API Documentation

Open http://localhost:8002/docs for interactive Swagger UI.

## API Endpoints

### Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Upload PDF files |
| POST | `/documents/process` | Process uploaded documents |
| GET | `/documents/sessions` | List all active sessions |
| GET | `/documents/sessions/{id}` | Get session info |
| DELETE | `/documents/sessions/{id}` | Delete a session |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/ask` | Ask a question |
| GET | `/chat/history/{session_id}` | Get chat history |
| DELETE | `/chat/history/{session_id}` | Clear chat history |

## Usage Flow

### 1. Upload Documents

```bash
curl -X POST "http://localhost:8002/documents/upload" \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf"
```

Response:
```json
{
  "session_id": "uuid-here",
  "files_received": 2,
  "filenames": ["document1.pdf", "document2.pdf"],
  "message": "Files uploaded successfully..."
}
```

### 2. Process Documents

```bash
curl -X POST "http://localhost:8002/documents/process" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "uuid-here"}'
```

### 3. Ask Questions

```bash
curl -X POST "http://localhost:8002/chat/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "uuid-here",
    "question": "What are the main topics covered?",
    "response_style": "detailed"
  }'
```

Response:
```json
{
  "session_id": "uuid-here",
  "question": "What are the main topics covered?",
  "answer": "The documents cover...",
  "response_style": "detailed",
  "sources": [
    {
      "filename": "document1.pdf",
      "chunks_used": 2,
      "chunks": [...]
    }
  ]
}
```

## Response Styles

- **concise**: Brief 2-3 sentence answers
- **detailed**: Comprehensive explanations with examples

## Tech Stack

- **Framework**: FastAPI
- **LLM**: Groq (llama-3.1-8b-instant)
- **Embeddings**: HuggingFace sentence-transformers (all-MiniLM-L6-v2)
- **Vector Store**: FAISS
- **PDF Processing**: PyPDF2
- **Orchestration**: LangChain

## Integration with Dashboard

The frontend dashboard should:

1. Call `/documents/upload` when user selects PDFs
2. Call `/documents/process` to process them
3. Store the `session_id` for the user's session
4. Call `/chat/ask` for each question
5. Display sources from the response

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8002 | Service port |
| `GROQ_API_KEY` | - | Required for LLM |
| `CHUNK_SIZE` | 1000 | Characters per chunk |
| `CHUNK_OVERLAP` | 200 | Overlap between chunks |
| `RETRIEVAL_TOP_K` | 4 | Chunks to retrieve |
| `SESSION_TIMEOUT_MINUTES` | 60 | Auto-cleanup timeout |

## Production Considerations

1. **Session Storage**: Currently uses in-memory storage. For production, consider Redis.
2. **Vector Store Persistence**: FAISS stores are in-memory. Consider persistent storage for long-term sessions.
3. **Rate Limiting**: Add rate limiting for the LLM endpoints.
4. **Authentication**: Integrate with the main platform's JWT auth.
