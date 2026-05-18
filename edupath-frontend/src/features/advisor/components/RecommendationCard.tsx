import React, { useState, useEffect, useCallback } from 'react';
import { Award, Building2, Target, Briefcase, Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import type { AdvisorRecommendation } from '../../../services/api';

const STORAGE_KEY = 'edupath_saved_recommendations';

export type SavedRecommendation = AdvisorRecommendation & { saved_at: string };

export function getSavedRecommendations(): SavedRecommendation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function makeKey(r: AdvisorRecommendation) {
  return `${r.course_name}__${r.institution}`;
}

interface RecommendationCardProps {
  recommendation: AdvisorRecommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const {
    rank,
    course_name,
    institution,
    hub_category,
    match_explanation,
    career_paths,
    cutoff_2023,
    avg_fees_ksh,
    match_score
  } = recommendation;

  const [saved, setSaved] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const existing = getSavedRecommendations();
    setSaved(existing.some(r => makeKey(r) === makeKey(recommendation)));
  }, [recommendation]);

  const handleToggleSave = useCallback(() => {
    const existing = getSavedRecommendations();
    const key = makeKey(recommendation);

    if (saved) {
      const updated = existing.filter(r => makeKey(r) !== key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaved(false);
    } else {
      const updated: SavedRecommendation[] = [
        ...existing.filter(r => makeKey(r) !== key),
        { ...recommendation, saved_at: new Date().toISOString() },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaved(true);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }
  }, [recommendation, saved]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
      {/* Rank Badge */}
      <div className={`absolute -left-2 -top-2 w-12 h-12 flex items-center justify-center font-black text-xl text-white rounded-xl shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform z-10 ${
        rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
        rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
        rank === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-700' :
        'bg-gradient-to-br from-teal-500 to-emerald-600'
      }`}>
        #{rank}
      </div>

      <div className="p-6 sm:p-8 ml-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 rounded-full">
                {hub_category}
              </span>
              <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                <Target className="w-4 h-4" /> {match_score}% Match
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
              {course_name}
            </h3>
            
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
              <Building2 className="w-5 h-5 text-slate-400" />
              {institution}
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-3 min-w-[140px]">
            {cutoff_2023 !== null && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 flex flex-col items-center flex-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Cutoff (2023)</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white">{cutoff_2023}</span>
              </div>
            )}
            {avg_fees_ksh !== null && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 flex flex-col items-center flex-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Avg. Fees</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white">
                  KSh {avg_fees_ksh.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-6">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <Award className="w-4 h-4" /> Why this matches you
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {match_explanation}
            </p>
          </div>

          {career_paths && career_paths.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                <Briefcase className="w-4 h-4" /> Potential Career Paths
              </h4>
              <div className="flex flex-wrap gap-2">
                {career_paths.map((career, i) => (
                  <span key={i} className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700">
                    {career}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                saved
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30 hover:bg-teal-700'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-600'
              } ${pulse ? 'scale-105' : 'scale-100'}`}
            >
              {saved ? (
                <><BookmarkCheck className="w-4 h-4" /> Saved</>
              ) : (
                <><Bookmark className="w-4 h-4" /> Save Recommendation</>
              )}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Added to your saved list
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
