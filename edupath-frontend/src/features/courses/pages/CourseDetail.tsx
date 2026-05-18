import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import api, { type CourseGrouped } from '../../../services/api'
import { getUniversityIcon } from '../../../utils/universityIcons'
import { Award, BookOpen, Calendar, Check, ChevronDown, ChevronUp, DollarSign, MapPin, Target, Users, X as LucideX } from 'lucide-react'

export default function CourseDetail() {
  const { id: encodedCategory } = useParams()
  const [course, setCourse] = useState<CourseGrouped | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expanded, setExpanded] = useState({
    prosCons: true,
    universities: true,
    requirements: true,
    career: true,
  })

  const toggleExpanded = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  useEffect(() => {
    if (!encodedCategory) return
    ;(async () => {
      setLoading(true)
      try {
        const category = decodeURIComponent(encodedCategory).replace(/^course:/, '')
        const data = await api.courses.getGrouped(category)
        setCourse(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load course')
      } finally {
        setLoading(false)
      }
    })()
  }, [encodedCategory])

  // Group programmes by institution name
  const universityProgramGroups = (() => {
    if (!course?.programmes) return []
    const map = new Map<string, typeof course.programmes>()
    for (const p of course.programmes) {
      const inst = p.institution || 'Unknown Institution'
      if (!map.has(inst)) map.set(inst, [])
      map.get(inst)!.push(p)
    }
    return Array.from(map.entries())
      .map(([name, progs]) => ({ name, programs: progs, logo: getUniversityIcon(name) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })()

  return (
    <PageContainer title={course?.category || 'Course Detail'}>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 border-b-0">
              <div className="text-xl font-semibold text-white">
                {course?.category ?? 'Loading…'}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading && <div>Loading course…</div>}
              {error && <div className="text-red-500">{error}</div>}
              {course && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200 px-3 py-1 text-xs font-semibold">
                      <Award className="w-4 h-4" />
                      {course.related_hub}
                    </span>
                    {course.avg_fees_ksh != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 px-3 py-1 text-xs font-semibold">
                        <DollarSign className="w-4 h-4" />
                        Avg Ksh {course.avg_fees_ksh.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {course.description && (
                    <div className="pt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
                      {course.description}
                    </div>
                  )}

                  {(course.pros?.length || course.cons?.length) && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded('prosCons')}
                        className="w-full flex items-center justify-between gap-3 rounded-xl p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                          <span className="font-semibold text-slate-900 dark:text-white">Pros & Cons</span>
                        </div>
                        {expanded.prosCons ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>

                      {expanded.prosCons && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
                            <div className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3">Pros</div>
                            <ul className="space-y-2">
                              {course.pros?.length ? course.pros.map((p, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300 mt-0.5 flex-shrink-0" />
                                  <span>{p}</span>
                                </li>
                              )) : <li className="text-sm text-slate-600">N/A</li>}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/20 p-4">
                            <div className="font-semibold text-red-800 dark:text-red-200 mb-3">Cons</div>
                            <ul className="space-y-2">
                              {course.cons?.length ? course.cons.map((c, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                                  <LucideX className="w-4 h-4 text-red-600 dark:text-red-300 mt-0.5 flex-shrink-0" />
                                  <span>{c}</span>
                                </li>
                              )) : <li className="text-sm text-slate-600">N/A</li>}
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
                          Institutions Offering This ({course.programmes.length})
                        </span>
                      </div>
                      {expanded.universities ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {expanded.universities && (
                      <div className="space-y-4">
                        {universityProgramGroups.map((group) => (
                          <div key={group.name} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 flex items-center gap-3">
                              <img src={group.logo} alt={group.name} className="w-12 h-12 rounded-full object-cover border-4 border-white dark:border-slate-900/40" />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate">{group.name}</div>
                              </div>
                            </div>

                            <div className="p-4 space-y-3">
                              {group.programs.map((p, idx) => (
                                <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/30 p-4">
                                  <div className="font-semibold text-slate-900 dark:text-white truncate mb-1">{p.name}</div>
                                  <div className="text-xs text-slate-500 font-semibold mb-3">Code: {p.programme_code || 'N/A'}</div>

                                  <div className="grid sm:grid-cols-2 gap-3 mb-3 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                      <Target className="w-4 h-4 text-cyan-600" />
                                      <span>Cutoff '23: <b className="text-slate-900">{p.cutoff_2023 ?? 'N/A'}</b></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                      <Target className="w-4 h-4 text-emerald-600" />
                                      <span>Cutoff '22: <b className="text-slate-900">{p.cutoff_2022 ?? 'N/A'}</b></span>
                                    </div>
                                  </div>

                                  <div className="text-xs uppercase font-bold bg-slate-800 text-white px-3 py-1.5 rounded-md mb-2 inline-block">Subject Requirements</div>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {[p.subject_requirement_1, p.subject_requirement_2, p.subject_requirement_3, p.subject_requirement_4]
                                      .filter(Boolean)
                                      .map((req, i) => (
                                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md whitespace-nowrap">{req}</span>
                                      ))
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
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
                        {course.careers?.length ? course.careers.map((c) => (
                          <span key={c} className="px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-semibold">
                            {c}
                          </span>
                        )) : <div className="text-sm text-slate-600">No career data found.</div>}
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
              <div className="font-semibold text-white">Advising & Eligibility</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600">
                To check exactly which of these institutions you qualify for, use <b>EduGuide AI</b> or consult an advisor on our platform.
              </div>
              <Link to="/advisor" className="block w-full text-center px-4 py-2 mt-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition">
                Talk to EduGuide AI
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
