import { useEffect, useMemo, useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import AdsCarousel from '../../../components/common/AdsCarousel'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toggleBookmark, isBookmarked } from '../../../lib/bookmarks'
import { CourseDetailCard } from '../../courses/components/CourseDetailCard'
import api, { type Course, type University, type CourseUniversity } from '../../../services/api'
import { getUniversityIcon } from '../../../utils/universityIcons'

export default function Directory() {
  const location = useLocation()
  const navigate = useNavigate()
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
          api.courses.listUniversities({ search: query, location: '', type: '' } as any),
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
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="p-3 grid grid-cols-[1fr_auto_auto] gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search courses or universities..." className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            <button onClick={()=>setDrawerOpen(true)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500">Filters</button>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button onClick={()=>setView('courses')} className={`px-3 py-2 ${view==='courses'?'bg-teal-600 text-white':'bg-white text-gray-700 hover:bg-teal-50'}`}>Courses</button>
              <button onClick={()=>setView('universities')} className={`px-3 py-2 ${view==='universities'?'bg-teal-600 text-white':'bg-white text-gray-700 hover:bg-teal-50'}`}>Universities</button>
            </div>
          </div>
        </div>

        {/* Layout: sidebar on desktop */}
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <Card>
              <CardHeader><div className="font-semibold text-gray-800">Filters</div></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">City</div>
                  <select value={city} onChange={e=>setCity(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                    <option value="">All</option>
                    {cities.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">University</div>
                  <select value={universityId} onChange={e=>setUniversityId(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                    <option value="">Any</option>
                    {universities.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                  </select>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Tuition (KSh)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={tuitionMin} onChange={e=>setTuitionMin(Number(e.target.value||0))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="Min" />
                    <input type="number" value={tuitionMax} onChange={e=>setTuitionMax(Number(e.target.value||0))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="Max" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
            {loading && <div className="text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">Loading...</div>}

            {/* Courses view */}
            {view==='courses' && !loading && (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredCourses.map(c => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Link to={`/courses/${c.id}`} className="font-semibold text-gray-900 hover:text-teal-500 transition-colors">{c.name}</Link>
                          <div className="mt-2 text-xs flex flex-wrap gap-1">
                            {(c.career_paths || []).slice(0,3).map((cp,i)=> (
                              <span key={i} className="px-2 py-1 rounded-full bg-teal-100 text-teal-700 text-xs">{cp}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs inline-flex items-center gap-1 text-gray-700">
                            <input type="checkbox" checked={!!compare[c.id]} onChange={()=>toggleCompare(c.id)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" /> Compare
                          </label>
                          <button onClick={()=>saveCourse(c)} className={`text-xs px-3 py-1 rounded-full border ${isBookmarked(`course:${c.id}`,'course') ? 'bg-teal-100 border-teal-600 text-teal-700' : 'border-gray-300 hover:bg-teal-50 hover:text-teal-500 text-gray-700'}`}>{isBookmarked(`course:${c.id}`,'course') ? '✓ Saved' : 'Save'}</button>
                          <button onClick={()=>setSelectedCourse(c)} className="text-xs px-3 py-1 rounded-full border border-teal-600 hover:bg-teal-50 hover:text-teal-500 text-teal-600 transition-colors">View Course</button>
                        </div>
                      </div>
                      {/* Quick info */}
                      <div className="mt-3 text-xs text-gray-600 grid grid-cols-3 gap-2">
                        <div>Duration: {c.duration}</div>
                        <div>Entry: {(c.mandatory_subjects || []).slice(0,2).join(', ') || '—'}</div>
                        <div>Fees: {minFeeFor(c.id)?.toLocaleString() ?? 'Varies'}</div>
                      </div>
                      <div className="mt-3 flex justify-between items-center pt-3 border-t border-gray-200">
                        <Link to={`/courses/${c.id}`} className="text-sm text-teal-600 hover:text-teal-500 font-medium">View More</Link>
                        <CourseDiscussionsBadge courseName={c.name} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredCourses.length===0 && <div className="text-gray-500">No matching courses found.</div>}
              </div>
            )}

            {/* Universities view */}
            {view==='universities' && !loading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUniversities.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => navigate(`/universities/${u.id}/programs`)}
                    className="group cursor-pointer bg-white rounded-2xl border border-gray-200 hover:border-teal-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Top Half - University Icon */}
                    <div className="h-40 bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-100/30 to-cyan-100/30 group-hover:from-teal-100/50 group-hover:to-cyan-100/50 transition-colors" />
                      <img 
                        src={getUniversityIcon(u.name)} 
                        alt={u.name}
                        className="w-20 h-20 rounded-full object-cover shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-white"
                      />
                      {/* Ranking Badge */}
                      {(u as any).ranking && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                          #{(u as any).ranking}
                        </div>
                      )}
                    </div>

                    {/* Bottom Half - Teal Information Display */}
                    <div className="h-40 bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 to-teal-700/20 group-hover:from-teal-600/30 group-hover:to-teal-700/30 transition-colors" />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold mb-1 group-hover:text-teal-100 transition-colors">
                            {u.name}
                          </h3>
                          <p className="text-teal-200 font-medium text-sm">{(u as any).short_name || u.name}</p>
                          <div className="mt-2 text-xs text-teal-200 bg-teal-600/30 px-2 py-1 rounded-full inline-block">
                            {(u as any).type || 'University'}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-teal-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{(u as any).location || u.location}</span>
                            </div>
                            {(u as any).students && (
                              <div className="font-bold text-white">
                                {(u as any).students}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-teal-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Est. {(u as any).established || 'N/A'}</span>
                            </div>
                            <div className="text-teal-200 text-sm font-medium group-hover:text-white transition-colors">
                              View Programs →
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredUniversities.length===0 && <div className="text-gray-500">No matching universities found.</div>}
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
            <div className="absolute right-0 top-0 h-full w-[80%] max-w-sm bg-white border-l border-gray-200 p-4 space-y-3">
              <div className="font-semibold text-gray-900">Filters</div>
              <div>
                <div className="text-gray-600 mb-1">City</div>
                <select value={city} onChange={e=>setCity(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="">All</option>
                  {cities.map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <div className="text-gray-600 mb-1">University</div>
                <select value={universityId} onChange={e=>setUniversityId(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="">Any</option>
                  {universities.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                </select>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Tuition (KSh)</div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={tuitionMin} onChange={e=>setTuitionMin(Number(e.target.value||0))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="Min" />
                  <input type="number" value={tuitionMax} onChange={e=>setTuitionMax(Number(e.target.value||0))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="Max" />
                </div>
              </div>
              <button onClick={()=>setDrawerOpen(false)} className="w-full px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white">Apply</button>
            </div>
          </div>
        )}

        {/* Floating compare bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 z-30">
            <div className="mx-auto max-w-5xl m-3 rounded-xl border border-gray-200 bg-white p-3 shadow-lg flex items-center justify-between">
              <div className="text-sm text-gray-700">Selected {selectedIds.length} course(s) for comparison</div>
              <Link to={'/courses/compare'} className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800">Compare</Link>
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
    <Link to={'/societies'} className="text-teal-400 hover:text-teal-300">
      See Discussions{count!=null ? ` (${count})` : ''}
    </Link>
  )
}
