import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import api, { type SubjectDef, type GradeEntry, type KCSEGrade } from '../../../services/api'

// Predefined KCSE subjects (4 compulsory + 6 optional)
const KCSE_SUBJECTS = [
  // Compulsory subjects
  { code: 'MAT', name: 'Mathematics', compulsory: true },
  { code: 'ENG', name: 'English', compulsory: true },
  { code: 'KIS', name: 'Kiswahili', compulsory: true },
  { code: 'BIO', name: 'Biology', compulsory: true },
  
  // Optional subjects
  { code: 'CHE', name: 'Chemistry', compulsory: false },
  { code: 'PHY', name: 'Physics', compulsory: false },
  { code: 'HIS', name: 'History', compulsory: false },
  { code: 'GEO', name: 'Geography', compulsory: false },
  { code: 'CRE', name: 'Christian Religious Education', compulsory: false },
  { code: 'AGR', name: 'Agriculture', compulsory: false },
  { code: 'BST', name: 'Business Studies', compulsory: false },
  { code: 'COM', name: 'Computer Studies', compulsory: false },
  { code: 'FRE', name: 'French', compulsory: false },
  { code: 'MUS', name: 'Music', compulsory: false },
  { code: 'HSC', name: 'Home Science', compulsory: false },
] as const

const COMPULSORY_SUBJECTS = KCSE_SUBJECTS.filter(s => s.compulsory).map(s => s.code)

const GRADE_POINTS_MAP: Record<KCSEGrade, number> = {
  'A': 12,
  'A-': 11,
  'B+': 10,
  'B': 9,
  'B-': 8,
  'C+': 7,
  'C': 6,
  'C-': 5,
  'D+': 4,
  'D': 3,
  'D-': 2,
  'E': 1,
}

const computeMeanPoints = (entries: GradeEntry[]) => {
  if (!entries || entries.length === 0) return undefined
  const points = entries
    .map(entry => GRADE_POINTS_MAP[entry.grade])
    .filter(point => typeof point === 'number')
    .sort((a, b) => b - a)
    .slice(0, 7)
  if (points.length === 0) return undefined
  return points.reduce((sum, current) => sum + current, 0)
}

export default function AcademicProfilePage() {
  const navigate = useNavigate()
  const [subjects] = useState<SubjectDef[]>(KCSE_SUBJECTS as any[])
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([])
  const [examYear, setExamYear] = useState<number | undefined>()
  const [school, setSchool] = useState<string>('')
  const [manualMean, setManualMean] = useState(false)
  const [meanPoints, setMeanPoints] = useState<number | undefined>()
  const sections = [
    {
      id: 'overview',
      title: 'Academic Details',
      description: 'Year you sat for KCSE and school information.',
    },
    {
      id: 'subjects',
      title: 'Subject Grades',
      description: 'Add your KCSE subjects and grades to compute points.',
    },
    {
      id: 'review',
      title: 'Review & Mean Points',
      description: 'Confirm your entries and adjust mean points if needed.',
    },
  ] as const

  const [activeSection, setActiveSection] = useState<typeof sections[number]['id']>('overview')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const existing = await api.academic.getProfile().catch(() => null)
        if (existing) {
          setExamYear(existing.kcse_year ?? undefined)
          setSchool(existing.kcse_school ?? '')
          if (existing.kcse_grades) {
            // Only include grades for our predefined subjects
            const entries = Object.entries(existing.kcse_grades)
              .filter(([code]) => KCSE_SUBJECTS.some(s => s.code === code))
              .map(([code, grade]) => ({
                subject_code: code,
                grade: grade as KCSEGrade,
              }))
            setGradeEntries(entries)
          }
          if (existing.kcse_mean_points != null) {
            setMeanPoints(Number(existing.kcse_mean_points))
            setManualMean(true)
          }
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  const gradeOptions: KCSEGrade[] = ['A','A-','B+','B','B-','C+','C','C-','D+','D','D-','E']

  const usedSubjectCodes = useMemo(() => new Set(gradeEntries.map(g => g.subject_code)), [gradeEntries])

  const addSubject = (code: string) => {
    if (!code || usedSubjectCodes.has(code)) return
    setGradeEntries(prev => [...prev, { subject_code: code, grade: 'B' }])
    setError(null) // Clear any previous errors when adding a subject
  }

  const removeSubject = (code: string) => {
    setGradeEntries(prev => prev.filter(g => g.subject_code !== code))
  }

  const updateGrade = (code: string, grade: KCSEGrade) => {
    setGradeEntries(prev => prev.map(g => g.subject_code === code ? { ...g, grade } : g))
  }

  const computedMeanPoints = useMemo(() => computeMeanPoints(gradeEntries), [gradeEntries])
  const effectiveMeanPoints = manualMean ? (meanPoints ?? computedMeanPoints) : computedMeanPoints

  const handleMeanInput = (value: string) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
      setMeanPoints(undefined)
      return
    }
    setMeanPoints(numeric)
  }

  const validateForm = () => {
    const filledSubjects = new Set(gradeEntries.map(g => g.subject_code))
    
    // Check for compulsory subjects
    const missingCompulsory = COMPULSORY_SUBJECTS.filter(
      code => !filledSubjects.has(code)
    )
    
    if (missingCompulsory.length > 0) {
      return `Missing compulsory subjects: ${missingCompulsory.join(', ')}`
    }
    
    // Check minimum subjects (8 total)
    if (filledSubjects.size < 8) {
      return `You need at least 8 subjects (${filledSubjects.size}/8 selected)`
    }
    
    return null
  }

  const saveProfile = async () => {
    setSaving(true)
    setError(null)

    try {
      const gradesPayload = Object.fromEntries(
        gradeEntries.map(({ subject_code, grade }) => [subject_code, grade])
      ) as Record<string, KCSEGrade>

      // Validate form
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        setActiveSection('subjects')
        setSaving(false)
        return
      }

      const payload = {
        kcse_year: examYear,
        kcse_school: school ? school : null,
        kcse_grades: gradesPayload,
        kcse_mean_points: effectiveMeanPoints ?? null,
      }

      const result = await api.academic.upsertProfile(payload)
      
      // Notify other views (e.g., Profile tabs) to refresh academic summary
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('academic:saved'))
      }
      navigate('/profile')
    } catch (e: any) {
      console.error('Failed to save academic profile:', e)
      setError(e?.message || 'Failed to save academic profile. Please check your authentication and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer title="Academic Profile">
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Academic Profile</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
              Capture your KCSE performance to unlock accurate recommendations and eligibility insights.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Back to Profile
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <div className="font-semibold">Profile Sections</div>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border border-transparent transition ${activeSection === section.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className="text-sm font-medium">{section.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{section.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="font-semibold">{sections.find(sec => sec.id === activeSection)?.title}</div>
              <div className="text-sm text-slate-500 dark:text-slate-300">
                {sections.find(sec => sec.id === activeSection)?.description}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                if (activeSection === 'overview') {
                  return (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">Exam Year</label>
                          <input
                            type="number"
                            value={examYear ?? ''}
                            onChange={e => setExamYear(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white"
                            placeholder="e.g., 2023"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">School (optional)</label>
                          <input
                            value={school}
                            onChange={e => setSchool(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white"
                            placeholder="Your secondary school"
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 text-sm">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">Why we ask</div>
                        <div className="mt-1 text-slate-600 dark:text-slate-300">This helps tailor course recommendations to your graduation timeline and school context.</div>
                      </div>
                    </div>
                  )
                }

                if (activeSection === 'subjects') {
                  return (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Add Subject
                          </label>
                          <span className="text-xs text-slate-500">
                            {gradeEntries.length}/10 subjects selected
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <select
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white"
                            onChange={(e) => {
                              addSubject(e.target.value)
                              e.currentTarget.selectedIndex = 0
                            }}
                            disabled={gradeEntries.length >= 10}
                          >
                            <option value="">Select subject…</option>
                            {subjects
                              .filter(s => !usedSubjectCodes.has(s.code))
                              .sort((a, b) => {
                                // Sort compulsory subjects first, then alphabetically
                                if (a.compulsory && !b.compulsory) return -1
                                if (!a.compulsory && b.compulsory) return 1
                                return a.name.localeCompare(b.name)
                              })
                              .map(s => (
                                <option key={s.code} value={s.code}>
                                  {s.name} {s.compulsory ? '(Compulsory)' : ''}
                                </option>
                              ))
                            }
                          </select>
                        </div>
                        {gradeEntries.length < 8 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Select at least 8 subjects (including all compulsory ones)
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {gradeEntries.length === 0 && (
                          <div className="text-sm text-slate-500">No subjects added yet.</div>
                        )}
                        {gradeEntries
                          .sort((a, b) => {
                            const subjA = subjects.find(s => s.code === a.subject_code)
                            const subjB = subjects.find(s => s.code === b.subject_code)
                            // Sort compulsory first, then by name
                            if (subjA?.compulsory && !subjB?.compulsory) return -1
                            if (!subjA?.compulsory && subjB?.compulsory) return 1
                            return (subjA?.name || '').localeCompare(subjB?.name || '')
                          })
                          .map(entry => {
                            const subject = subjects.find(s => s.code === entry.subject_code)
                            return (
                              <div 
                                key={entry.subject_code} 
                                className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                                  subject?.compulsory 
                                    ? 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20' 
                                    : 'border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <div>
                                  <div className="font-medium">
                                    {subject?.name ?? entry.subject_code}
                                    {subject?.compulsory && (
                                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={entry.grade}
                                    onChange={e => updateGrade(entry.subject_code, e.target.value as KCSEGrade)}
                                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white"
                                  >
                                    {gradeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                  {!subject?.compulsory && (
                                    <button 
                                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                      onClick={() => removeSubject(entry.subject_code)}
                                      title="Remove subject"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        }
                      </div>

                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 text-sm">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">Mean Points</div>
                        <div className="mt-1 text-slate-600 dark:text-slate-300">
                          {computedMeanPoints ? (
                            <>
                              <span className="font-medium">{computedMeanPoints.toFixed(2)}/84</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                                Calculated from your top 7 subjects
                              </span>
                            </>
                          ) : (
                            'Add more subjects to compute mean points.'
                          )}
                        </div>
                        
                        {gradeEntries.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-300">Subjects entered:</span>
                              <span className="font-medium">
                                {gradeEntries.length} {gradeEntries.length === 1 ? 'subject' : 'subjects'}
                              </span>
                            </div>
                            {gradeEntries.length < 8 && (
                              <div className="mt-1 text-amber-600 dark:text-amber-400 text-xs">
                                Minimum 8 subjects required (including all compulsory ones)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <div className="text-sm text-slate-500">Mean Points Mode</div>
                      <label className="mt-2 flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={manualMean}
                          onChange={e => {
                            const checked = e.target.checked
                            setManualMean(checked)
                            if (!checked) {
                              setMeanPoints(undefined)
                            }
                          }}
                        />
                        Enter mean points manually
                      </label>
                      {manualMean ? (
                        <div className="mt-2">
                          <input
                            type="number"
                            min={0}
                            max={84}
                            step={0.1}
                            value={meanPoints ?? ''}
                            onChange={e => handleMeanInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white"
                            placeholder={computedMeanPoints ? `${computedMeanPoints}` : 'Enter KCSE mean points (0-84)'}
                          />
                          <div className="mt-1 text-xs text-slate-500">Use official KCSE mean points if available.</div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {computedMeanPoints ? `${computedMeanPoints}/84 auto-calculated from your entries.` : 'Add subjects first to auto-compute mean points.'}
                        </div>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Exam Year</div>
                        <div className="font-medium">{examYear ?? '—'}</div>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">School</div>
                        <div className="font-medium">{school || '—'}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-sm text-slate-500">Effective Mean Points</div>
                      <div className="font-medium">
                        {effectiveMeanPoints != null ? `${effectiveMeanPoints.toFixed(2)}/84` : 'Not available'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-sm text-slate-500">Subjects & Grades</div>
                      <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                        {gradeEntries.length > 0
                          ? gradeEntries.map(entry => `${subjects.find(s => s.code === entry.subject_code)?.name || entry.subject_code}: ${entry.grade}`).join(', ')
                          : '—'}
                      </div>
                    </div>

                    {error && <div className="text-sm text-red-500">{error}</div>}

                    <div className="flex justify-end">
                      <button
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        onClick={saveProfile}
                      >
                        {saving ? 'Saving…' : 'Save Academic Profile'}
                      </button>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
