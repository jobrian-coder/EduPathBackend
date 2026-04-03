# CHAPTER FOUR: SYSTEM ANALYSIS AND REQUIREMENT MODELING

## 4.1 INTRODUCTION
This chapter provides a comprehensive analysis of the EduPath platform, an integrated digital career guidance and course selection ecosystem designed specifically for Kenyan high school graduates and prospective university students. The primary goal of this analysis is to evaluate the existing manual and fragmented methods of university course selection, identify systemic inefficiencies in the current KUCCPS application process, and formalize the requirements for a robust AI-driven digital solution.
Through this phase, the researcher established the organizational context, performed fact-finding through student surveys, and conducted a feasibility study to ensure the proposed system is viable from technical, economic, and operational perspectives.

## 4.2 STRUCTURE OF THE ORGANISATION
The EduPath platform operates as an educational advisory ecosystem involving several primary stakeholder groups. The hierarchy is designed to ensure platform data integrity while providing students with autonomy over their career discovery process.

1. **System Administrator:** Responsible for platform moderation, updating KUCCPS data (courses, clusters, and institutions), managing the technical infrastructure, overseeing the AI recommendation engine, and resolving disputes within community hubs.
2. **Student (Primary User):** The main beneficiary of the platform. They create profiles, input their academic grades, receive AI-driven course recommendations, interact with peers and mentors in Hubs, and track various career paths.
3. **Mentor/Alumni:** Verified professionals or current university students who provide guidance, answer questions in Hubs, and share real-world insights about specific courses, university life, and career progression.
4. **Educational Institutions (Optional):** University representatives who can manage their institutional profiles, providing up-to-date information on programs, facilities, and campus life to attract prospective students.

*Figure 4.1: Organizational Structure Diagram*

## 4.3 ANALYSIS OF THE CURRENT SYSTEM
Currently, Kenyan students rely on the centralized KUCCPS (Kenya Universities and Colleges Central Placement Service) portal and fragmented sources of information (word of mouth, university websites, teachers) to make critical career choices. There is no unified platform that combines data-driven course matching with social mentorship and AI-driven career guidance.

The current workflow involves: 
1. Students receive KCSE results.
2. Attempt to calculate their cluster points manually or using basic unofficial online estimators.
3. Browse through thousands of courses on the KUCCPS portal with limited context on the actual career outcomes.
4. Seek advice from peers, parents, or teachers informally.
5. Make final course selections often without fully understanding the market demand, employability, or alignment with their personal strengths.

### 4.3.1 Problems of the Current System
*   **Information Overload and Poor Guidance:** The current portals provide raw data (course codes and cut-off points) but lack context regarding what the course entails, required soft skills, and career prospects.
*   **Complex Cluster Point Calculations:** Calculating weighted cluster points for different courses is tedious and prone to human error, leading to students applying for courses they do not qualify for.
*   **The "Expectation Gap":** Students often select prestige-sounding courses without understanding the day-to-day realities, leading to high university dropout rates or course transfer requests in the first year.
*   **Lack of Community/Mentorship:** There is a deep disconnect between high school leavers and industry professionals or current university students. Advice is restricted to immediate family circles.
*   **Fragmented Decision Making:** Maintaining multiple tabs across university websites, the KUCCPS portal, and generic career advice blogs is hectic and creates overhead for the student.

*Figure 4.2: Current System Data Flow Diagram*

## 4.4 FACT FINDING REPORT
The researcher conducted a requirement gathering exercise using observation, document analysis, and digital questionnaires distributed to recent high school graduates and first-year university students.

### 4.4.1 Method 1: Observation
**Observation:** Through direct engagement with the Kenyan high school leavers and monitoring the recent KUCCPS placement phases, the researcher noted massive fragmentation and anxiety. Students often flock to cyber cafes, relying on attendants who have no career guidance background to help them select their entire future trajectory. The official platforms serve only as placement logistical tools, not as educational guidance tools, leaving students to navigate the crucial "choice" phase blindly in the dark. Goal: A dedicated platform that eliminates noise, auto-calculates eligibilities, and fosters direct mentorship.

### 4.4.2 Method 2: Questionnaire
An online questionnaire was distributed to recent KCSE candidates and university students. 
*Respondents: 120 verified students across 5 different counties.*

**Key Findings:**
*   **Challenges (Q3):** 85% of respondents found it extremely difficult to understand cluster points and subject requirements. 72% stated they lacked adequate career guidance before making their final application.
*   **Information Sources (Q4):** 60% relied on parents/peers, 30% on high school teachers, and only 10% received professional career coaching.
*   **Required Features (Q5):** 95% wanted an automated cluster point calculator and course matcher; 84% desired an AI assistant to explain career paths and future employability.
*   **Community Integration (Q6):** 88% felt that a peer/mentor community (Hubs) would give them significantly more confidence in their university choices.
*   **Platform Accessibility (Q7):** 100% preferred a mobile-friendly web application, citing smartphones as their primary internet access device.

### 4.4.3 Method 3: Document Analysis
To inform EduPath's development, the researcher analyzed existing educational portals and the current KUCCPS system.
The official KUCCPS portal successfully manages placement for over 100,000 students annually but offers zero personalized advisory tools. Existing third-party academic advisory platforms (like standard career aptitude tests) are heavily Western-centric and do not account for the localized Kenyan curriculum (KCSE subjects) or the specific cluster formulas used by public universities. This analysis revealed a massive gap for a localized, AI-powered, and socially-integrated platform like EduPath that bridges raw placement data with personalized human and AI mentorship.

## 4.5 FEASIBILITY STUDY

### 4.5.1 Economic Feasibility
The project is highly feasible. Development utilizes open-source stacks (React, Django, PostgreSQL), eliminating initial licensing fees. Operational costs such as cloud hosting and AI API usage (e.g., OpenAI API for EduGuide) are estimated at approximately KES 30,000 - 50,000 per year for early traction. The platform can achieve sustainability through premium features, university advertising placements, or subsidized access through institutional partnerships.

### 4.5.2 Technical Feasibility
The chosen tech stack is robust and highly scalable. The integration of modern AI LLMs (Large Language Models) via API for the "EduGuide" system is technically achievable and well-documented. Processing and mapping large KUCCPS datasets (JSON/CSV) into a relational database is fully supported by Django's ORM. The researcher possesses the requisite skills in Python, TypeScript, and database management to implement the proposed architecture.

### 4.5.3 Operational Feasibility
The system mimics the UI/UX patterns of modern social applications and intuitive dashboards, ensuring that the learning curve for young users is minimal. Operationally, it radically simplifies the stressful course selection process by acting as an intelligent, conversational intermediary between the student and complex educational data.

## 4.6 THE PROPOSED SYSTEM

### 4.6.1 Requirements Specifications

**a. User Requirements:**
*   **Students:** Input KCSE grades, view calculated cluster points, receive AI course recommendations, join Hubs, interact with mentors, and save favorite courses.
*   **Mentors/Alumni:** Create professional profiles, post advice in Hubs, answer student questions accurately.
*   **System Admin:** Upload new batch data for courses/universities, monitor system health, manage users, and moderate Hub content.

**b. Business Requirements:**
*   Accurate algorithms for cluster point calculation based on official formulas.
*   Secure storage of student academic data.
*   High engagement metrics driven by the AI recommendations and community hubs.
*   Analytical reports on popular courses for potential institutional stakeholders.

**c. Functional Requirements:**
*   KCSE Grade Input and Automated Calculation Engine.
*   EduGuide AI Chatbot integration for personalized career queries.
*   Hubs/Community forum system (posts, comments, upvotes).
*   Search and Filter functionality for thousands of university programmes.
*   User Profile Management and Bookmarking (favorites).
*   Real-time notifications for responses in Hubs.

**d. Non-Functional Requirements:**
*   **Security:** JWT authentication, encrypted passwords, data privacy compliance.
*   **Performance:** < 2s load time for programme searches and recommendations.
*   **Responsiveness:** Mobile-first design architecture.
*   **Scalability:** Ability to handle traffic spikes during national exam release weeks.
*   **Reliability:** 99.9% uptime.
*   **Usability:** Intuitive interface specifically appealing to Gen Z users.

## 4.7 DATA FLOW DIAGRAMS
*   4.7.1 Proposed System Context Diagram (Level 0 DFD)
*   4.7.2 Proposed System Context Diagram (Level 1 DFD)
*   4.7.3 Proposed System Context Diagram (Level 2 DFD)
*   4.7.4 Proposed System Use Case Diagram

---

# CHAPTER FIVE: SYSTEM DESIGN

## 5.1 INTRODUCTION
This chapter outlines the technical design of EduPath, transforming requirements into architectural components, processes, database structures, and UI elements. The design prioritizes performance, security, and usability to provide a seamless career guidance and social mentorship experience.

## 5.2 ARCHITECTURE OF THE PROPOSED SYSTEM
The system adopts a Modern Decoupled Client-Server Architecture (Headless).
*   **Frontend (React.js/Next.js/Vite):** A Single Page Application (SPA) that handles the user experience. It consumes data from the backend via secure RESTful APIs. It manages state efficiently for complex features like real-time Hub interactions and AI chat.
*   **Backend (Django REST Framework):** Serves as the robust logic engine. It handles user authentication, complex database queries for course matching, cluster point logic, and acts as the secure intermediary for the AI API (EduGuide).
*   **Database (PostgreSQL):** A highly relational database chosen for its ability to handle complex associations between users, thousands of university programmes, Hubs, and social interactions.
*   **External Services:** OpenAI API (or similar) for the EduGuide conversational AI, Cloudinary/AWS S3 for user avatar and media storage.

*Figure 5.1: System Architecture Diagram*

## 5.3 SYSTEM PROCESS MODELLING

### 5.3.1 User Registration and Academic Input Process
**Sequence:** User submits registration form → Frontend validates → POST to backend → Backend hashes password, generates JWT → User is prompted to input KCSE grades → Backend calculates and saves cluster points → Dashboard populated with baseline recommendations.
*Figure 5.2: Authentication & Onboarding Sequence Diagram*

### 5.3.2 Course Recommendation Process
**Sequence:** User requests recommendations → Backend reads user's saved cluster points and preferred subjects → Backend queries Programme table for eligible courses → Sends structured subset to AI Engine (EduGuide) for contextual ranking based on user prompts → Returns personalized, ranked list to Frontend.

### 5.3.3 Community Interaction (Hubs) Process
**Sequence:** User navigates to Hubs → Frontend fetches Hub list → User clicks Hub → Fetches posts → User creates new post/comment → Frontend sanitizes input → POST to backend → Database updated → Real-time response rendered to User.
*Figure 5.3: Hub Interaction Flowchart*

## 5.4 DATABASE DESIGN
The database is designed following 3rd Normal Form (3NF) principles to ensure data integrity, minimize redundancy, and maintain consistency across the system, especially regarding the massive KUCCPS educational datasets.

### 5.4.1 Data Dictionary (Core Tables)

**Table: User**
| Field | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| id | UUID | Primary Key | Unique user identifier |
| username | VARCHAR(50) | Unique, Not Null | User's display name |
| email | VARCHAR(100) | Unique, Not Null | User's email address |
| password_hash | VARCHAR(255) | Not Null | Encrypted password |
| user_type | ENUM | Not Null | Specifies 'student', 'mentor', or 'admin' |
| kcse_mean_grade | VARCHAR(2) | Nullable | Overall high school grade (e.g., A, B-) |
| profile_image | TEXT | Nullable | URL to user's avatar |
| bio | TEXT | Nullable | Short biography or career interest |
| created_at | TIMESTAMP | Default NOW() | Account creation date |

**Table: Programme (Course)**
| Field | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| id | UUID | Primary Key | Unique programme identifier |
| code | VARCHAR(20) | Unique, Not Null | Official KUCCPS Course Code |
| name | VARCHAR(200) | Not Null | Name of the degree/diploma |
| category | VARCHAR(100) | Not Null | Subject category (e.g., Engineering, Arts) |
| cluster_formula | TEXT | Not Null | Logic string for cluster calculation |
| description | TEXT | Nullable | Summary of the course |
| career_prospects | TEXT | Nullable | Potential jobs post-graduation |

**Table: University/Institution**
| Field | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| id | UUID | Primary Key | Unique institution identifier |
| code | VARCHAR(20) | Unique, Not Null | Official institution code |
| name | VARCHAR(255) | Not Null | Name of the university |
| type | ENUM | Not Null | 'Public' or 'Private' |

**Table: Programme_University (Pivot)**
| Field | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| id | UUID | Primary Key | Unique pivot identifier |
| programme_id | UUID | Foreign Key | References Programme table |
| university_id | UUID | Foreign Key | References Institution table |
| cutoff_point | DECIMAL(5,3) | Nullable | Previous year's cutoff for this specific combo |

**Table: Hub (Community)**
| Field | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| id | UUID | Primary Key | Unique Hub identifier |
| name | VARCHAR(100) | Unique, Not Null | Name of the community (e.g., 'Tech Enthusiasts') |
| description | TEXT | Not Null | Purpose of the hub |
| created_by | UUID | Foreign Key | User who created the hub |

**Table: Hub_Post**
| Field | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| id | UUID | Primary Key | Unique post identifier |
| hub_id | UUID | Foreign Key | References Hub |
| author_id | UUID | Foreign Key | References User |
| content | TEXT | Not Null | Body of the post |
| created_at | TIMESTAMP | Default NOW() |  |

### 5.4.2 Entity Relationships
*   **Users (1) → Profiles/Grades (1):** One user has one academic profile.
*   **Programme (1) → Programme_University (N) ← University (1):** Many-to-many relationship resolving which university offers which program, noting specific cutoffs.
*   **Users (1) → Favorite_Programmes (N):** A user can bookmark multiple courses.
*   **Hubs (1) → Hub_Posts (N):** A hub contains multiple posts.
*   **Users (1) → Hub_Posts (N):** A user can author multiple posts.
*   **Hub_Posts (1) → Comments (N):** A post can have multiple replies.

## 5.5 USER INTERFACE (UI) DESIGN
The UI design focuses on "Visual Hierarchy" and "Cognitive Ease," ensuring that complex data is digestible for high school leavers.

*   **EduPath Dashboard:** A personalized, widget-based interface. Displays the user's calculated Cluster Points in a prominent card, alongside quick insights like "Top Recommended Courses for You."
*   **Navigation:** Clean Sidebar navigation containing: Dashboard, Explore Courses, Hubs, EduGuide (AI), and Profile constraints.
*   **Course Explorer Interface:** A dynamic, searchable data table or masonry card grid with extensive filtering options (by category, university, cluster point match).
*   **EduGuide AI Interface:** A familiar, chat-bubble interface similar to modern messaging apps or ChatGPT, allowing natural language queries ("What jobs can I get with a B.Sc in Computer Science?").
*   **Hubs Interface:** Inspired by Reddit or modern forum layouts. A clear division between trending topics, individual post views, and nested comment threads for deep discussions.
*   **Feedback Loops:** Subtle animations, loading skeletons for data fetching, and "Toast" notifications confirming actions (e.g., "Course added to favorites!").

*Figure 5.7: Site Map / UI Flow*
