import React from 'react';
import { UserRole } from '../types';

interface RoleBadgeProps {
  role: UserRole;
}

const roleColors = {
  novice: 'bg-gray-100 text-gray-700',
  contributor: 'bg-blue-100 text-blue-700',
  moderator: 'bg-purple-100 text-purple-700',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role]}`}>
    {role}
  </span>
);
