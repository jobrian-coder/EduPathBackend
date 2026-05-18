import { useEffect, useMemo, useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent } from '../../../components/common/Card'
import AdsCarousel from '../../../components/common/AdsCarousel'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toggleBookmark, isBookmarked } from '../../../lib/bookmarks'
import api, { type CourseGrouped, type University } from '../../../services/api'
import { getUniversityIcon } from '../../../utils/universityIcons'

export default function Directory() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [view, setView] = useState<'courses' | 'universities'>('courses')
  const [query, setQuery] = useState('')
  const [categoryGroups, setCategoryGroups] = useState<CourseGrouped[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [city, setCity] = useState('')
  const [universityName, setUniversityName] = useState('')
  const [tuitionMin, setTuitionMin] = useState<number>(0)
  const [tuitionMax, setTuitionMax] = useState<number>(1000000)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [compare, setCompare] = useState<Record<string, boolean>>({})

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const [cRes, uRes] = await Promise.all([
          api.courses.listGrouped({ q: query }),
          api.courses.listUniversities({ search: query, location: '', type: '' } as any),
        ])
        setCategoryGroups(cRes)
        setUniversities(uRes.results)
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'Failed to load directory')
      } finally {
        setLoading(false)
      }
    })()
  }, [query])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const v = params.get('view')
    const uni = params.get('universityName')
    const search = params.get('search')
    if (v === 'courses' || v === 'universities') setView(v)
    if (uni) setUniversityName(uni)
    if (search) setQuery(search)
  }, [location.search])

  const cities = useMemo(() => Array.from(new Set(universities.map(u => u.location))).sort(), [universities])

  function minFeeFor(group: CourseGrouped): number | null {
    if (!group.avg_fees_ksh) return null
    return group.avg_fees_ksh
  }

  function toggleCompare(id: string) {
    setCompare(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function saveCourse(group: CourseGrouped) {
    toggleBookmark({ id: `course:${group.category}`, type: 'course', title: group.category })
    setCompare(prev => ({ ...prev }))
  }

  async function saveUniversity(u: University) {
    toggleBookmark({ id: `university:${u.id}`, type: 'university', title: u.name, meta: u.location })
    setCompare(prev => ({ ...prev }))
  }

  const filteredGroups = useMemo(() => {
    return categoryGroups.filter(g => {
      if (universityName) {
        if (!g.programmes.some(p => p.institution === universityName)) return false
      }
      if (city) {
        const uniMatches = g.programmes.some(p => {
          const u = universities.find(uni => uni.name === p.institution)
          return u?.location === city
        })
        if (!uniMatches) return false
      }
      const fee = minFeeFor(g)
      if (fee != null && (fee < tuitionMin || fee > tuitionMax)) return false
      return true
    })
  }, [categoryGroups, universityName, city, tuitionMin, tuitionMax, universities])

  const filteredUniversities = useMemo(() => {
    const nameMatch = (u: University) => (query ? u.name.toLowerCase().includes(query.toLowerCase()) : true)
    return universities.filter(u => (city ? u.location === city : true) && nameMatch(u))
  }, [universities, query, city])

  const selectedIds = useMemo(() => Object.keys(compare).filter(k => compare[k]), [compare])

  return (
    <PageContainer title="Information Directory">
      <div className="space-y-4">
        {/* Sticky search */}
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
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block h-[calc(100vh-12rem)] sticky top-36 overflow-y-auto custom-scrollbar">
            <div className="bg-white dark:bg-slate-900/40 rounded-2xl shadow-sm border border-teal-100 dark:border-slate-700 p-3 space-y-2">
              <div className="text-xs uppercase tracking-wide text-teal-600 font-semibold px-2 mb-3">
                Filter by University
              </div>
              
              <button
                onClick={() => setUniversityName('')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  universityName === '' 
                    ? 'bg-gradient-to-r from-teal-100 to-cyan-100 border border-teal-200 dark:border-teal-800 dark:bg-gradient-to-r dark:from-teal-950/40 dark:to-cyan-950/30 text-teal-900 dark:text-teal-100' 
                    : 'text-slate-700 hover:bg-teal-50 border border-transparent dark:hover:bg-slate-800/60 dark:text-slate-200'
                }`}
              >
                <div className="text-sm font-medium">All Universities</div>
              </button>

              {universities.map(u => (
                <button
                  key={u.id}
                  onClick={() => setUniversityName(u.name)}
                  title={u.name}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    universityName === u.name
                      ? 'bg-gradient-to-r from-teal-100 to-cyan-100 border border-teal-200 dark:border-teal-800 dark:bg-gradient-to-r dark:from-teal-950/40 dark:to-cyan-950/30 text-teal-900 dark:text-teal-100' 
                      : 'text-slate-700 hover:bg-teal-50 border border-transparent dark:hover:bg-slate-800/60 dark:text-slate-200'
                  }`}
                >
                  <img src={getUniversityIcon(u.name)} alt={u.name} className="w-8 h-8 rounded-full object-cover bg-white shadow-sm border border-gray-100 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-medium truncate">
                      {u.short_name || u.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
            {loading && <div className="text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">Loading...</div>}

            {/* Courses view */}
            {view==='courses' && !loading && (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredGroups.map(g => (
                  <Card 
                    key={g.category} 
                    className="hover:shadow-md transition-shadow cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onClick={() => navigate(`/courses/${encodeURIComponent(g.category)}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-teal-500 dark:group-hover:text-teal-300 transition-colors text-lg flex-1">
                            {g.category}
                          </h3>
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveCourse(g); }} 
                            className={`flex-shrink-0 p-2 rounded-full border transition-colors ${
                              isBookmarked(`course:${g.category}`, 'course') 
                                ? 'bg-teal-100 border-teal-600 text-teal-700' 
                                : 'border-gray-300 hover:bg-teal-50 hover:text-teal-500 text-gray-400'
                            }`}
                            title={isBookmarked(`course:${g.category}`, 'course') ? "Saved" : "Save Course"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isBookmarked(`course:${g.category}`, 'course') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-semibold px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full">{g.related_hub}</span>
                          {g.avg_fees_ksh && (
                             <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">Ksh {g.avg_fees_ksh.toLocaleString()}</span>
                          )}
                        </div>

                        {g.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {g.description}
                          </div>
                        )}
                        
                        <div className="flex justify-start pt-2">
                          <span className="text-sm font-medium text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            View Details
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                        </div>
                      </div>

                      {g.programmes.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex -space-x-2 overflow-hidden">
                            {Array.from(new Set(g.programmes.map(p => p.institution))).slice(0, 3).map((inst, idx) => (
                              <div 
                                key={idx}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-teal-50 flex items-center justify-center text-[8px] font-bold text-teal-700"
                                title={inst || 'Unknown'}
                              >
                                {(inst || '??').substring(0, 2).toUpperCase()}
                              </div>
                            ))}
                            {new Set(g.programmes.map(p => p.institution)).size > 3 && (
                              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">
                                +{new Set(g.programmes.map(p => p.institution)).size - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            Available at {new Set(g.programmes.map(p => p.institution)).size} institutions
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {filteredGroups.length===0 && <div className="text-gray-500">No matching courses found.</div>}
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
                      
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveUniversity(u); }} 
                        className={`absolute top-3 right-3 z-10 p-2 rounded-full border shadow-sm transition-all ${
                          isBookmarked(`university:${u.id}`, 'university') 
                            ? 'bg-teal-100 border-teal-600 text-teal-700' 
                            : 'bg-white/80 border-gray-200 hover:bg-teal-50 hover:text-teal-500 text-gray-400'
                        }`}
                        title={isBookmarked(`university:${u.id}`, 'university') ? "Saved" : "Save University"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked(`university:${u.id}`, 'university') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                      </button>

                      <img 
                        src={getUniversityIcon(u.name)} 
                        alt={u.name}
                        className="w-20 h-20 rounded-full object-cover shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-white dark:border-slate-900/40"
                      />
                    </div>

                    {/* Bottom Half */}
                    <div className="bg-white dark:bg-slate-900/40 p-5 flex flex-col h-full">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${u.type === 'Public' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {u.type}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            Rank #{u.ranking}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 transition-colors line-clamp-1">
                          {u.name}
                        </h3>
                        <p className="text-teal-600 dark:text-teal-400 font-medium text-xs mb-2">{u.short_name || u.name}</p>
                        
                        {u.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                            {u.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{u.location}</span>
                          </div>
                          {u.students && (
                            <div className="flex items-center gap-1.5">
                              <span>👥 {u.students}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end">
                          <span className="text-xs font-semibold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            View Programs
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredUniversities.length===0 && <div className="text-gray-500">No matching universities found.</div>}
              </div>
            )}

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
              <button onClick={()=>setDrawerOpen(false)} className="w-full px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white">Apply</button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
