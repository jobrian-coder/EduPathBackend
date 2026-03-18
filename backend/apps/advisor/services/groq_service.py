import os
import json
from groq import Groq
from django.conf import settings

# ─── System prompt ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an empathetic and knowledgeable academic advisor at a Kenyan university.
Your job is to conduct a structured 10-question interview to understand a student's interests,
academic strengths, career aspirations, lifestyle preferences, and constraints — so you can
recommend the best university courses for them.

RULES:
1. Ask EXACTLY one question per turn.
2. Each question must build on the student's previous answers — be adaptive, not scripted.
3. Questions should progressively go: broad interests → specific subjects → career goals → practical constraints (fees, location).
4. Maintain a warm, encouraging, conversational tone.
5. You MUST always output ONLY valid JSON format representing your turn.
6. For your questions (turns 1-9), output exactly this JSON format:
   {"done": false, "question": "Your single question here?", "options": ["Option A", "Option B", "Option C", "Option D"]}
   The 'options' array must contain 3 to 5 realistic multiple-choice paths the student might take.
7. After the 10th answer from the student, DO NOT ask another question. Output exactly this JSON format:
   {"done": true, "profile": "<synthesised student profile as a rich paragraph>"}
   The profile should summarise their interests, strengths, career goals, etc.
8. Do not add any extra text or conversational filler outside the JSON structure.

Begin the interview with a warm greeting and your first question about the student's general interests."""


class GroqInterviewService:
    """Manages the adaptive 10-question Groq interview."""

    MAX_QUESTIONS = 10

    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in settings / .env")
        self.client = Groq(api_key=api_key)

    def start_session(self) -> dict:
        """
        Get the very first question for a new session.
        Returns {"question": str, "question_number": 1, "done": False}
        """
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]
        response = self._call_groq(messages)
        try:
            parsed = json.loads(response)
        except:
            parsed = {"done": False, "question": "Hello! I'm your AI Academic Advisor. What subjects do you enjoy the most in school?", "options": ["Sciences", "Arts", "Business", "Technology"]}
            
        return {
            "question": parsed.get("question", "What are your general interests?"),
            "options": parsed.get("options", []),
            "question_number": 1,
            "done": False,
            "assistant_message": response,
        }

    def next_turn(self, message_history: list, student_answer: str, question_count: int) -> dict:
        """
        Given the rolling message history, append the student's answer,
        call Groq, and return the next question OR the completion signal.

        Returns:
            {
                "question": str | None,
                "question_number": int,
                "done": bool,
                "profile": str | None   # only when done=True
            }
        """
        # Build full message list
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + message_history
        messages.append({"role": "user", "content": student_answer})

        response_text = self._call_groq(messages)

        # We expect parsed JSON back
        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError as e:
            # Fallback
            parsed = {"done": False, "question": "Could you tell me a little more about that?", "options": []}

        if parsed.get("done") or question_count >= self.MAX_QUESTIONS:
            return {
                "question": None,
                "options": [],
                "question_number": question_count,
                "done": True,
                "profile": parsed.get("profile", f"Student answered {question_count} questions. Summary: {student_answer}"),
                "assistant_message": response_text,
            }

        return {
            "question": parsed.get("question", "Understood. What's next?"),
            "options": parsed.get("options", []),
            "question_number": question_count + 1,
            "done": False,
            "profile": None,
            "assistant_message": response_text,
        }

    def _call_groq(self, messages: list) -> str:
        """Call Groq API and return the assistant content string."""
        completion = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.75,
            max_tokens=612,
            response_format={"type": "json_object"},
        )
        return completion.choices[0].message.content.strip()
