import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { Society } from '../types';
import { Button } from '../../../components/common/Button';

interface SocietyCardProps {
  society: Society;
  onLearnMore: (id: number) => void;
  onVisitWebsite: (id: number) => void;
}

export const SocietyCard: React.FC<SocietyCardProps> = ({
  society,
  onLearnMore,
  onVisitWebsite,
}) => (
  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start gap-4">
      <div 
        className={`w-20 h-20 ${society.color} rounded-lg flex items-center justify-center text-4xl flex-shrink-0`}
      >
        {society.logo}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{society.name}</h3>
        <p className="text-gray-600 mb-3">
          Professional society for {society.careers.join(', ')} professionals
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {society.careers.map((career, idx) => (
            <span 
              key={idx} 
              className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm"
            >
              {career}
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => onLearnMore(society.id)}
          >
            <Award className="w-4 h-4 mr-2" />
            Learn More
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onVisitWebsite(society.id)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Website
          </Button>
        </div>
      </div>
    </div>
  </div>
);
