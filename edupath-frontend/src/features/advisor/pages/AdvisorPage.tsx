import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, ArrowRight, Loader, GraduationCap, BookmarkCheck, Bookmark, Download, Users, MessageCircle, FileText } from 'lucide-react';
import api from '../../../services/api';
import { InterviewChat } from '../components/InterviewChat';
import { RecommendationCard, getSavedRecommendations, type SavedRecommendation } from '../components/RecommendationCard';
import AIChat from '../components/AIChat';
import { TokenPaywall, AuthGate } from '../components/TokenPaywall';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useAdvisorSession } from '../context/AdvisorSessionContext';
import { downloadRecommendationsPdf } from '../utils/advisorPdf';
import { CreditCard, ShieldCheck, Lock, CheckCircle2, Coins, Wallet, LogIn, ChevronRight, HelpCircle } from 'lucide-react';

export const AdvisorPage: React.FC = () => {
  const {
    mode, setMode,
    sessionId, setSessionId,
    recommendations, setRecommendations,
    suggestedHubs, setSuggestedHubs,
    interviewMessages, setInterviewMessages,
    interviewQuestionCount, setInterviewQuestionCount,
    chatConversationId, setChatConversationId,
    clearAdvisorSession,
  } = useAdvisorSession();

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [trialsBalance, setTrialsBalance] = useState<number | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);
  const [academicProfile, setAcademicProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [allSaved, setAllSaved] = useState(false);
  const [saveAllPulse, setSaveAllPulse] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync auth trials balance to local state
  useEffect(() => {
    if (user) {
      setTrialsBalance(user.ai_trials_balance ?? 0);
    } else {
      setTrialsBalance(null);
    }
  }, [user]);

  // Payment gateway states
  const [activePaymentTab, setActivePaymentTab] = useState<'mpesa' | 'card' | 'paypal'>('mpesa');
  
  // Payment inputs and states
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaStatusMsg, setMpesaStatusMsg] = useState('');
  const [mpesaTimer, setMpesaTimer] = useState(15);
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  
  const [isProcessingPaypal, setIsProcessingPaypal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync mpesaPhone with user phone
  useEffect(() => {
    if (user?.phone_number) {
      setMpesaPhone(user.phone_number);
    }
  }, [user]);

  // Mpesa STK countdown effect
  useEffect(() => {
    let interval: any;
    if (isProcessingMpesa && mpesaTimer > 0) {
      interval = setInterval(() => {
        setMpesaTimer(prev => prev - 1);
      }, 1000);
    } else if (mpesaTimer === 0 && isProcessingMpesa) {
      handlePaymentSuccess('mpesa');
    }
    return () => clearInterval(interval);
  }, [isProcessingMpesa, mpesaTimer]);

  const handleMpesaPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaPhone) return;
    setIsProcessingMpesa(true);
    setMpesaTimer(15);
    setMpesaStatusMsg('Initiating M-Pesa Daraja STK Push...');
    
    setTimeout(() => {
      setMpesaStatusMsg('STK Push sent! Please enter your PIN on your phone.');
    }, 2000);
  };

  const handleCardPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc || !cardName) return;
    setIsProcessingCard(true);
    
    setTimeout(() => {
      handlePaymentSuccess('card');
    }, 3000);
  };

  const handlePaypalPay = () => {
    setIsProcessingPaypal(true);
    setTimeout(() => {
      handlePaymentSuccess('paypal');
    }, 2000);
  };

  const handlePaymentSuccess = async (method: string) => {
    try {
      const res = await api.auth.purchaseTrial(method, method === 'mpesa' ? mpesaPhone : undefined, 45);
      
      // Update local storage user structure and state
      const cachedUser = localStorage.getItem('edupath.user');
      if (cachedUser) {
        const u = JSON.parse(cachedUser);
        u.ai_trials_balance = res.ai_trials_balance;
        localStorage.setItem('edupath.user', JSON.stringify(u));
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        setTrialsBalance(res.ai_trials_balance);
        setIsProcessingMpesa(false);
        setIsProcessingCard(false);
        setIsProcessingPaypal(false);
        setIsSuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Payment simulation failed. Please try again.');
      setIsProcessingMpesa(false);
      setIsProcessingCard(false);
      setIsProcessingPaypal(false);
    }
  };

  // Card input formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      setExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setExpiry(val);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvc(val);
  };

  const showPaywall = isAuthenticated && 
    ((mode === 'interview' && !sessionId && !recommendations && trialsBalance === 0) ||
     (mode === 'chat' && !chatConversationId && trialsBalance === 0));

  const showAuthGate = !isAuthenticated && 
    ((mode === 'interview' && !sessionId && !recommendations) ||
     (mode === 'chat' && !chatConversationId));

  // Fetch academic profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.academic.getProfile();
        setAcademicProfile(profile);
      } catch (e) {
        // Profile may not exist yet
        setAcademicProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const res = await api.advisor.startSession();
      setSessionId(res.session_id);
      // Decrement balance locally
      setTrialsBalance(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      // Update cached user in localStorage
      const cachedUser = localStorage.getItem('edupath.user');
      if (cachedUser) {
        const u = JSON.parse(cachedUser);
        u.ai_trials_balance = Math.max(0, (u.ai_trials_balance ?? 1) - 1);
        localStorage.setItem('edupath.user', JSON.stringify(u));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to start advisor session.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleInterviewComplete = async (completedSessionId: string) => {
    setIsFetchingRecommendations(true);
    setRecommendationsError(null);
    try {
      const res = await api.advisor.getRecommendations(completedSessionId);
      console.log('[Advisor] Recommendations response:', res);
      if (!res.recommendations || res.recommendations.length === 0) {
        console.warn('[Advisor] No recommendations returned from API');
      }
      setRecommendations(res.recommendations);
      setSuggestedHubs(res.suggested_hubs || []);
    } catch (err: any) {
      console.error('[Advisor] Failed to load recommendations:', err);
      setRecommendationsError(err?.message || 'Failed to load recommendations. Please try again.');
    } finally {
      setIsFetchingRecommendations(false);
    }
  };

  const handleStartOver = () => {
    clearAdvisorSession();
    setAllSaved(false);
  };

  const handleDownloadPDF = () => {
    if (!recommendations || isDownloading) return;
    setIsDownloading(true);
    try {
      downloadRecommendationsPdf(
        recommendations,
        suggestedHubs,
        hasGrades ? academicProfile?.kcse_mean_points : null,
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Sync allSaved state when recommendations are loaded
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) return;
    const saved = getSavedRecommendations();
    const keys = saved.map(r => `${r.course_name}__${r.institution}`);
    setAllSaved(recommendations.every(r => keys.includes(`${r.course_name}__${r.institution}`)));
  }, [recommendations]);

  const handleSaveAll = useCallback(() => {
    if (!recommendations) return;
    const existing = getSavedRecommendations();
    const now = new Date().toISOString();
    const merged: SavedRecommendation[] = [...existing];
    recommendations.forEach(rec => {
      const key = `${rec.course_name}__${rec.institution}`;
      if (!merged.some(r => `${r.course_name}__${r.institution}` === key)) {
        merged.push({ ...rec, saved_at: now });
      }
    });
    localStorage.setItem('edupath_saved_recommendations', JSON.stringify(merged));
    setAllSaved(true);
    setSaveAllPulse(true);
    setTimeout(() => setSaveAllPulse(false), 600);
  }, [recommendations]);

  const hasGrades = academicProfile?.kcse_mean_points != null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-teal-950 py-12 px-4 sm:px-6 lg:px-8">
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
          {isAuthenticated && (
            <div className="flex justify-center mt-2">
              {trialsBalance === 1 ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  ✨ 1 Free Demo Session Active
                </div>
              ) : trialsBalance !== null && trialsBalance > 1 ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-teal-100/80 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-sm">
                  <Coins className="w-3.5 h-3.5" />
                  {trialsBalance} Trial Tokens Available
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
                  <Lock className="w-3.5 h-3.5" />
                  0 Tokens Remaining (Demo Used)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit mx-auto shadow-sm">
          <button
            onClick={() => setMode('interview')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              mode === 'interview'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/25'
                : 'text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Get Recommendations
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              mode === 'chat'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/25'
                : 'text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Ask AI Anything
          </button>
        </div>

        {/* Academic Profile Alert */}
        {mode === 'interview' && !profileLoading && !hasGrades && !sessionId && !recommendations && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-4 flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>Tip:</strong> Add your KCSE grades to your{' '}
                <a href="/profile/academic" className="underline hover:text-amber-900 dark:hover:text-amber-100">
                  Academic Profile
                </a>{' '}
                for personalized course recommendations based on your actual cluster points.
              </p>
            </div>
          </div>
        )}

        {/* Profile Badge */}
        {mode === 'interview' && !profileLoading && hasGrades && !sessionId && !recommendations && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-teal-900 dark:text-teal-100 font-medium">
                  Academic Profile Linked
                </p>
                <p className="text-teal-700 dark:text-teal-300 text-sm">
                  KCSE Mean Points: {academicProfile.kcse_mean_points}/84
                </p>
              </div>
            </div>
            <a 
              href="/profile/academic"
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Edit Grades
            </a>
          </div>
        )}
        
        {/* Content Section */}
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/50" style={{ borderTop: '4px solid rgb(20 184 166)' }}>
          
          {authLoading ? (
            <div className="p-16 text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto text-teal-600 dark:text-teal-400" />
              <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium">Checking account status...</p>
            </div>
          ) : showAuthGate ? (
            <AuthGate onLearnMore={() => navigate('/how-it-works')} />
          ) : showPaywall ? (
            <TokenPaywall user={user} onPaymentSuccess={(newBalance) => setTrialsBalance(newBalance)} />
          ) : (
            <>
              {/* Chat Mode */}
              {mode === 'chat' && (
                <div className="h-[600px]">
                  <AIChat />
                </div>
              )}
              
              {/* Interview Mode */}
              {mode === 'interview' && (
                <>
          {/* Landing State */}
          {!sessionId && !recommendations && (
            <div className="p-12 text-center space-y-8">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30 mb-2 animate-pulse">
                  ⚠️ Demo Mode Active
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">Ready to try the Demo?</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                  You are about to start a <strong>Free Demo Session</strong>. You'll answer 10 adaptive questions about your educational journey, and we'll match you with the top 5 Kenyan university programs just for you.
                </p>
                {hasGrades && (
                  <p className="text-teal-600 dark:text-teal-400 text-sm">
                    Your academic profile will be used to filter courses by eligibility.
                  </p>
                )}
              </div>
              <button
                onClick={handleStartSession}
                disabled={isStarting}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-full font-semibold text-lg shadow-lg shadow-teal-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isStarting ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Preparing...</>
                ) : (
                  <>Start Demo <ArrowRight className="w-5 h-5" /></>
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
                messages={interviewMessages}
                setMessages={setInterviewMessages}
                questionCount={interviewQuestionCount}
                setQuestionCount={setInterviewQuestionCount}
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
                {hasGrades && ' Using your KCSE grades for eligibility filtering.'}
              </p>
            </div>
          )}

          {recommendationsError && (
            <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-700/30">
              <p className="text-red-800 dark:text-red-200 font-medium">
                Error loading recommendations
              </p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-2">
                {recommendationsError}
              </p>
              <button
                onClick={() => handleInterviewComplete(sessionId!)}
                className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Results State */}
          {recommendations && !recommendationsError && (
            <div ref={resultsRef} className="p-8 space-y-8 bg-white dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Top 5 Course Matches</h2>
                  {hasGrades && (
                    <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                      Based on your KCSE mean points of {academicProfile.kcse_mean_points}/84
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Generating...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={allSaved}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                      allSaved
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30 cursor-default'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-300'
                    } ${saveAllPulse ? 'scale-105' : 'scale-100'}`}
                  >
                    {allSaved
                      ? <><BookmarkCheck className="w-4 h-4" /> All Saved</>
                      : <><Bookmark className="w-4 h-4" /> Save All</>
                    }
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              </div>

              {/* Suggested Hubs */}
              {suggestedHubs.length > 0 && (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recommended Hubs for You</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Based on your course matches, we recommend joining these communities to connect with peers and professionals.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {suggestedHubs.map(hub => (
                      <div
                        key={hub.id}
                        onClick={() => navigate(`/hubs/${hub.slug}`)}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{hub.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {hub.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {hub.member_count.toLocaleString()} members
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                              {hub.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.length > 0 ? (
                <div className="grid gap-6">
                  {recommendations.map((rec, idx) => (
                    <RecommendationCard key={idx} recommendation={rec} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-700/30">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    We couldn't find exact matches based on your specific criteria. Please try the interview again with broader preferences.
                  </p>
                  {!hasGrades && (
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                      Tip: Adding your KCSE grades to your Academic Profile can help us find courses you're eligible for.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          </>
          )}
          </>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default AdvisorPage;
