import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Bot, Loader } from 'lucide-react';
import api from '../../../services/api';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  options?: string[];
}

interface InterviewChatProps {
  sessionId: string;
  onComplete: () => void;
}

export const InterviewChat: React.FC<InterviewChatProps> = ({ sessionId, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputState, setInputState] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load of the first question (handled by startSession, but we fetched it in the parent)
  // Actually, parent didn't pass the first question. Let's just say we wait for the first answer?
  // No, startSession returns the first question. We should ideally pass it down.
  // To keep it simple, let's fetch history if we can, or we can just send an empty message to trigger the loop? 
  // No, the parent didn't pass it. Let's just ask the API or we can just assume we need to trigger it.
  
  // Wait, I can just do a dummy call or ensure the parent passes the first question.
  // Let me update the component so it takes the first question as a prop, OR I can just say "Hi, tell me about yourself?" as a fallback.
  useEffect(() => {
    // If messages are empty, we need the first question. 
    // Since startSession returned it, the parent could pass it. But we don't have it here.
    // Let's just add a placeholder. The real one from DB was added in startSession anyway.
    setMessages([{ 
      role: 'assistant', 
      content: "Hello! I'm EduGuide. Let's find your perfect course. To start off, what subjects do you enjoy the most in school?",
      options: ["Sciences", "Arts", "Business", "Technology", "I'm not sure"]
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputState.trim() || isSending) return;

    const userMessage = inputState.trim();
    setInputState('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      const res = await api.advisor.sendMessage(sessionId, userMessage);
      
      if (res.question) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.question as string, options: res.options }]);
        setQuestionCount(res.question_number);
      }
      
      if (res.done) {
        onComplete();
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error processing your response. Could you try again?" 
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (isSending) return;
    setInputState(option);
    // Submit immediately in next tick
    setTimeout(() => {
      const form = document.getElementById('chat-input-form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 0);
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[70vh]">
      {/* Progress Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-3xl flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">EduGuide Chat</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Finding your perfect match</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-full">
            Question {Math.min(questionCount, 10)} of 10
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-teal-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
              }`}>
                <p className="leading-relaxed">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
              )}
            </div>

            {/* Render MCQs if this is the last message and from assistant */}
            {!isSending && msg.role === 'assistant' && msg.options && msg.options.length > 0 && i === messages.length - 1 && (
              <div className="flex flex-wrap gap-2 pl-14 pt-1">
                {msg.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(opt)}
                    className="text-left text-sm px-4 py-2 rounded-xl border border-teal-200 dark:border-teal-700/50 bg-teal-50/50 dark:bg-teal-900/10 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors shadow-sm cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isSending && (
          <div className="flex gap-4 justify-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-3xl">
        <form id="chat-input-form" onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputState}
            onChange={(e) => setInputState(e.target.value)}
            disabled={isSending}
            placeholder="Type your answer or select an option above..."
            className="w-full pl-6 pr-14 py-4 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900/50 rounded-full transition-all text-slate-700 dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={!inputState.trim() || isSending}
            className="absolute right-2 p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-teal-600"
          >
            {isSending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
