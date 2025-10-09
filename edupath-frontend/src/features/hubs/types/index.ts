import type { User as APIUser } from '../../../services/api';

export type PostType = 'question' | 'guide' | 'discussion' | 'success_story';
export type UserRole = 'novice' | 'contributor' | 'expert' | 'moderator';

// View-model types used by Hubs feature (avoid extending API types directly)
export interface HubVM {
  id: string;
  name: string;
  field: string;
  icon: string; // public URL
  color: string; // gradient classes
  description: string;
  memberCount: number; // mapped from APIHub.member_count
  postCount: number; // mapped from APIHub.active_posts
  rules?: string[]; // parsed from APIHub.rules (string)
  isMember: boolean; // client-side membership flag
}

// Lightweight UI Post for components like PostCard
export interface Post {
  id: any;
  title: string;
  author: string;
  role: UserRole;
  type: PostType;
  content: string;
  upvotes: number;
  downvotes: number;
  comments: number; // total comments count
  tags: string[];
  isPinned: boolean;
  timestamp: string;
}

export interface CommentVM {
  id: string;
  post: string; // post id
  author: APIUser | null;
  content: string;
  upvotes: number;
  downvotes: number;
  timestamp: string; // relative/humanized
  replies: CommentVM[];
  parentComment?: string;
  userVote?: 'up' | 'down' | null;
}

export interface PostVM {
  id: string;
  hub: string; // hub id
  author: APIUser | null;
  title: string;
  content: string;
  type: PostType; // mapped from post_type
  tags: string[];
  upvotes: number;
  downvotes: number;
  commentCount: number; // mapped from comment_count
  isPinned: boolean; // mapped from is_pinned
  timestamp: string; // relative/humanized
  userVote?: 'up' | 'down' | null;
  comments?: CommentVM[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  image?: string;
  isVirtual: boolean;
  registrationUrl?: string;
  maxAttendees?: number;
  currentAttendees: number;
  isAttending: boolean;
  createdBy: APIUser;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'article' | 'video' | 'course' | 'document' | 'other';
  category: string;
  tags: string[];
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member extends APIUser {
  joinDate: string;
  lastActive: string;
  postCount: number;
  commentCount: number;
  isOnline: boolean;
}

export interface CreatePostData {
  title: string;
  content: string;
  type: PostType;
  tags?: string[];
  isPinned?: boolean;
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface HubFilters {
  search?: string;
  type?: string;
  sort?: 'newest' | 'popular' | 'active';
}

export interface PostFilters {
  type?: PostType | 'all';
  search?: string;
  sort?: 'newest' | 'top' | 'trending';
  tag?: string;
  author?: string;
}
