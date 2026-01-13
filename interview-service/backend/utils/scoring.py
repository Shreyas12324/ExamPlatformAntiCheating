"""
Scoring Utilities
Provides scoring and evaluation functions for interview performance
"""

from typing import Dict, List, Any


def calculate_final_scores(
    conversation_history: List[Dict[str, str]],
    role: str,
    cheating_summary: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Calculate final interview scores

    This is a fallback scoring system if LLM-based scoring fails.
    In production, LLM should handle most scoring.

    Args:
        conversation_history: List of conversation messages
        role: Interview role
        cheating_summary: Cheating detection summary

    Returns:
        Dictionary with scores and feedback
    """
    # Count user responses
    user_messages = [msg for msg in conversation_history if msg["role"] == "user"]
    num_responses = len(user_messages)

    # Calculate response quality metrics
    avg_response_length = sum(len(msg["content"]) for msg in user_messages) / max(
        num_responses, 1
    )

    # Base technical score on number and length of responses
    technical_score = min(10, max(1, int(num_responses * 1.5)))

    # Communication score based on response length
    if avg_response_length > 200:
        communication_score = 8
    elif avg_response_length > 100:
        communication_score = 6
    else:
        communication_score = 4

    # Confidence score (default mid-range, would need sentiment analysis for accuracy)
    confidence_score = 6

    # Adjust for cheating
    cheating_penalty = min(3, cheating_summary.get("critical_events", 0))
    technical_score = max(1, technical_score - cheating_penalty)

    return {
        "technical_score": technical_score,
        "communication_score": communication_score,
        "confidence_score": confidence_score,
        "overall_summary": generate_summary(
            technical_score, communication_score, confidence_score
        ),
        "strengths": identify_strengths(technical_score, communication_score),
        "weaknesses": identify_weaknesses(
            technical_score, communication_score, cheating_summary
        ),
        "recommendations": generate_recommendations(
            role, technical_score, communication_score
        ),
    }


def generate_summary(technical: int, communication: int, confidence: int) -> str:
    """Generate overall performance summary"""
    avg_score = (technical + communication + confidence) / 3

    if avg_score >= 8:
        return "Excellent performance with strong technical knowledge and communication skills."
    elif avg_score >= 6:
        return "Good performance with solid understanding. Some areas for improvement identified."
    elif avg_score >= 4:
        return "Fair performance. Significant room for improvement in technical depth and communication."
    else:
        return "Needs improvement. Focus on building foundational knowledge and interview skills."


def identify_strengths(technical: int, communication: int) -> List[str]:
    """Identify candidate strengths"""
    strengths = []

    if technical >= 7:
        strengths.append("Strong technical knowledge")
    if communication >= 7:
        strengths.append("Clear and articulate communication")
    if technical >= 5 and communication >= 5:
        strengths.append("Consistent engagement throughout interview")

    # Default strength if none identified
    if not strengths:
        strengths.append("Completed the interview")

    return strengths


def identify_weaknesses(
    technical: int, communication: int, cheating_summary: Dict[str, Any]
) -> List[str]:
    """Identify areas for improvement"""
    weaknesses = []

    if technical < 5:
        weaknesses.append("Technical knowledge needs strengthening")
    if communication < 5:
        weaknesses.append("Communication clarity could be improved")
    if cheating_summary.get("total_events", 0) > 5:
        weaknesses.append("Multiple protocol violations detected")

    # Default weakness if none identified
    if not weaknesses:
        weaknesses.append("Minor areas for refinement")

    return weaknesses


def generate_recommendations(
    role: str, technical: int, communication: int
) -> List[str]:
    """Generate personalized recommendations"""
    recommendations = []

    # Role-specific recommendations
    role_tips = {
        "SDE": "Practice coding problems on platforms like LeetCode and HackerRank",
        "Sales": "Study common sales scenarios and practice pitch delivery",
        "Retail Associate": "Focus on customer service scenarios and conflict resolution",
        "HR": "Review HR policies and practice behavioral interview questions",
    }

    recommendations.append(role_tips.get(role, "Continue practicing interview skills"))

    if technical < 6:
        recommendations.append(
            "Deepen technical knowledge through online courses and practice"
        )

    if communication < 6:
        recommendations.append("Practice articulating thoughts clearly and concisely")

    recommendations.append("Conduct more mock interviews to build confidence")

    return recommendations


def normalize_score(score: float, min_val: float = 0, max_val: float = 100) -> int:
    """Normalize a score to 1-10 scale"""
    normalized = ((score - min_val) / (max_val - min_val)) * 9 + 1
    return max(1, min(10, int(normalized)))
