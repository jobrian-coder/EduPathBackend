import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, ArrowRight, Loader, GraduationCap, BookmarkCheck, Bookmark, Download, Users, MessageCircle, FileText } from 'lucide-react';
import api, { type AdvisorRecommendation } from '../../../services/api';
import { InterviewChat } from '../components/InterviewChat';
import { RecommendationCard, getSavedRecommendations, type SavedRecommendation } from '../components/RecommendationCard';
import AIChat from '../components/AIChat';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

interface SuggestedHub {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  category: string;
  member_count: number;
  description: string;
}

export const AdvisorPage: React.FC = () => {
  const [mode, setMode] = useState<'interview' | 'chat'>('interview');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [recommendations, setRecommendations] = useState<AdvisorRecommendation[] | null>(null);
  const [suggestedHubs, setSuggestedHubs] = useState<SuggestedHub[]>([]);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);
  const [academicProfile, setAcademicProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [allSaved, setAllSaved] = useState(false);
  const [saveAllPulse, setSaveAllPulse] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    setSessionId(null);
    setRecommendations(null);
    setSuggestedHubs([]);
    setAllSaved(false);
  };

  const handleDownloadPDF = () => {
    if (!recommendations || isDownloading) return;

    setIsDownloading(true);
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
      pdf.setFontSize(22);
      pdf.setTextColor(15, 118, 110);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EduPath — Course Recommendations', margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleDateString()} | Personal Career Guidance`, margin, y);
      y += 10;

      // Divider Line
      pdf.setDrawColor(20, 184, 166);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageW - margin, y);
      y += 10;

      recommendations.forEach((rec, idx) => {
        checkPage(60);

        // Rank + Course Name
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${idx + 1}. ${rec.course_name}`, margin, y);
        y += 7;

        // Institution
        pdf.setFontSize(10);
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Institution: ${rec.institution}`, margin + 4, y);
        y += 5;

        // Score / match
        if (rec.match_score != null) {
          pdf.text(`Match Score: ${rec.match_score}%`, margin + 4, y);
          y += 5;
        }

        // Hub Category
        if (rec.hub_category) {
          pdf.text(`Hub Category: ${rec.hub_category}`, margin + 4, y);
          y += 5;
        }

        // Avg Fees
        if (rec.avg_fees_ksh != null) {
          const formattedFee = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(rec.avg_fees_ksh);
          pdf.text(`Average Fees: ${formattedFee} / year`, margin + 4, y);
          y += 5;
        }

        // Cutoffs
        if (rec.cutoff_2023 != null || rec.cutoff_2022 != null) {
          const cutoffsStr = [
            rec.cutoff_2023 != null ? `2023: ${rec.cutoff_2023}` : null,
            rec.cutoff_2022 != null ? `2022: ${rec.cutoff_2022}` : null
          ].filter(Boolean).join(' | ');
          pdf.text(`Cluster Cutoff Points — ${cutoffsStr}`, margin + 4, y);
          y += 5;
        }

        // Career paths
        if (rec.career_paths && rec.career_paths.length > 0) {
          pdf.text(`Recommended Careers: ${rec.career_paths.join(', ')}`, margin + 4, y);
          y += 5;
        }

        // Detailed matching reasoning explanation
        if (rec.match_explanation) {
          checkPage(20);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(15, 118, 110);
          pdf.text('Why Recommended:', margin + 4, y);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(51, 65, 85);
          y += 5;

          const lines = pdf.splitTextToSize(rec.match_explanation, contentW - 8);
          lines.forEach((line: string) => {
            checkPage(5);
            pdf.text(line, margin + 8, y);
            y += 4.5;
          });
        }

        y += 4;
        // Light separator between recommendation cards
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, y, pageW - margin, y);
        y += 8;
      });

      pdf.save('edupath-course-recommendations.pdf');
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

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-2 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit mx-auto">
          <button
            onClick={() => setMode('interview')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'interview'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            Get Recommendations
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'chat'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20 dark:border-slate-700/50">
          
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
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">Ready to find your path?</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  You'll answer 10 adaptive questions about your educational journey, and we'll match you with the top 5 Kenyan university programs just for you.
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
            <div ref={resultsRef} className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900/50">
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
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all cursor-pointer group"
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
          
        </div>
      </div>
    </div>
  );
};

export default AdvisorPage;
