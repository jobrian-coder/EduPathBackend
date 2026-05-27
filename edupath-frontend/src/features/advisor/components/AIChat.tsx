import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, MessageCircle, Sparkles, Download } from 'lucide-react';
import api from '../../../services/api';
import jsPDF from 'jspdf';

interface Message {
  role: string;
  content: string;
  created_at?: string;
}

export const AIChat: React.FC = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const downloadChatPDF = () => {
    if (messages.length === 0) return;
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = 20;

      const checkPage = (needed: number) => {
        if (y + needed > 280) { pdf.addPage(); y = 20; }
      };

      // Header Banner
      pdf.setFontSize(20);
      pdf.setTextColor(15, 118, 110);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EduPath — AI Advisor Chat Transcript', margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Exported on ${new Date().toLocaleDateString()} | Personal Advising Record`, margin, y);
      y += 10;

      // Divider Line
      pdf.setDrawColor(20, 184, 166);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageW - margin, y);
      y += 10;

      messages.forEach((msg) => {
        const isUser = msg.role === 'user';
        const speaker = isUser ? 'You' : 'EduPath AI Advisor';
        
        checkPage(15);
        
        // Speaker Label
        pdf.setFontSize(11);
        if (isUser) {
          pdf.setTextColor(15, 118, 110); // Teal
        } else {
          pdf.setTextColor(71, 85, 105); // Slate Gray
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text(speaker, margin, y);
        y += 5.5;

        // Content
        pdf.setFontSize(10);
        pdf.setTextColor(51, 65, 85);
        pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(msg.content, contentW - 4);
        lines.forEach((line: string) => {
          checkPage(6);
          pdf.text(line, margin + 2, y);
          y += 5;
        });

        y += 5;
      });

      pdf.save('edupath-ai-chat-transcript.pdf');
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
      <div className="flex flex-col items-center justify-center h-full py-16 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
          Talk to EduPath AI Advisor
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
          Ask me anything about courses, universities, career paths, or how to use the platform. I'm here to help!
        </p>
        <button
          onClick={startNewChat}
          disabled={starting}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {starting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5" />
              Start Chatting
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header with Download Button */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-teal-500" />
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">AI Advisor Conversation</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={downloadChatPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-750 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Download Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-teal-500" />
            <p>Start the conversation! Ask me anything.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
              <Loader className="w-5 h-5 text-teal-500 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about courses, careers, or the platform..."
            className="flex-1 resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default AIChat;
