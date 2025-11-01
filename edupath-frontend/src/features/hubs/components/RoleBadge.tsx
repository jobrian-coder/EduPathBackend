import React from 'react';
import { UserRole } from '../types';

interface RoleBadgeProps {
  role: UserRole;
}

const roleColors = {
  novice: 'bg-gray-100 text-gray-700',
  contributor: 'bg-teal-100 text-teal-700',
  moderator: 'bg-cyan-100 text-cyan-700',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role]}`}>
    {role}
  </span>
);
