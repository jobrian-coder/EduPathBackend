export type PostType = 'question' | 'guide' | 'success_story' | 'news';
export type UserRole = 'novice' | 'contributor' | 'moderator';

export interface Society {
  id: number;
  name: string;
  logo: string;
  color: string;
  careers: string[];
  memberCount?: number;
  postCount?: number;
}

export interface Post {
  id: number;
  title: string;
  author: string;
  role: UserRole;
  type: PostType;
  content: string;
  upvotes: number;
  downvotes: number;
  comments: number;
  tags: string[];
  isPinned: boolean;
  timestamp: string;
}

export interface Event {
  id: number;
  society: string;
  name: string;
  date: string;
  type: string;
}
