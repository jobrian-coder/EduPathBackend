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
RERANK_SYSTEM = """You are a Kenyan university admissions advisor. Rank the TOP 5 courses from the provided candidates that best match the student profile.

OUTPUT: a valid JSON array only — no prose, no markdown, no code fences.
EXACTLY 5 objects, each with:
{"rank":<1-5>,"course_name":"","institution":"","hub_category":"","match_explanation":"<2 sentences>","career_paths":["","",""],"cutoff_2023":<n|null>,"cutoff_2022":<n|null>,"avg_fees_ksh":<n|null>,"match_score":<1-100>}
Use only data from candidates. Null for missing fields."""


class RecommenderService:
    """Orchestrates the full Stage-2 RAG pipeline."""

    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in settings / .env")
        self.client = Groq(api_key=api_key)
        self.vector_store = CourseVectorStore()

    def recommend(self, profile_text: str, academic_profile=None) -> list[dict]:
        """
        Full pipeline:
          1. Query ChromaDB → top 25
          2. Filter by cluster points eligibility if academic_profile provided
          3. Diversity rerank → top 15
          4. Groq rerank + explain → top 5
        Returns list of 5 dicts.
        """
        # Stage 2a — vector retrieval
        hits = self.vector_store.query(profile_text, n_results=15)
        if not hits:
            return []

        # Stage 2b — filter by cluster points eligibility if profile available
        if academic_profile and academic_profile.kcse_mean_points:
            hits = self._filter_by_eligibility(hits, academic_profile)

        if not hits:
            return []

        # Stage 2c — diversity rerank
        shortlist = self.vector_store.diversity_rerank(hits, n=8)

        # Stage 2d — Groq personalised rerank
        candidates_text = self._format_candidates(shortlist, academic_profile)

        # Include academic info in the prompt if available
        academic_info = ""
        if academic_profile:
            if academic_profile.kcse_mean_points:
                academic_info += f"\nStudent KCSE Mean Points: {academic_profile.kcse_mean_points}/84"
            if academic_profile.kcse_grades:
                grades_str = ", ".join([f"{k}: {v}" for k, v in list(academic_profile.kcse_grades.items())[:5]])
                academic_info += f"\nTop Subject Grades: {grades_str}"

        user_message = (
            f"STUDENT PROFILE:\n{profile_text}{academic_info}\n\n"
            f"CANDIDATE COURSES:\n{candidates_text}\n\n"
            "Return the JSON array of the top 5 recommendations."
        )

        messages = [
            {"role": "system", "content": RERANK_SYSTEM},
            {"role": "user", "content": user_message},
        ]

        raw = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.2,
            max_tokens=900,
        ).choices[0].message.content.strip()

        return self._parse_recommendations(raw)

    def _filter_by_eligibility(self, hits: list[dict], academic_profile) -> list[dict]:
        """Filter courses by cluster points eligibility."""
        mean_points = academic_profile.kcse_mean_points
        if not mean_points:
            return hits

        # Estimate cluster points from mean points (rough conversion)
        # Cluster points typically range from 0-48, mean points 0-84
        estimated_cluster = min(48, float(mean_points) * 0.57)

        filtered = []
        for hit in hits:
            m = hit.get("metadata", {})
            cutoff_2023 = m.get("cutoff_2023")
            cutoff_2022 = m.get("cutoff_2022")

            # Include courses with missing cutoff data (can't filter them out)
            if cutoff_2023 is None and cutoff_2022 is None:
                filtered.append(hit)
                continue

            # Use the most recent cutoff
            cutoff = cutoff_2023 or cutoff_2022 or 0

            # More lenient filtering: allow courses within 15% below cutoff
            # This accounts for estimation errors and year-to-year variation
            if estimated_cluster >= float(cutoff) * 0.80:  # Within 80% of cutoff (was 85%)
                filtered.append(hit)

        # Only use filtered results if we have enough, otherwise return original
        # This prevents over-filtering from removing all viable options
        if len(filtered) >= 8:
            return filtered
        elif len(filtered) >= 3:
            # Pad with top non-filtered courses to ensure diversity
            missing = 8 - len(filtered)
            original_ids = {h.get('id') for h in filtered}
            for hit in hits:
                if hit.get('id') not in original_ids and missing > 0:
                    filtered.append(hit)
                    missing -= 1
            return filtered
        else:
            # Filtered too aggressively, return original with a warning
            print(f"[Recommender] Eligibility filtering too aggressive. "
                  f"Mean points: {mean_points}, Estimated cluster: {estimated_cluster:.1f}. "
                  f"Returning unfiltered results.")
            return hits

    def _format_candidates(self, shortlist: list[dict], academic_profile=None) -> str:
        """Format the shortlist into a numbered text block for the LLM."""
        lines = []

        # Add eligibility context
        if academic_profile and academic_profile.kcse_mean_points:
            lines.append(f"Note: Student has KCSE mean points of {academic_profile.kcse_mean_points}/84")
            lines.append("")

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
