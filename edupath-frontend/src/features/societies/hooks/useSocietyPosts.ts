import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, {
  type CreateSocietyPostPayload,
  type SocietyPost,
} from '../../../services/api';

const QUERY_KEYS = {
  societyPosts: (societyId?: string | null) => ['society-posts', societyId] as const,
};

export const useSocietyPosts = (societyId?: string | null) => {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: QUERY_KEYS.societyPosts(societyId ?? undefined),
    queryFn: async (): Promise<SocietyPost[]> => {
      if (!societyId) return [];
      const { results } = await api.societies.listPosts({ society: societyId });
      return results;
    },
    enabled: !!societyId,
  });

  const createPostMutation = useMutation({
    mutationFn: async (payload: Omit<CreateSocietyPostPayload, 'society'>) => {
      if (!societyId) throw new Error('Missing society context');
      return api.societies.createPost({ society: societyId, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.societyPosts(societyId ?? undefined) });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({
      postId,
      voteType,
    }: {
      postId: string;
      voteType: 'upvote' | 'downvote';
    }) => api.societies.votePost(postId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.societyPosts(societyId ?? undefined) });
    },
  });

  const unvoteMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => api.societies.unvotePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.societyPosts(societyId ?? undefined) });
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
