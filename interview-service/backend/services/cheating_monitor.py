"""
Cheating Monitor Service
Tracks and analyzes cheating events during interviews
"""

from typing import List, Dict, Any
from datetime import datetime


class CheatingMonitor:
    """
    Monitors and tracks cheating events for an interview session
    Provides real-time and cumulative analysis
    """

    def __init__(self, interview_id: str):
        self.interview_id = interview_id
        self.events: List[Dict[str, Any]] = []

    def add_event(self, event_data: Dict[str, Any]):
        """Add a cheating event to the timeline"""
        event_data["logged_at"] = datetime.utcnow().isoformat()
        self.events.append(event_data)

    def get_summary(self) -> Dict[str, Any]:
        """Get current cheating summary (used during interview)"""
        if not self.events:
            return {"total_events": 0, "critical_events": 0, "recent_severity": "low"}

        critical_count = sum(1 for e in self.events if e.get("severity") == "critical")

        # Get most recent severity
        recent_severity = (
            self.events[-1].get("severity", "low") if self.events else "low"
        )

        return {
            "total_events": len(self.events),
            "critical_events": critical_count,
            "recent_severity": recent_severity,
        }

    def get_detailed_summary(self) -> Dict[str, Any]:
        """Get comprehensive cheating summary (used at end of interview)"""
        if not self.events:
            return {
                "total_events": 0,
                "critical_events": 0,
                "face_missing_count": 0,
                "looking_away_count": 0,
                "multiple_faces_count": 0,
                "distance_violations": 0,
                "overall_cheating_probability": 0,
                "timeline": [],
            }

        # Count different event types
        face_missing = sum(1 for e in self.events if e.get("event") == "NO_FACE")
        looking_away = sum(1 for e in self.events if e.get("event") == "LOOKING_AWAY")
        multiple_faces = sum(
            1 for e in self.events if e.get("event") == "MULTIPLE_FACES"
        )
        distance_issues = sum(
            1
            for e in self.events
            if e.get("event") in ["DISTANCE_TOO_CLOSE", "DISTANCE_TOO_FAR"]
        )
        critical = sum(1 for e in self.events if e.get("severity") == "critical")

        # Calculate overall probability
        probability = self._calculate_cheating_probability(
            len(self.events),
            critical,
            multiple_faces,
            face_missing,
            looking_away,
            distance_issues,
        )

        return {
            "total_events": len(self.events),
            "critical_events": critical,
            "face_missing_count": face_missing,
            "looking_away_count": looking_away,
            "multiple_faces_count": multiple_faces,
            "distance_violations": distance_issues,
            "overall_cheating_probability": probability,
            "timeline": self.events,
        }

    def _calculate_cheating_probability(
        self,
        total: int,
        critical: int,
        multiple_faces: int,
        no_face: int,
        looking_away: int,
        distance: int,
    ) -> int:
        """Calculate overall cheating probability (0-100)"""
        if total == 0:
            return 0

        # Weighted scoring
        score = (
            critical * 20
            + multiple_faces * 15
            + no_face * 10
            + looking_away * 5
            + distance * 3
        )

        # Cap at 100
        return min(100, score)

    def has_critical_violations(self) -> bool:
        """Check if there are any critical violations"""
        return any(e.get("severity") == "critical" for e in self.events)

    def get_violation_count(self) -> int:
        """Get total number of violations"""
        return len(self.events)
