import { useEffect, useMemo, useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import api, { type CourseGrouped } from '../../../services/api'
import { listBookmarks, type BookmarkItem } from '../../../lib/bookmarks'
import { Bookmark, Sparkles, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CourseCompare() {
  const navigate = useNavigate()
  
  // Up to 3 selections
  const [queries, setQueries] = useState<string[]>(['', '', ''])
  const [options, setOptions] = useState<CourseGrouped[][]>([[], [], []])
  const [courses, setCourses] = useState<(CourseGrouped | null)[]>([null, null, null])
  const [view, setView] = useState<'table' | 'visual'>('table')
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar')
  const [highlightMetric, setHighlightMetric] = useState<string | null>(null)
  const [savedCourses, setSavedCourses] = useState<BookmarkItem[]>([])

  // Load saved courses from bookmarks
  useEffect(() => {
    const bookmarks = listBookmarks()
    const courseBookmarks = bookmarks.filter(b => b.type === 'course')
    setSavedCourses(courseBookmarks)
  }, [])

  // Debounced backend suggestions
  useEffect(() => {
    const timers: any[] = []
    queries.forEach((q, idx) => {
      // only trigger auto-search if it doesn't match the current selection exactly
      if (!q || q === courses[idx]?.category) { 
        setOptions(prev => { const n=[...prev]; n[idx]=[]; return n })
        return 
      }
      const t = setTimeout(async () => {
        try {
          // Use grouped endpoint for discovering courses
          const results = await api.courses.listGrouped({ q })
          setOptions(prev => { const n=[...prev]; n[idx]=results.slice(0,8); return n })
        } catch {
          setOptions(prev => { const n=[...prev]; n[idx]=[]; return n })
        }
      }, 300)
      timers.push(t)
    })
    return () => timers.forEach(clearTimeout)
  }, [queries, courses])

  function onDragOver(e: React.DragEvent<HTMLInputElement>) { e.preventDefault() }

  const metrics = useMemo(() => {
    const items = courses.map((c) => {
      if (!c) return null
      
      let cluster: number | null = null
      let uniCount = c.programmes.length
      
      // Calculate average cutoff points from all programmes
      const cutoffs = c.programmes.map(p => p.cutoff_2023).filter((cf): cf is number => cf !== null)
      if (cutoffs.length > 0) {
        cluster = Number((cutoffs.reduce((acc, curr) => acc + curr, 0) / cutoffs.length).toFixed(1))
      }

      return { id: c.category, name: c.category, cluster, fee: c.avg_fees_ksh, uniCount }
    }).filter(Boolean) as Array<{id:string,name:string,cluster:number|null,fee:number|null,uniCount:number}>

    function norm(values: (number|null)[], invert=false) {
      const arr = values.filter((v): v is number => v!=null)
      const min = arr.length? Math.min(...arr):0
      const max = arr.length? Math.max(...arr):1
      return values.map(v => {
        if (v==null) return 0
        if (max===min) return 100
        const n = (v - min) / (max - min) * 100
        return invert ? 100 - n : n
      })
    }

    const costN = norm(items.map(i=>i.fee), true)
    const clusterN = norm(items.map(i=>i.cluster), true)
    const availN = norm(items.map(i=>i.uniCount), false)

    const rows = items.map((i, idx) => ({
      id: i.id,
      name: i.name,
      raw: { cost: i.fee, cluster: i.cluster, availability: i.uniCount },
      norm: { cost: costN[idx], cluster: clusterN[idx], availability: availN[idx] },
    }))

    const scored = rows.map(r => ({
      id: r.id,
      name: r.name,
      score: (r.norm.availability + (100 - r.norm.cost)) / 2,
    }))
    const bestId = scored.sort((a,b)=>b.score-a.score)[0]?.id || null

    return { rows, bestId }
  }, [courses])

  const METRIC_MAX = 100;

  const visualData = useMemo(() => {
    const metricsData = [
      { 
        key: 'entry', 
        label: 'Entry Flexibility', 
        accessor: (r: any) => 100 - r.norm.cluster, 
        color: '#0d9488' 
      },
      { 
        key: 'availability', 
        label: 'Availability', 
        accessor: (r: any) => r.norm.availability, 
        color: '#0f766e' 
      },
      { 
        key: 'cost', 
        label: 'Cost Efficiency', 
        accessor: (r: any) => 100 - r.norm.cost, 
        color: '#d8b4fe' 
      },
    ]

    const bar = metricsData.map(metric => {
      const data: { [key: string]: any } = { metric: metric.label }
      metrics.rows.forEach((r, idx) => {
        data[`c${idx + 1}`] = Math.min(METRIC_MAX, Math.round(metric.accessor(r)))
      })
      return data
    })

    const radar = metrics.rows.map((r) => ({
      name: r.name,
      ...metricsData.reduce((acc, m) => ({
        ...acc,
        [m.label]: Math.min(METRIC_MAX, Math.round(m.accessor(r)))
      }), {})
    }))

    return { bar, radar, metrics: metricsData, METRIC_MAX }
  }, [metrics])

  function setQueryAt(i: number, v: string) {
    setQueries(prev => { const n=[...prev]; n[i]=v; return n })
  }

  function pickCourse(i: number, c: CourseGrouped) {
    setCourses(prev => { const n=[...prev]; n[i]=c; return n })
    setQueryAt(i, c.category)
    setOptions(prev => { const n=[...prev]; n[i]=[]; return n })
  }

  function saveComparison() {
    const ids = metrics.rows.map(r=>r.id)
    const key = 'edupath.compare.history'
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    arr.unshift({ ids, ts: Date.now() })
    localStorage.setItem(key, JSON.stringify(arr.slice(0,20)))
    alert('Comparison saved. Find it later under your profile (Compare Again).')
  }

  return (
    <PageContainer title="Course Comparison">
      <div className="grid gap-4 lg:grid-cols-3">
        {[0,1,2].map(i => (
          <Card key={i} className={`border-l-4 ${i===0?'border-l-teal-400':i===1?'border-l-teal-500':'border-l-teal-600'} bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 shadow-sm overflow-visible`}>
            <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${i===0?'bg-teal-100 text-teal-600':i===1?'bg-teal-200 text-teal-700':'bg-teal-300 text-purple-800'} flex items-center justify-center font-bold`}>{i+1}</div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">Select Course {i+1}</div>
              </div>
            </CardHeader>
            <CardContent className="bg-white dark:bg-slate-900/40 relative">
              <input
                value={queries[i]}
                onChange={e=>setQueryAt(i, e.target.value)}
                onDragOver={onDragOver}
                placeholder="Search a course category..."
                className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 p-3 rounded-lg focus:border-teal-500 transition"
              />
              <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg">
                {queries[i] && options[i].map(c => (
                  <button key={c.category} className="block w-full text-left px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-0 transition text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400" onClick={()=>pickCourse(i, c)}>{c.category}</button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between bg-white dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <div className="flex items-center gap-2">
          <button onClick={()=>setView('table')} className={`px-3 py-1.5 rounded-lg border ${view==='table'?'bg-teal-600 text-white border-teal-600':'border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500'}`}>Table View</button>
          <button onClick={()=>setView('visual')} className={`px-3 py-1.5 rounded-lg border ${view==='visual'?'bg-teal-600 text-white border-teal-600':'border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500'}`}>Visual View</button>
          {view==='visual' && (
            <div className="ml-2 flex items-center">
              <button onClick={()=>setChartType('bar')} className={`px-3 py-1.5 rounded-l-lg border ${chartType==='bar'?'bg-teal-700 text-white border-teal-700':'border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500'}`}>Bar</button>
              <button onClick={()=>setChartType('radar')} className={`px-3 py-1.5 rounded-r-lg border-t border-b border-r ${chartType==='radar'?'bg-teal-700 text-white border-teal-700':'border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500'}`}>Radar</button>
            </div>
          )}
        </div>
        <button onClick={saveComparison} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500">Save Comparison</button>
      </div>

      {metrics.rows.length >= 2 ? (
        <div className="mt-6 space-y-6">
          {view==='table' ? (
            <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">📋 Side-by-Side</div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-slate-900/40">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-2 text-gray-700 font-semibold">Metric</th>
                        {metrics.rows.map(r => (
                          <th key={r.id} className="text-left p-2 text-gray-700 font-semibold">{r.name}{metrics.bestId===r.id && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">Best Value</span>}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[{key:'cost',label:'Avg Cost (KSh)',invert:true}, {key:'cluster',label:'Average Cutoff (lower easier)',invert:true}, {key:'availability',label:'Total Institutions',invert:false}].map(row => (
                        <tr key={row.key} className={`border-b border-gray-100 ${highlightMetric===row.key? 'bg-teal-50' : 'hover:bg-gray-50'}`} onMouseEnter={()=>setHighlightMetric(row.key)} onMouseLeave={()=>setHighlightMetric(null)}>
                          <td className="p-2 font-medium text-gray-700">{row.label}</td>
                          {metrics.rows.map(r => (
                            <td key={r.id} className="p-2 align-middle">
                              <div className="flex items-center gap-2">
                                <div className="w-28 h-2 rounded bg-gray-200 overflow-hidden">
                                  <div className={`h-full ${row.invert?'bg-teal-500':'bg-teal-400'}`} style={{ width: `${Math.round(row.key==='cost'? (100 - r.norm.cost) : row.key==='cluster'? (100 - r.norm.cluster) : r.norm.availability)}%` }} />
                                </div>
                                <div className="text-xs text-gray-600">
                                  {row.key==='cost' ? (r.raw.cost?.toLocaleString() ?? '—') : row.key==='cluster' ? (r.raw.cluster ?? '—') : r.raw.availability}
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">📈 Visual Comparison</div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-slate-900/40">
                {chartType==='bar' ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={visualData.bar} layout="vertical" margin={{ top: 8, right: 16, bottom: 16, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                        <XAxis type="number" domain={[0, visualData.METRIC_MAX]} hide={false} tick={{ fill: '#6b7280' }} />
                        <YAxis dataKey="metric" type="category" tick={{ fill: '#6b7280' }} width={140} />
                        <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(value: number) => [`${value} / ${visualData.METRIC_MAX}`, 'Score']} />
                        {metrics.rows.map((r, i) => (
                          <Bar key={r.id} dataKey={`c${i+1}`} name={r.name} fill={i===0?'#14b8a6':i===1?'#0d9488':'#0f766e'} opacity={highlightMetric? 0.4:1} maxBarSize={40} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={150} data={visualData.radar}>
                        <PolarGrid stroke="#d1d5db" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, visualData.METRIC_MAX]} tick={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(value: number) => [`${value} / ${visualData.METRIC_MAX}`, 'Score']} />
                        <Legend />
                        {metrics.rows.map((r, i) => (
                          <Radar key={r.id} name={r.name} dataKey={r.name} stroke={i===0?'#14b8a6':i===1?'#0d9488':'#0f766e'} fill={i===0?'#14b8a6':i===1?'#0d9488':'#0f766e'} fillOpacity={0.2} strokeWidth={2} dot={{ fill: i===0?'#14b8a6':i===1?'#0d9488':'#0f766e', strokeWidth: 2 }} isAnimationActive={false} />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {metrics.rows.map((r, i) => {
              const c = courses[i]
              const pros = c?.pros || []
              const cons = c?.cons || []
              return (
                <Card key={r.id} className={`border-t-4 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 shadow-sm ${i===0?'border-t-teal-400':i===1?'border-t-teal-500':'border-t-teal-600'}`}>
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">{r.name}</div>
                    {metrics.bestId === r.id && (
                      <div className="mt-1 text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full inline-flex items-center">
                        🏆 Best Value
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 bg-white dark:bg-slate-900/40 mt-4">
                    {pros.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">✅ Pros</div>
                        <ul className="space-y-1 text-sm">
                          {pros.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <span className="text-green-600 mt-0.5">•</span><span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cons.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">⚠️ Cons</div>
                        <ul className="space-y-1 text-sm">
                          {cons.map((c, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <span className="text-red-600 mt-0.5">•</span><span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pros.length === 0 && cons.length === 0 && (
                      <div className="text-sm text-gray-500 italic">No pros/cons data available.</div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 p-8 text-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-gray-600 font-medium">Select at least two courses above to see comparison</div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Saved Courses Section */}
        <Card className="dark:bg-slate-900/40 dark:border-slate-700">
          <CardHeader className="dark:bg-slate-800/60 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-teal-500" />
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Saved Courses</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your bookmarked courses for quick access
            </p>
          </CardHeader>
          <CardContent className="dark:bg-slate-900/40">
            {savedCourses.length > 0 ? (
              <div className="space-y-3">
                {savedCourses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {course.title}
                      </p>
                      {course.meta && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {course.meta}
                        </p>
                      )}
                      <p className="text-[10px] text-teal-600 font-semibold mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ChevronRight className="w-3 h-3" />
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                  </div>
                ))}
                {savedCourses.length > 5 && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full text-center text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 py-2"
                  >
                    View all {savedCourses.length} saved courses
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  No saved courses yet. Browse courses and click the bookmark icon to save them here.
                </p>
                <button
                  onClick={() => navigate('/directory')}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  Browse Courses
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations Section */}
        <Card className="dark:bg-slate-900/40 dark:border-slate-700">
          <CardHeader className="dark:bg-slate-800/60 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">AI Recommended</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Personalized course suggestions from our AI advisor
            </p>
          </CardHeader>
          <CardContent className="dark:bg-slate-900/40">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Get personalized course recommendations based on your interests, grades, and career goals.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/advisor')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-purple-600 text-white rounded-lg hover:from-teal-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Get AI Recommendations
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Takes only 2 minutes • Free • Personalized for you
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
