import React from 'react';
import type { UserRole } from '../types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

const roleConfig: Record<UserRole, { label: string; icon: string; className: string }> = {
  novice:      { label: 'Novice',      icon: '🌱', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  contributor: { label: 'Contributor', icon: '✍️', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  moderator:   { label: 'Moderator',   icon: '🛡️', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  associate:   { label: 'Associate',   icon: '🔗', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  mentor:      { label: 'Mentor',      icon: '🎓', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  institution: { label: 'Institution', icon: '🏛️', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm' }) => {
  const cfg = roleConfig[role] ?? roleConfig.novice;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'} ${cfg.className}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};
