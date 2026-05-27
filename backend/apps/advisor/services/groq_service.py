import os
import json
from groq import Groq
from django.conf import settings


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


# ─────────────────────────────────────────────────────────────────────────────
# Context block builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_context_block(context: dict) -> str:
    """
    Format the student's pre-loaded profile data into a readable text block
    that is appended to the system prompt before the first question.

    Parameters
    ----------
    context : dict
        Expected shape (all keys optional):
        {
            "career_interests": ["AI Research", "Healthcare"],
            "hobbies": ["Robotics", "Reading"],
            "kcse_mean_points": 72.4,
            "kcse_grades": {"MATH": "A", "BIO": "A-", "ENG": "B+"},
            "career_goals": "Work in health technology",
            "kcse_year": 2023,
            "kcse_school": "Alliance High School"
        }

    Returns
    -------
    str  — formatted multiline block, or empty string if context is empty/None
    """
    if not context:
        return ""

    lines = [
        "",
        "\u2501" * 60,
        "STUDENT PROFILE (pre-loaded from EduPath profile — use this as your baseline context):",
    ]

    # Interests
    career_interests = context.get("career_interests") or []
    hobbies = context.get("hobbies") or []
    all_interests = list(career_interests) + list(hobbies)
    if all_interests:
        lines.append(f"  • Declared interests / hobbies: {', '.join(all_interests)}")

    # Grades
    mean = context.get("kcse_mean_points")
    if mean is not None:
        lines.append(f"  • KCSE Mean Points: {float(mean):.1f} / 84")

    grades = context.get("kcse_grades") or {}
    if grades:
        grade_str = ", ".join(f"{subj} ({grade})" for subj, grade in list(grades.items())[:6])
        lines.append(f"  • Subject grades (sample): {grade_str}")

    # Career goals
    goals = context.get("career_goals") or ""
    if goals.strip():
        lines.append(f"  • Career goals: \"{goals.strip()}\"")

    # School / year
    school = context.get("kcse_school") or ""
    year = context.get("kcse_year") or ""
    if school or year:
        detail = " | ".join(filter(None, [str(school), str(year)]))
        lines.append(f"  • KCSE: {detail}")

    lines += [
        "\u2501" * 60,
        "",
        "IMPORTANT: Because you already know the student's interests and academic background,",
        "DO NOT waste questions on basic interest discovery. Instead, use your questions to:",
        "  1. Understand HOW they want to apply their interests (applied vs research vs creative vs business)",
        "  2. Explore practical constraints: preferred location, annual fees budget, institution size",
        "  3. Lifestyle preferences: campus housing, city vs rural, part-time vs full-time",
        "  4. Career timeline: 4-year degree vs 3-year diploma vs certificate",
        "  5. International aspirations: plan to work in Kenya or abroad?",
        "  6. Backup interests: any completely different field they would consider?",
        "  7. Learning style: hands-on/lab-based vs classroom/theory-based",
        "",
        "Rotate across DIFFERENT axes each question — do NOT drill deeper into a single topic.",
        "Your first question should acknowledge their interests briefly, then explore a NEW dimension.",
        "\u2501" * 60,
    ]

    return "\n".join(lines)


class GroqInterviewService:
    """
    Manages the adaptive 10-question Groq interview.

    Key change (interests integration):
    ------------------------------------
    Both start_session() and next_turn() now accept an optional `context` dict
    containing the student's pre-loaded profile data (interests, KCSE grades,
    career goals, etc.).  This context is appended to the base SYSTEM_PROMPT via
    _build_context_block() so the LLM enters Q1 already knowing the student,
    avoiding the narrow-scope problem caused by sequential question tunneling.
    """

    MAX_QUESTIONS = 10

    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in settings / .env")
        self.client = Groq(api_key=api_key)

    def _build_system_prompt(self, context: dict = None) -> str:
        """
        Combine the base SYSTEM_PROMPT with an optional student context block.
        If no context is provided, returns the original prompt unchanged (backward compatible).
        """
        context_block = _build_context_block(context or {})
        return SYSTEM_PROMPT + context_block

    def start_session(self, context: dict = None) -> dict:
        """
        Get the very first question for a new session.

        Parameters
        ----------
        context : dict, optional
            Pre-loaded student profile data (interests, grades, career goals).
            When provided, the system prompt is enriched so Q1 is personalised
            and the LLM skips basic interest discovery entirely.

        Returns
        -------
        dict  — {"question": str, "question_number": 1, "done": False, "options": [...]}
        """
        enriched_prompt = self._build_system_prompt(context)
        messages = [
            {"role": "system", "content": enriched_prompt},
        ]
        response = self._call_groq(messages)
        try:
            parsed = json.loads(response)
        except Exception:
            parsed = {
                "done": False,
                "question": "Hello! I'm your AI Academic Advisor. What subjects do you enjoy the most in school?",
                "options": ["Sciences", "Arts", "Business", "Technology"],
            }

        return {
            "question": parsed.get("question", "What are your general interests?"),
            "options": parsed.get("options", []),
            "question_number": 1,
            "done": False,
            "assistant_message": response,
        }

    def next_turn(self, message_history: list, student_answer: str, question_count: int, context: dict = None) -> dict:
        """
        Given the rolling message history, append the student's answer,
        call Groq, and return the next question OR the completion signal.

        Parameters
        ----------
        message_history : list   — list of {"role": ..., "content": ...} dicts
        student_answer  : str    — the student's latest reply
        question_count  : int    — how many questions have been asked so far
        context         : dict, optional
            Same context dict passed at session start. Re-injected on every turn
            so the LLM never forgets the student's background mid-conversation.

        Returns
        -------
        dict — {question, options, question_number, done, profile (if done)}
        """
        enriched_prompt = self._build_system_prompt(context)
        messages = [{"role": "system", "content": enriched_prompt}] + message_history
        messages.append({"role": "user", "content": student_answer})

        response_text = self._call_groq(messages)

        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError:
            if question_count >= self.MAX_QUESTIONS:
                return {
                    "question": None,
                    "options": [],
                    "question_number": question_count,
                    "done": True,
                    "profile": f"Student completed {question_count} questions. Final answer: {student_answer}",
                    "assistant_message": response_text,
                }
            parsed = {"done": False, "question": "Could you tell me a little more about that?", "options": []}

        is_done = parsed.get("done") or question_count >= self.MAX_QUESTIONS

        if is_done:
            profile = parsed.get("profile")
            if not profile or not profile.strip():
                profile = self._generate_fallback_profile(message_history, student_answer, question_count)

            return {
                "question": None,
                "options": [],
                "question_number": question_count,
                "done": True,
                "profile": profile,
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

    def _generate_fallback_profile(self, message_history: list, last_answer: str, question_count: int) -> str:
        """Generate a synthetic profile when Groq fails to return one."""
        answers = [msg["content"] for msg in message_history if msg.get("role") == "user"]
        answers.append(last_answer)
        
        return (
            f"Student Profile (based on {question_count} questions): "
            f"The student provided insights across {question_count} areas including: "
            f"{', '.join(answers[:3])}{'...' if len(answers) > 3 else ''}. "
            f"Their final response indicated: {last_answer}. "
            f"This profile suggests interests in subjects they've discussed throughout the interview."
        )

    def _call_groq(self, messages: list) -> str:
        """Call Groq API and return the assistant content string."""
        completion = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.85,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )
        return completion.choices[0].message.content.strip()
