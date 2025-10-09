import { formatDistanceToNow } from 'date-fns';
import { hubsAPI } from '../../../services/api';
import type { 
  PostVM, 
  HubVM, 
  Event, 
  CreatePostData, 
  CreateCommentData, 
  UpdatePostData, 
  CommentVM,
  PostFilters,
} from '../types';

// Helper function to transform API post to our Post type
const transformPost = (apiPost: any, currentUserId?: string): PostVM => ({
  ...apiPost,
  hub: typeof apiPost.hub === 'object' ? String(apiPost.hub.id) : String(apiPost.hub),
  type: apiPost.post_type,
  timestamp: formatDistanceToNow(new Date(apiPost.created_at), { addSuffix: true }),
  isPinned: apiPost.is_pinned,
  commentCount: apiPost.comment_count || 0,
  comments: (apiPost.comments || []).map((c: any) => transformComment(c, currentUserId)),
  userVote: apiPost.user_vote || null
});

// Helper function to transform API comment to our Comment type
const transformComment = (apiComment: any, currentUserId?: string): CommentVM => ({
  ...apiComment,
  timestamp: formatDistanceToNow(new Date(apiComment.created_at), { addSuffix: true }),
  replies: (apiComment.replies || []).map((r: any) => transformComment(r, currentUserId)),
  parentComment: apiComment.parent_comment,
  userVote: apiComment.user_vote || null
});

// Helper function to transform API hub to our Hub type
const transformHub = (apiHub: any, isMember: boolean = false): HubVM => ({
  id: String(apiHub.id),
  name: apiHub.name,
  field: apiHub.field,
  icon: apiHub.icon,
  color: apiHub.color,
  description: apiHub.description,
  memberCount: Number(apiHub.member_count || 0),
  postCount: Number(apiHub.active_posts || 0),
  rules: apiHub.rules ? (typeof apiHub.rules === 'string' ? [apiHub.rules] : apiHub.rules) : [],
  isMember,
});

export const hubApi = {
  // Fetch Tech Hub details
  getHub: async (hubId: string = 'tech'): Promise<HubVM> => {
    try {
      let apiHub: any | null = null;
      if (!hubId || hubId === 'tech') {
        // Fallback: list hubs and pick Technology Hub by name
        const { results } = await hubsAPI.listHubs();
        apiHub = results.find((h: any) => String(h.name).toLowerCase().includes('technology')) || results[0] || null;
        if (!apiHub) throw new Error('No hubs available');
      } else {
        apiHub = await hubsAPI.getHub(hubId);
      }
      const isMember = false; // TODO: wire from user profile
      return transformHub(apiHub, isMember);
    } catch (error) {
      console.error('Error fetching hub:', error);
      throw error;
    }
  },

  // Interact with a post: like/dislike (save/report are no-ops for now)
  interactWithPost: async (postId: string, action: 'like' | 'dislike' | 'save' | 'report') => {
    try {
      if (action === 'like' || action === 'dislike') {
        await hubsAPI.votePost(postId, action === 'like' ? 'upvote' : 'downvote');
      }
      // save/report can be wired later
      return { ok: true };
    } catch (error) {
      console.error('Error interacting with post:', error);
      throw error;
    }
  },

  // Fetch posts for the hub with filters
  getPosts: async (filters: PostFilters = {}, hubId: string = 'tech'): Promise<{ results: PostVM[] }> => {
    try {
      const { type, search, sort, ...rest } = filters;
      const params: any = {
        hub: hubId,
        ...(type && type !== 'all' && { post_type: type }),
        ...(search && { search }),
        ...(sort && { ordering: sort === 'newest' ? '-created_at' : sort === 'top' ? '-score' : '-comment_count' }),
        ...rest
      };

      const response = await hubsAPI.listPosts(params);
      return {
        results: response.results.map((post: any) => transformPost(post)),
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get a single post by ID
  getPost: async (postId: string): Promise<PostVM> => {
    try {
      const post = await hubsAPI.getPost(postId);
      return transformPost(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Create a new post
  createPost: async (data: CreatePostData, hubId: string = 'tech'): Promise<PostVM> => {
    try {
      const postData = {
        ...data,
        hub: hubId,
        post_type: data.type,
        is_pinned: data.isPinned || false,
        tags: data.tags || []
      };

      const response = await hubsAPI.createPost(postData);
      return transformPost(response);
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Update a post
  updatePost: async (postId: string, data: UpdatePostData): Promise<PostVM> => {
    try {
      const postData: any = { ...data };
      if (data.type) postData.post_type = data.type;
      if (data.isPinned !== undefined) postData.is_pinned = data.isPinned;
      
      // In a real app, we'd have an updatePost endpoint
      // For now, we'll simulate an update
      const currentPost = await hubsAPI.getPost(postId);
      const updatedPost = { ...currentPost, ...postData };
      return transformPost(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId: string): Promise<void> => {
    try {
      // In a real app, we'd call an API endpoint to delete the post
      // await hubsAPI.deletePost(postId);
      console.log(`Post ${postId} deleted`);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Vote on a post (like/dislike)
  votePost: async (postId: string, voteType: 'upvote' | 'downvote'): Promise<{ upvotes: number; downvotes: number; userVote: 'up' | 'down' | null }> => {
    try {
      // First check if user already voted
      // In a real app, we'd have a way to check the current vote
      const currentVote = null; // Get from state or API
      
      if (currentVote === voteType) {
        // If clicking the same vote again, remove the vote
        await hubsAPI.unvotePost(postId);
        const post = await hubsAPI.getPost(postId);
        return {
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          userVote: null
        };
      } else {
        // Cast a new vote
        await hubsAPI.votePost(postId, voteType);
        const post = await hubsAPI.getPost(postId);
        return {
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          userVote: voteType === 'upvote' ? 'up' : 'down'
        };
      }
    } catch (error) {
      console.error('Error voting on post:', error);
      throw error;
    }
  },

  // Add a comment to a post
  addComment: async (postId: string, data: CreateCommentData): Promise<CommentVM> => {
    try {
      const commentData = {
        post: postId,
        content: data.content,
        parent_comment: data.parentCommentId
      };
      
      const response = await hubsAPI.createComment(commentData);
      return transformComment(response);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get comments for a post
  getComments: async (postId: string): Promise<CommentVM[]> => {
    try {
      const response = await hubsAPI.listComments(postId);
      return response.results.map((comment: any) => transformComment(comment));
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Vote on a comment
  voteComment: async (commentId: string, voteType: 'upvote' | 'downvote'): Promise<{ upvotes: number; downvotes: number; userVote: 'up' | 'down' | null }> => {
    try {
      // Similar to votePost, but for comments
      // This is a simplified version
      await hubsAPI.voteComment(commentId, voteType);
      
      // In a real app, we'd get the updated comment from the API
      return {
        upvotes: 0, // Updated values would come from the API
        downvotes: 0,
        userVote: voteType === 'upvote' ? 'up' : 'down'
      };
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  },

  // Toggle hub membership
  toggleMembership: async (hubId: string = 'tech'): Promise<{ isMember: boolean; memberCount: number }> => {
    try {
      // In a real app, we'd have an API endpoint for this
      // For now, we'll simulate it
      const apiHub = await hubsAPI.getHub(hubId);
      const isMember = true; // pretend user joined
      const currentCount = Number(apiHub.member_count || 0);
      
      return {
        isMember,
        memberCount: isMember ? currentCount + 1 : Math.max(0, currentCount - 1)
      };
    } catch (error) {
      console.error('Error toggling membership:', error);
      throw error;
    }
  },

  // Search within the hub
  search: async (query: string, type: 'posts' | 'users' | 'all' = 'all', hubId: string = 'tech') => {
    try {
      const params: any = { q: query };
      if (type !== 'all') params.type = type;
      
      const response = await hubsAPI.listPosts({
        hub: hubId,
        search: query,
        ...(type === 'posts' ? {} : { post_type: type })
      });
      
      return {
        results: response.results.map((post: any) => transformPost(post)),
      };
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  },

  // Get hub events (placeholder - would be implemented with real API)
  getEvents: async (hubId: string = 'tech'): Promise<Event[]> => {
    // In a real app, we'd fetch events from the API
    // For now, return mock data
    return [
      {
        id: '1',
        title: 'Tech Meetup',
        description: 'Monthly tech meetup with industry experts',
        startTime: new Date(Date.now() + 86400000 * 7).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 7 + 7200000).toISOString(),
        location: 'Nairobi Tech Hub',
        isVirtual: false,
        currentAttendees: 24,
        maxAttendees: 50,
        isAttending: false,
        createdBy: {
          id: 'user1',
          username: 'johndoe',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'contributor',
          created_at: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  },

  // RSVP to an event (placeholder)
  rsvpToEvent: async (eventId: string, isAttending: boolean): Promise<{ success: boolean }> => {
    // In a real app, we'd call an API endpoint
    console.log(`User ${isAttending ? 'RSVPed to' : 'canceled RSVP for'} event ${eventId}`);
    return { success: true };
  }
};
