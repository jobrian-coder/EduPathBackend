import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../../components/common/Card';
import { PageContainer } from '../../../components/layout/PageContainer';
import api from '../../../services/api';
import type { Post, Comment } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

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
      } catch (err) {
        setError('Failed to load post');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);
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
      
      // Update comment count
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

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className="border-l-2 border-slate-700 pl-4 py-2 my-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">{comment.author?.username}</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-500 text-xs">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-1 text-slate-200">{comment.content}</p>
      
      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 mt-2">
          {comment.replies.map(reply => renderComment(reply))}
        </div>
      )}
    </div>
  );

  if (isLoading) return <div className="p-8 text-center">Loading post...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!post) return <div className="p-8">Post not found</div>;

  return (
    <PageContainer title="Post">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{post.title}</h1>
              <Link 
                to={`/hubs/${post.hub}`}
                className="text-sm bg-slate-800 px-3 py-1 rounded-full hover:bg-slate-700 text-white"
              >
                {post.hub}
              </Link>
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Posted by {post.author?.username} • {new Date(post.created_at).toLocaleDateString()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              {post.content}
            </div>
            
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-800">
              <button className="flex items-center gap-1 text-slate-400 hover:text-white">
                <span>▲</span>
                <span>{post.upvotes}</span>
              </button>
              <button className="flex items-center gap-1 text-slate-400 hover:text-white">
                <span>▼</span>
              </button>
              <div className="flex items-center gap-1 text-slate-400">
                <span>💬</span>
                <span>{post.comment_count} comments</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comment form */}
        {user ? (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Add a comment</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCommentSubmit}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Write your comment..."
                  required
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname))}
              className="text-blue-400 hover:text-blue-300"
            >
              Sign in to comment
            </button>
          </div>
        )}

        {/* Comments section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h3>
          
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          ) : (
            <p className="text-slate-400">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
