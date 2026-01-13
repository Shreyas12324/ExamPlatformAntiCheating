"""
Interview Router
Handles all interview-related endpoints: start, next, end
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.llm_agent import LLMAgent
from services.memory_manager import MemoryManager
from services.questionnaire import Questionnaire
import uuid
from datetime import datetime

router = APIRouter()

# In-memory storage for active interviews (use Redis/DB in production)
active_interviews: Dict[str, Dict[str, Any]] = {}


# Pydantic models for request/response
class StartInterviewRequest(BaseModel):
    role: str  # SDE, Sales, Retail Associate, HR
    persona: str  # Confused, Efficient, Chatty, Edge-case
    user_name: Optional[str] = "Candidate"


class StartInterviewResponse(BaseModel):
    interview_id: str
    greeting_message: str
    first_question: str
    role: str
    persona: str


class NextQuestionRequest(BaseModel):
    interview_id: str
    user_answer: str


class NextQuestionResponse(BaseModel):
    interview_id: str
    agent_response: str
    next_question: Optional[str] = None
    is_followup: bool = False
    interview_ended: bool = False


class EndInterviewRequest(BaseModel):
    interview_id: str


class EndInterviewResponse(BaseModel):
    interview_id: str
    feedback: Dict[str, Any]
    cheating_summary: Dict[str, Any]


@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(request: StartInterviewRequest):
    """
    Start a new interview session
    - Validates role and persona
    - Initializes memory and questionnaire
    - Returns greeting and first question
    """
    # Validate role
    valid_roles = ["SDE", "Sales", "Retail Associate", "HR"]
    if request.role not in valid_roles:
        raise HTTPException(
            status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}"
        )

    # Validate persona (now includes Adaptive for auto-detection)
    valid_personas = ["Confused", "Efficient", "Chatty", "Edge-case", "Adaptive"]
    if request.persona not in valid_personas:
        raise HTTPException(
            status_code=400, detail=f"Invalid persona. Must be one of: {valid_personas}"
        )

    # Generate unique interview ID
    interview_id = str(uuid.uuid4())

    # Initialize services
    memory_manager = MemoryManager(interview_id)
    questionnaire = Questionnaire(request.role)
    llm_agent = LLMAgent(request.persona)

    # Get greeting and first question
    greeting = llm_agent.generate_greeting(request.role, request.user_name)
    first_question = questionnaire.get_next_question()

    # Store interview state
    active_interviews[interview_id] = {
        "id": interview_id,
        "role": request.role,
        "persona": request.persona,
        "user_name": request.user_name,
        "memory_manager": memory_manager,
        "questionnaire": questionnaire,
        "llm_agent": llm_agent,
        "start_time": datetime.utcnow().isoformat(),
        "question_count": 1,
        "current_question": first_question,
    }

    # Add to memory
    memory_manager.add_message("assistant", f"{greeting}\n\n{first_question}")

    return StartInterviewResponse(
        interview_id=interview_id,
        greeting_message=greeting,
        first_question=first_question,
        role=request.role,
        persona=request.persona,
    )


@router.post("/next", response_model=NextQuestionResponse)
async def next_question(request: NextQuestionRequest):
    """
    Process user's answer and generate next question or follow-up
    - Evaluates user's answer
    - Decides on follow-up or next question
    - Returns agent response
    """
    # Validate interview exists
    if request.interview_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Interview session not found")

    interview = active_interviews[request.interview_id]
    memory_manager = interview["memory_manager"]
    questionnaire = interview["questionnaire"]
    llm_agent = interview["llm_agent"]

    # Add user answer to memory
    memory_manager.add_message("user", request.user_answer)

    # Get conversation history
    conversation_history = memory_manager.get_conversation_history()

    # Agent evaluates answer and decides next action
    agent_decision = llm_agent.evaluate_and_decide(
        user_answer=request.user_answer,
        current_question=interview["current_question"],
        conversation_history=conversation_history,
        cheating_summary={},
        role=interview["role"],
    )

    agent_response = agent_decision["response"]
    should_ask_followup = agent_decision["followup"]
    interview_complete = agent_decision["complete"]

    # Add agent response to memory
    memory_manager.add_message("assistant", agent_response)

    next_q = None
    is_followup = False
    interview_ended = False

    if interview_complete or interview["question_count"] >= 7:
        # Interview is complete
        interview_ended = True
    elif should_ask_followup:
        # Generate follow-up question
        next_q = agent_decision.get("followup_question", "Could you elaborate on that?")
        is_followup = True
        interview["current_question"] = next_q
        memory_manager.add_message("assistant", next_q)
    else:
        # Move to next question
        next_q = questionnaire.get_next_question()
        if next_q:
            interview["question_count"] += 1
            interview["current_question"] = next_q
            memory_manager.add_message("assistant", next_q)
        else:
            # No more questions
            interview_ended = True

    return NextQuestionResponse(
        interview_id=request.interview_id,
        agent_response=agent_response,
        next_question=next_q,
        is_followup=is_followup,
        interview_ended=interview_ended,
    )


@router.post("/end", response_model=EndInterviewResponse)
async def end_interview(request: EndInterviewRequest):
    """
    End interview and provide comprehensive feedback
    - Generates structured feedback
    - Includes cheating summary
    - Calculates final scores
    """
    # Validate interview exists
    if request.interview_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Interview session not found")

    interview = active_interviews[request.interview_id]
    memory_manager = interview["memory_manager"]
    llm_agent = interview["llm_agent"]

    # Get conversation history
    conversation_history = memory_manager.get_conversation_history()

    # Generate final feedback using LLM
    feedback = llm_agent.generate_final_feedback(
        conversation_history=conversation_history,
        role=interview["role"],
        cheating_summary={},
    )

    # Clean up interview session
    del active_interviews[request.interview_id]

    return EndInterviewResponse(
        interview_id=request.interview_id,
        feedback=feedback,
        cheating_summary={},
    )


@router.get("/sessions")
async def list_active_sessions():
    """List all active interview sessions (for debugging)"""
    return {
        "active_sessions": len(active_interviews),
        "sessions": [
            {
                "id": iid,
                "role": data["role"],
                "persona": data["persona"],
                "question_count": data["question_count"],
                "start_time": data["start_time"],
            }
            for iid, data in active_interviews.items()
        ],
    }
