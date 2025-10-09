import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import api, { type Course } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'

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
            <CardHeader>
              <div className="text-xl font-semibold">{course?.name ?? 'Loading…'}</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading && <div>Loading course…</div>}
              {error && <div className="text-red-500">{error}</div>}
              {course && (
                <>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">University / Institution</div>
                    <div className="mt-1">Various (placeholder)</div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Duration</div>
                      <div className="mt-1">{course.duration || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Entry Requirements</div>
                      <div className="mt-1">Cluster points: {course.cluster_points ?? 'N/A'}</div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tuition Fees</div>
                      <div className="mt-1">Varies by institution (placeholder)</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Location / Campus</div>
                      <div className="mt-1">Multiple (placeholder)</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Career Outcomes</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(course.career_paths ?? []).map((c, i) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Job Market Demand</div>
                    <div className="mt-1">{course.description?.length ? 'See details below' : 'Good (placeholder)'}</div>
                  </div>
                  {course.description && (
                    <div className="pt-2 text-slate-700 dark:text-slate-200 leading-relaxed">{course.description}</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="font-semibold">Eligibility</div>
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
