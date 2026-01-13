"""
Questionnaire Service
Manages role-specific question banks and question flow
"""

from typing import List, Optional
from utils.role_data import get_questions_for_role
import random


class Questionnaire:
    """
    Manages interview questions for different roles
    Provides sequential and adaptive question selection
    """

    def __init__(self, role: str):
        self.role = role
        self.questions = get_questions_for_role(role)
        self.current_index = 0
        self.asked_questions: List[str] = []

    def get_next_question(self) -> Optional[str]:
        """
        Get the next question in the sequence

        Returns:
            Next question string or None if no more questions
        """
        if self.current_index >= len(self.questions):
            return None

        question = self.questions[self.current_index]
        self.asked_questions.append(question)
        self.current_index += 1

        return question

    def get_random_question(self, exclude_asked: bool = True) -> Optional[str]:
        """
        Get a random question from the pool

        Args:
            exclude_asked: If True, only return questions not yet asked

        Returns:
            Random question or None
        """
        available_questions = self.questions

        if exclude_asked:
            available_questions = [
                q for q in self.questions if q not in self.asked_questions
            ]

        if not available_questions:
            return None

        question = random.choice(available_questions)
        if question not in self.asked_questions:
            self.asked_questions.append(question)

        return question

    def get_remaining_count(self) -> int:
        """Get number of questions remaining"""
        return len(self.questions) - self.current_index

    def get_asked_count(self) -> int:
        """Get number of questions asked"""
        return len(self.asked_questions)

    def has_more_questions(self) -> bool:
        """Check if more questions are available"""
        return self.current_index < len(self.questions)

    def reset(self):
        """Reset questionnaire state"""
        self.current_index = 0
        self.asked_questions = []

    def get_all_questions(self) -> List[str]:
        """Get all questions for this role"""
        return self.questions.copy()
