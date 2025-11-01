import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import ChatInterface from './ChatInterface';

interface ChatButtonProps {
  hubId?: string;
  contextType?: 'hub_general' | 'career_guidance' | 'course_comparison' | 'society_info';
  className?: string;
  children?: React.ReactNode;
}

export default function ChatButton({ 
  hubId, 
  contextType = 'hub_general', 
  className = '',
  children 
}: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
      >
        {children || '💬 Ask AI'}
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl mx-4">
            <ChatInterface
              hubId={hubId}
              contextType={contextType}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

