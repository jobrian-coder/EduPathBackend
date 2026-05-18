# EduPath Frontend - Complex Features Documentation

> **For Junior Developers** - Comprehensive guide to the major frontend features

---

## Table of Contents

1. [EduGuide AI Advisor](#1-eduguide-ai-advisor)
2. [Directory (Course/University Search)](#2-directory-courseuniversity-search)
3. [Hubs & Forums System](#3-hubs--forums-system)
4. [Academic Profile](#4-academic-profile)
5. [Landing Page](#5-landing-page)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Common Patterns](#7-common-patterns)

---

## 1. EduGuide AI Advisor

### Overview
An AI-powered academic advisor that conducts a 10-question interview and generates personalized course recommendations using a 2-stage RAG (Retrieval-Augmented Generation) pipeline.

### Key Components

#### `AdvisorPage.tsx` (Orchestrator)
**Location**: `src/features/advisor/pages/AdvisorPage.tsx`

**State Management**:
```typescript
const [sessionId, setSessionId] = useState<string | null>(null);
const [recommendations, setRecommendations] = useState<AdvisorRecommendation[] | null>(null);
const [academicProfile, setAcademicProfile] = useState<any>(null);
const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
```

**UI States**:
1. **Landing State** - "Start Interview" button with academic profile alert
2. **Chat State** - Renders `InterviewChat` component
3. **Loading State** - Animated spinner while fetching recommendations
4. **Error State** - Red alert with "Try Again" button
5. **Results State** - Displays `RecommendationCard` list

**Academic Profile Integration**:
- Fetches profile on mount using `api.academic.getProfile()`
- Shows amber warning if no grades: *"Add your KCSE grades for better recommendations"*
- Shows teal badge if grades exist: *"KCSE Mean Points: X/84"*
- Passes profile to recommendation API for eligibility filtering

---

#### `InterviewChat.tsx` (Chat Interface)
**Location**: `src/features/advisor/components/InterviewChat.tsx`

**Features**:
- **Real-time messaging** with typing indicators
- **Multiple choice options** displayed as clickable buttons
- **Progress tracker** - "Question X of 10" badge
- **Auto-scroll** to latest message using `useRef`
- **Error handling** with fallback messages

**Message Flow**:
```
User types answer → POST /api/advisor/<session_id>/message/
                → Receive next question or done=true
                → If done: onComplete() triggers recommendations fetch
```

**Key Implementation Details**:
```typescript
// Auto-submit when clicking option
const handleOptionClick = (option: string) => {
  setInputState(option);
  setTimeout(() => {
    const form = document.getElementById('chat-input-form');
    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }, 0);
};

// Scroll to bottom on new messages
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

---

#### `RecommendationCard.tsx`
**Location**: `src/features/advisor/components/RecommendationCard.tsx`

**Displays**:
- Match score (1-100)
- Course name & institution
- Match explanation (2-3 sentences)
- Career paths list
- Cutoff points (2022/2023)
- Average fees

---

### API Integration

```typescript
// Start interview
const res = await api.advisor.startSession();
// Returns: { session_id, question, question_number, done }

// Send answer
const res = await api.advisor.sendMessage(sessionId, userMessage);
// Returns: { question, options, question_number, done, profile? }

// Get recommendations
const res = await api.advisor.getRecommendations(sessionId);
// Returns: { session_id, profile_text, recommendations: [...] }
```

---

## 2. Directory (Course/University Search)

### Overview
A searchable, filterable directory of Kenyan universities and courses with grouped course categories.

### Key Features

#### Dual View System
```typescript
const [view, setView] = useState<'courses' | 'universities'>('courses');
```

**Courses View**:
- Displays `CourseGrouped` cards (category-level)
- Each card shows: category name, hub, avg fees, description
- Institution avatars showing where course is offered
- Click navigates to `/courses/<category>`

**Universities View**:
- Grid of university cards with icons
- Hover effects with scale animation
- Location badges
- Click navigates to `/universities/<id>/programs`

---

#### Advanced Filtering

**Filter Types**:
1. **Search Query** - Text search across names
2. **University Filter** - Sidebar list of all universities
3. **City Filter** - Dropdown of unique locations
4. **Tuition Range** - Min/max fee slider (mobile drawer)

**Filter Logic** (using `useMemo` for performance):
```typescript
const filteredGroups = useMemo(() => {
  return categoryGroups.filter(g => {
    // University name filter
    if (universityName) {
      if (!g.programmes.some(p => p.institution === universityName)) return false;
    }
    // City filter (matches university location)
    if (city) {
      const uniMatches = g.programmes.some(p => {
        const u = universities.find(uni => uni.name === p.institution);
        return u?.location === city;
      });
      if (!uniMatches) return false;
    }
    // Tuition filter
    const fee = minFeeFor(g);
    if (fee != null && (fee < tuitionMin || fee > tuitionMax)) return false;
    return true;
  });
}, [categoryGroups, universityName, city, tuitionMin, tuitionMax, universities]);
```

---

#### Sticky Search Header
```typescript
<div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b ...">
  <div className="grid grid-cols-[1fr_auto_auto] gap-2">
    <input ... />           {/* Search */}
    <button>Filters</button> {/* Mobile drawer trigger */}
    <div>                   {/* View toggle */}
      <button>Courses</button>
      <button>Universities</button>
    </div>
  </div>
</div>
```

---

#### Bookmark System
```typescript
async function saveCourse(group: CourseGrouped) {
  toggleBookmark({ 
    id: `course:${group.category}`, 
    type: 'course', 
    title: group.category 
  });
}
```

---

## 3. Hubs & Forums System

### Overview
Community discussion platform organized by career hubs (Technology, Engineering, Business, etc.). Each hub has posts, events, members, and resources.

### Key Components

#### `HubFeed.tsx` - Main Feed
**Location**: `src/features/hubs/pages/HubFeed.tsx`

**Features**:
- **Sidebar hub list** with followed hubs
- **Post feed** with upvote/downvote
- **Active users** display
- **Trending posts** section

**Data Loading**:
```typescript
useEffect(() => {
  loadHubs()
}, [])

useEffect(() => {
  if (selectedHub) {
    loadPosts(selectedHub.id)
    loadActiveUsers(selectedHub.id)
    loadTrendingPosts(selectedHub.id)
  }
}, [selectedHub])
```

---

#### `HubSociety.tsx` - Detailed Hub View
**Location**: `src/features/hubs/pages/HubSociety.tsx`

**Tab System**:
```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsTrigger value="feed">Feed</TabsTrigger>
  <TabsTrigger value="events">Events</TabsTrigger>
  <TabsTrigger value="members">Members</TabsTrigger>
  <TabsTrigger value="resources">Resources</TabsTrigger>
</Tabs>
```

**Features**:
- **Join/Leave** hub functionality
- **Create post** dialog (floating action button)
- **Post filters**: type (all/questions/guides/success stories) + sort (newest/top/trending)
- **Event RSVP** system
- **Member list** with message buttons

---

#### `useHub.ts` - Custom Hook
**Location**: `src/features/hubs/hooks/useHub.ts`

**React Query Integration**:
```typescript
export const useHub = ({ hubIdOrSlug }: UseHubParams) => {
  const queryClient = useQueryClient();

  const hubQuery = useQuery({
    queryKey: QUERY_KEYS.hub(hubIdOrSlug),
    queryFn: () => hubsAPI.getHub(hubIdOrSlug),
  });

  const usePosts = (filters: Record<string, unknown> = {}) =>
    useQuery({
      queryKey: QUERY_KEYS.posts(hubIdOrSlug, filters),
      queryFn: async () => {
        const { results } = await hubsAPI.listPosts({ ...filters, hub: hubIdOrSlug });
        return results;
      },
    });

  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostData) => hubsAPI.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts(hubIdOrSlug) });
    },
  });

  return { hubQuery, usePosts, createPost: createPostMutation.mutate, ... };
};
```

---

#### Post Voting System
```typescript
const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
  if (!isAuthenticated) {
    alert('Please sign in to vote');
    return;
  }
  try {
    await api.hubs.votePost(postId, voteType);
    // Reload posts to show updated counts
    if (selectedHub) loadPosts(selectedHub.id);
  } catch (error) {
    console.error('Failed to vote:', error);
  }
};
```

---

## 4. Academic Profile

### Overview
KCSE grades management system that calculates mean points and feeds into course eligibility filtering.

### Key Features

#### Grade Entry System
**Location**: `src/features/profile/pages/AcademicProfile.tsx`

**Predefined Subjects**:
```typescript
const KCSE_SUBJECTS = [
  // Compulsory (4)
  { code: 'MAT', name: 'Mathematics', compulsory: true },
  { code: 'ENG', name: 'English', compulsory: true },
  { code: 'KIS', name: 'Kiswahili', compulsory: true },
  { code: 'BIO', name: 'Biology', compulsory: true },
  // Optional (11+)
  { code: 'CHE', name: 'Chemistry', compulsory: false },
  ...
] as const;
```

**Grade Points Map**:
```typescript
const GRADE_POINTS_MAP: Record<KCSEGrade, number> = {
  'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
  'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3,
  'D-': 2, 'E': 1,
};
```

---

#### Mean Points Calculation
```typescript
const computeMeanPoints = (entries: GradeEntry[]) => {
  if (!entries || entries.length === 0) return undefined;
  const points = entries
    .map(entry => GRADE_POINTS_MAP[entry.grade])
    .filter(point => typeof point === 'number')
    .sort((a, b) => b - a)  // Sort descending
    .slice(0, 7);           // Take top 7 subjects
  if (points.length === 0) return undefined;
  return points.reduce((sum, current) => sum + current, 0);
};
```

**Example**: 
- Grades: A(12), B+(10), B(9), C+(7), B-(8), A-(11), C(6)
- Top 7: 12 + 11 + 10 + 9 + 8 + 7 + 6 = **63 points**

---

#### Form Validation
```typescript
const validateForm = () => {
  const filledSubjects = new Set(gradeEntries.map(g => g.subject_code));
  
  // Check compulsory subjects
  const missingCompulsory = COMPULSORY_SUBJECTS.filter(
    code => !filledSubjects.has(code)
  );
  
  if (missingCompulsory.length > 0) {
    return `Please add grades for: ${missingCompulsory.join(', ')}`;
  }
  
  return null; // Valid
};
```

---

#### Multi-Step Form
**Sections**:
1. **Academic Details** - KCSE year & school
2. **Subject Grades** - Add/remove subjects, select grades
3. **Review** - Computed mean points, manual override option

---

## 5. Landing Page

### Overview
Hero landing page with animated background, search, and featured sections.

### Key Features

#### Animated Background Mesh
```typescript
<div className="fixed inset-0 z-0 pointer-events-none">
  {/* Blurred gradient orbs */}
  <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-teal-400/20 blur-[120px]"></div>
  <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-cyan-400/20 blur-[120px]"></div>
  <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-emerald-400/20 blur-[120px]"></div>
  {/* Frosted glass overlay */}
  <div className="absolute inset-0 bg-white/30 backdrop-blur-[50px]"></div>
</div>
```

---

#### Fluid Search Bar
```typescript
<div className="rounded-[2rem] bg-white/60 border border-white/60 backdrop-blur-xl 
              px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)]
              focus-within:ring-4 focus-within:ring-teal-500/20">
  <input 
    placeholder="Search courses, universities, or paths..."
    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
  />
</div>
```

---

#### Featured Sections

**Hub Cards**:
```typescript
const hubData = [
  {
    name: 'Technology Hub',
    slug: 'tech-hub',
    icon: techIcon,
    memberCount: 2156
  },
  ...
];
```

**University Showcase**:
- Top 3 universities with icons
- Ranking badges
- Student counts
- Click → directory with filter

---

## 6. Frontend Architecture

### Project Structure
```
src/
├── components/
│   ├── common/          # Reusable UI (Card, Button, etc.)
│   ├── layout/          # Layout components (PageContainer)
│   └── providers/       # Context providers
├── features/            # Feature-based modules
│   ├── advisor/         # AI advisor
│   ├── auth/            # Authentication
│   ├── courses/         # Course detail/compare
│   ├── directory/       # Search/filter
│   ├── hubs/            # Forums
│   ├── landing/         # Home page
│   ├── posts/           # Post detail
│   ├── profile/         # User profile
│   └── societies/       # Professional societies
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── routes/              # Routing configuration
├── services/            # API integration (api.ts)
└── utils/               # Helper functions
```

---

### State Management

#### React Query (TanStack Query)
Used for server state management:

```typescript
// Hook pattern
const useHub = (hubId: string) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['hub', hubId],
    queryFn: () => api.hubs.getHub(hubId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const mutation = useMutation({
    mutationFn: api.hubs.joinHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub', hubId] });
    },
  });
  
  return { data: query.data, join: mutation.mutate };
};
```

---

#### Local State (useState)
Used for UI state:

```typescript
// Form state
const [formData, setFormData] = useState({ email: '', password: '' });

// UI state
const [isOpen, setIsOpen] = useState(false);
const [activeTab, setActiveTab] = useState('feed');
```

---

### Routing

#### React Router v6
**Location**: `src/routes/AppRoutes.tsx`

```typescript
<Route path="/" element={<Landing />} />
<Route path="/directory" element={<Directory />} />
<Route path="/advisor" element={<AdvisorPage />} />
<Route path="/hubs/:slug" element={<HubSociety />} />
<Route path="/courses/:category" element={<CourseDetail />} />
<Route path="/profile/academic" element={<AcademicProfile />} />
```

---

### API Service Layer

**Location**: `src/services/api.ts`

#### Request Pattern
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { includeAuth?: boolean } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.includeAuth !== false && {
        'Authorization': `Token ${getAuthToken()}`
      }),
      ...options.headers,
    },
  };
  
  const response = await fetch(url, config);
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}
```

---

#### API Modules
```typescript
export const api = {
  auth: authAPI,         // Login, register, profile
  careers: careersAPI,   // Career paths
  courses: coursesAPI,   // Courses & universities
  hubs: hubsAPI,         // Forums & posts
  societies: societiesAPI, // Professional bodies
  academic: academicAPI, // KCSE grades
  advisor: advisorAPI,   // AI chat
};
```

---

### Authentication Flow

#### Auth Hook Pattern
**Location**: `src/hooks/useAuth.ts`

```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('edupath.auth.token');
    if (token) {
      api.auth.getProfile()
        .then(setUser)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const login = async (credentials: LoginData) => {
    const response = await api.auth.login(credentials);
    localStorage.setItem('edupath.auth.token', response.token);
    setUser(response.user);
  };
  
  const logout = () => {
    localStorage.removeItem('edupath.auth.token');
    setUser(null);
  };
  
  return { user, isAuthenticated: !!user, login, logout, isLoading };
};
```

---

## 7. Common Patterns

### Debounced Search
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery] = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);
```

---

### Infinite Scroll
```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 1 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});

// Intersection Observer trigger
<div ref={loadMoreRef}>
  {isFetchingNextPage && <Spinner />}
</div>
```

---

### Optimistic Updates
```typescript
const voteMutation = useMutation({
  mutationFn: (postId: string) => api.votePost(postId),
  onMutate: async (postId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['posts'] });
    
    // Snapshot previous value
    const previousPosts = queryClient.getQueryData(['posts']);
    
    // Optimistically update
    queryClient.setQueryData(['posts'], (old) => ({
      ...old,
      upvotes: old.upvotes + 1,
    }));
    
    return { previousPosts };
  },
  onError: (err, postId, context) => {
    // Rollback on error
    queryClient.setQueryData(['posts'], context.previousPosts);
  },
});
```

---

### Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

### Loading States
```typescript
// Skeleton screens
{isLoading ? (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
  </div>
) : (
  <ActualContent />
)}
```

---

## Quick Reference: Feature Checklist

| Feature | Tech Stack | Key Files |
|---------|-----------|-----------|
| AI Advisor | Groq API, React State | `advisor/pages/AdvisorPage.tsx`, `advisor/components/InterviewChat.tsx` |
| Directory | React Query, URL params | `directory/pages/Directory.tsx` |
| Hubs | React Query, Tabs | `hubs/pages/HubSociety.tsx`, `hubs/hooks/useHub.ts` |
| Academic Profile | Form state, Computed values | `profile/pages/AcademicProfile.tsx` |
| Landing | CSS Animations, Search | `landing/pages/Landing.tsx` |
| Auth | LocalStorage, Context | `hooks/useAuth.ts`, `auth/pages/Auth.tsx` |

---

## Debugging Tips

1. **Check Network Tab** - API calls visible in browser dev tools
2. **React DevTools** - Inspect component hierarchy and state
3. **Query DevTools** - React Query has built-in devtools for cache inspection
4. **Console Logging** - Add `console.log('[Feature]', data)` at key points
5. **Error Boundaries** - Wrap components to catch crashes

---

**Questions?** Check the specific feature files or ask the senior dev!
