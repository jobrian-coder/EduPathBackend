import React from 'react';
import { PostType } from '../types';

interface PostTypeBadgeProps {
  type: PostType;
}

const typeColors = {
  question: 'bg-blue-100 text-blue-800',
  guide: 'bg-green-100 text-green-800',
  success_story: 'bg-purple-100 text-purple-800',
  news: 'bg-orange-100 text-orange-800',
};

export const PostTypeBadge: React.FC<PostTypeBadgeProps> = ({ type }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[type]}`}>
    {type.replace('_', ' ')}
  </span>
);
