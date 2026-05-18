# EduGuide Setup & Authentication System

This document outlines the operational mechanisms of the EduGuide AI platform, specifically targeting how to keep the vector database updated, how user authentication functions across the platform to secure data, and a deep-dive into EduGuide's feature set.

---

## 1. Updating the EduGuide Vector Database

To ensure the EduGuide recommendation engine has the most up-to-date courses to recommend, you need to sync any changes in your main database to **ChromaDB**, the local vector storage for the AI.

EduPath provides a management script that automatically recreates embeddings via the `all-MiniLM-L6-v2` model and syncs them.

### Step-by-Step Update Process:

1. **Populate Main DB**: Ensure any new courses/universities are added to your main Django Postgres database first (e.g., via the Django admin panel or using scripts like `populate_courses_enriched.py`).
2. **Open your Terminal**: Navigate to the Django `backend` directory.
   ```bash
   cd backend
   ```
3. **Activate Environment**: Ensure your Python virtual environment (if any) is running.
4. **Run the Indexer Script**:
   ```bash
   python scripts/index_courses.py
   ```
5. **What happens under the hood?**
   - The script connects to the local ChromaDB.
   - It deletes the existing `edupath_courses` knowledge base collection.
   - It iterates over all unique courses grouped by category from the relational DB.
   - It generates 384-dimensional vector embeddings of the course names, hubs, parameters, and careers using the sentence transformer model.
   - Finally, it upserts these embeddings into the vector storage. The AI advisor instantly has access to the new curriculum.

---

## 2. Authentication Workflow

EduPath operates a dual-layer security approach, but primarily utilizes **Django Rest Framework (DRF) Token Authentication** for client-server communication.

### How Authentication Works:
- **Login Request**: When a student logs in, the frontend sends a `POST /auth/login/` request containing their email and password.
- **Token Generation**: The Django backend validates the credentials using Django's standard `authenticate()` method and either creates or retrieves an existing permanent `Token` key (e.g., `9944b09199c62bcf9418...`).
- **Client Storage**: The frontend React application manages this state and stores the key in the browser's local storage as `edupath.auth.token`.

> **Note on JWT:** The platform also has JWT (JSON Web Tokens) configured in the backend settings as a secondary or legacy setup, but Token authentication is practically enforced by the frontend HTTP interceptor and views.

### Protected Endpoints
When requesting secure data (e.g., looking up the user's Academic Profile or requesting AI Recommendations), the frontend auto-attaches the token to the Authorization header in all API calls via an Axios interceptor:
```javascript
headers: {
  'Authorization': `Token 9944b09199c62bcf9418...`
}
```
If an invalid token (or no token) is sent, the backend blocks the request and responds with a `401 Unauthorized` status. This triggers the frontend `AuthContext` to wipe the session variables and redirect the user back to the `/login` screen.

---

## 3. EduGuide Functionalities

The **EduGuide AI** leverages a powerful 2-Stage Retrieval-Augmented Generation (RAG) Architecture driven by the **Groq API (Llama-3.3-70b)** and **ChromaDB**. 

The EduGuide feature is split into two primary operational phases.

### Phase 1: The Adaptive Interview
When a student initiates an AI consultation, the system launches a dynamic 10-question interview:
1. **Endpoint Called**: `POST /api/advisor/start/` creates a new conversation session.
2. **Groq Engine**: The advisor generates adaptive, progressive questions evaluating the user's personality, interests, and constraints.
3. **JSON Structure**: Groq is structurally prompted to output raw JSON containing the question text and a list of multiple-choice options.
4. **Profile Generation**: On the 10th answer, instead of emitting another question, the system instructs the LLM to generate a rich, summarized, text-based "Student Profile". 

### Phase 2: RAG Course Recommendations
Once the profile is formed, the platform generates customized academic recommendations based directly on this personality profile:
1. **Endpoint Called**: `GET /api/advisor/<id>/recommendations/` is hit once the session concludes.
2. **Vector Querying (ChromaDB)**: The system converts the newly minted student text profile into a vector embedding. ChromaDB is queried to return the Top 25 overlapping `Course` vectors based on semantic distance (Cosine Similarity).
3. **Academic Filtering**: The system reads the student's KCSE Grades/Academic Profile. It estimates cluster points, and strictly filters out any courses from the Top 25 where the student fails to meet the 2023/2022 KNEC Cutoff margins.
4. **Diversity Rerank**: The candidate pool is algorithmically thinned out to exactly 15 courses, with hard caps enforced to ensure the student sees courses spread across diverse "Hub Categories" (e.g., maximum 2 courses per category).
5. **Final AI Review (Rerank)**: The remaining 15 candidates are fed back to Groq Llama 3.3 alongside the student's profile. Groq uses comparative reasoning logic to evaluate the absolute Top 5 courses. It formulates a personalized explanation for *why* each course is a match and maps out relevant career paths. 
6. **Delivery**: This structured JSON response is shipped to the frontend and displayed as cards to the user.
