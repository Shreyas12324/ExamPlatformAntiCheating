# Interview Service Backend

FastAPI backend for the Interview Practice Partner microservice.

## Architecture

```
backend/
├── main.py                 # FastAPI application entry point
├── routers/                # API route handlers
│   ├── interview_router.py # Interview flow endpoints
│   └── cheating_router.py  # Cheating detection endpoints
├── services/               # Business logic
│   ├── llm_agent.py       # LLM interaction and persona management
│   ├── cheating_monitor.py # Cheating event tracking
│   ├── memory_manager.py  # Conversation history management
│   └── questionnaire.py   # Question bank management
└── utils/                 # Utilities
    ├── config.py          # Configuration and environment variables
    ├── scoring.py         # Scoring algorithms
    └── role_data.py       # Role-specific data and rubrics
```

## API Endpoints

### Interview Endpoints

- `POST /interview/start` - Start a new interview session
- `POST /interview/next` - Submit answer and get next question
- `POST /interview/end` - End interview and get feedback
- `GET /interview/sessions` - List active sessions (debug)

### Cheating Detection Endpoints

- `POST /cheating/log` - Log a cheating detection event
- `GET /cheating/timeline/{interview_id}` - Get cheating timeline
- `DELETE /cheating/timeline/{interview_id}` - Clear timeline

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Run the server:
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

## Configuration

See `.env.example` for all configuration options.

### LLM Providers

- **Groq** (default): Fast, efficient, uses Llama 3.1 8B
- **OpenAI**: Fallback option, uses GPT-4 Turbo

### Supported Roles

- Software Engineer (SDE)
- Sales Representative
- Retail Associate
- Human Resources (HR)

### Supported Personas

- Confused: Needs guidance and clarification
- Efficient: Prefers brief, direct responses
- Chatty: Tends to go off-topic
- Edge-case: Provides unusual or unexpected answers

## Integration

### ML Service

The backend integrates with the YOLO-based anti-cheating service at `http://localhost:8001`.

Expected endpoint: `POST /ml/check_face`

### Response Format

```json
{
  "face_detected": true,
  "multiple_faces": false,
  "gaze_direction": "center",
  "face_distance": "normal",
  "cheating_score": 15,
  "severity": "low"
}
```

## Development

### Adding New Roles

1. Add questions to `ROLE_QUESTIONS` in `utils/role_data.py`
2. Add context to `ROLE_CONTEXT`
3. Add rubric to `SCORING_RUBRICS`

### Adding New Personas

1. Add persona instructions in `LLMAgent._get_persona_instructions()`
2. Update validation in `interview_router.py`

## Testing

Use the provided examples in the main README or test with curl:

```bash
# Start interview
curl -X POST http://localhost:8005/interview/start \
  -H "Content-Type: application/json" \
  -d '{"role":"SDE","persona":"Efficient","user_name":"John"}'

# Submit answer
curl -X POST http://localhost:8005/interview/next \
  -H "Content-Type: application/json" \
  -d '{"interview_id":"<id>","user_answer":"I have 3 years of experience..."}'

# End interview
curl -X POST http://localhost:8005/interview/end \
  -H "Content-Type: application/json" \
  -d '{"interview_id":"<id>"}'
```

## License

Part of the exam-platform project.
