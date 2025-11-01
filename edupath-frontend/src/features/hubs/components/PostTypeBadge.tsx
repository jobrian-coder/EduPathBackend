import React from 'react';
import { PostType } from '../types';

interface PostTypeBadgeProps {
  type: PostType;
}

const typeColors = {
  question: 'bg-teal-100 text-teal-800',
  guide: 'bg-cyan-100 text-cyan-800',
  success_story: 'bg-emerald-100 text-emerald-800',
  news: 'bg-sky-100 text-sky-800',
};

export const PostTypeBadge: React.FC<PostTypeBadgeProps> = ({ type }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[type]}`}>
    {type.replace('_', ' ')}
  </span>
);
