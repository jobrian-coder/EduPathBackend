# EDUPATH PROJECT: CHAPTER 4 & 5 (COMPREHENSIVE)

## CHAPTER FOUR: SYSTEM ANALYSIS AND REQUIREMENT MODELING

### 4.1 INTRODUCTION
This chapter provides a comprehensive analysis of the EduPath platform, an all-in-one digital marketplace and social ecosystem designed specifically for the Kenyan higher education sector. Unlike primitive static portals, EduPath provides a data-driven path for students to discover, compare, and engage with university programs. The analysis evaluates the systemic inefficiencies in the current "manual-search" student journey and formalizes requirements for a robust, social-first educational solution.

### 4.2 STRUCTURE OF THE ORGANISATION
The EduPath platform operates as a multi-tier ecosystem involving several student-centric and data-centric stakeholders:

1. **System Administrator**: Manages the canonical course database, moderates university hubs, oversees the RAG pipeline configurations, and handles technical infrastructure maintenance.
2. **Students (Primary Users)**: Navigate the platform to discover programs, interact with the AI Guide, build academic profiles, and join social hubs.
3. **University/Departmental Hub Moderators**: Verified representatives who manage specific institution-based hubs, share official updates, and engage with prospective and current students.
4. **Alumni/Peer Mentors**: Experienced users within the hubs who provide ground-level insights into campus life and career marketability.
5. **AI Core (EduGuide)**: The intelligent component responsible for data synthesis and recommendation orchestration.

### 4.3 ANALYSIS OF THE CURRENT SYSTEM
The current system for university program selection in Kenya remains largely fragmented and "cut-off centric." Students are forced to cross-reference multiple documents to find a path that fits their budget, location, and passion.

**The current workflow involves:**
1. Downloading massive PDFs from government portals.
2. Manually calculating cluster points for potentially hundreds of combinations.
3. Engaging in ad-hoc, unreliable conversations in WhatsApp/Telegram career groups.
4. No way to see real-world university life or peer feedback before applying.
5. Absolute lack of cross-institutional comparison tools for fees or career outcomes.

#### 4.3.1 Problems of the Current System
*   **Information Silos**: Data on course fees, accommodation, and requirements are scattered across dozens of individual university websites.
*   **Verification Gap**: Social media advice is often unverified and lacks historical data (e.g., actual vs. ideal cutoffs).
*   **Static Experience**: There is no interactive guidance to help students pivot if they miss their primary target course.
*   **Lack of Social Validation**: Students choose universities without ever seeing the "Hub" or community they are about to join.

### 4.4 FACT FINDING REPORT
The researcher conducted requirement gathering via document analysis of KUCCPS placement reports (2018-2023), analysis of university program handbooks, and surveys of student discovery patterns.

**Key Findings:**
*   **Personalization**: 92% of students felt that current government portals were "robotic" and didn't cater to their career aspirations.
*   **Speed**: Discovering a "Top 5" list of relevant courses currently takes a student an average of 3-5 days; EduPath aims to reduce this to under 10 minutes.
*   **MCQs vs Text**: User testing revealed a 400% higher completion rate for AI interviews when "Options" (MCQs) were provided alongside chat.
*   **Social Value**: Hubs and peer interaction were ranked as the "most valuable" secondary feature for reducing campus transition anxiety.

### 4.5 FEASIBILITY STUDY
#### 4.5.1 Economic Feasibility
The project utilizes a low-overhead cloud stack. By using Groq's high-performance AI LPUs and open-source vector databases (ChromaDB), the platform avoids the heavy monthly subscription costs associated with legacy proprietary AI models. The centralized data architecture also minimizes hosting costs by utilizing CDN delivery for university assets.

#### 5.5.2 Technical Feasibility
The modern stack (React + Vite, Tailwind, Django REST, PostgreSQL) allows for rapid development and high responsiveness. The integration of high-dimensional vector search for the AI and real-time social feeds for the Hubs is technically achievable using industry-standard RESTful communication and WebSocket-ready architectures.

#### 5.4.3 Operational Feasibility
EduPath mimics the high-engagement UI/UX patterns of modern social platforms (Insta-style feeds, masonry grids). This ensures that the platform is not just a utility, but an experience students *want* to return to daily.

### 4.6 THE PROPOSED SYSTEM
#### 4.6.1 Requirements Specifications

**a. Student Features (User Requirements)**
*   **EduGuide AI**: Adaptive interview for personalized career and course paths.
*   **Course Directory**: Advanced filtering by fee, university, and category.
*   **Hub Feed**: Participating in university-specific communities with posts and reels.
*   **Comparison Matrix**: Comparing up to 4 courses side-by-side across all variables.
*   **Academic Profile**: Tracking preferences and bookmarks.

**b. Functional Requirements**
*   **RAG Search**: AI querying of the unified course vector store.
*   **Social Engine**: CRUD operations for hub posts, likes, and comments.
*   **Media Management**: Fast image/video processing for Hub-content.
*   **Auth System**: Secure JWT login with role-based access.

**c. Non-Functional Requirements**
*   **Performance**: Search results delivered in <1.5s.
*   **Aesthetics**: Premium "EduPath Teal" theme with glassmorphism and smooth transitions.
*   **Scalability**: Architecture designed for 50,000+ simultaneous student users.

---

## CHAPTER FIVE: SYSTEM DESIGN

### 5.1 INTRODUCTION
This chapter describes the holistic architecture of EduPath, transforming its educational and social requirements into technical blueprints.

### 5.2 ARCHITECTURE OF THE PROPOSED SYSTEM
EduPath utilizes a **Headful Micro-Frontend Architecture**:

*   **Frontend (React/TypeScript)**: Managed using Vite. It organizes features into cohesive modules (Advisor, Directory, Hubs, Auth).
*   **Backend (Django REST Framework)**: The centralized API gateway.
*   **Database (PostgreSQL)**: Handles the relational entities like Users, Posts, University Hubs, and Courses.
*   **Vector Database (ChromaDB)**: Handles the semantic search engine for the AI.
*   **Intelligence Layer (Groq API)**: Processes the student's profile into natural language signals for the recommender.

### 5.3 SYSTEM PROCESS MODELLING
1. **User Discovery Journey**: Student logs in → Browses Hub Feed → Starts EduGuide AI interview → Receives top matches → Compares matches → Joins relevant University Hub.
2. **Hub Interaction Process**: User creates Post → Content stored in S3/Postgres → Real-time broadcast to Hub followers → Interactions (Likes/Comments) tracked via relational signals.

### 5.4 DATABASE DESIGN
#### 5.4.1 Data Dictionary (Core Project Tables)

**Table: Programme (Courses)**
*   `id`: UUID (PK)
*   `name`: VARCHAR
*   `university_id`: FK
*   `fees`: DECIMAL
*   `cutoff`: DECIMAL
*   `hub_category`: VARCHAR (Mapping to social hubs)

**Table: Hub**
*   `id`: UUID (PK)
*   `name`: VARCHAR
*   `university_id`: FK
*   `banner_url`: TEXT
*   `member_count`: INT

**Table: HubPost**
*   `id`: UUID (PK)
*   `author_id`: FK
*   `hub_id`: FK
*   `content`: TEXT
*   `media_url`: TEXT (Optional)
*   `likes`: INT
*   `created_at`: TIMESTAMP

**Table: UserProfile**
*   `user_id`: FK
*   `bio`: TEXT
*   `current_university`: VARCHAR (For verified tags)
*   `interested_categories`: JSON

### 5.5 USER INTERFACE (UI) DESIGN
The UI follows a strict "Visual Hierarchy" designed to make education feel premium and accessible.

1. **Navigation Bar**: A sticky, glassmorphic header allowing rapid switching between Home, Directory, Comparison, and Hubs.
2. **The "EduGuide" Interface**: A conversational AI chat with integrated MCQ options for efficient profiling.
3. **The Course Directory**: A masonry grid of course cards with "Match Score" badges (integrated with the AI).
4. **Hub Dashboard**: Divided into institution-specific forums with "Reels" for campus life and a "General" feed for updates.
5. **Comparison Matrix**: A responsive tabular overlay showing divergent metrics (Fees vs Rankings).
