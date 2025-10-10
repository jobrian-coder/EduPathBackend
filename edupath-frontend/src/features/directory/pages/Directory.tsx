import { useEffect, useMemo, useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import AdsCarousel from '../../../components/common/AdsCarousel'
import { Link, useLocation } from 'react-router-dom'
import { toggleBookmark, isBookmarked } from '../../../lib/bookmarks'
import { CourseDetailCard } from '../../courses/components/CourseDetailCard'
import api, { type Course, type University, type CourseUniversity } from '../../../services/api'

export default function Directory() {
  const location = useLocation()
  // view + data
  const [view, setView] = useState<'courses' | 'universities'>('courses')
  const [query, setQuery] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [links, setLinks] = useState<CourseUniversity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [city, setCity] = useState('')
  const [universityId, setUniversityId] = useState('')
  const [tuitionMin, setTuitionMin] = useState<number>(0)
  const [tuitionMax, setTuitionMax] = useState<number>(1000000)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [compare, setCompare] = useState<Record<string, boolean>>({})
  
  // course detail view
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const [cRes, uRes] = await Promise.all([
          api.courses.listCourses({ search: query }),
          api.courses.listUniversities({ search: '', location: '', type: '' } as any),
        ])
        setCourses(cRes.results)
        setUniversities(uRes.results)
        const cu = await api.courses.listCourseUniversities()
        setLinks(cu.results)
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'Failed to load directory')
      } finally {
        setLoading(false)
      }
    })()
  }, [query])

  // initialize from URL params (e.g., /directory?view=courses&university=ID&search=query)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const v = params.get('view')
    const uni = params.get('university')
    const search = params.get('search')
    if (v === 'courses' || v === 'universities') setView(v)
    if (uni) setUniversityId(uni)
    if (search) setQuery(search)
  }, [location.search])

  const cities = useMemo(() => Array.from(new Set(universities.map(u => u.location))).sort(), [universities])

  // helpers
  const byCourseId = useMemo(() => links.reduce<Record<string, CourseUniversity[]>>((acc, l) => {
    (acc[l.course] ||= []).push(l)
    return acc
  }, {}), [links])

  function minFeeFor(courseId: string): number | null {
    const arr = byCourseId[courseId]
    if (!arr || arr.length === 0) return null
    return Math.min(...arr.map(a => Number(a.fees_ksh)))
  }

  function toggleCompare(id: string) {
    setCompare(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function saveCourse(course: Course) {
    // Try backend bookmarks, fallback to local
    try {
      await api.bookmarks.create('course', course.id)
    } catch {
      toggleBookmark({ id: `course:${course.id}`, type: 'course', title: course.name })
    }
    // force re-render by flipping compare map briefly
    setCompare(prev => ({ ...prev }))
  }

  // filtering
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // university filter via CU mapping
      const cuArr = byCourseId[c.id] || []
      if (universityId && !cuArr.some(l => String(l.university) === String(universityId))) return false
      // city filter via university location
      if (city) {
        const uniMatches = cuArr.some(l => {
          const u = universities.find(u => String(u.id) === String(l.university))
          return u?.location === city
        })
        if (!uniMatches) return false
      }
      // tuition range
      const fee = minFeeFor(c.id)
      if (fee != null && (fee < tuitionMin || fee > tuitionMax)) return false
      // query handled by backend listCourses(search)
      return true
    })
  }, [courses, byCourseId, universityId, city, tuitionMin, tuitionMax, universities])

  const filteredUniversities = useMemo(() => {
    const nameMatch = (u: University) => (query ? u.name.toLowerCase().includes(query.toLowerCase()) : true)
    return universities.filter(u => (city ? u.location === city : true) && nameMatch(u))
  }, [universities, query, city])

  const selectedIds = useMemo(() => Object.keys(compare).filter(k => compare[k]), [compare])

  return (
    <PageContainer title="Information Directory">
      <div className="space-y-4">
        {/* Sticky search + view toggle */}
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800">
          <div className="p-3 grid grid-cols-[1fr_auto_auto] gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search courses or universities..." className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <button onClick={()=>setDrawerOpen(true)} className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800">Filters</button>
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              <button onClick={()=>setView('courses')} className={`px-3 py-2 ${view==='courses'?'bg-blue-600 text-white':'bg-slate-900'}`}>Courses</button>
              <button onClick={()=>setView('universities')} className={`px-3 py-2 ${view==='universities'?'bg-blue-600 text-white':'bg-slate-900'}`}>Universities</button>
            </div>
          </div>
        </div>

        {/* Layout: sidebar on desktop */}
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <Card>
              <CardHeader><div className="font-semibold">Filters</div></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-400 mb-1">City</div>
                  <select value={city} onChange={e=>setCity(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                    <option value="">All</option>
                    {cities.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">University</div>
                  <select value={universityId} onChange={e=>setUniversityId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                    <option value="">Any</option>
                    {universities.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                  </select>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Tuition (KSh)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={tuitionMin} onChange={e=>setTuitionMin(Number(e.target.value||0))} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" placeholder="Min" />
                    <input type="number" value={tuitionMax} onChange={e=>setTuitionMax(Number(e.target.value||0))} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" placeholder="Max" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {loading && <div className="text-slate-400">Loading...</div>}

            {/* Courses view */}
            {view==='courses' && !loading && (
              <div className="grid md:grid-cols-2 gap-3">
                {filteredCourses.map(c => (
                  <div key={c.id} className="p-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition relative">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/courses/${c.id}`} className="font-medium hover:text-blue-400">{c.name}</Link>
                        <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-1">
                          {(c.career_paths || []).slice(0,3).map((cp,i)=> (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-slate-700/60">{cp}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs inline-flex items-center gap-1">
                          <input type="checkbox" checked={!!compare[c.id]} onChange={()=>toggleCompare(c.id)} /> Compare
                        </label>
                        <button onClick={()=>saveCourse(c)} className={`text-xs px-2 py-1 rounded-full border ${isBookmarked(`course:${c.id}`,'course') ? 'bg-blue-600/20 border-blue-600 text-blue-300' : 'border-slate-600 hover:bg-blue-600/10 hover:text-blue-400'}`}>{isBookmarked(`course:${c.id}`,'course') ? '✓ Saved' : 'Save'}</button>
                        <button onClick={()=>setSelectedCourse(c)} className="text-xs px-2 py-1 rounded-full border border-purple-600 hover:bg-purple-600/10 hover:text-purple-400">View Course</button>
                      </div>
                    </div>
                    {/* Quick info hover */}
                    <div className="mt-2 text-xs text-slate-400 grid grid-cols-3 gap-2">
                      <div>Duration: {c.duration}</div>
                      <div>Entry: {(c.mandatory_subjects || []).slice(0,2).join(', ') || '—'}</div>
                      <div>Fees: {minFeeFor(c.id)?.toLocaleString() ?? 'Varies'}</div>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <Link to={`/courses/${c.id}`} className="text-blue-400 hover:text-blue-300">View More</Link>
                      <CourseDiscussionsBadge courseName={c.name} />
                    </div>
                  </div>
                ))}
                {filteredCourses.length===0 && <div className="text-slate-400">No matching courses.</div>}
              </div>
            )}

            {/* Universities view */}
            {view==='universities' && !loading && (
              <div className="grid md:grid-cols-2 gap-3">
                {filteredUniversities.map(u => (
                  <div key={u.id} className="p-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.location}</div>
                      </div>
                      <Link to={`/directory?view=courses&university=${u.id}`} className="text-sm px-2 py-1 rounded-lg border border-slate-600 hover:bg-slate-700">See offered courses</Link>
                    </div>
                  </div>
                ))}
                {filteredUniversities.length===0 && <div className="text-slate-400">No matching universities.</div>}
              </div>
            )}

            {/* Ads below lists */}
            <Card>
              <CardContent>
                <AdsCarousel title="Sponsored" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile filters drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-30">
            <div className="absolute inset-0 bg-black/50" onClick={()=>setDrawerOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-[80%] max-w-sm bg-slate-900 border-l border-slate-800 p-4 space-y-3">
              <div className="font-semibold">Filters</div>
              <div>
                <div className="text-slate-400 mb-1">City</div>
                <select value={city} onChange={e=>setCity(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                  <option value="">All</option>
                  {cities.map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <div className="text-slate-400 mb-1">University</div>
                <select value={universityId} onChange={e=>setUniversityId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                  <option value="">Any</option>
                  {universities.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                </select>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Tuition (KSh)</div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={tuitionMin} onChange={e=>setTuitionMin(Number(e.target.value||0))} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" placeholder="Min" />
                  <input type="number" value={tuitionMax} onChange={e=>setTuitionMax(Number(e.target.value||0))} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" placeholder="Max" />
                </div>
              </div>
              <button onClick={()=>setDrawerOpen(false)} className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Apply</button>
            </div>
          </div>
        )}

        {/* Floating compare bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 z-30">
            <div className="mx-auto max-w-5xl m-3 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-lg flex items-center justify-between">
              <div className="text-sm text-slate-300">Selected {selectedIds.length} course(s) for comparison</div>
              <Link to={'/courses/compare'} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">Compare</Link>
            </div>
          </div>
        )}

        {/* Course Detail Card Modal */}
        {selectedCourse && (
          <CourseDetailCard
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
          />
        )}

      </div>
    </PageContainer>
  )
}

function CourseDiscussionsBadge({ courseName }: { courseName: string }) {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.search.global(courseName, 'posts')
        setCount(res.total_results || (res.results.posts?.length ?? 0))
      } catch {
        setCount(null)
      }
    })()
  }, [courseName])
  return (
    <Link to={'/societies'} className="text-blue-400 hover:text-blue-300">
      See Discussions{count!=null ? ` (${count})` : ''}
    </Link>
  )
}
