import React from 'react';
import type { PostType } from '../types';

interface PostTypeBadgeProps {
  type: PostType;
}

const typeColors: Record<string, string> = {
  question: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
  guide: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
  success_story: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
  news: 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300',
  discussion: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300',
  link: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  image: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
};

export const PostTypeBadge: React.FC<PostTypeBadgeProps> = ({ type }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[type]}`}>
    {type.replace('_', ' ')}
  </span>
);
