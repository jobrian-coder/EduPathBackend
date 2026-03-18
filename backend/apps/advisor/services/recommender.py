"""
RecommenderService — Stage-2 of the RAG pipeline.

Takes a completed student profile string, queries ChromaDB,
applies diversity reranking, then calls Groq for personalised
reranking and explanation generation.  Returns the top-5 courses
as a structured JSON payload.
"""

import json
from groq import Groq
from django.conf import settings
from .vector_service import CourseVectorStore

# ─── Reranking prompt ─────────────────────────────────────────────────────────
RERANK_SYSTEM = """You are an expert Kenyan university admissions advisor.
You will be given a student profile and a list of candidate university courses.
Your task is to select and rank the TOP 5 courses that best match the student.

OUTPUT RULES — CRITICAL:
- Output ONLY a valid JSON array. No prose, no markdown, no code fences.
- The array must contain EXACTLY 5 objects.
- Each object must have these exact keys (no others):
  {
    "rank": <1-5>,
    "course_name": "<name>",
    "institution": "<institution or 'Various universities'>",
    "hub_category": "<category>",
    "match_explanation": "<2-3 sentence personalised explanation>",
    "career_paths": ["<career1>", "<career2>", "<career3>"],
    "cutoff_2023": <number or null>,
    "cutoff_2022": <number or null>,
    "avg_fees_ksh": <number or null>,
    "match_score": <integer 1-100>
  }
- Use only information from the provided candidates; do not invent courses.
- If a field is missing in the candidate data, use null."""


class RecommenderService:
    """Orchestrates the full Stage-2 RAG pipeline."""

    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in settings / .env")
        self.client = Groq(api_key=api_key)
        self.vector_store = CourseVectorStore()

    def recommend(self, profile_text: str) -> list[dict]:
        """
        Full pipeline:
          1. Query ChromaDB → top 25
          2. Diversity rerank → top 15
          3. Groq rerank + explain → top 5
        Returns list of 5 dicts.
        """
        # Stage 2a — vector retrieval
        hits = self.vector_store.query(profile_text, n_results=25)
        if not hits:
            return []

        # Stage 2b — diversity rerank
        shortlist = self.vector_store.diversity_rerank(hits, n=15)

        # Stage 2c — Groq personalised rerank
        candidates_text = self._format_candidates(shortlist)

        user_message = (
            f"STUDENT PROFILE:\n{profile_text}\n\n"
            f"CANDIDATE COURSES:\n{candidates_text}\n\n"
            "Return the JSON array of the top 5 recommendations."
        )

        messages = [
            {"role": "system", "content": RERANK_SYSTEM},
            {"role": "user", "content": user_message},
        ]

        raw = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
        ).choices[0].message.content.strip()

        return self._parse_recommendations(raw)

    def _format_candidates(self, shortlist: list[dict]) -> str:
        """Format the shortlist into a numbered text block for the LLM."""
        lines = []
        for i, hit in enumerate(shortlist, 1):
            m = hit["metadata"]
            lines.append(
                f"{i}. {m.get('course_name', 'Unknown')} | "
                f"Category: {m.get('hub_category', '?')} | "
                f"Institution: {m.get('institution', 'Various')} | "
                f"Cutoff 2023: {m.get('cutoff_2023', 'N/A')} | "
                f"Cutoff 2022: {m.get('cutoff_2022', 'N/A')} | "
                f"Fees (KSh): {m.get('avg_fees_ksh', 'N/A')} | "
                f"Careers: {m.get('careers', '')}"
            )
        return "\n".join(lines)

    def _parse_recommendations(self, raw: str) -> list[dict]:
        """
        Extract the JSON array from the Groq response.
        Tries direct parse first, then looks for the array inside the text.
        """
        # Try direct parse
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass

        # Look for array between [ and ]
        start = raw.find("[")
        end = raw.rfind("]")
        if start != -1 and end != -1:
            try:
                data = json.loads(raw[start:end + 1])
                if isinstance(data, list):
                    return data
            except json.JSONDecodeError:
                pass

        # Fallback — return empty so the view can handle it gracefully
        return []
