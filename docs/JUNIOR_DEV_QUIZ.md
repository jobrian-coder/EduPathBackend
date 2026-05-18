# Junior Developer Quiz: EduGuide AI System

**18 Questions (Code + Algorithm + API)**

---

## SECTION 1: GROQ API & LLM Integration (6 questions)

### Q1: API Key Handling
**Question**: In `groq_service.py`, what happens if `GROQ_API_KEY` is not set in the environment?

**Answer**: 
```python
# Line 36-38 in groq_service.py
api_key = settings.GROQ_API_KEY
if not api_key:
    raise ValueError("GROQ_API_KEY is not set in settings / .env")
```
The `GroqInterviewService.__init__()` raises a `ValueError` with a clear message telling the developer to set the API key.

---

### Q2: Temperature Settings
**Question**: Why does the interview use `temperature=0.75` but the recommender uses `temperature=0.3`?

**Answer**:
- **Interview (0.75)**: Higher temperature = more creative, varied questions. We want adaptive, conversational responses that feel natural.
- **Recommender (0.3)**: Lower temperature = more deterministic, consistent output. We need strict JSON format and reliable rankings.

---

### Q3: Response Format Enforcement
**Question**: How do we force Groq to return JSON? Show the exact code.

**Answer**:
```python
# Line 147 in groq_service.py
completion = self.client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=messages,
    temperature=0.75,
    max_tokens=612,
    response_format={"type": "json_object"},  # ← This enforces JSON output
)
```

---

### Q4: Fallback Handling
**Question**: In `next_turn()`, what happens if Groq returns malformed JSON on the 10th question?

**Answer**:
```python
# Lines 84-94 in groq_service.py
try:
    parsed = json.loads(response_text)
except json.JSONDecodeError as e:
    if question_count >= self.MAX_QUESTIONS:
        return {
            "question": None,
            "options": [],
            "question_number": question_count,
            "done": True,
            "profile": f"Student completed {question_count} questions. Final answer: {student_answer}",
            "assistant_message": response_text,
        }
```
If JSON parsing fails on the final question, it forces completion with a synthetic profile built from the last answer.

---

### Q5: System Prompt Purpose
**Question**: What are the 3 key rules in `SYSTEM_PROMPT` that Groq must follow?

**Answer**:
1. **Ask exactly one question per turn** (Rule #1)
2. **Output ONLY valid JSON** - no prose, no markdown (Rule #5)
3. **After 10th answer, return `"done": true` with profile** (Rule #7)

---

### Q6: Model Selection
**Question**: What model do we use and why? What happens if we switch to a cheaper model?

**Answer**:
- **Model**: `llama-3.3-70b-versatile` (70B parameters)
- **Why**: Large context window, good at following JSON instructions, understands complex academic domains
- **If cheaper model used**: Risk of:
  - Not following JSON format strictly
  - Less coherent questions
  - Worse profile synthesis
  - JSON parsing errors increase

---

## SECTION 2: Vector Database & ChromaDB (5 questions)

### Q7: Lazy Loading Pattern
**Question**: Why do we use singleton pattern (`_client`, `_collection`, `_embedder`) instead of initializing in `__init__`?

**Answer**:
```python
# Lines 18-21 and 37-56 in vector_service.py
# Avoids reloading the model/database on every request
# SentenceTransformer model is ~80MB - loading it every request would be slow
# ChromaDB connection is persistent

def _get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL_NAME)
    return _embedder
```
Keeps Django startup fast and prevents memory leaks from loading duplicate models.

---

### Q8: Embedding Model
**Question**: What embedding model do we use and what are its output dimensions?

**Answer**:
```python
# Line 15 in vector_service.py
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
```
- **Model**: `all-MiniLM-L6-v2` (SentenceTransformer/HuggingFace)
- **Output**: 384-dimensional vectors
- **Why**: Fast, small, good quality for semantic search

---

### Q9: Query Method Logic
**Question**: Explain the `query()` method step-by-step. What does `collection.query()` return?

**Answer**:
```python
def query(self, profile_text: str, n_results: int = 25) -> list[dict]:
    # 1. Convert text to embedding vector
    query_embedding = embedder.encode(profile_text).tolist()
    
    # 2. Search ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(n_results, collection.count() or 1),
        include=["metadatas", "documents", "distances"],
    )
    
    # 3. Returns dict with keys: ids, distances, metadatas, documents
    # Each is a list of lists (outer = queries, inner = results)
```

---

### Q10: Diversity Reranking Algorithm
**Question**: How does `diversity_rerank()` work? What's the trade-off?

**Answer**:
```python
def diversity_rerank(self, hits: list[dict], n: int = 15) -> list[dict]:
    category_counts: dict[str, int] = {}
    reranked = []
    for hit in hits:
        cat = hit["metadata"].get("hub_category", "Other")
        count = category_counts.get(cat, 0)
        if count < 2:  # Max 2 per category
            reranked.append(hit)
            category_counts[cat] = count + 1
        if len(reranked) >= n:
            break
    return reranked
```
- **Logic**: Limits to 2 courses per category to ensure variety
- **Trade-off**: May exclude highly-relevant courses if they're all in one category

---

### Q11: Metadata Storage
**Question**: What metadata fields are stored with each vector? Why include both 2022 and 2023 cutoffs?

**Answer**:
```python
metadata = {
    "course_name": "...",      # For display
    "institution": "...",      # For filtering
    "hub_category": "...",     # For diversity reranking
    "cutoff_2023": 42.5,       # For eligibility checking
    "cutoff_2022": 41.8,       # Fallback if 2023 missing
    "avg_fees_ksh": 120000,    # For cost consideration
    "careers": "...",          # For career matching
}
```
Both cutoffs stored because:
- Some courses may not have 2023 data yet
- Shows trend year-over-year
- Fallback for eligibility calculation

---

## SECTION 3: RAG Pipeline Algorithm (4 questions)

### Q12: Stage Breakdown
**Question**: List the 4 stages of the recommendation pipeline in order.

**Answer**:
```
Stage 1: Query ChromaDB → top 25 courses by semantic similarity
Stage 2: Filter by eligibility (if KCSE grades available)
Stage 3: Diversity rerank → top 15 (max 2 per category)
Stage 4: Groq rerank + explain → final top 5
```

---

### Q13: Eligibility Filter Math
**Question**: How is cluster points estimated from KCSE mean points? Show the formula.

**Answer**:
```python
# Line 117 in recommender.py
estimated_cluster = min(48, float(mean_points) * 0.57)

# Formula: estimated_cluster = min(48, mean_points × 0.57)
# Example: 70 mean points → min(48, 39.9) = 39.9 cluster points

# Then check against cutoff (80% threshold):
if estimated_cluster >= cutoff * 0.80:
    include_course()
```
- 0.57 is a rough conversion factor (KCSE 0-84 → cluster 0-48)
- 80% threshold accounts for estimation errors

---

### Q14: Fallback Logic
**Question**: What happens if eligibility filtering removes too many courses?

**Answer**:
```python
# Lines 140-156 in recommender.py
if len(filtered) >= 8:
    return filtered
elif len(filtered) >= 3:
    # Pad with top non-filtered courses
    missing = 8 - len(filtered)
    for hit in hits:
        if hit.get('id') not in original_ids and missing > 0:
            filtered.append(hit)
            missing -= 1
    return filtered
else:
    # Return unfiltered with warning
    print(f"[Recommender] Eligibility filtering too aggressive...")
    return hits
```
- If < 3 courses pass filter → return all 25 (don't over-filter)
- If 3-7 courses → pad with top non-filtered to get 8
- If 8+ courses → use filtered results

---

### Q15: Prompt Engineering
**Question**: In `recommender.py`, what information is sent to Groq in the user message?

**Answer**:
```python
# Lines 89-93 in recommender.py
user_message = (
    f"STUDENT PROFILE:\n{profile_text}{academic_info}\n\n"
    f"CANDIDATE COURSES:\n{candidates_text}\n\n"
    "Return the JSON array of the top 5 recommendations."
)

# Contains:
# 1. Student's interview profile (interests, strengths, goals)
# 2. KCSE grades/mean points (if available)
# 3. 15 candidate courses with metadata (name, cutoff, fees, careers)
# 4. Strict instruction to return JSON array
```

---

## SECTION 4: API & Backend Integration (3 questions)

### Q16: Anonymous Users
**Question**: How does the system handle users who aren't logged in?

**Answer**:
```python
# Line 35 in views.py (StartAdvisorView)
session = AdvisorSession.objects.create(
    user=request.user if request.user.is_authenticated else None,
    status='interviewing',
    ...
)

# Lines 165-170 (RecommendationsView)
academic_profile = None
if request.user.is_authenticated:
    try:
        academic_profile = AcademicProfile.objects.get(user=request.user)
    except AcademicProfile.DoesNotExist:
        pass
```
- Session stored with `user=None`
- Recommendations skip eligibility filtering
- Works fully without login, just less personalized

---

### Q17: API Endpoint Permissions
**Question**: What permission class is required and why?

**Answer**:
```python
# Lines 23, 71, 144 in views.py
from rest_framework.permissions import AllowAny

class StartAdvisorView(APIView):
    permission_classes = [AllowAny]  # ← Critical!
```
- **Required**: `AllowAny` (not IsAuthenticated)
- **Why**: The advisor should work for anonymous users
- **Default**: Django REST defaults to `IsAuthenticatedOrReadOnly` which blocks POST
- Without this: 401 Unauthorized error on starting interview

---

### Q18: Error Handling Strategy
**Question**: If Groq API is down, what error does the user see? Show the code path.

**Answer**:
```python
# 1. Service catches exception (groq_service.py, lines 27-31)
try:
    service = GroqInterviewService()
    result = service.start_session()
except Exception as e:
    return Response(
        {"error": f"Failed to start advisor session: {str(e)}"},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,  # 503
    )

# 2. Frontend shows alert (AdvisorPage.tsx, lines 56-57)
catch (err: any) {
    setRecommendationsError(err?.message || 'Failed to load recommendations...')
}

# User sees: "Failed to start advisor session: {error details}"
# HTTP Status: 503 Service Unavailable
```

---

## BONUS: Debugging Scenario

### Scenario
The junior dev says: *"The advisor works locally but returns empty recommendations on production."*

**What's your debugging checklist?**

**Answer**:
1. ✅ Check `GROQ_API_KEY` is set in production `.env`
2. ✅ Check `backend/chroma_store/` exists and has data on production server
3. ✅ Check `CHROMA_DB_PATH` points to correct location in production
4. ✅ Check Groq rate limits (free tier = 20 req/min)
5. ✅ Check Django logs for `503` errors from Groq
6. ✅ Check if `_parse_recommendations()` is returning `[]` due to malformed JSON
7. ✅ Verify `all-MiniLM-L6-v2` model downloaded on production

---

## Scoring Guide

| Score | Level |
|-------|-------|
| 18/18 | Senior dev in disguise |
| 15-17 | Solid junior dev |
| 12-14 | Needs mentoring |
| < 12 | Vibe coding confirmed |
