"""
Role Data Management
Provides role-specific questions, rubrics, and context
"""

from typing import List, Dict, Any

# Role-specific question banks
ROLE_QUESTIONS = {
    "SDE": [
        "Tell me about yourself and your experience with software development.",
        "Explain the difference between a process and a thread.",
        "What is your experience with data structures? Can you explain when you'd use a queue?",
        "Describe a challenging bug you've encountered and how you debugged it.",
        "How do you ensure code quality in your projects?",
        "Explain the concept of REST APIs and how you've used them.",
        "What is your approach to learning new technologies?",
    ],
    "Sales": [
        "Tell me about your experience in sales.",
        "How do you handle objections from potential customers?",
        "Describe a time when you successfully closed a difficult deal.",
        "What strategies do you use to build rapport with clients?",
        "How do you prioritize your sales pipeline?",
        "Tell me about a time you failed to meet a sales target. What did you learn?",
        "How do you stay motivated in a competitive sales environment?",
    ],
    "Retail Associate": [
        "Tell me about your customer service experience.",
        "How would you handle an angry or frustrated customer?",
        "Describe a time when you went above and beyond for a customer.",
        "How do you handle multiple customers at once during busy periods?",
        "What would you do if you suspected a customer of shoplifting?",
        "How do you stay knowledgeable about products you're selling?",
        "Why do you want to work in retail?",
    ],
    "HR": [
        "Tell me about your HR experience and areas of expertise.",
        "How do you handle confidential employee information?",
        "Describe your approach to resolving workplace conflicts.",
        "What strategies do you use for effective employee onboarding?",
        "How do you stay updated on labor laws and HR best practices?",
        "Tell me about a difficult employee situation you've handled.",
        "How do you promote diversity and inclusion in the workplace?",
    ],
}

# Role-specific context and expectations
ROLE_CONTEXT = {
    "SDE": "Software Engineer interviews focus on technical knowledge, problem-solving, coding ability, and system design understanding.",
    "Sales": "Sales interviews assess communication skills, persuasion ability, customer relationship management, and target-driven mindset.",
    "Retail Associate": "Retail interviews evaluate customer service skills, multitasking ability, product knowledge, and handling difficult situations.",
    "HR": "HR interviews focus on interpersonal skills, confidentiality, conflict resolution, policy knowledge, and employee relations.",
}

# Scoring rubrics for each role
SCORING_RUBRICS = {
    "SDE": {
        "technical_knowledge": "Understanding of programming concepts, data structures, algorithms",
        "problem_solving": "Ability to break down problems and think through solutions",
        "communication": "Explaining technical concepts clearly",
        "experience": "Relevant project experience and practical application",
    },
    "Sales": {
        "persuasion": "Ability to convince and influence",
        "communication": "Clear, confident, and engaging speaking style",
        "customer_focus": "Understanding of customer needs and pain points",
        "results_orientation": "Track record and approach to meeting targets",
    },
    "Retail Associate": {
        "customer_service": "Friendliness, patience, and problem-solving for customers",
        "multitasking": "Ability to handle multiple tasks efficiently",
        "product_knowledge": "Interest in learning about products",
        "teamwork": "Ability to work well with others",
    },
    "HR": {
        "interpersonal_skills": "Empathy, active listening, relationship building",
        "policy_knowledge": "Understanding of HR practices and compliance",
        "conflict_resolution": "Ability to mediate and resolve disputes",
        "confidentiality": "Discretion and professional judgment",
    },
}


def get_questions_for_role(role: str) -> List[str]:
    """Get question bank for a specific role"""
    return ROLE_QUESTIONS.get(role, ROLE_QUESTIONS["SDE"]).copy()


def get_role_context(role: str) -> str:
    """Get context description for a role"""
    return ROLE_CONTEXT.get(role, ROLE_CONTEXT["SDE"])


def get_scoring_rubric(role: str) -> Dict[str, str]:
    """Get scoring rubric for a role"""
    return SCORING_RUBRICS.get(role, SCORING_RUBRICS["SDE"]).copy()


def get_available_roles() -> List[str]:
    """Get list of all available roles"""
    return list(ROLE_QUESTIONS.keys())


def validate_role(role: str) -> bool:
    """Validate if a role is supported"""
    return role in ROLE_QUESTIONS


def get_role_summary(role: str) -> Dict[str, Any]:
    """Get comprehensive information about a role"""
    if not validate_role(role):
        return None

    return {
        "role": role,
        "context": get_role_context(role),
        "num_questions": len(ROLE_QUESTIONS[role]),
        "rubric": get_scoring_rubric(role),
        "sample_questions": ROLE_QUESTIONS[role][:3],
    }
