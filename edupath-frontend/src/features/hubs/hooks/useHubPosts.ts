import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

const QUERY_KEYS = {
  hubPosts: (hubId?: string | null) => ['hub-posts', hubId] as const,
};

export const useHubPosts = (hubId?: string | null) => {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: QUERY_KEYS.hubPosts(hubId ?? undefined),
    queryFn: async () => {
      if (!hubId) return [];
      const { results } = await api.hubs.listPosts({ hub: hubId });
      return results;
    },
    enabled: !!hubId,
  });

  const createPostMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!hubId) throw new Error('Missing hub context');
      return api.hubs.createPost({ hub: hubId, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hubPosts(hubId ?? undefined) });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({
      postId,
      voteType,
    }: {
      postId: string;
      voteType: 'upvote' | 'downvote';
    }) => api.hubs.votePost(postId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hubPosts(hubId ?? undefined) });
    },
  });

  const unvoteMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => api.hubs.unvotePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hubPosts(hubId ?? undefined) });
    },
  });

  return {
    postsQuery,
    createPost: createPostMutation.mutateAsync,
    isCreatingPost: createPostMutation.isPending,
    voteOnPost: voteMutation.mutateAsync,
    unvoteOnPost: unvoteMutation.mutateAsync,
    isVoting: voteMutation.isPending || unvoteMutation.isPending,
  };
};

