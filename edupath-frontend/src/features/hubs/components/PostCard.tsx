import React from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, Pin } from 'lucide-react';
import type { Post } from '../types';
import { PostTypeBadge } from './PostTypeBadge';
import { RoleBadge } from './RoleBadge';

interface PostCardProps {
  post: Post;
  onUpvote: (id: string | number) => void;
  onDownvote: (id: string | number) => void;
  onComment: (id: string | number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onUpvote,
  onDownvote,
  onComment,
}) => (
  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
          {post.author[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{post.author}</span>
            <RoleBadge role={post.role} />
          </div>
          <span className="text-sm text-gray-500">{post.timestamp}</span>
        </div>
      </div>
      {post.isPinned && (
        <Pin className="w-5 h-5 text-blue-600 fill-current" />
      )}
    </div>

    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
        <PostTypeBadge type={post.type} />
      </div>
      <p className="text-gray-600 line-clamp-2">{post.content}</p>
    </div>

    <div className="flex flex-wrap gap-2 mb-4">
      {post.tags.map((tag, idx) => (
        <span 
          key={idx} 
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
        >
          #{tag}
        </span>
      ))}
    </div>

    <div className="flex items-center gap-6 text-sm">
      <button 
        onClick={() => onUpvote(post.id)}
        className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="font-medium">{post.upvotes}</span>
      </button>
      <button 
        onClick={() => onDownvote(post.id)}
        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
      >
        <ThumbsDown className="w-4 h-4" />
        <span className="font-medium">{post.downvotes}</span>
      </button>
      <button 
        onClick={() => onComment(post.id)}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium">{post.comments} comments</span>
      </button>
    </div>
  </div>
);
