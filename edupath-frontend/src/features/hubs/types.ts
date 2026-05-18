export type PostType = 'question' | 'guide' | 'success_story' | 'news' | 'link' | 'image';
export type UserRole = 'novice' | 'contributor' | 'moderator' | 'mentor' | 'associate' | 'institution';

export interface Society {
  id: number;
  name: string;
  logo: string;
  color: string;
  careers: string[];
  memberCount?: number;
  postCount?: number;
}

export interface AffiliatedInstitution {
  id: number;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  type: 'school' | 'bootcamp' | 'company' | 'ngo';
}

export interface Post {
  id: number;
  title: string;
  author: string;
  role: UserRole;
  type: PostType;
  content: string;
  link_url?: string;
  image_url?: string;
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
