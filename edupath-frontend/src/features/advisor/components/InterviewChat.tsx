import React, { useEffect, useRef } from 'react';
import { Send, User as UserIcon, Loader } from 'lucide-react';
import api from '../../../services/api';
import eduguideIcon from '../../../assets/eduguide.png';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  options?: string[];
}

interface InterviewChatProps {
  sessionId: string;
  onComplete: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  questionCount: number;
  setQuestionCount: (n: number) => void;
}

export const InterviewChat: React.FC<InterviewChatProps> = ({
  sessionId, onComplete,
  messages, setMessages,
  questionCount, setQuestionCount,
}) => {
  const [inputState, setInputState] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only seed the opening message when there is no existing history
    if (messages.length === 0) {
      setMessages([{ 
        role: 'assistant', 
        content: "Hello! I'm EduGuide. Let's find your perfect course. To start off, what subjects do you enjoy the most in school?",
        options: ["Sciences", "Arts", "Business", "Technology", "I'm not sure"]
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const progressPct = Math.min(((questionCount - 1) / 10) * 100, 100);

  return (
    <div className="flex flex-col h-[600px] max-h-[70vh]">
      {/* Progress Header */}
      <div className="bg-white dark:bg-slate-900 border-b-2 border-teal-500 dark:border-teal-600">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center p-1.5 shadow-sm shadow-teal-200 dark:shadow-teal-900/40">
              <img src={eduguideIcon} alt="EduGuide" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">EduGuide</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your personal course advisor</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-full">
              {Math.min(questionCount, 10)} / 10
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-slate-50 dark:bg-slate-900/50 relative">
        <div
          className="absolute inset-x-0 inset-y-12 z-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: `url(${eduguideIcon})`, backgroundPosition: 'center', backgroundSize: '40%', backgroundRepeat: 'no-repeat' }}
        />
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-2.5 relative z-10">
            <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-shrink-0 shadow-sm p-1">
                  <img src={eduguideIcon} alt="EduGuide" className="w-full h-full object-contain" />
                </div>
              )}

              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
              }`}>
                {msg.role === 'assistant' && (
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide block mb-1">EduGuide</span>
                )}
                <p>{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-slate-700 border border-teal-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-4 h-4 text-teal-600 dark:text-slate-400" />
                </div>
              )}
            </div>

            {/* MCQ Options */}
            {!isSending && msg.role === 'assistant' && msg.options && msg.options.length > 0 && i === messages.length - 1 && (
              <div className="flex flex-wrap gap-2 pl-11">
                {msg.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(opt)}
                    className="text-sm px-3.5 py-2 rounded-xl border-2 border-teal-200 dark:border-teal-700/60 bg-white dark:bg-teal-900/10 text-teal-800 dark:text-teal-200 font-medium hover:bg-teal-500 hover:text-white hover:border-teal-500 dark:hover:bg-teal-800/40 transition-all shadow-sm cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex gap-3 justify-start relative z-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center flex-shrink-0 p-1">
              <img src={eduguideIcon} alt="EduGuide" className="w-full h-full object-contain animate-pulse" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
        <form id="chat-input-form" onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputState}
            onChange={(e) => setInputState(e.target.value)}
            disabled={isSending}
            placeholder="Type your answer or pick an option above..."
            className="w-full pl-5 pr-14 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900/50 rounded-full text-sm text-slate-900 dark:text-slate-200 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!inputState.trim() || isSending}
            className="absolute right-2 p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full transition-all shadow-md shadow-teal-500/20 disabled:opacity-40"
          >
            {isSending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
