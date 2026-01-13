"""
Memory Manager Service
Manages conversation history and context for interview sessions
"""

from typing import List, Dict, Any


class MemoryManager:
    """
    Manages conversation memory for an interview session
    Stores and retrieves conversation history
    """

    def __init__(self, interview_id: str):
        self.interview_id = interview_id
        self.messages: List[Dict[str, str]] = []
        self.max_history = 50  # Keep last 50 messages

    def add_message(self, role: str, content: str):
        """
        Add a message to conversation history

        Args:
            role: "user" or "assistant"
            content: Message content
        """
        self.messages.append({"role": role, "content": content})

        # Trim history if too long (keep system context)
        if len(self.messages) > self.max_history:
            self.messages = self.messages[-self.max_history :]

    def get_conversation_history(self) -> List[Dict[str, str]]:
        """Get full conversation history"""
        return self.messages.copy()

    def get_recent_messages(self, count: int = 10) -> List[Dict[str, str]]:
        """Get recent messages"""
        return (
            self.messages[-count:]
            if len(self.messages) >= count
            else self.messages.copy()
        )

    def get_user_answers(self) -> List[str]:
        """Extract all user answers from conversation"""
        return [msg["content"] for msg in self.messages if msg["role"] == "user"]

    def get_questions_asked(self) -> List[str]:
        """Extract all questions asked by agent"""
        # Simple heuristic: messages ending with "?"
        return [
            msg["content"]
            for msg in self.messages
            if msg["role"] == "assistant" and "?" in msg["content"]
        ]

    def get_message_count(self) -> int:
        """Get total message count"""
        return len(self.messages)

    def clear_history(self):
        """Clear all conversation history"""
        self.messages = []

    def get_context_summary(self) -> Dict[str, Any]:
        """Get summary of conversation context"""
        user_messages = sum(1 for msg in self.messages if msg["role"] == "user")
        assistant_messages = sum(
            1 for msg in self.messages if msg["role"] == "assistant"
        )

        return {
            "total_messages": len(self.messages),
            "user_messages": user_messages,
            "assistant_messages": assistant_messages,
            "questions_asked": len(self.get_questions_asked()),
        }
