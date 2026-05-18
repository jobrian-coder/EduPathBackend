# 🎓 Interests → EduGuide: Feature Walkthrough & Change Documentation

## Overview

This document describes the **interests input feature** added to the Profile page and how those interests flow into the **EduGuide AI advisor** as pre-loaded context, reducing redundant questions and broadening recommendation scope.

---

## The Problem (Before)

```
Student opens EduGuide
       ↓
EduGuide knows NOTHING about the student
       ↓
Asks generic Q1: "What subjects do you like?"
       ↓
Asks Q2 based only on Q1 answer (tunnel vision begins)
       ↓
By Q5 the conversation is very narrow (e.g. only "Science/Biology")
       ↓
Recommendations: only Biology-adjacent courses
       ↓
Student misses Nursing, Nutrition, Environmental Science, etc.
```

**Root cause:** EduGuide had no pre-session context. It discovered everything through questions that built on each other, causing a depth-first search (narrow) instead of a breadth-first search (diverse).

---

## The Solution (After)

```
Student writes interests on Profile page (tags: "AI", "Healthcare", "Business")
       ↓  saved to backend → UserInterest model (hobbies + career_interests fields)
       ↓
Student opens EduGuide → frontend fetches interests + academic profile
       ↓
startSession() call sends { user_interests, academic_profile } as context payload
       ↓
Backend enriches SYSTEM_PROMPT with student known context BEFORE Q1
       ↓
EduGuide begins already knowing: subjects, interests, goals
       ↓
Questions explore ACROSS dimensions (not drill-down on one topic)
       ↓
Recommendations are diverse AND still personalised
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PROFILE PAGE                           │
│                                                             │
│  [Interests Tag Editor] ──PUT──▶ /auth/profile/interests/   │
│   (tags + free text)              UserInterest model        │
│                                   { hobbies, career_interests }     │
└─────────────────────────────────────────────────────────────┘
                               │ (stored in DB)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      EduGUIDE PAGE                          │
│                                                             │
│  On mount: GET /auth/profile/interests/                     │
│            GET /auth/profile/academic_profile/              │
│  advisorAPI.startSession({ interests, academic_profile })   │
│      │                                                      │
│      └──POST──▶  /api/advisor/start/                        │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   ADVISOR BACKEND (views.py)                │
│                                                             │
│  StartAdvisorView.post():                                   │
│    1. Read interests + academic_profile from request body   │
│    2. Pass to GroqInterviewService.start_session(context)   │
│    3. Store context snapshot in AdvisorSession              │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              GROQ SERVICE (groq_service.py)                 │
│                                                             │
│  _build_context_block(context) creates:                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ STUDENT CONTEXT (pre-loaded from profile):          │   │
│  │   Interests: AI Research, Healthcare, Business      │   │
│  │   KCSE Mean: 72.4/84                               │   │
│  │   Strong subjects: Biology (A), Math (A-)           │   │
│  │   Career goals: "Work in health tech"              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Block APPENDED to SYSTEM_PROMPT before Q1                  │
│  Groq asks INFORMED questions across multiple axes          │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   RECOMMENDER (recommender.py)              │
│                                                             │
│  profile_text includes BOTH interview answers + context     │
│  Result: richer embedding → broader vector search hits      │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Changed

### 1. `apps/advisor/services/groq_service.py`
- `start_session(context)` — new optional `context` parameter
- `next_turn(context)` — context passed to enriched system prompt per turn  
- `_build_context_block(context)` — new helper that formats profile data into a readable block
- `_build_system_prompt(context)` — new helper combining base SYSTEM_PROMPT + context block

### 2. `apps/advisor/views.py`
- `StartAdvisorView.post()` — reads `interests` + `academic_profile` from request body, passes as `context` dict to the service

### 3. `src/services/api.ts`
- New `UserInterests` interface
- New `interestsAPI` object with `getInterests()` and `updateInterests()`
- `advisorAPI.startSession()` updated to accept optional context payload
- `api` default export updated to include `interests: interestsAPI`

### 4. `src/features/profile/pages/Profile.tsx`
- Interests section becomes a live **tag editor** (replaces `DEFAULT_INTERESTS` hardcoded list)
- Fetches real interests from backend on mount
- Add tags via free-text input (Enter key) or predefined suggestion chips
- Remove tags by clicking ×
- Auto-saves to backend when interests change

### 5. EduGuide page (advisor feature)
- Fetches interests + academic profile before `startSession()`
- Passes both as context so Q1 is already personalised

---

## EduGuide System Prompt: Before vs After

### Before (generic):
```
STUDENT CONTEXT: None
Q1: "What subjects do you enjoy the most in school?"
Q2: (builds only on Q1 answer — narrows scope fast)
```

### After (enriched):
```
STUDENT CONTEXT:
  • Declared interests: AI Research, Healthcare, Business
  • KCSE Mean Points: 72.4 / 84
  • Strong subjects: Biology (A), Mathematics (A-), Chemistry (B+)

INSTRUCTION: Use this context to skip basic interest discovery.
Instead explore: HOW they apply interests, practical constraints, 
lifestyle preferences, location, fees.

Q1: "You have strong grades in Biology and Math plus interests in 
     both AI and Healthcare — are you drawn more to the human care 
     side or the technology/systems side of health?"
```

---

## Question Axis Rotation (Prevents Narrow Scope)

With context pre-loaded, EduGuide is instructed to rotate across dimensions:

| Turn | Axis | Example Question |
|------|------|-----------------|
| Q1 | Interest angle (HOW not WHAT) | Care side vs Tech side? |
| Q2 | Application depth | Build systems, analyse data, or design devices? |
| Q3 | Location | Nairobi or open to other counties? |
| Q4 | Financial | Annual fees budget range? |
| Q5 | Institution size | Large national vs small focused college? |
| Q6 | Social/lifestyle | Campus housing important? |
| Q7 | Career timeline | 4-year degree vs 3-year diploma? |
| Q8 | Work context | Want to work in Kenya or plan to go abroad? |
| Q9 | Backup interest | Any completely different field you'd consider? |
| Q10 | Final priority | If you had to pick one thing that matters most? |

---

## Backward Compatibility

- If a student has **no interests saved** → context block is omitted → EduGuide falls back to original generic first question  
- If **academic_profile is empty/null** → only the interests block is added  
- The `UserInterest` model and endpoint already existed — **no DB migrations needed**
- No breaking changes to the session or message schema

---

## Profile Page: New Interests UI

```
┌──────────────────────────────────────────────────────┐
│  🎯 My Interests                          [Saved ✓]  │
├──────────────────────────────────────────────────────┤
│  [AI Research ×] [Healthcare ×] [Business ×]         │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Type an interest and press Enter...            │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Quick add:                                          │
│  [+ Medicine]  [+ Law]  [+ Finance]  [+ Robotics]   │
│  [+ Engineering] [+ Education] [+ Arts] [+ Sports]  │
└──────────────────────────────────────────────────────┘
```
