import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onClick: (id: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => (
  <div 
    className="flex items-center justify-between p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
    onClick={() => onClick(event.id)}
  >
    <div>
      <h4 className="font-semibold text-gray-900">{event.name}</h4>
      <p className="text-sm text-gray-600">
        {event.society} • {event.date} • {event.type}
      </p>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-400" />
  </div>
);
