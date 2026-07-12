import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AdvisorRecommendation } from '../../../services/api';

const KEYS = {
  mode:                  'edupath.advisor.mode',
  sessionId:             'edupath.advisor.sessionId',
  recommendations:       'edupath.advisor.recommendations',
  suggestedHubs:         'edupath.advisor.suggestedHubs',
  interviewMessages:     'edupath.advisor.interviewMessages',
  interviewQuestionCount:'edupath.advisor.interviewQuestionCount',
  chatConversationId:    'edupath.advisor.chatConversationId',
  chatMessages:          'edupath.advisor.chatMessages',
};

export const ADVISOR_SESSION_STORAGE_KEYS = Object.values(KEYS);

export interface SuggestedHub {
  id: string; name: string; slug: string; icon: string;
  color: string; category: string; member_count: number; description: string;
}

export interface InterviewMessage {
  role: 'assistant' | 'user';
  content: string;
  options?: string[];
}

export interface ChatMessage {
  role: string;
  content: string;
  created_at?: string;
}

interface AdvisorSessionCtx {
  mode: 'interview' | 'chat';
  setMode: (m: 'interview' | 'chat') => void;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  recommendations: AdvisorRecommendation[] | null;
  setRecommendations: (r: AdvisorRecommendation[] | null) => void;
  suggestedHubs: SuggestedHub[];
  setSuggestedHubs: (h: SuggestedHub[]) => void;
  interviewMessages: InterviewMessage[];
  setInterviewMessages: React.Dispatch<React.SetStateAction<InterviewMessage[]>>;
  interviewQuestionCount: number;
  setInterviewQuestionCount: (n: number) => void;
  chatConversationId: string | null;
  setChatConversationId: (id: string | null) => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearAdvisorSession: () => void;
}

const AdvisorSessionContext = createContext<AdvisorSessionCtx | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AdvisorSessionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'interview' | 'chat'>(() =>
    readJson(KEYS.mode, 'interview')
  );
  const [sessionId, setSessionId] = useState<string | null>(() =>
    readJson(KEYS.sessionId, null)
  );
  const [recommendations, setRecommendations] = useState<AdvisorRecommendation[] | null>(() =>
    readJson(KEYS.recommendations, null)
  );
  const [suggestedHubs, setSuggestedHubs] = useState<SuggestedHub[]>(() =>
    readJson(KEYS.suggestedHubs, [])
  );
  const [interviewMessages, setInterviewMessages] = useState<InterviewMessage[]>(() =>
    readJson(KEYS.interviewMessages, [])
  );
  const [interviewQuestionCount, setInterviewQuestionCount] = useState<number>(() =>
    readJson(KEYS.interviewQuestionCount, 1)
  );
  const [chatConversationId, setChatConversationId] = useState<string | null>(() =>
    readJson(KEYS.chatConversationId, null)
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    readJson(KEYS.chatMessages, [])
  );

  useEffect(() => { sessionStorage.setItem(KEYS.mode, JSON.stringify(mode)); }, [mode]);
  useEffect(() => { sessionStorage.setItem(KEYS.sessionId, JSON.stringify(sessionId)); }, [sessionId]);
  useEffect(() => { sessionStorage.setItem(KEYS.recommendations, JSON.stringify(recommendations)); }, [recommendations]);
  useEffect(() => { sessionStorage.setItem(KEYS.suggestedHubs, JSON.stringify(suggestedHubs)); }, [suggestedHubs]);
  useEffect(() => { sessionStorage.setItem(KEYS.interviewMessages, JSON.stringify(interviewMessages)); }, [interviewMessages]);
  useEffect(() => { sessionStorage.setItem(KEYS.interviewQuestionCount, JSON.stringify(interviewQuestionCount)); }, [interviewQuestionCount]);
  useEffect(() => { sessionStorage.setItem(KEYS.chatConversationId, JSON.stringify(chatConversationId)); }, [chatConversationId]);
  useEffect(() => { sessionStorage.setItem(KEYS.chatMessages, JSON.stringify(chatMessages)); }, [chatMessages]);

  const clearAdvisorSession = useCallback(() => {
    Object.values(KEYS).forEach(k => sessionStorage.removeItem(k));
    setMode('interview');
    setSessionId(null);
    setRecommendations(null);
    setSuggestedHubs([]);
    setInterviewMessages([]);
    setInterviewQuestionCount(1);
    setChatConversationId(null);
    setChatMessages([]);
  }, []);

  return (
    <AdvisorSessionContext.Provider value={{
      mode, setMode,
      sessionId, setSessionId,
      recommendations, setRecommendations,
      suggestedHubs, setSuggestedHubs,
      interviewMessages, setInterviewMessages,
      interviewQuestionCount, setInterviewQuestionCount,
      chatConversationId, setChatConversationId,
      chatMessages, setChatMessages,
      clearAdvisorSession,
    }}>
      {children}
    </AdvisorSessionContext.Provider>
  );
}

export function useAdvisorSession() {
  const ctx = useContext(AdvisorSessionContext);
  if (!ctx) throw new Error('useAdvisorSession must be inside AdvisorSessionProvider');
  return ctx;
}
