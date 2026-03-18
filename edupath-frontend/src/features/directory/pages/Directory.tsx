import { useEffect, useMemo, useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent } from '../../../components/common/Card'
import AdsCarousel from '../../../components/common/AdsCarousel'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toggleBookmark, isBookmarked } from '../../../lib/bookmarks'
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
    const cid = typeof l.course === 'object' ? (l.course as any).id : l.course
    if (cid) {
      (acc[cid] ||= []).push(l)
    }
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
      if (universityId) {
        if (!cuArr.some(l => {
          const uid = typeof l.university === 'object' ? (l.university as any).id : l.university
          return String(uid) === String(universityId)
        })) return false
      }
      // city filter via university location
      if (city) {
        const uniMatches = cuArr.some(l => {
          const uniObj = typeof l.university === 'object' ? (l.university as any) : universities.find(u => String(u.id) === String(l.university))
          return uniObj?.location === city
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
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm dark:bg-slate-900/50 dark:border-slate-700">
          <div className="p-3 grid grid-cols-[1fr_auto_auto] gap-2">
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Search courses or universities..."
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder-slate-400"
            />
            <button
              onClick={()=>setDrawerOpen(true)}
              className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
            >
              Filters
            </button>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button onClick={()=>setView('courses')} className={`px-3 py-2 ${view==='courses'?'bg-teal-600 text-white':'bg-white dark:bg-slate-900/40 text-gray-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>Courses</button>
              <button onClick={()=>setView('universities')} className={`px-3 py-2 ${view==='universities'?'bg-teal-600 text-white':'bg-white dark:bg-slate-900/40 text-gray-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>Universities</button>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid gap-4 lg:grid-cols-1">
          <div className="space-y-4">
            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
            {loading && <div className="text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">Loading...</div>}

            {/* Courses view */}
            {view==='courses' && !loading && (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredCourses.map(c => (
                  <Card 
                    key={c.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onClick={() => navigate(`/courses/${c.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-teal-500 dark:group-hover:text-teal-300 transition-colors text-lg flex-1">
                            {c.name}
                          </h3>
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveCourse(c); }} 
                            className={`flex-shrink-0 p-2 rounded-full border transition-colors ${
                              isBookmarked(`course:${c.id}`, 'course') 
                                ? 'bg-teal-100 border-teal-600 text-teal-700' 
                                : 'border-gray-300 hover:bg-teal-50 hover:text-teal-500 text-gray-400'
                            }`}
                            title={isBookmarked(`course:${c.id}`, 'course') ? "Saved" : "Save Course"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isBookmarked(`course:${c.id}`, 'course') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                          </button>
                        </div>
                        
                        <div className="flex justify-start">
                          <span className="text-sm font-medium text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            View Details
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                        </div>
                      </div>

                      {/* University icons at bottom of card */}
                      {byCourseId[c.id]?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex -space-x-2 overflow-hidden">
                            {byCourseId[c.id].slice(0, 3).map((cu) => (
                              <div 
                                key={cu.id}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-teal-50 flex items-center justify-center text-[8px] font-bold text-teal-700"
                                title={(cu.university as any).name}
                              >
                                {(cu.university as any).short_name?.substring(0, 2).toUpperCase() || '??'}
                              </div>
                            ))}
                            {byCourseId[c.id].length > 3 && (
                              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">
                                +{byCourseId[c.id].length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {byCourseId[c.id].length} universities
                          </span>
                        </div>
                      )}
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
                    className="group cursor-pointer bg-white rounded-2xl border border-gray-200 hover:border-teal-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden dark:bg-slate-900/40 dark:border-slate-700 dark:hover:border-teal-400/50"
                  >
                    {/* Top Half - University Icon */}
                    <div className="h-40 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-100/30 to-cyan-100/30 group-hover:from-teal-100/50 group-hover:to-cyan-100/50 transition-colors" />
                      <img 
                        src={getUniversityIcon(u.name)} 
                        alt={u.name}
                        className="w-20 h-20 rounded-full object-cover shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-white dark:border-slate-900/40"
                      />
                      {/* Ranking Badge */}
                      {(u as any).ranking && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                          #{(u as any).ranking}
                        </div>
                      )}
                    </div>

                    {/* Bottom Half - Teal Information Display */}
                    <div className="h-40 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-500 dark:to-cyan-600 p-6 text-white relative overflow-hidden">
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
            <div className="absolute right-0 top-0 h-full w-[80%] max-w-sm bg-white border-l border-gray-200 p-4 space-y-3 dark:bg-slate-900/70 dark:border-slate-700">
              <div className="font-semibold text-gray-900 dark:text-slate-100">Filters</div>
              <div>
                <div className="text-gray-600 mb-1 dark:text-slate-300">City</div>
                <select value={city} onChange={e=>setCity(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900/40 dark:text-slate-100 dark:border-slate-700">
                  <option value="">All</option>
                  {cities.map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <div className="text-gray-600 mb-1 dark:text-slate-300">University</div>
                <select value={universityId} onChange={e=>setUniversityId(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900/40 dark:text-slate-100 dark:border-slate-700">
                  <option value="">Any</option>
                  {universities.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                </select>
              </div>
              <div>
                <div className="text-gray-600 mb-1 dark:text-slate-300">Tuition (KSh)</div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={tuitionMin} onChange={e=>setTuitionMin(Number(e.target.value||0))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-700" placeholder="Min" />
                  <input type="number" value={tuitionMax} onChange={e=>setTuitionMax(Number(e.target.value||0))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-700" placeholder="Max" />
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
    <Link to={'/hubs'} className="text-teal-400 hover:text-teal-300">
      See Discussions{count!=null ? ` (${count})` : ''}
    </Link>
  )
}
