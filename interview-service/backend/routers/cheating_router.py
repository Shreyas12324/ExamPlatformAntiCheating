"""
Cheating Router
Handles cheating detection logging and timeline retrieval
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
from utils.config import settings

router = APIRouter()

# In-memory storage for cheating events (use Redis/DB in production)
cheating_timelines: Dict[str, List[Dict[str, Any]]] = {}


# Pydantic models
class CheatingLogRequest(BaseModel):
    interview_id: str
    frame_data: str  # Base64 encoded image
    timestamp: Optional[str] = None


class CheatingLogResponse(BaseModel):
    interview_id: str
    event_logged: bool
    detection_result: Dict[str, Any]
    severity: str


class CheatingTimelineResponse(BaseModel):
    interview_id: str
    total_events: int
    timeline: List[Dict[str, Any]]
    summary: Dict[str, Any]


@router.post("/log", response_model=CheatingLogResponse)
async def log_cheating_event(request: CheatingLogRequest):
    """
    Log a cheating detection event
    - Sends frame to ML service for analysis
    - Stores event in timeline
    - Returns detection result
    """
    # Use provided timestamp or generate new one
    timestamp = request.timestamp or datetime.utcnow().isoformat()

    # Initialize timeline for this interview if not exists
    if request.interview_id not in cheating_timelines:
        cheating_timelines[request.interview_id] = []

    try:
        # Decode base64 image
        import base64

        image_bytes = base64.b64decode(request.frame_data)

        # Call ML service for face detection with multipart/form-data
        async with httpx.AsyncClient(timeout=10.0) as client:
            files = {"image": ("frame.jpg", image_bytes, "image/jpeg")}
            ml_response = await client.post(
                f"{settings.ML_SERVICE_URL}/ml/check_face", files=files
            )
            ml_response.raise_for_status()
            detection_result = ml_response.json()

        # Determine event type based on detection result
        event_type = determine_event_type(detection_result)
        severity = detection_result.get("severity", "low")

        # Create event entry
        event_entry = {
            "timestamp": timestamp,
            "event": event_type,
            "severity": severity,
            "num_faces": detection_result.get("num_faces", 0),
            "mobile_detected": detection_result.get("mobile_detected", False),
            "issues": detection_result.get("issues", []),
            "cheating_score": detection_result.get("cheating_score", 0),
            "message": detection_result.get("message", ""),
        }

        # Log all events internally for backend tracking
        cheating_timelines[request.interview_id].append(event_entry)

        # Notify frontend for critical events (mobile, multiple faces)
        critical_events = ["MOBILE_DEVICE_DETECTED", "MULTIPLE_FACES"]
        event_logged = event_type in critical_events

        return CheatingLogResponse(
            interview_id=request.interview_id,
            event_logged=event_logged,
            detection_result=detection_result,
            severity=severity,
        )

    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"ML service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing cheating detection: {str(e)}"
        )


@router.get("/timeline/{interview_id}", response_model=CheatingTimelineResponse)
async def get_cheating_timeline(interview_id: str):
    """
    Retrieve complete cheating timeline for an interview
    - Returns all logged events
    - Provides summary statistics
    """
    if interview_id not in cheating_timelines:
        # Return empty timeline if no events logged
        return CheatingTimelineResponse(
            interview_id=interview_id,
            total_events=0,
            timeline=[],
            summary={
                "total_events": 0,
                "critical_events": 0,
                "face_missing_count": 0,
                "looking_away_count": 0,
                "multiple_faces_count": 0,
                "distance_violations": 0,
                "overall_cheating_probability": 0,
            },
        )

    timeline = cheating_timelines[interview_id]

    # Calculate summary statistics
    summary = calculate_cheating_summary(timeline)

    return CheatingTimelineResponse(
        interview_id=interview_id,
        total_events=len(timeline),
        timeline=timeline,
        summary=summary,
    )


@router.delete("/timeline/{interview_id}")
async def clear_timeline(interview_id: str):
    """Clear cheating timeline for an interview (cleanup)"""
    if interview_id in cheating_timelines:
        del cheating_timelines[interview_id]
        return {"message": "Timeline cleared", "interview_id": interview_id}
    return {"message": "No timeline found", "interview_id": interview_id}


# Helper functions
def determine_event_type(detection_result: Dict[str, Any]) -> str:
    """Determine cheating event type from ML service response"""
    num_faces = detection_result.get("num_faces", 0)
    severity = detection_result.get("severity", "low")
    issues = detection_result.get("issues", [])
    mobile_detected = detection_result.get("mobile_detected", False)

    # Report critical events: mobile detection and multiple faces
    if mobile_detected:
        return "MOBILE_DEVICE_DETECTED"

    if num_faces > 1:
        return "MULTIPLE_FACES"

    if num_faces == 0:
        return "NO_FACE_INTERNAL"

    # Check issues for internal tracking
    for issue in issues:
        issue_lower = issue.lower()
        if "not centered" in issue_lower or "looking away" in issue_lower:
            return "LOOKING_AWAY_INTERNAL"
        if "eyes not" in issue_lower or "gaze away" in issue_lower:
            return "LOOKING_AWAY_INTERNAL"
        if "too far" in issue_lower:
            return "DISTANCE_TOO_FAR_INTERNAL"
        if "too close" in issue_lower:
            return "DISTANCE_TOO_CLOSE_INTERNAL"

    return "NORMAL"


def calculate_cheating_summary(timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate summary statistics from cheating timeline"""
    total_events = len(timeline)
    critical_events = sum(1 for e in timeline if e["severity"] == "critical")
    face_missing_count = sum(1 for e in timeline if e["event"] == "NO_FACE")
    looking_away_count = sum(1 for e in timeline if e["event"] == "LOOKING_AWAY")
    multiple_faces_count = sum(1 for e in timeline if e["event"] == "MULTIPLE_FACES")
    distance_violations = sum(
        1 for e in timeline if e["event"] in ["DISTANCE_TOO_CLOSE", "DISTANCE_TOO_FAR"]
    )

    # Calculate overall cheating probability
    if total_events == 0:
        probability = 0
    else:
        # Weight different violations
        score = (
            critical_events * 20
            + multiple_faces_count * 15
            + face_missing_count * 10
            + looking_away_count * 5
            + distance_violations * 3
        )
        probability = min(100, score)

    return {
        "total_events": total_events,
        "critical_events": critical_events,
        "face_missing_count": face_missing_count,
        "looking_away_count": looking_away_count,
        "multiple_faces_count": multiple_faces_count,
        "distance_violations": distance_violations,
        "overall_cheating_probability": probability,
    }
