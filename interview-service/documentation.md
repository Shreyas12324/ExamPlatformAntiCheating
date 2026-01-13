# AI Interview Partner - Complete Technical Explanation for Viva

## 📋 Project Overview

**Project Name**: AI Interview Partner with Anti-Cheating Proctoring  
**Type**: Full-stack microservices application  
**Purpose**: Conduct AI-powered mock interviews with real-time cheating detection

---

## 🏗️ System Architecture

### Three-Tier Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│              React Frontend (Port 5173)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│  Backend API  │◄────────│  ML Service  │
│   (FastAPI)   │         │    (YOLO)    │
│  Port 8005    │         │  Port 8001   │
└───────────────┘         └──────────────┘
```

**Three Independent Services:**
1. **Frontend**: React + Vite (User Interface)
2. **Backend**: FastAPI (Business Logic + LLM Integration)
3. **ML Service**: Python + YOLO (Computer Vision)

---

## 🎯 Core Components Breakdown

### 1. Backend Service (FastAPI)

#### 1.1 Main Entry Point (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import interview_router, cheating_router

app = FastAPI(title="AI Interview Partner API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register routers
app.include_router(interview_router.router, prefix="/interview")
app.include_router(cheating_router.router, prefix="/cheating")
```

**Key Points for Viva:**
- FastAPI chosen for: async support, automatic API docs, type safety
- CORS enabled for cross-origin requests from React frontend
- Modular routing with separate routers for different concerns

---

#### 1.2 Interview Router (`routers/interview_router.py`)

**Three Main Endpoints:**

##### Endpoint 1: `/interview/start` - Start Interview

```python
@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(request: StartInterviewRequest):
    # 1. Generate unique interview ID
    interview_id = str(uuid.uuid4())
    
    # 2. Initialize services
    memory_manager = MemoryManager(interview_id)
    questionnaire = Questionnaire(request.role)
    llm_agent = LLMAgent(request.persona)
    cheating_monitor = CheatingMonitor(interview_id)
    
    # 3. Generate greeting using LLM
    greeting = llm_agent.generate_greeting(request.role, request.user_name)
    
    # 4. Get first question
    first_question = questionnaire.get_next_question()
    
    # 5. Store interview state in memory
    active_interviews[interview_id] = {
        "memory_manager": memory_manager,
        "questionnaire": questionnaire,
        "llm_agent": llm_agent,
        # ... other state
    }
    
    return StartInterviewResponse(
        interview_id=interview_id,
        greeting_message=greeting,
        first_question=first_question
    )
```

**Viva Points:**
- Uses in-memory storage (`active_interviews` dict) - in production would use Redis/database
- Each interview gets isolated state management
- LLM generates personalized greeting based on role and user name

##### Endpoint 2: `/interview/next` - Process Answer & Get Next Question

```python
@router.post("/next", response_model=NextQuestionResponse)
async def next_question(request: NextQuestionRequest):
    # 1. Retrieve interview state
    interview = active_interviews[request.interview_id]
    
    # 2. Add user answer to memory
    interview["memory_manager"].add_message("user", request.user_answer)
    
    # 3. Get conversation history
    conversation = interview["memory_manager"].get_conversation_history()
    
    # 4. Get cheating summary
    cheating_summary = interview["cheating_monitor"].get_summary()
    
    # 5. LLM evaluates answer and decides next action
    decision = interview["llm_agent"].evaluate_and_decide(
        user_answer=request.user_answer,
        current_question=interview["current_question"],
        conversation_history=conversation,
        cheating_summary=cheating_summary,
        role=interview["role"]
    )
    
    # 6. Determine if follow-up or next question
    if decision["followup"]:
        next_q = decision["followup_question"]
    else:
        next_q = interview["questionnaire"].get_next_question()
    
    return NextQuestionResponse(
        agent_response=decision["response"],
        next_question=next_q,
        interview_ended=decision["complete"]
    )
```

**Viva Points:**
- LLM makes intelligent decisions: acknowledge answer, ask follow-up, or move to next question
- Conversation history maintained for context-aware responses
- Cheating summary passed to LLM for awareness (though not directly mentioned to user)

##### Endpoint 3: `/interview/end` - Generate Final Feedback

```python
@router.post("/end", response_model=EndInterviewResponse)
async def end_interview(request: EndInterviewRequest):
    interview = active_interviews[request.interview_id]
    
    # Get complete conversation history
    conversation = interview["memory_manager"].get_conversation_history()
    cheating_summary = interview["cheating_monitor"].get_summary()
    
    # LLM generates comprehensive feedback
    feedback = interview["llm_agent"].generate_final_feedback(
        conversation_history=conversation,
        role=interview["role"],
        cheating_summary=cheating_summary
    )
    
    # Cleanup interview state
    del active_interviews[request.interview_id]
    
    return EndInterviewResponse(
        feedback=feedback,
        cheating_summary=cheating_summary
    )
```

**Viva Points:**
- Feedback includes: technical_score (0-10), communication_score, confidence_score
- Provides strengths, weaknesses, and actionable recommendations
- Uses LLM for intelligent evaluation rather than rule-based scoring

---

#### 1.3 LLM Agent Service (`services/llm_agent.py`)

**Core Functionality: Intelligent Interview Orchestration**

##### A. Initialization

```python
class LLMAgent:
    def __init__(self, persona: str = "Efficient"):
        self.persona = persona
        
        # Initialize Groq client with LLaMA 3.3 70B model
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"
        
        # Get persona-specific instructions
        self.persona_instructions = self._get_persona_instructions()
```

**Viva Points:**
- Uses Groq API (fast inference for LLaMA models)
- LLaMA 3.3 70B chosen for: strong reasoning, conversational ability, JSON generation
- Persona system adapts interviewer behavior to user style

##### B. Generate Greeting

```python
def generate_greeting(self, role: str, user_name: str) -> str:
    system_prompt = f\"\"\"You are a professional interview agent conducting a 
    mock {role} interview.
    
    {self.persona_instructions}
    
    Generate a warm, professional greeting that:
    1. Welcomes the candidate
    2. Explains the interview structure (5-7 questions)
    3. Mentions anti-cheating monitoring
    4. Sets expectations for honest, detailed answers
    \"\"\"
    
    user_prompt = f"Generate a greeting for {user_name} for a {role} interview."
    
    return self._call_llm(system_prompt, user_prompt)
```

**Viva Points:**
- Dynamic greeting generation (not hardcoded templates)
- Context-aware: includes role, name, persona style
- Sets professional tone while being welcoming

##### C. Evaluate and Decide

```python
def evaluate_and_decide(
    self,
    user_answer: str,
    current_question: str,
    conversation_history: List[Dict[str, str]],
    cheating_summary: Dict[str, Any],
    role: str
) -> Dict[str, Any]:
    
    system_prompt = f\"\"\"You are a professional interview agent.
    
    {self.persona_instructions}
    
    Role Context: {role_context}
    Scoring Rubric: {rubric}
    
    Analyze the candidate's answer and decide:
    1. Provide acknowledgment/feedback on their answer
    2. Decide if follow-up question needed (if answer incomplete/unclear)
    3. OR move to next question (if answer satisfactory)
    
    Respond in JSON format:
    {{
        "response": "Your acknowledgment message",
        "followup": true/false,
        "followup_question": "Question if followup is true",
        "complete": false
    }}
    \"\"\"
    
    # Build conversation context
    conversation_text = "\\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in conversation_history
    ])
    
    user_prompt = f\"\"\"Current Question: {current_question}
    Candidate's Answer: {user_answer}
    
    Conversation History:
    {conversation_text}
    
    Evaluate the answer and decide next action.\"\"\"
    
    response = self._call_llm(system_prompt, user_prompt, json_mode=True)
    return json.loads(response)
```

**Viva Points:**
- **Intelligent follow-ups**: If answer is vague, LLM generates probing questions
- **Context-aware**: Has access to full conversation history
- **JSON mode**: Ensures structured, parseable responses
- **Adaptive**: Behavior changes based on persona (patient vs. direct)

##### D. Generate Final Feedback

```python
def generate_final_feedback(
    self,
    conversation_history: List[Dict[str, str]],
    role: str,
    cheating_summary: Dict[str, Any]
) -> Dict[str, Any]:
    
    system_prompt = f\"\"\"You are a professional interview evaluator for {role}.
    
    SCORING GUIDELINES (Be honest and fair):
    - 9-10: Exceptional - Expert-level answers
    - 7-8: Strong - Good knowledge, minor gaps
    - 5-6: Adequate - Meets basic requirements
    - 3-4: Below Average - Significant gaps
    - 1-2: Poor - Major deficiencies
    - 0: No participation
    
    Most candidates should score in the 4-7 range.
    
    Return JSON with:
    {{
        "technical_score": 0-10,
        "communication_score": 0-10,
        "confidence_score": 0-10,
        "overall_summary": "2-3 sentence summary",
        "strengths": ["strength 1", "strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "recommendations": ["recommendation 1", "recommendation 2"]
    }}
    \"\"\"
    
    # Analyze conversation
    user_messages = [msg for msg in conversation_history if msg["role"] == "user"]
    total_words = sum(len(msg["content"].split()) for msg in user_messages)
    
    user_prompt = f\"\"\"Interview Transcript:
    {conversation_text}
    
    User provided {len(user_messages)} answers with {total_words} total words.
    
    EVALUATION INSTRUCTIONS:
    1. If NO participation (0 messages or <10 words): Give 0/10 for all
    2. If minimal effort: Score 2-4 range
    3. If adequate but basic: Score 5-6 range
    4. If good with examples: Score 7-8 range
    5. If exceptional: Score 9-10 range
    
    Provide comprehensive feedback with specific examples.\"\"\"
    
    response = self._call_llm(system_prompt, user_prompt, json_mode=True)
    
    # Parse JSON with error handling
    try:
        feedback = json.loads(response)
        # Validate scores are 0-10
        feedback["technical_score"] = max(0, min(10, int(feedback["technical_score"])))
        # ... similar for other scores
        return feedback
    except json.JSONDecodeError:
        # Fallback: calculate basic scores based on participation
        return fallback_feedback
```

**Viva Points:**
- **Prevents score inflation**: Explicit guidelines that most should score 4-7
- **Detailed analysis**: LLM examines depth, relevance, accuracy, communication
- **Robust error handling**: If JSON parsing fails, retries with clearer instructions
- **Intelligent fallback**: If still fails, generates participation-based scores (not generic error)

---

#### 1.4 Questionnaire Service (`services/questionnaire.py`)

**Purpose: Manage role-specific question banks**

```python
class Questionnaire:
    def __init__(self, role: str):
        self.role = role
        # Load questions from role_data.py
        self.questions = get_questions_for_role(role)
        self.current_index = 0
        self.asked_questions: List[str] = []
    
    def get_next_question(self) -> Optional[str]:
        \"\"\"Get next question in sequence\"\"\"
        if self.current_index >= len(self.questions):
            return None  # No more questions
        
        question = self.questions[self.current_index]
        self.asked_questions.append(question)
        self.current_index += 1
        return question
    
    def has_more_questions(self) -> bool:
        return self.current_index < len(self.questions)
```

**Role Data Structure** (`utils/role_data.py`):

```python
ROLE_QUESTIONS = {
    "SDE": [
        "Tell me about yourself and your experience with software development.",
        "Explain the difference between a process and a thread.",
        "What is your experience with data structures?",
        "Describe a challenging bug you've encountered.",
        # ... 3-4 more questions
    ],
    "Sales": [...],
    "Retail Associate": [...],
    "HR": [...]
}

SCORING_RUBRICS = {
    "SDE": {
        "technical_knowledge": "Understanding of programming concepts",
        "problem_solving": "Ability to break down problems",
        "communication": "Explaining technical concepts clearly",
        "experience": "Relevant project experience"
    },
    # ... other roles
}
```

**Viva Points:**
- **Modular design**: Questions separated from logic
- **Sequential delivery**: One question at a time, tracks progress
- **Extensible**: Easy to add new roles/questions
- **Context for LLM**: Rubric guides evaluation

---

#### 1.5 Memory Manager (`services/memory_manager.py`)

**Purpose: Maintain conversation history per interview**

```python
class MemoryManager:
    def __init__(self, interview_id: str):
        self.interview_id = interview_id
        self.messages: List[Dict[str, str]] = []
    
    def add_message(self, role: str, content: str):
        \"\"\"Add message to conversation history\"\"\"
        self.messages.append({
            "role": role,  # "user" or "assistant"
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def get_conversation_history(self) -> List[Dict[str, str]]:
        \"\"\"Return full conversation for LLM context\"\"\"
        return self.messages.copy()
    
    def get_last_n_messages(self, n: int) -> List[Dict[str, str]]:
        \"\"\"Get recent messages for context window\"\"\"
        return self.messages[-n:] if len(self.messages) > n else self.messages
```

**Viva Points:**
- **Context preservation**: LLM sees full conversation, not just last message
- **Enables coherent dialogue**: Agent remembers what was discussed
- **Timestamped**: Useful for analytics/debugging

---

#### 1.6 Cheating Monitor (`services/cheating_monitor.py`)

**Purpose: Track cheating events and generate summary**

```python
class CheatingMonitor:
    def __init__(self, interview_id: str):
        self.interview_id = interview_id
    
    def get_summary(self) -> Dict[str, Any]:
        \"\"\"Get cheating summary from router's storage\"\"\"
        # Retrieve from cheating_router's in-memory storage
        timeline = cheating_timelines.get(self.interview_id, [])
        
        # Calculate statistics
        total_events = len(timeline)
        critical_events = len([e for e in timeline if e["severity"] == "critical"])
        
        return {
            "total_events": total_events,
            "critical_events": critical_events,
            "mobile_detected_count": len([e for e in timeline if e["mobile_detected"]]),
            "multiple_faces_count": len([e for e in timeline if e["num_faces"] > 1]),
            "timeline": timeline
        }
```

**Viva Points:**
- **Aggregates ML service results**: Collects all detection events
- **Provides context to LLM**: LLM is aware of violations (though doesn't heavily penalize)
- **Frontend receives summary**: Displayed in feedback (though hidden from UI currently)

---

### 2. Cheating Router (`routers/cheating_router.py`)

#### Endpoint: `/cheating/log` - Log Detection Event

```python
@router.post("/log", response_model=CheatingLogResponse)
async def log_cheating_event(request: CheatingLogRequest):
    # 1. Decode base64 image from webcam
    image_bytes = base64.b64decode(request.frame_data)
    
    # 2. Send to ML service for analysis
    async with httpx.AsyncClient(timeout=10.0) as client:
        files = {"image": ("frame.jpg", image_bytes, "image/jpeg")}
        ml_response = await client.post(
            f"{settings.ML_SERVICE_URL}/ml/check_face",
            files=files
        )
        detection_result = ml_response.json()
    
    # 3. Determine event type
    event_type = determine_event_type(detection_result)
    
    # 4. Store event in timeline
    cheating_timelines[request.interview_id].append({
        "timestamp": request.timestamp,
        "event": event_type,
        "severity": detection_result["severity"],
        "num_faces": detection_result["num_faces"],
        "mobile_detected": detection_result["mobile_detected"],
        "issues": detection_result["issues"]
    })
    
    # 5. Determine if frontend should show alert
    critical_events = ["MOBILE_DEVICE_DETECTED", "MULTIPLE_FACES"]
    event_logged = event_type in critical_events
    
    return CheatingLogResponse(
        interview_id=request.interview_id,
        event_logged=event_logged,  # Triggers toast notification
        detection_result=detection_result,
        severity=detection_result["severity"]
    )

def determine_event_type(detection_result):
    \"\"\"Classify detection result into event type\"\"\"
    if detection_result["mobile_detected"]:
        return "MOBILE_DEVICE_DETECTED"
    
    if detection_result["num_faces"] > 1:
        return "MULTIPLE_FACES"
    
    if detection_result["num_faces"] == 0:
        return "NO_FACE_INTERNAL"  # Logged but no alert
    
    # Check issues for looking away, distance violations
    for issue in detection_result["issues"]:
        if "looking away" in issue.lower():
            return "LOOKING_AWAY_INTERNAL"
    
    return "NORMAL"
```

**Viva Points:**
- **Async communication**: Uses `httpx.AsyncClient` for non-blocking ML service calls
- **Event classification**: Distinguishes critical (alert user) vs internal tracking
- **Timeline storage**: All events logged for comprehensive report
- **Base64 encoding**: Efficient image transmission over HTTP

---

## 🖥️ Frontend Service (React)

### Architecture Overview

```
src/
├── pages/              # Main views
│   ├── Home.jsx       # Setup interview (role, name, voice mode)
│   ├── Interview.jsx  # Main interview UI
│   └── Feedback.jsx   # Results display
├── components/         # Reusable UI
│   ├── WebcamFeed.jsx # Camera monitoring
│   ├── ChatBubble.jsx # Message display
│   ├── ChatInput.jsx  # Text/voice input
│   ├── VoiceRecorder.jsx  # Speech-to-text
│   └── VoicePlayer.jsx    # Text-to-speech
├── context/
│   └── InterviewContext.jsx  # Global state
├── services/
│   └── api.js         # Backend API calls
└── App.jsx            # Root component with routing
```

---

### Key Components Explained

#### 1. Home Page (`pages/Home.jsx`)

**Purpose: Interview setup and initialization**

```jsx
export default function Home() {
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('SDE');
  const [audioMode, setAudioMode] = useState('text'); // 'text' or 'voice'
  const { setInterviewData } = useInterview();
  const navigate = useNavigate();

  const handleStartInterview = async () => {
    // Call /interview/start endpoint
    const response = await startInterview({
      user_name: userName,
      role: role,
      persona: 'Adaptive',  // Always adaptive
      audio_mode: audioMode
    });

    // Combine greeting + first question into single message
    const combinedMessage = `${response.greeting_message}\\n\\n${response.first_question}`;

    // Store in context
    setInterviewData({
      interviewId: response.interview_id,
      role,
      userName,
      audioMode,
      messages: [{
        role: 'assistant',
        content: combinedMessage,
        timestamp: new Date().toISOString()
      }]
    });

    // Navigate to interview page
    navigate('/interview');
  };

  return (
    <div>
      <input value={userName} onChange={e => setUserName(e.target.value)} />
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="SDE">Software Developer</option>
        <option value="Sales">Sales</option>
        {/* ... */}
      </select>
      <select value={audioMode} onChange={e => setAudioMode(e.target.value)}>
        <option value="text">Text Only</option>
        <option value="voice">Voice Enabled</option>
      </select>
      <button onClick={handleStartInterview}>Start Interview</button>
    </div>
  );
}
```

**Viva Points:**
- **User inputs**: Name, role selection, voice mode preference
- **Persona fixed**: Always "Adaptive" (LLM auto-detects user style)
- **Combined greeting**: Greeting + first question in one message for better voice flow
- **Context storage**: Uses React Context for global state management

---

#### 2. Interview Page (`pages/Interview.jsx`)

**Purpose: Main interview interface with chat + webcam**

```jsx
export default function Interview() {
  const { interviewData, addMessage, setInterviewData } = useInterview();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.error('⚠ Tab switching detected!', {
          duration: 5000,
          style: { background: '#DC2626', color: '#fff' }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleSendAnswer = async (answer) => {
    // Add user message to UI immediately
    addMessage({
      role: 'user',
      content: answer,
      timestamp: new Date().toISOString()
    });

    setLoading(true);

    // Call /interview/next endpoint
    const response = await sendAnswer({
      interview_id: interviewData.interviewId,
      user_answer: answer
    });

    // Add agent's acknowledgment
    addMessage({
      role: 'assistant',
      content: response.agent_response,
      timestamp: new Date().toISOString()
    });

    // Add next question if present
    if (response.next_question) {
      addMessage({
        role: 'assistant',
        content: response.next_question,
        timestamp: new Date().toISOString(),
        isFollowup: response.is_followup
      });
    }

    // Check if interview ended
    if (response.interview_ended) {
      handleEndInterview();
    }

    setLoading(false);
  };

  const handleCheatingAlert = (alert) => {
    const eventType = alert.event_type;
    const isCritical = ['MOBILE_DEVICE_DETECTED', 'MULTIPLE_FACES'].includes(eventType);

    if (isCritical) {
      let message = '';
      if (eventType === 'MOBILE_DEVICE_DETECTED') {
        message = '⚠ Mobile phone detected in frame!';
      } else if (eventType === 'MULTIPLE_FACES') {
        message = '⚠ Multiple people detected in frame!';
      }

      // Show toast notification (dismissible)
      toast.error(message, {
        duration: 6000,
        style: { background: '#DC2626', color: '#fff', fontWeight: '600' }
      });
    }
  };

  return (
    <div>
      <Header userName={interviewData.userName} role={interviewData.role} />
      
      <div className="main-content">
        {/* Chat Area */}
        <div className="chat-area">
          {interviewData.messages.map((message, index) => (
            <ChatBubble
              key={`message-${index}-${message.timestamp}`}
              message={{
                ...message,
                autoPlay: message.role === 'assistant' && 
                         interviewData.audioMode === 'voice'
              }}
              variant={message.role === 'user' ? 'user' : 'agent'}
            />
          ))}
        </div>

        {/* Webcam Monitor */}
        <WebcamFeed
          interviewId={interviewData.interviewId}
          onAlert={handleCheatingAlert}
        />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendAnswer}
        disabled={loading}
        audioMode={interviewData.audioMode}
      />
    </div>
  );
}
```

**Viva Points:**
- **Real-time chat**: Messages added immediately to UI (optimistic updates)
- **Tab switching detection**: Uses `document.visibilitychange` event
- **Toast notifications**: Dismissible, 6-second duration, only for critical events
- **Webcam integration**: Runs in parallel, sends frames every 3 seconds
- **Voice mode**: `autoPlay` prop passed to messages when voice enabled

---

#### 3. WebcamFeed Component (`components/WebcamFeed.jsx`)

**Purpose: Capture webcam frames and send to ML service**

```jsx
export default function WebcamFeed({ interviewId, onAlert }) {
  const webcamRef = useRef(null);
  const [checkInterval] = useState(3000); // Check every 3 seconds

  useEffect(() => {
    if (!interviewId) return;

    const captureAndCheck = async () => {
      // Capture frame from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      // Convert to base64
      const base64Data = imageSrc.split(',')[1];

      try {
        // Send to backend /cheating/log endpoint
        const response = await logCheatingEvent({
          interview_id: interviewId,
          frame_data: base64Data,
          timestamp: new Date().toISOString()
        });

        // Determine event type from detection result
        const detectionResult = response.detection_result || {};
        let eventType = 'UNKNOWN';

        if (detectionResult.mobile_detected) {
          eventType = 'MOBILE_DEVICE_DETECTED';
        } else if (detectionResult.num_faces > 1) {
          eventType = 'MULTIPLE_FACES';
        }

        // Trigger alert if critical event
        if (response.event_logged && onAlert) {
          onAlert({
            event_type: eventType,
            severity: response.severity,
            detection_result: detectionResult
          });
        }
      } catch (error) {
        console.error('Cheating check error:', error);
      }
    };

    // Start interval for periodic checks
    const intervalId = setInterval(captureAndCheck, checkInterval);

    return () => clearInterval(intervalId);
  }, [interviewId, checkInterval, onAlert]);

  return (
    <div className="webcam-container">
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: 'user' }}
      />
      <div className="monitoring-label">Monitoring Active</div>
    </div>
  );
}
```

**Viva Points:**
- **react-webcam library**: Provides easy camera access
- **3-second intervals**: Balance between real-time and performance
- **Base64 encoding**: Efficient image transmission
- **Event-driven alerts**: Calls parent's `onAlert` callback when critical event detected
- **Error handling**: Logs errors but doesn't crash app

---

#### 4. VoicePlayer Component (`components/VoicePlayer.jsx`)

**Purpose: Text-to-speech for agent responses**

```jsx
export default function VoicePlayer({ text, autoPlay = false }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasAutoPlayedRef = useRef(false);

  // Auto-play effect when autoPlay prop is true
  useEffect(() => {
    if (autoPlay && text && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      // Small delay to ensure DOM ready
      setTimeout(() => speakText(), 100);
    }
  }, [autoPlay, text]);

  const speakText = useCallback(() => {
    if (!window.speechSynthesis || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    // Speak
    window.speechSynthesis.speak(utterance);
  }, [text]);

  return (
    <button onClick={speakText} disabled={isSpeaking}>
      {isSpeaking ? '🔊 Speaking...' : '🔊 Play Audio'}
    </button>
  );
}
```

**Viva Points:**
- **Web Speech API**: Browser-native text-to-speech
- **Auto-play in voice mode**: Automatically speaks agent responses
- **hasAutoPlayedRef**: Prevents re-triggering on re-renders
- **Manual control**: User can also click to replay

---

#### 5. VoiceRecorder Component (`components/VoiceRecorder.jsx`)

**Purpose: Speech-to-text for user input**

```jsx
export default function VoiceRecorder({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        }
      }
      if (finalText) {
        setTranscript(prev => prev + finalText);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    setTranscript('');
    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current.stop();
    setIsListening(false);
    if (transcript && onTranscript) {
      onTranscript(transcript.trim());
    }
  };

  return (
    <div>
      {!isListening ? (
        <button onClick={startListening}>Start Recording</button>
      ) : (
        <button onClick={stopListening}>Stop Recording</button>
      )}
      {transcript && <div className="transcript">{transcript}</div>}
    </div>
  );
}
```

**Viva Points:**
- **Web Speech API**: Browser-native speech recognition
- **Continuous recognition**: Records until stopped
- **Interim results**: Shows real-time transcription
- **Chrome/Edge/Safari support**: Not available in Firefox

---

#### 6. InterviewContext (`context/InterviewContext.jsx`)

**Purpose: Global state management**

```jsx
const InterviewContext = createContext();

export function InterviewProvider({ children }) {
  const [interviewData, setInterviewData] = useState(null);

  const addMessage = (message) => {
    setInterviewData(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  return (
    <InterviewContext.Provider value={{ interviewData, setInterviewData, addMessage }}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within InterviewProvider');
  }
  return context;
}
```

**Viva Points:**
- **React Context API**: Avoids prop drilling
- **Shared state**: All components access same interview data
- **Convenience hook**: `useInterview()` for easy access

---

## 🤖 ML Service (YOLO Detection)

### Architecture

```
ml-service/
├── main.py              # FastAPI server
├── advanced_models.py   # YOLO model wrapper
├── yolov8n.pt          # Pre-trained YOLO weights
└── requirements.txt
```

---

### How YOLO Works in This Project

#### 1. YOLO (You Only Look Once) Overview

**YOLO Basics:**
- **Object Detection**: Identifies objects in images (people, phones, etc.)
- **Single Pass**: Analyzes entire image at once (fast!)
- **Bounding Boxes**: Draws boxes around detected objects
- **Class Labels**: Labels objects (person, cell phone, laptop, etc.)
- **Confidence Scores**: How sure it is about each detection

**YOLOv8n:**
- **"n" = nano**: Smallest, fastest version
- **Trade-off**: Speed over accuracy (perfect for real-time webcam)
- **80 classes**: Can detect 80 different object types
- **Pre-trained on COCO dataset**: Common objects in everyday scenes

---

#### 2. Implementation (`advanced_models.py`)

```python
from ultralytics import YOLO
import cv2
import numpy as np

class AdvancedCheatingDetector:
    def __init__(self):
        # Load pre-trained YOLOv8 nano model
        self.model = YOLO("yolov8n.pt")
        
        # Define what we're looking for
        self.mobile_classes = ['cell phone', 'laptop', 'keyboard', 'mouse']
        self.person_class = 'person'
    
    def detect_faces_and_objects(self, image: np.ndarray) -> dict:
        \"\"\"
        Analyze webcam frame for cheating indicators
        
        Args:
            image: numpy array (BGR format from OpenCV)
        
        Returns:
            Dictionary with detection results
        \"\"\"
        # Run YOLO detection
        results = self.model(image, verbose=False)
        
        # Extract detections
        detections = results[0].boxes
        
        num_persons = 0
        mobile_detected = False
        issues = []
        
        for detection in detections:
            # Get class name and confidence
            class_id = int(detection.cls[0])
            class_name = self.model.names[class_id]
            confidence = float(detection.conf[0])
            
            # Only consider high-confidence detections (>50%)
            if confidence < 0.5:
                continue
            
            # Count persons
            if class_name == self.person_class:
                num_persons += 1
            
            # Detect mobile devices
            if class_name in self.mobile_classes:
                mobile_detected = True
                issues.append(f"{class_name} detected with {confidence:.2%} confidence")
        
        # Analyze results
        severity = "low"
        message = "No issues detected"
        
        if mobile_detected:
            severity = "critical"
            message = "Mobile device detected in frame!"
        elif num_persons > 1:
            severity = "high"
            message = f"Multiple people detected ({num_persons} persons)"
        elif num_persons == 0:
            severity = "medium"
            message = "No face visible in frame"
        
        return {
            "num_faces": num_persons,
            "mobile_detected": mobile_detected,
            "severity": severity,
            "message": message,
            "issues": issues,
            "cheating_score": self._calculate_score(num_persons, mobile_detected)
        }
    
    def _calculate_score(self, num_persons, mobile_detected) -> float:
        \"\"\"Calculate cheating risk score (0-100)\"\"\"
        score = 0
        if mobile_detected:
            score += 80  # Very high risk
        if num_persons > 1:
            score += 60  # High risk
        elif num_persons == 0:
            score += 30  # Medium risk
        return min(100, score)
```

**Viva Points:**
- **Pre-trained model**: No training needed, uses COCO-trained weights
- **Confidence threshold**: Only considers detections >50% confidence
- **Multi-class detection**: Looks for persons AND devices
- **Severity classification**: Critical, high, medium, low
- **Scoring system**: Numerical risk assessment (0-100)

---

#### 3. API Endpoint (`main.py`)

```python
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from advanced_models import AdvancedCheatingDetector

app = FastAPI(title="ML Cheating Detection Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize detector (loads YOLO model once at startup)
detector = AdvancedCheatingDetector()

@app.post("/ml/check_face")
async def check_face(image: UploadFile = File(...)):
    \"\"\"
    Analyze uploaded image for cheating indicators
    
    Accepts: image/jpeg multipart file
    Returns: Detection results JSON
    \"\"\"
    # Read image bytes
    image_bytes = await image.read()
    
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # Decode image (JPEG -> BGR)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return {"error": "Invalid image"}
    
    # Run YOLO detection
    result = detector.detect_faces_and_objects(img)
    
    return result

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "yolov8n"}
```

**Viva Points:**
- **FastAPI async**: Non-blocking image processing
- **Multipart file upload**: Standard HTTP file upload
- **OpenCV integration**: Decodes JPEG to numpy array
- **Single model instance**: Loaded once at startup (efficient)
- **Health check**: Monitoring endpoint

---

### YOLO Detection Flow (Step-by-Step)

```
1. Frontend Webcam Capture (every 3 seconds)
   ↓
   [Capture frame as JPEG using react-webcam]
   ↓
2. Convert to Base64
   ↓
   [imageSrc.split(',')[1]]
   ↓
3. Send to Backend
   ↓
   [POST /cheating/log with base64 data]
   ↓
4. Backend decodes and forwards to ML Service
   ↓
   [POST /ml/check_face with image bytes]
   ↓
5. ML Service processes image
   ↓
   [cv2.imdecode → numpy array]
   ↓
6. YOLO Analysis
   ↓
   [YOLO model scans image]
   ↓
   [Detects objects: persons, phones, laptops]
   ↓
   [Returns bounding boxes + confidence scores]
   ↓
7. Post-processing
   ↓
   [Count persons, check for mobile devices]
   ↓
   [Classify severity: critical/high/medium/low]
   ↓
   [Calculate cheating score: 0-100]
   ↓
8. Return to Backend
   ↓
   [JSON: {num_faces: 1, mobile_detected: false, severity: "low"}]
   ↓
9. Backend logs event
   ↓
   [Store in cheating_timelines dict]
   ↓
10. Return to Frontend
   ↓
   [If critical: event_logged=true]
   ↓
11. Frontend shows toast
   ↓
   [toast.error("⚠ Mobile phone detected!")]
```

---

### Why YOLO for This Project?

**Advantages:**
1. **Real-time performance**: Processes webcam frames in <100ms
2. **Pre-trained**: No need to collect/label training data
3. **Multi-object**: Detects both people and devices simultaneously
4. **Robust**: Works in various lighting conditions
5. **Lightweight**: YOLOv8n runs on CPU (no GPU needed)

**Alternatives Considered:**
- **Face detection only (dlib/OpenCV Haar Cascades)**: Can't detect mobile devices
- **Custom CNN**: Would require training data and time
- **Cloud APIs (AWS Rekognition)**: Cost and latency issues
- **YOLOv5/v7**: Larger models, slower inference

---

## 🔄 Complete User Flow with Code

### Scenario: User takes interview in voice mode

```
1. HOME PAGE
   User enters: Name="John", Role="SDE", VoiceMode="Voice Enabled"
   Clicks "Start Interview"
   
   Frontend Code:
   const response = await startInterview({
     user_name: "John",
     role: "SDE",
     persona: "Adaptive",
     audio_mode: "voice"
   });
   
   Backend Code (interview_router.py):
   interview_id = uuid.uuid4()  # e.g., "a1b2c3d4-..."
   llm_agent = LLMAgent("Adaptive")
   greeting = llm_agent.generate_greeting("SDE", "John")
   # Returns: "Hello John, welcome to this mock Software Development Engineer interview..."
   
   questionnaire = Questionnaire("SDE")
   first_question = questionnaire.get_next_question()
   # Returns: "Tell me about yourself and your experience with software development."
   
   Frontend receives and stores:
   {
     interview_id: "a1b2c3d4-...",
     greeting_message: "Hello John, welcome...",
     first_question: "Tell me about yourself..."
   }
   
   Navigate to /interview
```

```
2. INTERVIEW PAGE LOADS
   Frontend renders:
   - Header (shows "John | SDE")
   - Chat area with combined greeting+question
   - Webcam feed (starts monitoring)
   - Chat input
   
   VoicePlayer auto-plays greeting (because audioMode="voice"):
   useEffect(() => {
     if (autoPlay && text) {
       setTimeout(() => speakText(), 100);
     }
   }, [autoPlay, text]);
   
   Webcam starts 3-second interval:
   setInterval(() => {
     const frame = webcamRef.current.getScreenshot();
     logCheatingEvent({ interview_id, frame_data: base64 });
   }, 3000);
```

```
3. USER ANSWERS (Voice)
   User clicks "Start Recording"
   Speech recognition starts:
   recognition.onresult = (event) => {
     transcript = event.results[0][0].transcript;
     // "I'm a software engineer with 5 years of experience..."
   };
   
   User clicks "Stop Recording"
   Transcript sent:
   handleSendAnswer("I'm a software engineer with 5 years of experience...");
   
   Frontend immediately adds to chat (optimistic update):
   addMessage({
     role: "user",
     content: "I'm a software engineer...",
     timestamp: "2025-11-27T10:30:00Z"
   });
```

```
4. BACKEND PROCESSES ANSWER
   POST /interview/next
   {
     interview_id: "a1b2c3d4-...",
     user_answer: "I'm a software engineer..."
   }
   
   Backend Code:
   memory_manager.add_message("user", user_answer)
   conversation = memory_manager.get_conversation_history()
   # [
   #   {role: "assistant", content: "Hello John...Tell me about yourself"},
   #   {role: "user", content: "I'm a software engineer..."}
   # ]
   
   decision = llm_agent.evaluate_and_decide(
     user_answer=user_answer,
     current_question="Tell me about yourself...",
     conversation_history=conversation,
     cheating_summary={total_events: 0, critical_events: 0},
     role="SDE"
   )
   
   LLM returns:
   {
     "response": "Great background! It's impressive to hear about your 5 years of experience.",
     "followup": true,
     "followup_question": "Can you tell me more about the types of projects you've worked on?",
     "complete": false
   }
   
   Backend returns to frontend:
   {
     agent_response: "Great background!...",
     next_question: "Can you tell me more about...",
     is_followup: true,
     interview_ended: false
   }
```

```
5. FRONTEND DISPLAYS RESPONSE
   Frontend adds two messages:
   1. Agent acknowledgment: "Great background!..."
   2. Follow-up question: "Can you tell me more..."
   
   VoicePlayer auto-plays acknowledgment (voice mode):
   speechSynthesis.speak(new SpeechSynthesisUtterance("Great background..."));
   
   Then auto-plays follow-up question:
   speechSynthesis.speak(new SpeechSynthesisUtterance("Can you tell me more..."));
```

```
6. WEBCAM MONITORING (Parallel)
   Every 3 seconds, webcam captures frame and sends to backend:
   
   POST /cheating/log
   {
     interview_id: "a1b2c3d4-...",
     frame_data: "iVBORw0KGgoAAAANSUhEUgAA..." (base64)
   }
   
   Backend forwards to ML Service:
   POST http://localhost:8001/ml/check_face
   Content-Type: multipart/form-data
   [image bytes]
   
   ML Service (YOLO):
   img = cv2.imdecode(image_bytes)
   results = yolo_model(img)
   # Detects: 1 person, no mobile devices
   
   Returns:
   {
     num_faces: 1,
     mobile_detected: false,
     severity: "low",
     message: "No issues detected",
     issues: [],
     cheating_score: 0
   }
   
   Backend classifies:
   event_type = "NORMAL"
   event_logged = false  # Not critical, don't alert
   
   Backend returns:
   {
     interview_id: "a1b2c3d4-...",
     event_logged: false,
     detection_result: {...},
     severity: "low"
   }
   
   Frontend: No toast shown (not critical)
```

```
7. USER PULLS OUT PHONE (Critical Event!)
   Webcam captures frame with phone visible
   
   YOLO detects:
   {
     num_faces: 1,
     mobile_detected: true,  # ← CRITICAL!
     severity: "critical",
     message: "Mobile device detected in frame!",
     issues: ["cell phone detected with 87% confidence"],
     cheating_score: 80
   }
   
   Backend classifies:
   event_type = "MOBILE_DEVICE_DETECTED"
   event_logged = true  # ← ALERT USER!
   
   Backend stores in timeline:
   cheating_timelines["a1b2c3d4-..."].append({
     timestamp: "2025-11-27T10:32:15Z",
     event: "MOBILE_DEVICE_DETECTED",
     severity: "critical",
     mobile_detected: true,
     cheating_score: 80
   })
   
   Backend returns:
   {
     event_logged: true,  # ← Triggers frontend alert
     detection_result: {mobile_detected: true, ...}
   }
   
   Frontend receives and shows toast:
   if (response.event_logged) {
     toast.error('⚠ Mobile phone detected in frame!', {
       duration: 6000,
       style: { background: '#DC2626', color: '#fff' }
     });
   }
   
   User sees dismissible red toast notification!
```

```
8. INTERVIEW CONTINUES
   User answers 4-5 more questions
   Each answer goes through LLM evaluation
   LLM decides: acknowledge + follow-up OR acknowledge + next question
   
   After 5-7 questions, LLM decides interview is complete:
   {
     "response": "Thank you for your answers, John.",
     "followup": false,
     "complete": true  # ← Interview ends
   }
   
   Backend returns:
   {
     interview_ended: true
   }
   
   Frontend calls:
   handleEndInterview()
```

```
9. END INTERVIEW - GENERATE FEEDBACK
   POST /interview/end
   {
     interview_id: "a1b2c3d4-..."
   }
   
   Backend retrieves full conversation:
   conversation = memory_manager.get_conversation_history()
   # 12 messages: 6 user, 6 assistant
   
   cheating_summary = {
     total_events: 47,  # Many frames checked
     critical_events: 1,  # One phone detection
     mobile_detected_count: 1,
     multiple_faces_count: 0,
     timeline: [...]
   }
   
   LLM generates feedback:
   feedback = llm_agent.generate_final_feedback(
     conversation_history=conversation,
     role="SDE",
     cheating_summary=cheating_summary
   )
   
   LLM returns:
   {
     "technical_score": 7,
     "communication_score": 8,
     "confidence_score": 7,
     "overall_summary": "Strong performance with good technical knowledge. Communication was clear and examples were relevant. Showed confidence in discussing past projects.",
     "strengths": [
       "Demonstrated 5 years of solid experience",
       "Provided specific examples from past projects",
       "Explained technical concepts clearly"
     ],
     "weaknesses": [
       "Could provide more depth on data structures",
       "Brief answer on debugging approach"
     ],
     "recommendations": [
       "Practice explaining algorithms in more detail",
       "Prepare more examples of debugging complex issues",
       "Review system design patterns"
     ]
   }
   
   Backend returns feedback + cheating_summary to frontend
   Frontend stores in context and navigates to /feedback
```

```
10. FEEDBACK PAGE
    Displays:
    - Overall scores (7/10, 8/10, 7/10)
    - Summary paragraph
    - Strengths list
    - Weaknesses list
    - Recommendations list
    - (Cheating summary hidden from UI but available in data)
    
    User can review feedback and start another interview
```

---

## 🎓 Key Technical Concepts for Viva

### 1. Microservices Architecture
**Q: Why separate services?**
- **Separation of concerns**: LLM logic, ML detection, UI are independent
- **Scalability**: Can scale ML service independently if detection is slow
- **Technology flexibility**: Python for ML, JavaScript for UI, Python for backend
- **Fault isolation**: If ML service crashes, interview can continue (just no monitoring)

### 2. Asynchronous Communication
**Q: Why async?**
- **Non-blocking**: Backend doesn't wait for ML service response
- **Better performance**: Can handle multiple interviews simultaneously
- **Responsive UI**: Frontend updates immediately, backend processes in background

### 3. LLM Integration (Groq)
**Q: Why Groq instead of OpenAI?**
- **Speed**: Groq provides fastest LLaMA inference (important for real-time)
- **Cost**: More affordable than OpenAI
- **Open model**: LLaMA 3.3 70B is open-weights (could self-host if needed)

**Q: How does LLM ensure JSON responses?**
- **System prompt**: Explicitly instructs "Respond with valid JSON only"
- **Temperature**: Lower temperature (0.5) for more deterministic output
- **Error handling**: If JSON parsing fails, retries with clearer instructions
- **Fallback**: If still fails, generates participation-based scores

### 4. YOLO Object Detection
**Q: Why YOLO for cheating detection?**
- **Speed**: Real-time performance (100ms per frame)
- **Multi-object**: Detects people AND devices simultaneously
- **Pre-trained**: No training data needed
- **Accuracy**: Good enough for proctoring (doesn't need perfect precision)

**Q: How does YOLO work?**
- **Single neural network**: One pass through image
- **Grid system**: Divides image into grid cells
- **Bounding boxes**: Each cell predicts boxes + confidence
- **Class labels**: Identifies object type (person, phone, etc.)
- **Non-max suppression**: Removes duplicate detections

### 5. Voice Features
**Q: How does voice mode work?**
- **Web Speech API**: Browser-native speech recognition & synthesis
- **Speech-to-text**: Converts user's voice to text (SpeechRecognition)
- **Text-to-speech**: Speaks agent's responses (SpeechSynthesis)
- **Auto-play**: When voice mode enabled, agent responses auto-play
- **Fallback**: If voice fails, user can type (graceful degradation)

### 6. State Management (React Context)
**Q: Why React Context?**
- **Global state**: Interview data accessible across all components
- **Avoids prop drilling**: No need to pass props through many levels
- **Simple API**: useInterview() hook for easy access
- **Alternative**: Could use Redux, but Context is simpler for this scale

### 7. Toast Notifications
**Q: Why react-hot-toast?**
- **Lightweight**: Small bundle size
- **Customizable**: Easy to style
- **Dismissible**: User can close notifications
- **Stacking**: Multiple toasts don't overlap
- **Accessible**: Proper ARIA labels

### 8. In-Memory Storage
**Q: Why not database?**
- **Prototype**: For demo/development, in-memory is faster
- **Stateless**: No persistence needed between restarts
- **Production**: Would use Redis (for sessions) + PostgreSQL (for history)

---

## 📊 System Metrics & Performance

### Backend Performance
- **Interview start**: ~500ms (includes LLM greeting generation)
- **Process answer**: ~1-2 seconds (depends on LLM response time)
- **Generate feedback**: ~3-5 seconds (comprehensive LLM analysis)

### ML Service Performance
- **YOLO detection**: ~50-100ms per frame
- **Total round-trip**: ~200-300ms (including network latency)
- **CPU usage**: ~10-15% per detection (on modern CPU)

### Frontend Performance
- **Initial load**: ~1-2 seconds
- **Message rendering**: <16ms (60 FPS)
- **Webcam capture**: 3-second intervals (balance of real-time vs. performance)

---

## 🔒 Security Considerations

### Current Implementation
- **No authentication**: Open access (prototype only)
- **No data encryption**: Plain HTTP (should use HTTPS in production)
- **No rate limiting**: Could be abused
- **In-memory storage**: Data lost on restart

### Production Improvements Needed
- **JWT authentication**: Secure user sessions
- **HTTPS**: Encrypt data in transit
- **Database**: Persistent storage with encryption at rest
- **Rate limiting**: Prevent abuse
- **API keys**: Protect ML service endpoint
- **CORS restrictions**: Limit allowed origins

---

## 🎯 Project Strengths for Viva

1. **Full-stack**: Frontend + Backend + ML service
2. **Modern tech**: React 19, FastAPI, LLaMA 3.3, YOLOv8
3. **Real-time features**: Voice, webcam, chat
4. **Intelligent**: LLM-powered adaptive interviewing
5. **Complete**: Setup → Interview → Feedback workflow
6. **Scalable architecture**: Microservices can scale independently
7. **Good UX**: Toast notifications, voice mode, clean UI
8. **Error handling**: Fallbacks for LLM failures, graceful degradation

---

## 🚀 Future Enhancements

1. **Database integration**: PostgreSQL for interview history
2. **User authentication**: Login/signup system
3. **Analytics dashboard**: Track user progress over time
4. **More roles**: Add 10+ different job roles
5. **Advanced proctoring**: Eye tracking, audio analysis
6. **Export feedback**: PDF generation
7. **Mobile app**: React Native version
8. **Video recording**: Save interview for review

---

This document covers everything you need for your viva! Practice explaining each component and be ready to dive deeper into any section based on questions.
