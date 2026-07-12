# CHAPTER FIVE: SYSTEM DESIGN

## 5.1 Introduction

This chapter details the technical design of the EduPath platform, transforming the gathered requirements into a functional architecture. It covers the system architecture, process modeling, database design, and user interface layouts designed for an intuitive career guidance experience.


## 5.2 Architecture of the Proposed System

EduPath follows a modern Full-Stack Decoupled Architecture, separating the frontend user interface from the robust backend logic.

[Placeholder: Figure 5.1 - Proposed System Architecture Diagram showing the decoupled full-stack infrastructure and integration with external databases and AI APIs]

The system components are as follows:
* **Frontend (React/Vite):** A responsive web application using React.js for high performance and dynamic routing, paired with modern UI libraries (like Tailwind CSS) for a clean, accessible aesthetic.
* **Backend (Django REST Framework):** A powerful RESTful API built on Python that handles complex data orchestration, authentication, and core business logic.
* **Database (PostgreSQL/SQLite):** A relational database management system designed to handle structured data such as user profiles, course directories, society hubs, and chat histories.
* **AI Integration Layer (EduGuide):** Interfaces connecting to external AI providers (OpenAI, Anthropic Claude, Google Gemini) to power the contextual chatbot and automated pros/cons career generation.


## 5.3 System Process Modeling

The following sequence diagrams and process models illustrate the core workflows of the EduPath platform, specifically the career exploration, community engagement, AI assistance, and administration processes.

### 5.3.1 User Registration and Authentication Process
The authentication system utilizes DRF Token and JWT-based protocols, ensuring secure access to user data and profile persistence.

[Placeholder: Figure 5.2 - Sequence Diagram illustrating the secure user registration and authentication flow]

### 5.3.2 Career Comparison and Course Discovery Process
This process enables users to search for careers, compare metrics (salary, demand, growth), and discover related university courses.

[Placeholder: Figure 5.3 - Sequence Diagram illustrating the Career Comparison and Course Discovery workflow]

### 5.3.3 Society Hubs (Community Q&A) Process
The platform allows users to engage in Reddit-style forums tailored to specific careers, featuring threaded comments and a voting system.

[Placeholder: Figure 5.4 - Sequence Diagram illustrating the post creation, commenting, and voting process within Society Hubs]

### 5.3.4 EduGuide AI Assistant Process
The chatbot system workflow where users can invoke the floating AI assistant in any hub or use the course comparator's AI to generate tailored career pros and cons. The system parses context and communicates with external AI APIs.

[Placeholder: Figure 5.5 - Sequence Diagram illustrating the EduGuide Chatbot interaction and context-aware response generation]

### 5.3.5 Admin Content Moderation Process
The administrative workflow detailing how platform moderators use the Admin Panel to manage users, soft-delete inappropriate posts/comments in Society Hubs, and oversee global settings.

[Placeholder: Figure 5.6 - Sequence Diagram illustrating the Admin Panel moderation workflow]


## 5.4 Database Design

The database utilizes a relational schema to handle complex interconnected data between users, courses, hubs, and AI interactions.

### 5.4.1 Data Dictionary (Core Collections/Tables)

**Table: Users**
| Field | Data Type | Constraint | Description |
|---|---|---|---|
| id | Integer | Primary Key | Unique user identifier |
| username | String | Required, Unique | Display name |
| email | String | Required, Unique | Login identifier |
| password | String | Required | Hashed credentials |
| role | String | Default: Novice | Access level (Novice, Contributor, Expert) |

**Table: AcademicProfile**
| Field | Data Type | Constraint | Description |
|---|---|---|---|
| id | Integer | Primary Key | Unique profile identifier |
| user_id | Integer | Foreign Key | Owner of the profile |
| kcse_grades | JSON | Required | Grade data |
| cluster_points | Float | Required | Computed academic score |

**Table: Posts**
| Field | Data Type | Constraint | Description |
|---|---|---|---|
| id | Integer | Primary Key | Unique post identifier |
| hub_id | Integer | Foreign Key | Community hub reference |
| author_id | Integer | Foreign Key | Creator of the post |
| title | String | Required | Post heading |
| is_deleted | Boolean | Default: False | Soft delete flag for admin moderation |
| score | Integer | Default: 0 | Net upvotes |

**Table: ChatConversation**
| Field | Data Type | Constraint | Description |
|---|---|---|---|
| id | Integer | Primary Key | Unique chat session identifier |
| user_id | Integer | Foreign Key | Student requesting AI help |
| started_at | DateTime | Default: Now | Session initiation timestamp |
| context | String | Optional | Page context (e.g., Specific Hub) |

**Table: ChatMessage**
| Field | Data Type | Constraint | Description |
|---|---|---|---|
| id | Integer | Primary Key | Unique message identifier |
| conversation_id | Integer | Foreign Key | Parent conversation link |
| sender | String | Enum | "User" or "AI" |
| message | Text | Required | The chat content |


## 5.5 User Interface (UI) Design

The UI is designed to be accessible, informative, and engaging, utilizing clean layouts to minimize cognitive load while presenting complex academic data.

### 5.5.1 Dashboard & Academic Profile
The central hub for student activity, integrating academic records, bookmarked careers, and profile completion status.

[Placeholder: Figure 5.7 - Screenshot: Student Dashboard providing a summary of saved courses, cluster points, and profile completeness]

### 5.5.2 Society Hub Interface
A community-driven forum layout emphasizing readability, threaded discussions, and dynamic voting.

[Placeholder: Figure 5.8 - Screenshot: Society Hub displaying a feed of posts, tags, and interactive upvote/downvote buttons]

### 5.5.3 EduGuide Chat Interface
The AI assistant overlay UI. Includes the floating chat button and the pop-up modal containing chat history and context-aware responses.

[Placeholder: Figure 5.9 - Screenshot: EduGuide Chatbot Interface over a Hub page]

### 5.5.4 AI Career Analysis (Course Comparator)
The section within the course comparator where students can input context and the AI generates detailed pros and cons.

[Placeholder: Figure 5.10 - Screenshot: AI Pros and Cons generator UI showing career analysis]

### 5.5.5 Admin Panel Interface
The secure backend dashboard utilized by administrators to moderate posts, manage user roles, and update course directories.

[Placeholder: Figure 5.11 - Screenshot: Admin Panel displaying platform metrics and moderation queues]


<br><br><br>

# CHAPTER SIX: SYSTEM IMPLEMENTATION

## 6.1 Introduction

This chapter describes the implementation of the EduPath platform, covering the tools used for coding and testing, the testing approach employed throughout development, and the proposed change-over techniques. Development followed an iterative approach focusing heavily on robust API design, responsive frontend interfaces, and integrating third-party AI LLMs.


## 6.2 Tools Used for Coding and Testing

The platform was implemented using a scalable Python and JavaScript stack, summarized in the table below:

| Category | Tool | Purpose |
|---|---|---|
| IDE | Visual Studio Code | Frontend and backend development |
| Version Control | Git and GitHub | Source code management |
| Frontend Framework | React & Vite | High-performance, responsive UI |
| Styling & UI | Tailwind CSS | Utility-first styling for consistent design |
| Backend Framework | Django & DRF | Secure, RESTful API endpoints |
| Database | SQLite (Dev) / PostgreSQL | Relational data storage |
| AI Integration | OpenAI/Claude/Gemini APIs | Natural Language Processing for EduGuide |
| API Testing | Postman / Swagger | Endpoint documentation and testing |


## 6.3 Testing Approach and Data Used

Testing was conducted rigorously across the stack to ensure reliability:

### 6.3.1 Unit Testing
Backend logic, such as cluster point calculation, permission checks, and API rate limiting, was tested using Django's built-in testing framework. Serializer validations and database constraints (e.g., ensuring soft deletes function correctly without wiping related data) were also verified.

### 6.3.2 Integration Testing
API endpoints were tested via Swagger and Postman to validate request/response lifecycles. This included user registration, bookmarking careers, and generating community posts. Data consistency between the User, Academic Profile, and Hubs models was heavily scrutinized.

### 6.3.3 Functional Testing
Core workflows were tested using synthetic data:
* **Community Engagement:** Posting a question in a Society Hub, replying to threads, and verifying that the async view counting and score calculation performed as expected.
* **EduGuide Capabilities:** Chatbot testing was conducted to ensure the AI correctly identified the active hub context. Tests also verified graceful fallbacks when primary AI service APIs (e.g., OpenAI) timed out.
* **Admin Moderation:** Utilizing the Admin Panel to soft-delete flagged comments and confirming they were immediately hidden from the public frontend.

### 6.3.4 User Acceptance Testing (UAT)
Target demographics (high school leavers and peer counselors) tested the staging environment. Feedback on the Career Comparison clarity, the responsiveness of the EduGuide chatbot, and the Society Hub navigation was iteratively incorporated to improve the user experience.

### 6.3.5 Security Testing
Unauthenticated access to protected endpoints (like creating a post) was verified to return HTTP 403 Forbidden errors. Token expiration and proper permission checks for Admin Panel actions were successfully validated.


## 6.4 Proposed Change-over Techniques

### 6.4.1 Pilot Change-over (Recommended)
EduPath will be introduced to a select group of students from a partner high school. This localized approach allows developers to monitor database load and optimize AI API token usage based on real-world interaction before a wider rollout.

### 6.4.2 Parallel Change-over (Alternative)
Students can use EduPath alongside traditional KUCCPS physical booklets. While this allows for safe cross-referencing, it may slow down the complete adoption of the digital workflow.

### 6.4.3 Training and Documentation
Interactive tooltips, a comprehensive FAQ section within the application, and digital user manuals will be provided to ensure seamless onboarding for new students and academic advisors.


<br><br><br>

# CHAPTER SEVEN: LIMITATIONS, CONCLUSIONS AND RECOMMENDATIONS

## 7.1 Limitations

The following limitations were identified during the development phase of EduPath:

1. **Data Freshness Dependency:** The accuracy of the Course Directory heavily relies on periodic, manual syncing with official KUCCPS data releases, which can occasionally delay the availability of the latest cutoff points.
2. **Infrastructure and API Costs:** As the platform scales, maintaining a robust database and handling the increasing volume of API requests to external LLMs (for the EduGuide AI) will introduce significant hosting expenses.
3. **Internet Accessibility:** The platform relies on real-time internet access, which poses a barrier to students in marginalized areas lacking stable connectivity.


## 7.2 Conclusions

The EduPath project successfully engineered a comprehensive, centralized digital career guidance platform. The system addressed key objectives identified during requirements gathering:

* Consolidated fragmented career data and university course requirements into an easily searchable directory and comparison tool.
* Established an interactive Society Hub that fosters peer-to-peer mentorship and direct access to career experts.
* Successfully integrated EduGuide, an AI-powered assistant capable of providing contextual career advice and generating robust pros/cons analyses.
* Delivered a secure, scalable architecture using Django REST Framework and React, complete with an Admin Panel for efficient platform moderation.


## 7.3 Recommendations

Based on project findings, the following recommendations are proposed for future iterations of EduPath:

### 7.3.1 Technical Recommendations

1. **Implement a Payment Plan for AI Bills:** To sustain advanced platform features (like the EduGuide AI chatbot and automated pros/cons generation), introduce a tiered subscription or payment plan module. This billing system will manage student payments for AI-driven services, ensuring the long-term financial viability of these premium tools while allowing students to track their usage.
2. **Develop a Student Ranking Dashboard:** Implement a leaderboard system that calculates and displays student rankings based on their KCSE grades and computed cluster points. This would foster healthy academic competition and provide clear goal-tracking metrics for students across the platform.
3. **Automated Data Integration:** Develop automated web scrapers or official API partnerships with KUCCPS and university portals to ensure course data and cutoff points are updated in real-time.

### 7.3.2 Educational and Content Recommendations

1. **Holistic Profiling:** Expand the Academic Profile to include extracurricular activities and psychometric test results, providing more well-rounded career recommendations beyond just KCSE grades.
2. **Institutional Portals:** Create specialized dashboards for high school counselors to monitor their students' progress and provide batch guidance.

### 7.3.3 Deployment Recommendations

1. **Mobile Application Development:** Build a native or cross-platform mobile application to improve accessibility, allowing for offline access to bookmarked careers and push notifications for Society Hub replies.
2. **Advanced Analytics:** Integrate tracking tools into the Admin Panel to analyze which career paths and courses are trending, providing valuable insights to educational policymakers.
