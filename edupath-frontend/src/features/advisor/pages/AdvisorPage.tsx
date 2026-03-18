import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader } from 'lucide-react';
import api, { type AdvisorRecommendation } from '../../../services/api';
import { InterviewChat } from '../components/InterviewChat';
import { RecommendationCard } from '../components/RecommendationCard';

export const AdvisorPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [recommendations, setRecommendations] = useState<AdvisorRecommendation[] | null>(null);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const res = await api.advisor.startSession();
      setSessionId(res.session_id);
    } catch (err) {
      console.error(err);
      alert('Failed to start advisor session.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleInterviewComplete = async (completedSessionId: string) => {
    setIsFetchingRecommendations(true);
    try {
      const res = await api.advisor.getRecommendations(completedSessionId);
      setRecommendations(res.recommendations);
    } catch (err) {
      console.error(err);
      alert('Failed to load recommendations.');
    } finally {
      setIsFetchingRecommendations(false);
    }
  };

  const handleStartOver = () => {
    setSessionId(null);
    setRecommendations(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-teal-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-xl shadow-teal-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 tracking-tight">
            EduGuide AI
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Discover your perfect university path. Chat with our intelligent guide to uncover courses tailored to your unique interests, strengths, and goals.
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20 dark:border-slate-700/50">
          
          {/* Landing State */}
          {!sessionId && !recommendations && (
            <div className="p-12 text-center space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">Ready to find your path?</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  You'll answer 10 adaptive questions about your educational journey, and we'll match you with the top 5 Kenyan university programs just for you.
                </p>
              </div>
              <button
                onClick={handleStartSession}
                disabled={isStarting}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-full font-semibold text-lg shadow-lg shadow-teal-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isStarting ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Preparing...</>
                ) : (
                  <>Start Interview <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {/* Chat State */}
          {sessionId && !recommendations && !isFetchingRecommendations && (
            <div className="p-0">
              <InterviewChat 
                sessionId={sessionId} 
                onComplete={() => handleInterviewComplete(sessionId)} 
              />
            </div>
          )}

          {/* Loading Recommendations State */}
          {isFetchingRecommendations && (
            <div className="p-16 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-t-4 border-teal-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-4 border-emerald-500 animate-spin animation-delay-150"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-teal-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Analysing your profile...</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Searching across 2,000+ courses to find your perfect matches.
              </p>
            </div>
          )}

          {/* Results State */}
          {recommendations && (
            <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Top 5 Course Matches</h2>
                <button
                  onClick={handleStartOver}
                  className="px-5 py-2 text-sm font-medium text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/30 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                >
                  Start Over
                </button>
              </div>

              {recommendations.length > 0 ? (
                <div className="grid gap-6">
                  {recommendations.map((rec) => (
                    <RecommendationCard key={rec.rank} recommendation={rec} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-700/30">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    We couldn't find exact matches based on your specific criteria. Please try the interview again with broader preferences.
                  </p>
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default AdvisorPage;
