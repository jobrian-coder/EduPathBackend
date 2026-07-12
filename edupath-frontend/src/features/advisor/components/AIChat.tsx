import React, { useEffect, useRef } from 'react';
import { Send, Loader, MessageCircle, Sparkles, Download } from 'lucide-react';
import api from '../../../services/api';
import { useAdvisorSession } from '../context/AdvisorSessionContext';
import { downloadChatTranscriptPdf } from '../utils/advisorPdf';

export const AIChat: React.FC = () => {
  const {
    chatConversationId: conversationId,
    setChatConversationId: setConversationId,
    chatMessages: messages,
    setChatMessages: setMessages,
  } = useAdvisorSession();
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const downloadChatPDF = () => {
    if (messages.length === 0) return;
    try {
      downloadChatTranscriptPdf(messages);
    } catch (error) {
      console.error('Failed to generate chat PDF:', error);
      alert('Failed to download chat. Please try again.');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewChat = async () => {
    setStarting(true);
    try {
      const res = await api.advisor.startChat();
      setConversationId(res.conversation_id);
      setMessages(res.messages);
    } catch (error) {
      console.error('Failed to start chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const res = await api.advisor.sendChatMessage(conversationId, userMessage);
      setMessages(res.messages);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-4 bg-white dark:bg-slate-900">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-200 dark:shadow-teal-900/40">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Talk to EduPath AI Advisor
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-8 text-sm leading-relaxed">
          Ask me anything about courses, universities, career paths, or how to use the platform. I'm here to help!
        </p>
        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Course guidance', 'Career paths', 'University info', 'Platform help'].map(tag => (
            <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={startNewChat}
          disabled={starting}
          className="px-7 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
        >
          {starting ? (
            <><Loader className="w-5 h-5 animate-spin" />Starting...</>
          ) : (
            <><MessageCircle className="w-5 h-5" />Start Chatting</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-900 border-b-2 border-teal-500 dark:border-teal-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">AI Advisor</span>
            <span className="ml-2 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">Online</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={downloadChatPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-slate-50 dark:bg-slate-900/60">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-teal-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Ask me anything to get started.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role !== 'user' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-tr-none'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
            }`}>
              {msg.role !== 'user' && (
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide block mb-1">EduPath AI</span>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
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

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about courses, careers, universities..."
            className="flex-1 resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-teal-500/20 hover:shadow-teal-500/40"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 pl-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default AIChat;
