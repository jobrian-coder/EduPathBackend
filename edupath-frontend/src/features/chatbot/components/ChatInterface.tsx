import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';

interface ChatMessage {
  id: string;
  sender_type: 'user' | 'ai';
  content: string;
  metadata?: any;
  created_at: string;
}

interface ChatConversation {
  id: string;
  title: string;
  context_type: string;
  hub?: {
    id: string;
    name: string;
  };
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

interface ChatInterfaceProps {
  hubId?: string;
  contextType?: 'hub_general' | 'career_guidance' | 'course_comparison' | 'society_info';
  onClose?: () => void;
  isOpen?: boolean;
}

export default function ChatInterface({ 
  hubId, 
  contextType = 'hub_general', 
  onClose, 
  isOpen = true 
}: ChatInterfaceProps) {
  const { user, isAuthenticated } = useAuth();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load or create conversation
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadOrCreateConversation();
    }
  }, [isAuthenticated, isOpen, hubId, contextType]);

  const loadOrCreateConversation = async () => {
    try {
      // Try to get existing conversation for this context
      const conversations = await api.chatbot.getConversations();
      const existingConversation = conversations.find(
        conv => conv.hub?.id === hubId && conv.context_type === contextType
      );

      if (existingConversation) {
        setConversation(existingConversation);
        setMessages(existingConversation.messages || []);
      } else {
        // Create new conversation
        const newConversation = await api.chatbot.createConversation({
          hub: hubId,
          context_type: contextType,
          title: `Chat - ${contextType.replace('_', ' ')}`
        });
        setConversation(newConversation);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || isLoading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_type: 'user',
      content: newMessage,
      created_at: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await api.chatbot.sendMessage(conversation.id, {
        content: newMessage,
        metadata: {}
      });

      // Add AI response
      setMessages(prev => [...prev, response.ai_message]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender_type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isAuthenticated) {
    return (
      <Card className="h-96">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI Assistant</h3>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-slate-400">Please sign in to use the AI assistant</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AI Assistant</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-400">
          Ask me anything about careers, courses, or professional societies
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-8">
              <p>👋 Hi! I'm your AI assistant. How can I help you today?</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-slate-200 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isLoading}
              size="sm"
            >
              Send
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
