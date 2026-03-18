import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import api, { type Course, type CourseUniversity, type University } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'
import { getUniversityIcon } from '../../../utils/universityIcons'
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ExternalLink,
  MapPin,
  Target,
  Users,
  X as LucideX,
} from 'lucide-react'

export default function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const [eligibility, setEligibility] = useState<null | {
    course_id: string
    cluster_points: number
    raw_cluster_total: number
    mean_points: number | null
    required_points: number
    eligible: boolean
    missing_subjects: string[]
    cluster_subjects: string[]
  }>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)

  const [expanded, setExpanded] = useState({
    prosCons: true,
    universities: true,
    requirements: true,
    career: true,
    modules: true,
  })

  const toggleExpanded = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getUniversityName = (u: string | University) => (typeof u === 'string' ? u : u.name)
  const getUniversityShortName = (u: string | University) => (typeof u === 'string' ? '' : u.short_name)

  const universityProgramGroups = useMemo(() => {
    if (!course?.universities || course.universities.length === 0) return []

    const map = new Map<
      string,
      { universityName: string; universityShortName: string; universityLogo: string; programs: CourseUniversity[] }
    >()

    for (const cu of course.universities) {
      const universityName = getUniversityName(cu.university)
      const universityShortName = getUniversityShortName(cu.university)
      const universityLogo = getUniversityIcon(universityName)

      if (!map.has(universityName)) {
        map.set(universityName, { universityName, universityShortName, universityLogo, programs: [] })
      }
      map.get(universityName)!.programs.push(cu)
    }

    return Array.from(map.values()).sort((a, b) => a.universityName.localeCompare(b.universityName))
  }, [course?.universities])

  useEffect(() => {
    if (!id) return
    ;(async () => {
      setLoading(true)
      try {
        const data = await api.courses.getCourse(id)
        setCourse(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load course')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const fetchEligibility = useCallback(async () => {
    if (!course?.id) return
    setCheckingEligibility(true)
    setEligibilityError(null)
    try {
      const data = await api.courses.calculateCluster({
        course_id: course.id,
        use_profile: true,
      })
      setEligibility(data)
    } catch (e: any) {
      setEligibility(null)
      setEligibilityError(e?.message || 'Unable to compute eligibility')
    } finally {
      setCheckingEligibility(false)
    }
  }, [course?.id])

  useEffect(() => {
    if (!user) return
    if (!course?.id) return
    fetchEligibility()
  }, [user, course?.id, fetchEligibility])

  return (
    <PageContainer title={course?.name || 'Course'}>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 border-b-0">
              <div className="text-xl font-semibold text-white">
                {course?.name ?? 'Loading…'}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading && <div>Loading course…</div>}
              {error && <div className="text-red-500">{error}</div>}
              {course && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200 px-3 py-1 text-xs font-semibold">
                      <Award className="w-4 h-4" />
                      {course.category}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-200 px-3 py-1 text-xs font-semibold">
                      <Calendar className="w-4 h-4" />
                      {course.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 px-3 py-1 text-xs font-semibold">
                      <Target className="w-4 h-4" />
                      Cluster cutoff: {course.cluster_points}
                    </span>
                  </div>

                  {course.description && (
                    <div className="pt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
                      {course.description}
                    </div>
                  )}

                  {(course.pros?.length || course.cons?.length) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleExpanded('prosCons')}
                          className="flex-1 text-left flex items-center justify-between gap-3 rounded-xl p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                            <span className="font-semibold text-slate-900 dark:text-white">Pros & Cons</span>
                          </div>
                          {expanded.prosCons ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {expanded.prosCons && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
                            <div className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3">Pros</div>
                            <ul className="space-y-2">
                              {course.pros?.length ? (
                                course.pros.map((p, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300 mt-0.5 flex-shrink-0" />
                                    <span>{p}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-slate-600 dark:text-slate-300">N/A</li>
                              )}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/20 p-4">
                            <div className="font-semibold text-red-800 dark:text-red-200 mb-3">Cons</div>
                            <ul className="space-y-2">
                              {course.cons?.length ? (
                                course.cons.map((c, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                                    <LucideX className="w-4 h-4 text-red-600 dark:text-red-300 mt-0.5 flex-shrink-0" />
                                    <span>{c}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-slate-600 dark:text-slate-300">N/A</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded('universities')}
                      className="w-full flex items-center justify-between gap-3 rounded-xl p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Universities & Programs {course.universities?.length ? `(${course.universities.length})` : ''}
                        </span>
                      </div>
                      {expanded.universities ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {expanded.universities && (
                      <div className="space-y-4">
                        {universityProgramGroups.length === 0 && (
                          <div className="text-slate-600 dark:text-slate-300">No program data found for this course.</div>
                        )}
                        {universityProgramGroups.map((group) => (
                          <div key={group.universityName} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 flex items-center gap-3">
                              <img
                                src={group.universityLogo}
                                alt={group.universityName}
                                className="w-12 h-12 rounded-full object-cover border-4 border-white dark:border-slate-900/40"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                  {group.universityName}
                                </div>
                                {group.universityShortName && (
                                  <div className="text-xs text-teal-700 dark:text-teal-200 font-semibold">
                                    {group.universityShortName}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-4 space-y-3">
                              {group.programs.map((cu) => {
                                const courseName = typeof cu.course === 'string' ? cu.course : (cu.course as Course | undefined)?.name
                                const programName = cu.programme_name || courseName || course.name

                                const universityLocation =
                                  typeof cu.university === 'string' ? '' : (cu.university as University).location

                                return (
                                  <div
                                    key={cu.id}
                                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/30 p-4"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                                          {programName}
                                        </div>
                                        {cu.program_code && (
                                          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                                            Code: {cu.program_code}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <div className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200 px-3 py-1 text-xs font-semibold">
                                          <DollarSign className="w-4 h-4" />
                                          {formatCurrency(cu.fees_ksh)}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-3 grid sm:grid-cols-3 gap-3">
                                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-300" />
                                        <span>{universityLocation || 'Various locations'}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />
                                        <span>Cutoff: {cu.cutoff_points}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                                        <span>{cu.application_deadline ? `Deadline: ${new Date(cu.application_deadline).toLocaleDateString('en-KE')}` : 'Deadline: N/A'}</span>
                                      </div>
                                    </div>

                                    {cu.course_url && (
                                      <div className="mt-3 flex items-center justify-end">
                                        <a
                                          href={cu.course_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-200 hover:text-teal-900 dark:hover:text-teal-100 transition-colors"
                                        >
                                          View program details
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded('requirements')}
                      className="w-full flex items-center justify-between gap-3 rounded-xl p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                        <span className="font-semibold text-slate-900 dark:text-white">Entry Requirements</span>
                      </div>
                      {expanded.requirements ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {expanded.requirements && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="shadow-none bg-slate-50/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700">
                          <CardContent className="p-4 space-y-3">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <Award className="w-4 h-4 text-teal-600 dark:text-teal-300" />
                              Cluster Cutoff
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{course.cluster_points}</div>
                            {course.cluster_subjects?.length ? (
                              <div className="text-sm text-slate-600 dark:text-slate-300">
                                Cluster subjects: <span className="font-semibold">{course.cluster_subjects.join(', ')}</span>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-600 dark:text-slate-300">Cluster subjects: N/A</div>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="shadow-none bg-slate-50/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700">
                          <CardContent className="p-4 space-y-3">
                            <div className="font-semibold text-slate-900 dark:text-white">Subjects</div>
                            <div className="space-y-2">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mandatory</div>
                              <div className="flex flex-wrap gap-2">
                                {course.mandatory_subjects?.length ? (
                                  course.mandatory_subjects.map((s) => (
                                    <span key={s} className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-slate-600 dark:text-slate-300">N/A</span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Alternatives</div>
                              <div className="flex flex-wrap gap-2">
                                {course.alternative_subjects?.length ? (
                                  course.alternative_subjects.map((s) => (
                                    <span key={s} className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-slate-600 dark:text-slate-300">N/A</span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded('career')}
                      className="w-full flex items-center justify-between gap-3 rounded-xl p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                        <span className="font-semibold text-slate-900 dark:text-white">Career Opportunities</span>
                      </div>
                      {expanded.career ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {expanded.career && (
                      <div className="flex flex-wrap gap-2">
                        {((course.career_paths && course.career_paths.length ? course.career_paths : course.careers) ?? []).length ? (
                          ((course.career_paths?.length ? course.career_paths : course.careers) ?? []).map((c) => (
                            <span
                              key={c}
                              className="px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-semibold"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <div className="text-sm text-slate-600 dark:text-slate-300">No career data found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded('modules')}
                      className="w-full flex items-center justify-between gap-3 rounded-xl p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                        <span className="font-semibold text-slate-900 dark:text-white">Course Modules</span>
                      </div>
                      {expanded.modules ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {expanded.modules && (
                      <div className="flex flex-wrap gap-2">
                        {course.modules?.length ? (
                          course.modules.map((m, idx) => (
                            <span
                              key={`${m}-${idx}`}
                              className="px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 text-sm font-semibold"
                            >
                              {idx + 1}. {m}
                            </span>
                          ))
                        ) : (
                          <div className="text-sm text-slate-600 dark:text-slate-300">No modules found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-b-0">
              <div className="font-semibold text-white">Eligibility</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Required cluster points</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{course?.cluster_points ?? 'N/A'}</div>

              {course?.cluster_subjects && course.cluster_subjects.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cluster subjects</div>
                  <div className="mt-1 text-slate-700 dark:text-slate-200">
                    {course.cluster_subjects.join(', ')}
                  </div>
                </div>
              )}

              {!user && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 text-slate-600 dark:text-slate-300">
                  Sign in and complete your academic profile to calculate eligibility.
                  <div className="mt-2">
                    <Link to="/auth" className="text-blue-600 hover:text-blue-500">Sign in</Link>
                  </div>
                </div>
              )}

              {user && (
                <div className="space-y-3">
                  {checkingEligibility && (
                    <div className="text-slate-500">Calculating using your academic profile…</div>
                  )}

                  {eligibility && !checkingEligibility && (
                    <div className={`rounded-lg border p-3 ${eligibility.eligible ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">Your cluster points</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${eligibility.eligible ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                        </div>
                      </div>
                      <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{eligibility.cluster_points.toFixed(2)} / 48</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">Raw cluster total: {eligibility.raw_cluster_total} · Mean points: {eligibility.mean_points?.toFixed(2) ?? 'N/A'}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Required cutoff: {eligibility.required_points.toFixed(2)}
                      </div>
                      {eligibility.missing_subjects.length > 0 && (
                        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                          Missing subjects: {eligibility.missing_subjects.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {eligibilityError && !checkingEligibility && (
                    <div className="rounded-lg border border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/30 p-3 text-sm text-amber-700 dark:text-amber-300">
                      {eligibilityError}
                      <div className="mt-2">
                        <Link to="/profile/academic" className="text-blue-600 hover:text-blue-500">Complete Academic Profile</Link>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Link to="/profile/academic" className="text-blue-600 hover:text-blue-500">Update academic profile</Link>
                    <button
                      onClick={fetchEligibility}
                      disabled={checkingEligibility || !course?.id}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                    >
                      Recalculate
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
