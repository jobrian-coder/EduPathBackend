import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hubsAPI } from '../../../services/api';
import type { Hub } from '../../../services/api';

const QUERY_KEYS = {
  hub: (hubId: string) => ['hub', hubId] as const,
  posts: (hubId: string, filters: Record<string, unknown> = {}) => ['hub-posts', hubId, filters] as const,
  overview: (hubId: string) => ['hub-overview', hubId] as const,
  relatedCourses: (hubId: string) => ['hub-related-courses', hubId] as const,
  recentPosts: (hubId: string) => ['hub-recent-posts', hubId] as const,
} as const;

interface UseHubParams {
  hubIdOrSlug: string;
}

export const useHub = ({ hubIdOrSlug }: UseHubParams) => {
  const queryClient = useQueryClient();

  const hubQuery = useQuery({
    queryKey: QUERY_KEYS.hub(hubIdOrSlug),
    queryFn: () => hubsAPI.getHub(hubIdOrSlug),
  });

  const overviewQuery = useQuery({
    queryKey: QUERY_KEYS.overview(hubIdOrSlug),
    queryFn: () => hubsAPI.getHubOverview(hubIdOrSlug),
  });

  const relatedCoursesQuery = useQuery({
    queryKey: QUERY_KEYS.relatedCourses(hubIdOrSlug),
    queryFn: () => hubsAPI.listRelatedCourses(hubIdOrSlug, 12),
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
    mutationFn: async (payload: { title: string; content: string; post_type: string; is_expert_post?: boolean; tags?: string[] }) =>
      hubsAPI.createPost({ hub: hubIdOrSlug, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts(hubIdOrSlug) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recentPosts(hubIdOrSlug) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overview(hubIdOrSlug) });
    },
  });

  const votePostMutation = useMutation({
    mutationFn: async ({ postId, voteType }: { postId: string; voteType: 'upvote' | 'downvote' }) =>
      hubsAPI.votePost(postId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts(hubIdOrSlug) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recentPosts(hubIdOrSlug) });
    },
  });

  const joinHubMutation = useMutation({
    mutationFn: () => hubsAPI.joinHub(hubIdOrSlug),
    onSuccess: ({ hub }) => {
      queryClient.setQueryData<Hub>(QUERY_KEYS.hub(hubIdOrSlug), hub);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overview(hubIdOrSlug) });
    },
  });

  const leaveHubMutation = useMutation({
    mutationFn: () => hubsAPI.leaveHub(hubIdOrSlug),
    onSuccess: ({ hub }) => {
      queryClient.setQueryData<Hub>(QUERY_KEYS.hub(hubIdOrSlug), hub);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overview(hubIdOrSlug) });
    },
  });

  const recentPostsQuery = useQuery({
    queryKey: QUERY_KEYS.recentPosts(hubIdOrSlug),
    queryFn: async () => {
      const { results } = await hubsAPI.listRecentPosts(hubIdOrSlug, 5);
      return results;
    },
  });

  // Placeholder events (can be replaced with real API later)
  const eventsQuery = useQuery({
    queryKey: ['hub-events', hubIdOrSlug],
    queryFn: async () => [] as Array<{ id: string; name: string; date: string; type: string; society?: string; isAttending?: boolean }>,
    staleTime: 60_000,
  });

  const rsvpToEvent = useMutation({
    mutationFn: async (_: { eventId: string; rsvp: boolean }) => ({ success: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-events', hubIdOrSlug] });
    },
  });

  const stats = useMemo(() => {
    const hub = hubQuery.data;
    if (!hub) return null;
    return {
      memberCount: hub.member_count,
      postCount: hub.active_posts,
      isMember: hub.is_member,
    };
  }, [hubQuery.data]);

  return {
    hubQuery,
    overviewQuery,
    relatedCoursesQuery,
    recentPostsQuery,
    eventsQuery,
    stats,
    usePosts,
    createPost: createPostMutation.mutateAsync,
    voteOnPost: votePostMutation.mutateAsync,
    joinHub: joinHubMutation.mutateAsync,
    leaveHub: leaveHubMutation.mutateAsync,
    rsvpToEvent: rsvpToEvent.mutate,
    isCreatingPost: createPostMutation.isPending,
    isVoting: votePostMutation.isPending,
    isJoining: joinHubMutation.isPending,
    isLeaving: leaveHubMutation.isPending,
  };
};
