# EduGuide AI - Groq API & Vector Database Documentation

> **For Junior Developers** - This guide explains how the AI advisor (EduGuide) uses Groq API and ChromaDB vector database.

---

## Table of Contents
1. [Overview](#overview)
2. [Groq API Key](#groq-api-key)
3. [Vector Database (ChromaDB)](#vector-database-chromadb)
4. [RAG Pipeline Flow](#rag-pipeline-flow)
5. [Key Files & Their Roles](#key-files--their-roles)
6. [Environment Variables](#environment-variables)
7. [Common Issues & Debugging](#common-issues--debugging)

---

## Overview

The EduGuide AI advisor uses a **2-Stage RAG (Retrieval-Augmented Generation) pipeline**:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Student Chat   │────▶│  Stage 1:       │────▶│  Stage 2:       │
│  (10 questions) │     │  Groq Interview │     │  Recommendations│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  ChromaDB Query │
                                              │  + Groq Rerank  │
                                              └─────────────────┘
```

---

## Groq API Key

### What is it?

The `GROQ_API_KEY` is your access token to **Groq Cloud**, a service that provides fast inference for Large Language Models (LLMs) like Llama 3.3 70B.

### Where is it used?

| File | Purpose |
|------|---------|
| `backend/apps/advisor/services/groq_service.py` | Powers the 10-question adaptive interview |
| `backend/apps/advisor/services/recommender.py` | Reranks and personalizes course recommendations |

### How it works

```python
# From settings.py
GROQ_API_KEY = config('GROQ_API_KEY', default='')

# Used in services
from groq import Groq
client = Groq(api_key=settings.GROQ_API_KEY)
```

### What does Groq do for us?

#### 1. **Interview Phase** (`groq_service.py`)
- **Model**: `llama-3.3-70b-versatile`
- **Temperature**: 0.75 (creative but consistent)
- **Task**: Ask 10 adaptive questions, then generate a student profile
- **Output Format**: Strict JSON

```json
// Questions 1-9 output:
{
  "done": false,
  "question": "What subjects do you enjoy?",
  "options": ["Sciences", "Arts", "Business", "Technology"]
}

// Question 10 output:
{
  "done": true,
  "profile": "Student enjoys sciences..."
}
```

#### 2. **Recommendations Phase** (`recommender.py`)
- **Model**: Same (`llama-3.3-70b-versatile`)
- **Temperature**: 0.3 (more deterministic)
- **Task**: Rank top 5 courses from 15 candidates with explanations
- **Output Format**: JSON array of 5 recommendations

```json
[
  {
    "rank": 1,
    "course_name": "BSc Computer Science",
    "institution": "University of Nairobi",
    "hub_category": "Technology",
    "match_explanation": "Matches your interest in programming...",
    "career_paths": ["Software Engineer", "Data Scientist"],
    "cutoff_2023": 42.5,
    "cutoff_2022": 41.8,
    "avg_fees_ksh": 120000,
    "match_score": 95
  }
]
```

---

## Vector Database (ChromaDB)

### What is it?

**ChromaDB** is an open-source vector database that stores course embeddings (numerical representations of text). It allows us to find courses similar to a student's profile using semantic search.

### Key Concepts

| Term | Explanation |
|------|-------------|
| **Embedding** | A vector (list of numbers) representing text meaning |
| **Collection** | Like a database table - stores related embeddings |
| **Query** | Find similar vectors using cosine similarity |
| **Metadata** | Extra info stored with each vector (course name, cutoff, fees, etc.) |

### Configuration

```python
# settings.py
CHROMA_DB_PATH = config('CHROMA_DB_PATH', default='./chroma_store')

# vector_service.py
COLLECTION_NAME = "edupath_courses"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"  # HuggingFace model for embeddings
```

### How Data is Stored

Each course becomes a document in ChromaDB:

```python
{
    "id": "course_uuid",           # Unique identifier
    "document": "BSc Computer Science at UoN...",  # Searchable text
    "embedding": [0.23, -0.45, ...], # 384-dimension vector from all-MiniLM-L6-v2
    "metadata": {
        "course_name": "BSc Computer Science",
        "institution": "University of Nairobi",
        "hub_category": "Technology",
        "cutoff_2023": 42.5,
        "cutoff_2022": 41.8,
        "avg_fees_ksh": 120000,
        "careers": "Software Engineer, Data Scientist..."
    }
}
```

### The CourseVectorStore Class

Located in `vector_service.py`, this class provides the query interface:

#### Method 1: `query(profile_text, n_results=25)`

```python
# How it works:
1. Embed the student's profile text using SentenceTransformer
2. Search ChromaDB for similar course embeddings
3. Return top N matches with metadata and similarity scores

# Usage in recommender.py:
hits = self.vector_store.query(profile_text, n_results=25)
# Returns: [{"id": "...", "metadata": {...}, "distance": 0.23}, ...]
```

#### Method 2: `diversity_rerank(hits, n=15)`

```python
# Purpose: Ensure recommendations cover different categories
# Logic: Max 2 courses per hub_category, preserving similarity order

# Example:
# Input: 25 hits (mostly Technology courses)
# Output: 15 hits with max 2 from each category
```

---

## RAG Pipeline Flow

### Stage 1: Interview (Groq Only)

```
Student starts chat
    ↓
POST /api/advisor/start/
    ↓
GroqInterviewService.start_session()
    ↓
Groq API generates Question 1
    ↓
Store in DB, return to frontend
    ↓
[Loop 10 times]
    Student answers → POST /api/advisor/<id>/message/
    Groq generates next question
    Store in message_history
    ↓
After 10th answer:
    Groq generates student profile paragraph
    session.status = 'complete'
```

### Stage 2: Recommendations (ChromaDB + Groq)

```
GET /api/advisor/<id>/recommendations/
    ↓
RecommenderService.recommend(profile_text, academic_profile)
    ↓
Step 1: Query ChromaDB (25 courses)
    vector_store.query(profile_text, n_results=25)
    ↓
Step 2: Filter by eligibility (if grades available)
    _filter_by_eligibility(hits, academic_profile)
    - Estimates cluster points from KCSE mean points
    - Filters out courses where student won't meet cutoff
    ↓
Step 3: Diversity rerank (15 courses)
    vector_store.diversity_rerank(hits, n=15)
    - Max 2 per category
    ↓
Step 4: Groq final rerank (top 5)
    Send student profile + 15 candidates to Groq
    Groq returns ranked list with explanations
    ↓
Return JSON with top 5 recommendations
```

---

## Key Files & Their Roles

### 1. `backend/config/settings.py` (Lines 176-178)

```python
# AI Advisor — RAG Pipeline
GROQ_API_KEY = config('GROQ_API_KEY', default='')
CHROMA_DB_PATH = config('CHROMA_DB_PATH', default='./chroma_store')
```

**Role**: Stores configuration from `.env` file.

### 2. `backend/apps/advisor/services/groq_service.py`

**Role**: Manages the 10-question interview using Groq API.

**Key Classes/Functions**:
- `GroqInterviewService` - Main service class
- `start_session()` - Gets first question from Groq
- `next_turn()` - Processes student answer, gets next question
- `_call_groq()` - Low-level API call to Groq
- `_generate_fallback_profile()` - Creates profile if Groq fails

**System Prompt**: The `SYSTEM_PROMPT` constant (lines 7-26) tells Groq how to behave - empathetic tone, JSON output, 10-question structure.

### 3. `backend/apps/advisor/services/vector_service.py`

**Role**: ChromaDB wrapper for semantic search.

**Key Classes/Functions**:
- `CourseVectorStore` - Main query interface
- `_get_embedder()` - Lazy-loads SentenceTransformer model
- `_get_collection()` - Lazy-loads ChromaDB collection
- `query()` - Embeds text and searches ChromaDB
- `diversity_rerank()` - Ensures category diversity

**Important**: Uses singleton pattern (`_client`, `_collection`, `_embedder`) to avoid reloading models on every request.

### 4. `backend/apps/advisor/services/recommender.py`

**Role**: Orchestrates the full recommendation pipeline.

**Key Classes/Functions**:
- `RecommenderService` - Main orchestrator
- `recommend()` - Main pipeline (query → filter → rerank → Groq)
- `_filter_by_eligibility()` - Academic filtering based on KCSE grades
- `_format_candidates()` - Formats courses for Groq prompt
- `_parse_recommendations()` - Parses Groq JSON response

**RERANK_SYSTEM**: The prompt (lines 16-40) tells Groq how to rank courses and what JSON format to return.

### 5. `backend/apps/advisor/views.py`

**Role**: Django REST API endpoints.

**Endpoints**:
- `POST /api/advisor/start/` → `StartAdvisorView`
- `POST /api/advisor/<session_id>/message/` → `AdvisorMessageView`
- `GET /api/advisor/<session_id>/recommendations/` → `RecommendationsView`

---

## Environment Variables

Create a `.env` file in `backend/` with:

```bash
# Required for AI features
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional - defaults to ./chroma_store
CHROMA_DB_PATH=./chroma_store
```

### Getting a Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Create a free account
3. Generate an API key
4. Copy to your `.env` file

**Free Tier Limits**:
- 20 requests/minute
- 1,000,000 tokens/minute
- Sufficient for development

---

## Common Issues & Debugging

### Issue 1: "GROQ_API_KEY is not set"

**Error**: `ValueError: GROQ_API_KEY is not set in settings / .env`

**Fix**:
```bash
cd backend
# Create .env file
echo "GROQ_API_KEY=gsk_your_key" > .env
# Or edit manually
```

### Issue 2: "No module named 'chromadb'"

**Fix**:
```bash
pip install chromadb sentence-transformers
```

### Issue 3: ChromaDB folder not found

**Error**: Collection not found or empty results

**Fix**: The ChromaDB is pre-populated. If missing:
1. Check `backend/chroma_store/` exists
2. Run the data indexing script (if available)
3. Contact senior dev for database dump

### Issue 4: Groq returns malformed JSON

**Symptom**: Interview stops or recommendations are empty

**Debug**: Check `groq_service.py`:
- Lines 50-52: Has fallback parsing
- Lines 84-96: Handles JSON errors with fallback questions
- Lines 180-206 in recommender.py: Tries multiple parsing strategies

### Issue 5: 401 Authentication Error on Advisor

**Fix**: Add to `views.py`:
```python
from rest_framework.permissions import AllowAny

class StartAdvisorView(APIView):
    permission_classes = [AllowAny]  # Allow anonymous users
```

---

## Quick Reference: Data Flow

```
Frontend (React)                    Backend (Django)
    │                                    │
    ├─ POST /advisor/start/ ───────────▶│
    │                                    ├─ Groq: Get Question 1
    │◀────────── session_id, Q1 ───────┤
    │                                    │
    ├─ POST /advisor/<id>/message/ ────▶│
    │   (student answer)                 ├─ Groq: Get Question 2
    │◀────────────────── Q2 ───────────┤
    │            ...                     │
    ├─ POST /advisor/<id>/message/ ────▶│
    │   (answer 10)                      ├─ Groq: Generate profile
    │◀────────────── done=true ─────────┤
    │                                    │
    ├─ GET /advisor/<id>/recommendations/ ────▶│
    │                                    ├─ ChromaDB: Query 25 courses
    │                                    ├─ Filter by KCSE grades
    │                                    ├─ Diversity rerank to 15
    │                                    ├─ Groq: Rerank to top 5
    │◀────────── top 5 courses ──────────┤
```

---

## Summary for Junior Devs

1. **Groq API** = The "brain" that asks questions and ranks courses
2. **ChromaDB** = The "memory" that stores and searches courses semantically
3. **SentenceTransformer** = Converts text to numbers (embeddings)
4. **2-Stage Pipeline** = Interview first, then recommend

When something breaks:
- Check `.env` has `GROQ_API_KEY`
- Check `backend/chroma_store/` exists
- Check browser console for 401/500 errors
- Check Django logs for Python tracebacks
