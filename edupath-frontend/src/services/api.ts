// API Service Layer for EduPath Frontend
// Base configuration for all API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('edupath.auth.token');
};

// ============================================
// ACADEMIC PROFILE API
// ============================================

export interface SubjectDef {
  code: string; // e.g., MATH, ENG, KISW, BIO
  name: string;
  group: 'core' | 'science' | 'humanity' | 'technical' | 'language' | 'other';
}

export type KCSEGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'E';

export interface GradeEntry {
  subject_code: string; // matches SubjectDef.code
  grade: KCSEGrade;
}

export interface AcademicProfile {
  id?: string;
  kcse_year?: number;
  kcse_school?: string | null;
  kcse_grades?: Record<string, KCSEGrade> | null;
  kcse_mean_points?: number | null;
  cluster_points?: number | null;
  strengths?: string[];
  interests?: string[];
  career_goals?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicProfilePayload {
  kcse_year?: number;
  kcse_school?: string | null;
  kcse_grades: Record<string, KCSEGrade>;
  kcse_mean_points?: number | null;
}

export const academicAPI = {
  getProfile: () =>
    apiRequest<AcademicProfile>('/auth/profile/academic_profile/'),

  upsertProfile: (data: AcademicProfilePayload) =>
    apiRequest<AcademicProfile>('/auth/profile/academic_profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  listSubjects: () =>
    apiRequest<{ results: SubjectDef[] }>('/courses/subjects/'),
};

// Helper function to build headers
const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }
  
  return headers;
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { includeAuth?: boolean } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getHeaders(options.includeAuth !== false),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      console.error('API Error Response:', { url, status: response.status, error });
      throw new Error(error.detail || error.message || error.error || JSON.stringify(error) || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', { url, error });
    throw error;
  }
}

// ============================================
// AUTHENTICATION API
// ============================================

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'novice' | 'contributor' | 'expert';
  profile_picture?: string;
  bio?: string;
  location?: string;
  created_at: string;
  date_joined?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  email_verified?: boolean;
}

export const authAPI = {
  register: (data: RegisterData) =>
    apiRequest<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginData) =>
    apiRequest<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiRequest<void>('/auth/logout/', {
      method: 'POST',
    }),

  getProfile: () =>
    apiRequest<User>('/auth/profile/me/'),

  getAchievements: () =>
    apiRequest<any[]>('/auth/profile/achievements/'),

  getAnalytics: () =>
    apiRequest<any>('/auth/profile/analytics/'),

  updateProfile: (data: Partial<User>) =>
    apiRequest<User>('/auth/profile/me/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================
// CAREERS API
// ============================================

export interface Career {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  avg_salary_ksh: number;
  job_demand_score: number;
  growth_rate: number;
  work_life_balance_score: number;
  entry_requirements_score: number;
  job_satisfaction_score: number;
  education_required: string;
  experience_required: string;
  key_skills: string[];
  top_employers: string[];
  work_environment: string;
  certifications: string[];
  pros_cons?: Array<{ type: string; items: string[] }>;
}

export const careersAPI = {
  list: (params?: { category?: string; search?: string; ordering?: string }) =>
    apiRequest<{ results: Career[] }>(`/careers/?${new URLSearchParams(params as any)}`),

  get: (id: string) =>
    apiRequest<Career>(`/careers/${id}/`),

  compare: (careerIds: string[]) =>
    apiRequest<Career[]>('/careers/compare/', {
      method: 'POST',
      body: JSON.stringify({ career_ids: careerIds }),
    }),
};

// ============================================
// COURSES API
// ============================================

export interface Course {
  id: string;
  name: string;
  category: string;
  duration: string;
  cluster_points: number;
  description: string;
  modules: string[];
  career_paths: string[];
  mandatory_subjects: string[];
  alternative_subjects: string[];
  cluster_subjects?: string[] | null;
  pros?: string[];
  cons?: string[];
  careers?: string[];
  universities?: CourseUniversity[];
  // Admin fields (optional, used for creation/editing)
  institution?: string;
  cutoff_2023?: number | null;
  cutoff_2022?: number | null;
  fees_ksh?: number | null;
  programme_code?: string | null;
  subject_requirement_1?: string | null;
  subject_requirement_2?: string | null;
  subject_requirement_3?: string | null;
  subject_requirement_4?: string | null;
  is_enriched?: boolean;
  avg_fees_ksh?: number | null;
  related_hub?: string | null;
}

export interface CourseUniversity {
  id: string;
  course: string | Course;
  university: string | University;
  program_code?: string;
  programme_name?: string;
  fees_ksh: number;
  cutoff_points: number;
  cutoff_2022?: number;
  cutoff_2023?: number;
  requirements?: any;
  cutoffs?: any;
  cluster_subjects?: string[];
  application_deadline?: string | null;
  course_url?: string | null;
}

export interface University {
  id: string;
  name: string;
  short_name: string;
  type: 'Public' | 'Private';
  location: string;
  logo: string;
  established: number;
  ranking: number;
  students: string;
  website: string;
  description: string;
  facilities: string[];
  accreditation: string;
}

/** One institution-programme row nested inside a CourseGrouped response. */
export interface Programme {
  programme_code: string | null;
  name: string;
  institution: string | null;
  cutoff_2023: number | null;
  cutoff_2022: number | null;
  subject_requirement_1: string | null;
  subject_requirement_2: string | null;
  subject_requirement_3: string | null;
  subject_requirement_4: string | null;
}

/** Category-level response from /courses/grouped/ and /courses/grouped/<category>/ */
export interface CourseGrouped {
  category: string;
  description: string | null;
  pros: string[] | null;
  cons: string[] | null;
  careers: string[] | null;
  related_hub: string | null;
  avg_fees_ksh: number | null;
  is_enriched: boolean;
  programmes: Programme[];
}

export const coursesAPI = {
  listCourses: async (params?: { category?: string; search?: string }) => {
    const data = await apiRequest<any>(`/courses/courses/?${new URLSearchParams(params as any)}`, { includeAuth: false })
    const results: Course[] = Array.isArray(data) ? data : (data?.results || [])
    return { results }
  },

  getCourse: (id: string) =>
    apiRequest<Course>(`/courses/courses/${id}/`),

  checkEligibility: (courseId: string, clusterPoints: number) =>
    apiRequest<{
      eligible: boolean;
      user_points: number;
      required_points: number;
      difference: number;
      message: string;
    }>(`/courses/courses/${courseId}/check_eligibility/`, {
      method: 'POST',
      body: JSON.stringify({ cluster_points: clusterPoints }),
    }),

  listUniversities: async (params?: { type?: string; location?: string; search?: string }) => {
    const data = await apiRequest<any>(`/courses/universities/?${new URLSearchParams(params as any)}`, { includeAuth: false })
    const results: University[] = Array.isArray(data) ? data : (data?.results || [])
    return { results }
  },

  getUniversity: (id: string) =>
    apiRequest<University>(`/courses/universities/${id}/`),

  getUniversityPrograms: async (universityId: string, params?: { category?: string; search?: string; ordering?: string }) => {
    const data = await apiRequest<{
      university: University;
      programs: CourseUniversity[];
      total_programs: number;
    }>(`/courses/universities/${universityId}/programs/?${new URLSearchParams(params as any)}`, { includeAuth: false })
    return data
  },

  listCourseUniversities: async (params?: { course?: string; university?: string }) => {
    const data = await apiRequest<any>(`/courses/course-universities/?${new URLSearchParams(params as any)}`, { includeAuth: false })
    const raw: any[] = Array.isArray(data) ? data : (data?.results || [])
    // Keep nested objects as they are for CourseDetailCard compatibility
    const results: CourseUniversity[] = raw.map((item: any) => ({
      id: String(item.id),
      course: item.course, // Keep as object or string
      university: item.university, // Keep as object or string
      fees_ksh: Number(item.fees_ksh),
      cutoff_points: Number(item.cutoff_points),
      application_deadline: item.application_deadline ?? null,
      course_url: item.course_url ?? null,
    }))
    return { results }
  },

  /**
   * Returns one object per category (235 items) for the discovery page.
   * Each object includes a `programmes` array of all institution offerings.
   */
  listGrouped: (params?: { q?: string; hub?: string }) =>
    apiRequest<CourseGrouped[]>(
      `/courses/grouped/?${new URLSearchParams(params as any)}`,
      { includeAuth: false }
    ),

  /**
   * Returns full detail for one category, all institution offerings nested.
   * Pass the raw category string — encoding is handled inside.
   */
  getGrouped: (category: string) =>
    apiRequest<CourseGrouped>(
      `/courses/grouped/${encodeURIComponent(category)}/`,
      { includeAuth: false }
    ),

  calculateCluster: (payload: {
    course_id: string;
    grades?: Record<string, KCSEGrade> | GradeEntry[];
    mean_points?: number;
    use_profile?: boolean;
  }) =>
    apiRequest<{
      course_id: string;
      cluster_points: number;
      raw_cluster_total: number;
      mean_points: number | null;
      required_points: number;
      eligible: boolean;
      missing_subjects: string[];
      cluster_subjects: string[];
    }>('/courses/calculate-cluster/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ============================================
// HUBS API (Forums)
// ============================================

export interface Hub {
  id: string;
  name: string;
  slug: string;
  field: string;
  category?: string;
  icon: string;
  color: string;
  banner_image?: string | null;
  description: string;
  rules?: string | string[] | null;
  member_count: number;
  active_posts: number;
  created_at: string;
  updated_at: string;
  is_member: boolean;
}

export interface Post {
  id: string;
  hub: string;
  author: User | null;
  title: string;
  content: string;
  post_type: 'question' | 'guide' | 'discussion' | 'success_story';
  is_expert_post: boolean;
  tags: string[];
  upvotes: number;
  downvotes: number;
  comment_count: number;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  score: number;
  is_member: boolean;
}

export interface Comment {
  id: string;
  post: string;
  author: User;
  parent_comment?: string;
  content: string;
  depth?: number;
  path?: string;
  upvotes: number;
  downvotes: number;
  score?: number;
  reply_count?: number;
  is_deleted?: boolean;
  is_edited?: boolean;
  edited_at?: string;
  created_at: string;
  updated_at?: string;
  replies?: Comment[];
}

export const hubsAPI = {
  listHubs: async (params?: { search?: string; ordering?: string }) => {
    const searchParams = params ? new URLSearchParams(params as any) : new URLSearchParams();
    const data = await apiRequest<any>(`/hubs/hubs/?${searchParams.toString()}`);
    const results: Hub[] = Array.isArray(data) ? data : data?.results || [];
    return { results };
  },

  getHub: (idOrSlug: string) =>
    apiRequest<Hub>(`/hubs/hubs/${idOrSlug}/`),

  getHubOverview: (idOrSlug: string) =>
    apiRequest<{ hub: Hub; recent_posts: Post[]; related_courses: Course[] }>(`/hubs/hubs/${idOrSlug}/overview/`),

  listRelatedCourses: (idOrSlug: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    return apiRequest<{ results: Course[] }>(`/hubs/hubs/${idOrSlug}/related_courses/?${params.toString()}`);
  },

  listRecentPosts: (idOrSlug: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    return apiRequest<{ results: Post[] }>(`/hubs/hubs/${idOrSlug}/recent_posts/?${params.toString()}`);
  },

  joinHub: (idOrSlug: string) =>
    apiRequest<{ status: string; hub: Hub }>(`/hubs/hubs/${idOrSlug}/join/`, { method: 'POST' }),

  leaveHub: (idOrSlug: string) =>
    apiRequest<{ status: string; hub: Hub }>(`/hubs/hubs/${idOrSlug}/leave/`, { method: 'POST' }),

  listPosts: async (params?: { hub?: string; post_type?: string; ordering?: string; search?: string }) => {
    const searchParams = params ? new URLSearchParams(params as any) : new URLSearchParams();
    const data = await apiRequest<any>(`/hubs/posts/?${searchParams.toString()}`);
    const results: Post[] = Array.isArray(data) ? data : data?.results || [];
    return { results };
  },

  getPost: (id: string) =>
    apiRequest<Post>(`/hubs/posts/${id}/`),

  createPost: (data: { hub: string; title: string; content: string; post_type: string; is_expert_post?: boolean; tags?: string[] }) =>
    apiRequest<Post>('/hubs/posts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  votePost: (postId: string, voteType: 'upvote' | 'downvote') =>
    apiRequest<{ status: string; upvotes: number; downvotes: number }>(`/hubs/posts/${postId}/vote/`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    }),

  unvotePost: (postId: string) =>
    apiRequest<{ status: string; upvotes: number; downvotes: number }>(`/hubs/posts/${postId}/unvote/`, {
      method: 'DELETE',
    }),

  listComments: async (postId: string) => {
    const data = await apiRequest<any>(`/hubs/comments/?post=${postId}`);
    const results: Comment[] = Array.isArray(data) ? data : data?.results || [];
    return { results };
  },

  createComment: (data: { post: string; content: string; parent_comment?: string }) =>
    apiRequest<Comment>('/hubs/comments/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  voteComment: (commentId: string, voteType: 'upvote' | 'downvote') =>
    apiRequest<{ status: string; upvotes: number; downvotes: number }>(`/hubs/comments/${commentId}/vote/`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    }),
};

// ============================================
// BOOKMARKS API
// ============================================

export interface Bookmark {
  id: string;
  bookmark_type: 'course' | 'university' | 'post' | 'society';
  bookmark_id: string;
  created_at: string;
}

export const bookmarksAPI = {
  list: () =>
    apiRequest<Bookmark[]>('/auth/profile/bookmarks/'),

  create: (bookmarkType: string, bookmarkId: string) =>
    apiRequest<Bookmark>('/auth/profile/bookmarks/', {
      method: 'POST',
      body: JSON.stringify({
        bookmark_type: bookmarkType,
        bookmark_id: bookmarkId,
      }),
    }),

  delete: (bookmarkId: string) =>
    apiRequest<void>(`/auth/profile/bookmarks/${bookmarkId}/`, {
      method: 'DELETE',
    }),
};

// ============================================
// SEARCH API
// ============================================

export interface SearchResults {
  query: string;
  total_results: number;
  results: {
    careers?: Array<{ id: string; name: string; category: string; icon: string; type: string }>;
    courses?: Array<{ id: string; name: string; category: string; duration: string; type: string }>;
    universities?: Array<{ id: string; name: string; location: string; ranking: number; type: string }>;
    posts?: Array<{ id: string; title: string; hub: string; author: string; type: string }>;
    societies?: Array<{ id: string; name: string; acronym: string; type: string }>;
  };
}

export const searchAPI = {
  global: (query: string, type: string = 'all') =>
    apiRequest<SearchResults>(`/search/?q=${encodeURIComponent(query)}&type=${type}`),
};

// ============================================
// SOCIETIES API
// ============================================

export interface Society {
  id: string;
  name: string;
  acronym: string;
  full_name: string;
  logo: string;
  type: string;
  description: string;
  website?: string;
  icon?: string;
}

export type SocietyPostType = 'announcement' | 'question' | 'opportunity' | 'discussion';

export interface SocietyPost {
  id: string;
  society: string;
  author: User | null;
  title: string;
  content: string;
  post_type: SocietyPostType;
  tags: string[];
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
  updated_at: string;
  user_vote: 'upvote' | 'downvote' | null;
}

export interface CreateSocietyPostPayload {
  society: string;
  title: string;
  content: string;
  post_type?: SocietyPostType;
  tags?: string[];
}

const normalizeSociety = (item: any): Society => ({
  id: String(item.id),
  name: item.name,
  acronym: item.acronym,
  full_name: item.full_name,
  logo: item.logo,
  type: item.type,
  description: item.description,
  website: item.website ?? undefined,
});

const normalizeSocietyPost = (item: any): SocietyPost => ({
  id: String(item.id),
  society: typeof item.society === 'object' ? String(item.society.id) : String(item.society),
  author: item.author ?? null,
  title: item.title,
  content: item.content,
  post_type: item.post_type,
  tags: Array.isArray(item.tags) ? item.tags : [],
  upvotes: Number(item.upvotes ?? 0),
  downvotes: Number(item.downvotes ?? 0),
  score:
    typeof item.score === 'number'
      ? item.score
      : Number(item.upvotes ?? 0) - Number(item.downvotes ?? 0),
  created_at: item.created_at,
  updated_at: item.updated_at,
  user_vote: item.user_vote ?? null,
});

export const societiesAPI = {
  list: async (params?: { type?: string; search?: string }) => {
    const searchParams = params ? new URLSearchParams(params as any) : new URLSearchParams();
    const data = await apiRequest<any>(`/societies/?${searchParams.toString()}`, { includeAuth: false });
    const raw: any[] = Array.isArray(data) ? data : data?.results || [];
    return { results: raw.map(normalizeSociety) };
  },

  get: async (id: string) => {
    const data = await apiRequest<any>(`/societies/${id}/`, { includeAuth: false });
    return normalizeSociety(data);
  },

  listPosts: async (params?: { society?: string; post_type?: string; search?: string }) => {
    const searchParams = params ? new URLSearchParams(params as any) : new URLSearchParams();
    const data = await apiRequest<any>(`/societies/posts/?${searchParams.toString()}`, { includeAuth: false });
    const raw: any[] = Array.isArray(data) ? data : data?.results || [];
    return { results: raw.map(normalizeSocietyPost) };
  },

  createPost: async (payload: CreateSocietyPostPayload) => {
    const data = await apiRequest<any>('/societies/posts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeSocietyPost(data);
  },

  votePost: async (postId: string, voteType: 'upvote' | 'downvote') => {
    const data = await apiRequest<any>(`/societies/posts/${postId}/vote/`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
    return {
      status: data.status,
      post: normalizeSocietyPost(data.post),
    };
  },

  unvotePost: async (postId: string) => {
    const data = await apiRequest<any>(`/societies/posts/${postId}/unvote/`, {
      method: 'DELETE',
    });
    return {
      status: data.status,
      post: normalizeSocietyPost(data.post),
    };
  },
};

// ============================================
// ADVISOR API (RAG Pipeline)
// ============================================

export interface AdvisorRecommendation {
  rank: number;
  course_name: string;
  institution: string;
  hub_category: string;
  match_explanation: string;
  career_paths: string[];
  cutoff_2023: number | null;
  cutoff_2022: number | null;
  avg_fees_ksh: number | null;
  match_score: number;
}

export const advisorAPI = {
  startSession: () =>
    apiRequest<{
      session_id: string;
      question: string;
      question_number: number;
      done: boolean;
    }>('/advisor/start/', { method: 'POST' }),

  sendMessage: (sessionId: string, content: string) =>
    apiRequest<{
      question: string | null;
      options?: string[];
      question_number: number;
      done: boolean;
      profile?: string;
    }>(`/advisor/${sessionId}/message/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getRecommendations: (sessionId: string) =>
    apiRequest<{
      session_id: string;
      profile_text: string;
      recommendations: AdvisorRecommendation[];
    }>(`/advisor/${sessionId}/recommendations/`),
};


// ============================================
// ADMIN API (Requires admin role)
// ============================================

/** Strip undefined/null/empty values so they never appear as literal '?foo=undefined' in the URL. */
function toQS(params?: Record<string, string | undefined | null>): string {
  if (!params) return ''
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Record<string, string>
  const qs = new URLSearchParams(clean).toString()
  return qs ? `?${qs}` : ''
}

export const adminAPI = {
  // Users
  listUsers: async (params?: { search?: string; role?: string; is_active?: string }) => {
    const data = await apiRequest<any>(`/auth/users/${toQS(params)}`)
    const results: User[] = Array.isArray(data) ? data : (data?.results || [])
    const count: number = data?.count ?? results.length
    return { results, count }
  },

  getUser: (id: string) =>
    apiRequest<User>(`/auth/users/${id}/`),

  createUser: (data: Partial<User> & { password: string }) =>
    apiRequest<User>('/auth/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: Partial<User> & { password?: string }) =>
    apiRequest<User>(`/auth/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    apiRequest<void>(`/auth/users/${id}/`, {
      method: 'DELETE',
    }),

  // Universities
  listUniversities: async (params?: { type?: string; location?: string; search?: string }) => {
    const data = await apiRequest<any>(`/courses/admin/universities/${toQS(params)}`)
    const results: University[] = Array.isArray(data) ? data : (data?.results || [])
    const count: number = data?.count ?? results.length
    return { results, count }
  },

  getUniversity: (id: string) =>
    apiRequest<University>(`/courses/admin/universities/${id}/`),

  createUniversity: (data: Omit<University, 'id' | 'created_at' | 'updated_at'>) =>
    apiRequest<University>('/courses/admin/universities/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUniversity: (id: string, data: Partial<University>) =>
    apiRequest<University>(`/courses/admin/universities/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUniversity: (id: string) =>
    apiRequest<void>(`/courses/admin/universities/${id}/`, {
      method: 'DELETE',
    }),

  // Courses
  listCourses: async (params?: { category?: string; search?: string }) => {
    const data = await apiRequest<any>(`/courses/admin/courses/${toQS(params)}`)
    const results: Course[] = Array.isArray(data) ? data : (data?.results || [])
    const count: number = data?.count ?? results.length
    return { results, count }
  },

  getCourse: (id: string) =>
    apiRequest<Course>(`/courses/admin/courses/${id}/`),

  createCourse: (data: Omit<Course, 'id' | 'created_at' | 'updated_at'>) =>
    apiRequest<Course>('/courses/admin/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCourse: (id: string, data: Partial<Course>) =>
    apiRequest<Course>(`/courses/admin/courses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCourse: (id: string) =>
    apiRequest<void>(`/courses/admin/courses/${id}/`, {
      method: 'DELETE',
    }),

  // Bulk operations
  bulkCreateCourses: (courses: Omit<Course, 'id' | 'created_at' | 'updated_at'>[]) =>
    apiRequest<{ created_count: number; created: any[]; errors: any[] }>('/courses/admin/courses/bulk_create/', {
      method: 'POST',
      body: JSON.stringify({ courses }),
    }),

  bulkUpdateCourses: (courses: Partial<Course>[]) =>
    apiRequest<{ updated_count: number; updated: any[]; errors: any[] }>('/courses/admin/courses/bulk_update/', {
      method: 'POST',
      body: JSON.stringify({ courses }),
    }),

  // Course-University relationships
  listCourseUniversities: async (params?: { course?: string; university?: string }) => {
    const data = await apiRequest<any>(`/courses/admin/course-universities/?${new URLSearchParams(params as any)}`)
    const results: CourseUniversity[] = Array.isArray(data) ? data : (data?.results || [])
    return { results }
  },

  createCourseUniversity: (data: Omit<CourseUniversity, 'id' | 'created_at' | 'updated_at'>) =>
    apiRequest<CourseUniversity>('/courses/admin/course-universities/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCourseUniversity: (id: string, data: Partial<CourseUniversity>) =>
    apiRequest<CourseUniversity>(`/courses/admin/course-universities/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCourseUniversity: (id: string) =>
    apiRequest<void>(`/courses/admin/course-universities/${id}/`, {
      method: 'DELETE',
    }),
};


// ============================================
// ASSOCIATES API
// ============================================

export interface Associate {
  id: number;
  name: string;
  associate_type: 'MENTOR' | 'SOCIETY' | 'SCHOOL';
  bio: string;
  profile_image: string | null;
  website: string | null;
  location: string | null;
  follower_count: number;
  is_following: boolean;
  created_at: string;
}

export interface AssociatePost {
  id: number;
  post_type: 'UPDATE' | 'OPPORTUNITY' | 'EVENT' | 'RESOURCE';
  title: string | null;
  body: string;
  image_url: string | null;
  external_url: string | null;
  cta_label: string | null;
  deadline: string | null;
  upvotes: number;
  created_at: string;
  associate_name: string;
  associate_type: 'MENTOR' | 'SOCIETY' | 'SCHOOL';
  associate_image: string | null;
}

export const associatesAPI = {
  apply: (data: {
    name: string;
    associate_type: 'MENTOR' | 'SOCIETY' | 'SCHOOL';
    bio: string;
    website?: string;
    location?: string;
    contact_email: string;
    hub_id: string;
  }) =>
    apiRequest<{ message: string }>('/associates/apply/', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: false,
    }),

  listForHub: (hubId: string) =>
    apiRequest<Associate[]>(`/associates/hubs/${hubId}/associates/`, { includeAuth: false }),

  getDetails: (associateId: number) =>
    apiRequest<Associate>(`/associates/${associateId}/`, { includeAuth: true }),

  listPosts: (associateId: number) =>
    apiRequest<AssociatePost[]>(`/associates/${associateId}/posts/`, { includeAuth: false }),

  report: (associatePostId: number, reason: string) =>
    apiRequest<{ message: string }>('/associates/reports/', {
      method: 'POST',
      body: JSON.stringify({ associate_post_id: associatePostId, reason }),
    }),

  follow: (associateId: number) =>
    apiRequest<{ message: string }>(`/associates/${associateId}/follow/`, {
      method: 'POST',
    }),

  unfollow: (associateId: number) =>
    apiRequest<{ message: string }>(`/associates/${associateId}/unfollow/`, {
      method: 'DELETE',
    }),

  listFollowed: () =>
    apiRequest<Associate[]>('/associates/followed/', { includeAuth: true }),
};

// ============================================
// ADMIN HUB MODERATION API
// ============================================

export interface DashboardStats {
  total_students: number;
  verified_associates: number;
  open_reports: number;
  pending_applications: number;
}

export interface RecentStudentPost {
  id: string;
  title: string;
  content: string;
  author: string;
  hub: string;
  created_at: string;
  upvotes: number;
}

export interface RecentAssociatePost {
  id: number;
  content: string;
  associate: string;
  associate_type: string;
  hub: string;
  created_at: string;
  upvotes: number;
}

export interface HubHealth {
  id: string;
  name: string;
  category: string;
  student_posts_7d: number;
  associate_posts_7d: number;
  open_reports: number;
  traffic_light: 'green' | 'amber' | 'red';
}

export interface HubStudentPost {
  id: string;
  title: string;
  content: string;
  author: string;
  upvotes: number;
  downvotes: number;
  report_count: number;
  created_at: string;
}

export interface HubAssociatePost {
  id: number;
  content: string;
  image_url: string | null;
  external_url: string | null;
  associate: string;
  associate_id: number;
  associate_type: string;
  upvotes: number;
  report_count: number;
  is_visible: boolean;
  created_at: string;
}

export interface HubReportGroup {
  post_id: number;
  post_content: string;
  associate: string;
  associate_type: string;
  reports: {
    id: number;
    reporter: string;
    reason: string;
    created_at: string;
  }[];
  report_count: number;
}

export const adminHubAPI = {
  getDashboardStats: () =>
    apiRequest<DashboardStats>('/associates/admin/dashboard-stats/'),

  getRecentStudentPosts: () =>
    apiRequest<RecentStudentPost[]>('/associates/admin/recent-student-posts/'),

  getRecentAssociatePosts: () =>
    apiRequest<RecentAssociatePost[]>('/associates/admin/recent-associate-posts/'),

  getHubHealth: () =>
    apiRequest<HubHealth[]>('/associates/admin/hub-health/'),

  getHubStudentPosts: (hubId: string) =>
    apiRequest<HubStudentPost[]>(`/associates/admin/hubs/${hubId}/student-posts/`),

  getHubAssociatePosts: (hubId: string) =>
    apiRequest<HubAssociatePost[]>(`/associates/admin/hubs/${hubId}/associate-posts/`),

  getHubReports: (hubId: string) =>
    apiRequest<HubReportGroup[]>(`/associates/admin/hubs/${hubId}/reports/`),

  hideStudentPost: (postId: string) =>
    apiRequest<{ message: string }>(`/associates/admin/posts/${postId}/hide/`, { method: 'POST' }),

  warnStudent: (postId: string) =>
    apiRequest<{ message: string }>(`/associates/admin/posts/${postId}/warn/`, { method: 'POST' }),

  dismissStudentPostReports: (postId: string) =>
    apiRequest<{ message: string }>(`/associates/admin/posts/${postId}/dismiss-reports/`, { method: 'POST' }),

  hideAssociatePost: (postId: number) =>
    apiRequest<{ message: string }>(`/associates/admin/associate-posts/${postId}/hide/`, { method: 'POST' }),

  strikeAssociate: (postId: number) =>
    apiRequest<{ message: string; strike_count: number }>(`/associates/admin/associate-posts/${postId}/strike/`, { method: 'POST' }),

  dismissAssociatePostReports: (postId: number) =>
    apiRequest<{ message: string }>(`/associates/admin/associate-posts/${postId}/dismiss-reports/`, { method: 'POST' }),
};

// ============================================
// ADMIN ASSOCIATE APPLICATIONS API
// ============================================

export interface AssociateApplication {
  id: number;
  name: string;
  associate_type: 'MENTOR' | 'SOCIETY' | 'SCHOOL';
  hub: string;
  hub_id: string;
  contact_email: string;
  bio: string;
  website: string | null;
  location: string | null;
  profile_image: string | null;
  application_status: 'PENDING' | 'AWAITING_RESPONSE' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
}

export const adminApplicationsAPI = {
  listApplications: (status: 'pending' | 'awaiting' | 'history' = 'pending') =>
    apiRequest<AssociateApplication[]>(`/associates/admin/applications/?status=${status}`),

  approveApplication: (associateId: number) =>
    apiRequest<{ message: string }>(`/associates/admin/applications/${associateId}/approve/`, { method: 'POST' }),

  rejectApplication: (associateId: number, reason: string) =>
    apiRequest<{ message: string }>(`/associates/admin/applications/${associateId}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  requestApplicationInfo: (associateId: number, question: string) =>
    apiRequest<{ message: string }>(`/associates/admin/applications/${associateId}/request-info/`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};

export default {
  auth: authAPI,
  careers: careersAPI,
  courses: coursesAPI,
  hubs: hubsAPI,
  bookmarks: bookmarksAPI,
  search: searchAPI,
  societies: societiesAPI,
  academic: academicAPI,
  advisor: advisorAPI,
  admin: adminAPI,
  associates: associatesAPI,
  adminHub: adminHubAPI,
  adminApplications: adminApplicationsAPI,
};
