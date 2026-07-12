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

  const scoreColor =
    (match_score ?? 0) >= 75 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
    (match_score ?? 0) >= 50 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
    'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
      {/* Left teal accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-cyan-500 rounded-l-2xl" />

      {/* Rank Badge */}
      <div className={`absolute left-3 -top-2 w-10 h-10 flex items-center justify-center font-black text-sm text-white rounded-xl shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform z-10 ${
        rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
        rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
        rank === 3 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
        'bg-gradient-to-br from-teal-500 to-emerald-600'
      }`}>
        #{rank}
      </div>

      <div className="p-6 sm:p-7 ml-5 mt-2">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-800 rounded-full">
                {hub_category}
              </span>
              {match_score != null && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${scoreColor}`}>
                  <Target className="w-3.5 h-3.5" /> {match_score}% Match
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {course_name}
            </h3>

            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
              <Building2 className="w-4 h-4 text-teal-500 dark:text-teal-400" />
              <span className="font-medium">{institution}</span>
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2.5 min-w-[130px]">
            {cutoff_2023 !== null && (
              <div className="bg-teal-50 dark:bg-slate-900/50 rounded-xl p-3 border border-teal-200 dark:border-slate-700 flex flex-col items-center flex-1">
                <span className="text-[10px] text-teal-600 dark:text-slate-400 uppercase font-bold tracking-wide">Cutoff 2023</span>
                <span className="text-lg font-extrabold text-teal-700 dark:text-white">{cutoff_2023}</span>
              </div>
            )}
            {avg_fees_ksh !== null && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex flex-col items-center flex-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Avg. Fees</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                  KSh {avg_fees_ksh.toLocaleString()}
                </span>
              </div>
            )}
          </div>

        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 space-y-5">
          {match_explanation && (
            <div className="bg-teal-50/60 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/40 rounded-xl px-4 py-3">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5">
                <Award className="w-3.5 h-3.5" /> Why this matches you
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {match_explanation}
              </p>
            </div>
          )}

          {career_paths && career_paths.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                <Briefcase className="w-3.5 h-3.5" /> Career Paths
              </h4>
              <div className="flex flex-wrap gap-2">
                {career_paths.map((career, i) => (
                  <span key={i} className="px-3 py-1 text-xs font-semibold bg-white dark:bg-slate-700/50 text-teal-700 dark:text-teal-300 rounded-lg border border-teal-200 dark:border-slate-600 shadow-sm">
                    {career}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                saved
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30 hover:bg-teal-700'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white hover:border-teal-500 border border-slate-200 dark:border-slate-600 shadow-sm'
              } ${pulse ? 'scale-105' : 'scale-100'}`}
            >
              {saved ? (
                <><BookmarkCheck className="w-4 h-4" /> Saved</>
              ) : (
                <><Bookmark className="w-4 h-4" /> Save</>
              )}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Added to your saved list
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
