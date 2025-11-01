import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, ThumbsUp, ThumbsDown, ArrowLeft, Circle, Plus } from 'lucide-react';
import api from '../../../services/api';
import type { Post, Comment, Hub } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [hub, setHub] = useState<Hub | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [joinedHubIds, setJoinedHubIds] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
      
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [postData, commentsData] = await Promise.all([
          api.hubs.getPost(id), 
          api.hubs.listComments(id).then(res => res.results || [])
        ]);
        setPost(postData);
        setComments(commentsData);
        
        // Fetch hub information
        if (postData.hub) {
          try {
            const hubData = await api.hubs.getHub(typeof postData.hub === 'string' ? postData.hub : (postData.hub as any).id);
            setHub(hubData);
          } catch (err) {
            console.error('Failed to load hub:', err);
          }
        }
      } catch (err) {
        setError('Failed to load post');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const loadHubs = async () => {
      try {
        const { results } = await api.hubs.listHubs();
        setHubs(results);
      } catch (error) {
        console.error('Failed to load hubs:', error);
      }
    };
    loadHubs();
  }, []);

  useEffect(() => {
    if (isAuthenticated && hub) {
      const loadJoinedHubs = async () => {
        try {
          const profile = await api.auth.getProfile();
          if ((profile as any).joined_hubs) {
            setJoinedHubIds((profile as any).joined_hubs.map((h: any) => h.id));
          }
        } catch (error) {
          console.error('Failed to load joined hubs:', error);
        }
      };
      loadJoinedHubs();
    }
  }, [isAuthenticated, hub]);

  const handleHubSwitch = useCallback((selectedHub: Hub) => {
    navigate(`/hubs/${selectedHub.slug}`);
  }, [navigate]);

  const handleJoinHub = async (hubId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to join communities');
      return;
    }

    setIsJoining(true);
    try {
      await api.hubs.joinHub(hubId);
      setJoinedHubIds(prev => [...prev, hubId]);
      if (hub) {
        setHub({ ...hub, member_count: hub.member_count + 1 });
      }
    } catch (error) {
      console.error('Failed to join hub:', error);
      alert('Failed to join community. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveHub = async (hubId: string) => {
    setIsJoining(true);
    try {
      await api.hubs.leaveHub(hubId);
      setJoinedHubIds(prev => prev.filter(id => id !== hubId));
      if (hub) {
        setHub({ ...hub, member_count: Math.max(0, hub.member_count - 1) });
      }
    } catch (error) {
      console.error('Failed to leave hub:', error);
      alert('Failed to leave community. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !id) return;
    
    try {
      const comment = await api.hubs.createComment({
        post: id,
        content: newComment,
      });
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      
      if (post) {
        setPost({
          ...post,
          comment_count: (post.comment_count || 0) + 1
        });
      }
    } catch (err) {
      console.error('Failed to post comment', err);
      setError('Failed to post comment. Please try again.');
    }
  };

  const handleReplySubmit = async (parentCommentId: string) => {
    const text = replyText[parentCommentId]?.trim();
    if (!text || !user || !id) return;
    
    try {
      await api.hubs.createComment({
        post: id,
        parent_comment: parentCommentId,
        content: text,
      });
      
      const commentsData = await api.hubs.listComments(id).then(res => res.results || []);
      setComments(commentsData);
      
      setReplyText(prev => {
        const next = { ...prev };
        delete next[parentCommentId];
        return next;
      });
      setReplyingTo(null);
      
      if (post) {
        setPost({
          ...post,
          comment_count: (post.comment_count || 0) + 1
        });
      }
    } catch (err) {
      console.error('Failed to post reply', err);
      setError('Failed to post reply. Please try again.');
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const indentLevel = depth * 24;
    const isReplying = replyingTo === comment.id;
    
    return (
      <div 
        key={comment.id} 
        className="py-3 border-b border-teal-100 last:border-b-0"
        style={{ marginLeft: `${indentLevel}px` }}
      >
        <div className="flex items-center gap-2 text-sm mb-2">
          <span className="font-semibold text-slate-800">{comment.author?.username || 'Deleted User'}</span>
          <span className="text-teal-400">•</span>
          <span className="text-teal-600 text-xs">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
          {comment.is_edited && (
            <>
              <span className="text-teal-400">•</span>
              <span className="text-teal-600 text-xs italic">edited</span>
            </>
          )}
        </div>
        <p className="mt-1 text-slate-700 mb-2">{comment.content}</p>
        
        {user && (
          <div className="mt-2">
            {!isReplying ? (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="text-sm text-teal-600 hover:text-teal-700 transition-colors font-medium"
              >
                Reply
              </button>
            ) : (
              <div className="mt-3 border-l-2 border-teal-500 pl-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReplySubmit(comment.id);
                  }}
                >
                  <textarea
                    value={replyText[comment.id] || ''}
                    onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-white border border-teal-200 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                    rows={2}
                    placeholder={`Reply to ${comment.author?.username}...`}
                    autoFocus
                    required
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg text-white text-sm font-medium transition-all"
                    >
                      Post Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText(prev => {
                          const next = { ...prev };
                          delete next[comment.id];
                          return next;
                        });
                      }}
                      className="px-4 py-1.5 bg-teal-50 hover:bg-teal-100 rounded-lg text-teal-700 text-sm font-medium transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
      </div>
        )}
      
      {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-teal-50 to-cyan-50">
        <div className="text-teal-600">Loading post...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-teal-50 to-cyan-50">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-teal-50 to-cyan-50">
        <div className="text-slate-600">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-cyan-50">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] gap-4 p-2 md:p-4 max-w-[1800px] mx-auto">
        
        {/* Left Sidebar - Hub Navigator */}
        <aside className="hidden lg:block lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4">
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-3 md:p-4 space-y-2">
            <div className="text-xs uppercase tracking-wide text-teal-600 font-semibold px-2 mb-3">
              Communities
            </div>
            
            {hubs.map(h => (
              <button
                key={h.id}
                onClick={() => handleHubSwitch(h)}
                className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-xl transition-all hover:bg-teal-50 ${
                  hub?.id === h.id 
                    ? 'bg-gradient-to-r from-teal-100 to-cyan-100 border border-teal-200' 
                    : 'border border-transparent'
                }`}
              >
                {(h as any).icon_url ? (
                  <img 
                    src={(h as any).icon_url} 
                    alt={h.name}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="text-xl md:text-2xl">{h.icon}</div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs md:text-sm font-medium text-slate-800 truncate">
                    {h.name}
                  </div>
                  <div className="text-xs text-teal-600 hidden md:block">
                    {h.active_posts} posts
                  </div>
                </div>
                {hub?.id === h.id && (
                  <Circle className="w-2 h-2 fill-teal-500 text-teal-500 flex-shrink-0" />
                )}
              </button>
            ))}

            <button className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 mt-4 rounded-xl border-2 border-dashed border-teal-200 text-teal-600 hover:border-teal-400 hover:text-teal-700 transition-all text-sm">
              <Plus className="w-4 h-4" />
              <span className="font-medium hidden md:inline">Create Hub</span>
              <span className="font-medium md:hidden">New</span>
            </button>
          </div>
        </aside>

        {/* Center - Post Content */}
        <main className="space-y-3 min-w-0">
          {/* Back Button */}
          <button
            onClick={() => hub ? navigate(`/hubs/${hub.slug}`) : navigate('/hubs')}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to {hub?.name || 'Hub'}</span>
          </button>

          {/* Post Card */}
          <article className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-teal-100">
            <div className="p-4 md:p-6">
              {/* Post Header */}
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-3 text-xs">
                <span className="px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700">
                  {hub?.name || 'Hub'}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${
                  post.is_expert_post 
                    ? 'bg-teal-200 text-teal-800' 
                    : 'bg-cyan-100 text-cyan-700'
                }`}>
                  {post.is_expert_post ? '⭐ Expert' : '👤 Rookie'} · {
                    post.post_type === 'question' ? '❓' :
                    post.post_type === 'guide' ? '📚' :
                    post.post_type === 'success_story' ? '🎉' : '💬'
                  } {post.post_type.replace('_', ' ')}
                </span>
                <span className="text-teal-600">
                  by {post.author?.username || 'Anonymous'}
                </span>
                <span className="text-teal-400 hidden md:inline">·</span>
                <span className="text-teal-600 hidden md:inline">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Post Title */}
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">
                {post.title}
              </h1>

              {/* Post Content */}
              <div className="prose max-w-none text-slate-700 mb-4">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Interaction Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-teal-100">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-50 text-teal-600 hover:bg-teal-100 transition-all">
                  <ThumbsUp className="w-4 h-4" />
                  {post.upvotes}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-all">
                  <ThumbsDown className="w-4 h-4" />
              </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-600">
                  <MessageSquare className="w-4 h-4" />
                  {post.comment_count} comments
                </div>
              </div>
            </div>
          </article>

          {/* Comment Form */}
        {user ? (
            <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Join the conversation</h2>
              <form onSubmit={handleCommentSubmit}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white border border-teal-200 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  rows={3}
                  placeholder="Write your comment..."
                  required
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all"
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 md:p-6 text-center">
            <button
              onClick={() => navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname))}
                className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Sign in to comment
            </button>
          </div>
        )}

          {/* Comments Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h3>
          
          {comments.length > 0 ? (
              <div className="space-y-0">
                {comments.map(comment => renderComment(comment, 0))}
              </div>
            ) : (
              <p className="text-teal-600">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </main>

        {/* Right Sidebar - Hub Info */}
        {hub && (
          <aside className="hidden xl:block h-[calc(100vh-2rem)] sticky top-4 overflow-y-auto space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4">
              <div className="flex items-center gap-3 mb-4">
                {(hub as any).icon_url ? (
                  <img 
                    src={(hub as any).icon_url} 
                    alt={hub.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="text-3xl">{hub.icon}</div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{hub.name}</h3>
                  <div className="text-xs text-teal-600">
                    {hub.member_count.toLocaleString()} members
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => joinedHubIds.includes(hub.id) ? handleLeaveHub(hub.id) : handleJoinHub(hub.id)}
                disabled={isJoining}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  joinedHubIds.includes(hub.id)
                    ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {joinedHubIds.includes(hub.id) ? 'Joined' : 'Join'}
              </button>

              <div className="mt-4 pt-4 border-t border-teal-100 text-sm text-slate-700">
                <p className="mb-3">{hub.description}</p>
                <div className="space-y-2 text-xs text-teal-600">
                  <div className="flex items-center gap-2">
                    <span>📊</span>
                    <span>{hub.active_posts} posts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>{hub.member_count.toLocaleString()} members</span>
                  </div>
                </div>
              </div>

              {(hub as any).related_societies && (hub as any).related_societies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-teal-100">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Related Societies</h4>
                  <div className="space-y-2">
                    {(hub as any).related_societies.slice(0, 3).map((society: any, index: number) => (
                      <div key={index} className="p-2 rounded-lg hover:bg-teal-50 transition-all">
                        <div className="text-sm font-medium text-slate-800">{society.name}</div>
                        <a
                          href={society.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal-600 hover:text-teal-700"
                        >
                          Visit Website →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
          )}
        </div>
      </div>
  );
}