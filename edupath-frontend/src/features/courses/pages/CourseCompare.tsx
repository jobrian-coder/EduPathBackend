import { useEffect, useMemo, useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import api, { type Course, type CourseUniversity } from '../../../services/api'
import ProsConsGenerator from '../../chatbot/components/ProsConsGenerator'

export default function CourseCompare() {
  // Up to 3 selections
  const [queries, setQueries] = useState<string[]>(['', '', ''])
  const [options, setOptions] = useState<Course[][]>([[], [], []])
  const [courses, setCourses] = useState<(Course | null)[]>([null, null, null])
  const [courseLinks, setCourseLinks] = useState<(CourseUniversity[] | null)[]>([null, null, null])
  const [view, setView] = useState<'table' | 'visual'>('table')
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar')
  const [highlightMetric, setHighlightMetric] = useState<string | null>(null)

  // Debounced backend suggestions
  useEffect(() => {
    const timers: any[] = []
    queries.forEach((q, idx) => {
      if (!q) { setOptions(prev => { const n=[...prev]; n[idx]=[]; return n }) ; return }
      const t = setTimeout(async () => {
        try {
          const { results } = await api.courses.listCourses({ search: q })
          setOptions(prev => { const n=[...prev]; n[idx]=results.slice(0,8); return n })
        } catch {
          setOptions(prev => { const n=[...prev]; n[idx]=[]; return n })
        }
      }, 300)
      timers.push(t)
    })
    return () => timers.forEach(clearTimeout)
  }, [queries])

  // When a course is chosen, fetch course-university links
  useEffect(() => {
    courses.forEach(async (c, idx) => {
      if (!c) { setCourseLinks(prev=>{const n=[...prev]; n[idx]=null; return n}); return }
      try {
        const { results } = await api.courses.listCourseUniversities({ course: c.id })
        setCourseLinks(prev=>{ const n=[...prev]; n[idx]=results; return n })
      } catch {
        setCourseLinks(prev=>{const n=[...prev]; n[idx]=[]; return n})
      }
    })
  }, [courses])

  function onDragOver(e: React.DragEvent<HTMLInputElement>) { e.preventDefault() }

  // Helpers
  function parseYears(dur: string | undefined): number | null {
    if (!dur) return null
    const m = String(dur).match(/(\d+(?:\.\d+)?)/)
    return m ? parseFloat(m[1]) : null
  }
  function minFee(links: CourseUniversity[] | null): number | null {
    if (!links || links.length===0) return null
    return Math.min(...links.map(l=>Number(l.fees_ksh)))
  }

  const metrics = useMemo(() => {
    const items = courses.map((c, idx) => {
      if (!c) return null
      const durY = parseYears(c.duration) ?? null
      const cluster = typeof c.cluster_points === 'number' ? c.cluster_points : (c as any).cluster_points ?? null
      const fee = minFee(courseLinks[idx])
      const uniCount = courseLinks[idx]?.length ?? 0
      return { id: c.id, name: c.name, durY, cluster, fee, uniCount }
    }).filter(Boolean) as Array<{id:string,name:string,durY:number|null,cluster:number|null,fee:number|null,uniCount:number}>

    // Normalize to 0-100 (higher is better) with lower-is-better inverted for cost, duration, cluster
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

    const durN = norm(items.map(i=>i.durY), true)
    const costN = norm(items.map(i=>i.fee), true)
    const clusterN = norm(items.map(i=>i.cluster), true)
    const availN = norm(items.map(i=>i.uniCount), false)

    const rows = items.map((i, idx) => ({
      id: i.id,
      name: i.name,
      raw: { duration: i.durY, cost: i.fee, cluster: i.cluster, availability: i.uniCount },
      norm: { duration: durN[idx], cost: costN[idx], cluster: clusterN[idx], availability: availN[idx] },
    }))

    // Best Value heuristic ~ availability / cost * duration_eff
    const scored = rows.map(r => ({
      id: r.id,
      name: r.name,
      score: (r.norm.availability + (100 - r.norm.cost) + (100 - r.norm.duration)) / 3,
    }))
    const bestId = scored.sort((a,b)=>b.score-a.score)[0]?.id || null

    return { rows, bestId }
  }, [courses, courseLinks])

  // Constants for consistent scaling
  const METRIC_MAX = 100; // Maximum value for all metrics (0-100 scale)

  // Prepare data for visualization
  const visualData = useMemo(() => {
    const metricsData = [
      { 
        key: 'duration', 
        label: 'Duration', 
        accessor: (r: any) => 100 - r.norm.duration, 
        color: '#14b8a6' 
      },
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

    // For Bar Chart - use index for data keys to avoid using row.id which might change
    const bar = metricsData.map(metric => {
      const data: { [key: string]: any } = { metric: metric.label }
      metrics.rows.forEach((r, idx) => {
        data[`c${idx + 1}`] = Math.min(METRIC_MAX, Math.round(metric.accessor(r)))
      })
      return data
    })

    // For Radar Chart - all courses in one chart
    const radar = metrics.rows.map((r) => ({
      name: r.name,
      ...metricsData.reduce((acc, m) => ({
        ...acc,
        [m.label]: Math.min(METRIC_MAX, Math.round(m.accessor(r)))
      }), {})
    }))

    return { bar, radar, metrics: metricsData, METRIC_MAX }
  }, [metrics])

  // Get pros/cons for a course
  const getProsCons = useMemo(() => (course: any) => {
    if (!course) return { pros: [], cons: [] }
    const prosCons = (course as any).pros_cons || []
    return {
      pros: prosCons.find((pc: any) => pc.type === 'pros')?.items || [],
      cons: prosCons.find((pc: any) => pc.type === 'cons')?.items || []
    }
  }, [])

  function setQueryAt(i: number, v: string) {
    setQueries(prev => { const n=[...prev]; n[i]=v; return n })
  }
  function pickCourse(i: number, c: Course) {
    setCourses(prev => { const n=[...prev]; n[i]=c; return n })
    setQueryAt(i, c.name)
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
      {/* Selection row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {[0,1,2].map(i => (
          <Card key={i} className={`border-l-4 ${i===0?'border-l-teal-400':i===1?'border-l-teal-500':'border-l-teal-600'} bg-white border-gray-200 shadow-sm`}>
            <CardHeader className="bg-gray-50">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${i===0?'bg-teal-100 text-teal-600':i===1?'bg-teal-200 text-teal-700':'bg-teal-300 text-purple-800'} flex items-center justify-center font-bold`}>{i+1}</div>
                <div className="font-semibold text-gray-800">Select Course {i+1}</div>
              </div>
            </CardHeader>
            <CardContent className="bg-white">
              <input
                value={queries[i]}
                onChange={e=>setQueryAt(i, e.target.value)}
                onDragOver={onDragOver}
                placeholder="Search or drop a course here..."
                className="w-full border-2 border-gray-300 focus:border-teal-500 bg-white text-gray-900 p-3 rounded-lg transition"
              />
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {queries[i] && options[i].map(c => (
                  <button key={c.id} className="block w-full text-left px-3 py-2 hover:bg-teal-50 rounded-lg transition text-gray-700 hover:text-teal-500" onClick={()=>pickCourse(i, c)}>{c.name}</button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mode toggles */}
      <div className="mt-4 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={()=>setView('table')} className={`px-3 py-1.5 rounded-lg border ${view==='table'?'bg-teal-600 text-white border-teal-600':'border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500'}`}>Table View</button>
          <button onClick={()=>setView('visual')} className={`px-3 py-1.5 rounded-lg border ${view==='visual'?'bg-teal-600 text-white border-teal-600':'border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500'}`}>Visual View</button>
          {view==='visual' && (
            <div className="ml-2">
              <button onClick={()=>setChartType('bar')} className={`px-3 py-1.5 rounded-l-lg border ${chartType==='bar'?'bg-teal-700 text-white border-teal-700':'border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500'}`}>Bar</button>
              <button onClick={()=>setChartType('radar')} className={`px-3 py-1.5 rounded-r-lg border ${chartType==='radar'?'bg-teal-700 text-white border-teal-700':'border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500'}`}>Radar</button>
            </div>
          )}
        </div>
        <button onClick={saveComparison} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-teal-50 text-gray-700 hover:text-teal-500">Save Comparison</button>
      </div>

      {/* Comparison content */}
      {metrics.rows.length >= 2 ? (
        <div className="mt-6 space-y-6">
          {view==='table' ? (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50">
                <div className="font-semibold text-lg text-gray-800">📋 Side-by-Side</div>
              </CardHeader>
              <CardContent className="bg-white">
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
                      {[{key:'cost',label:'Cost (min fee, KSh)',invert:true}, {key:'duration',label:'Duration (years)',invert:true}, {key:'cluster',label:'Entry Points (lower easier)',invert:true}, {key:'availability',label:'Universities offering',invert:false}].map(row => (
                        <tr key={row.key} className={`border-b border-gray-100 ${highlightMetric===row.key? 'bg-teal-50' : 'hover:bg-gray-50'}`} onMouseEnter={()=>setHighlightMetric(row.key)} onMouseLeave={()=>setHighlightMetric(null)}>
                          <td className="p-2 font-medium text-gray-700">{row.label}</td>
                          {metrics.rows.map(r => (
                            <td key={r.id} className="p-2 align-middle">
                              <div className="flex items-center gap-2">
                                <div className="w-28 h-2 rounded bg-gray-200 overflow-hidden">
                                  <div className={`h-full ${row.invert?'bg-teal-500':'bg-teal-400'}`} style={{ width: `${Math.round(row.key==='cost'? (100 - r.norm.cost) : row.key==='duration'? (100 - r.norm.duration) : row.key==='cluster'? (100 - r.norm.cluster) : r.norm.availability)}%` }} />
                                </div>
                                <div className="text-xs text-gray-600">
                                  {row.key==='cost' ? (r.raw.cost?.toLocaleString() ?? '—') : row.key==='duration' ? (r.raw.duration ?? '—') : row.key==='cluster' ? (r.raw.cluster ?? '—') : r.raw.availability}
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50">
                <div className="font-semibold text-lg text-gray-800">📈 Visual Comparison</div>
              </CardHeader>
              <CardContent className="bg-white">
                {chartType==='bar' ? (
                  <div className="h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={visualData.bar} 
                        layout="vertical" 
                        margin={{ top: 8, right: 16, bottom: 16, left: 16 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                        <XAxis 
                          type="number" 
                          domain={[0, visualData.METRIC_MAX]} 
                          hide={false}
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          dataKey="metric" 
                          type="category" 
                          tick={{ fill: '#6b7280' }} 
                          width={140} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: '#ffffff', 
                            border: '1px solid #d1d5db', 
                            color: '#374151',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number) => [`${value} / ${visualData.METRIC_MAX}`, 'Score']}
                        />
                        {metrics.rows.map((r, i) => (
                          <Bar 
                            key={r.id} 
                            dataKey={`c${i+1}`} 
                            name={r.name} 
                            fill={i===0?'#14b8a6':i===1?'#0d9488':'#0f766e'} 
                            opacity={highlightMetric? 0.4:1}
                            maxBarSize={40}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart 
                        outerRadius={150} 
                        data={visualData.radar.length > 0 ? visualData.radar : []}
                      >
                        <PolarGrid stroke="#d1d5db" />
                        <PolarAngleAxis 
                          dataKey="metric" 
                          tick={{ fill: '#6b7280', fontSize: 11 }} 
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, visualData.METRIC_MAX]} 
                          tick={false} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: '#ffffff', 
                            border: '1px solid #d1d5db', 
                            color: '#374151',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number) => [`${value} / ${visualData.METRIC_MAX}`, 'Score']}
                        />
                        <Legend />
                        {metrics.rows.map((r, i) => (
                          <Radar 
                            key={r.id} 
                            name={r.name} 
                            dataKey={r.name}
                            stroke={i===0?'#14b8a6':i===1?'#0d9488':'#0f766e'}
                            fill={i===0?'#14b8a6':i===1?'#0d9488':'#0f766e'}
                            fillOpacity={0.2}
                            strokeWidth={2}
                            dot={{ 
                              fill: i===0?'#14b8a6':i===1?'#0d9488':'#0f766e', 
                              strokeWidth: 2 
                            }}
                            isAnimationActive={false}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Course Details with Pros/Cons */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {metrics.rows.map((r, i) => {
              const { pros, cons } = getProsCons(courses[i])
              return (
                <Card key={r.id} className={`border-t-4 bg-white border-gray-200 shadow-sm ${i===0?'border-t-teal-400':i===1?'border-t-teal-500':'border-t-teal-600'}`}>
                  <CardHeader className="bg-gray-50">
                    <div className="font-semibold text-lg text-gray-800">{r.name}</div>
                    {metrics.bestId === r.id && (
                      <div className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full inline-flex items-center">
                        🏆 Best Value
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 bg-white">
                    {pros.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">✅ Pros</div>
                        <ul className="space-y-1 text-sm">
                          {pros.map((p: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cons.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">⚠️ Cons</div>
                        <ul className="space-y-1 text-sm">
                          {cons.map((c: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <span className="text-red-600 mt-0.5">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pros.length === 0 && cons.length === 0 && (
                      <div className="text-sm text-gray-500 italic">No pros/cons data available for this course.</div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 p-8 text-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-gray-600 font-medium">Select at least two courses above to see comparison</div>
        </div>
      )}

      {/* AI Pros/Cons Generator */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-800">🤖 AI Career Analysis</h2>
            <p className="text-sm text-gray-600">
              Get AI-generated pros and cons for any career or course to help with your decision making
            </p>
          </CardHeader>
          <CardContent>
            <ProsConsGenerator 
              careerName={courses[0]?.name || ''}
              courseName={courses[0]?.name || ''}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
