import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { Badge } from '../../../components/common/Badge'
import { SlidersHorizontal, X } from 'lucide-react'
import api, { type University } from '../../../services/api'

type FlatCourse = {
  id: string
  name: string
  category: string
  description?: string
  duration?: string
  avg_fees_ksh?: number
  cutoff_2023?: number
  institution?: string
  programme_code?: string
  related_hub?: string
}

export default function UniversityPrograms() {
  const { id } = useParams<{ id: string }>()
  const [university, setUniversity] = useState<University | null>(null)
  const [programs, setPrograms] = useState<FlatCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('course__name')
  const [totalPrograms, setTotalPrograms] = useState(0)
  const [feesMin, setFeesMin] = useState('')
  const [feesMax, setFeesMax] = useState('')
  const [cutoffMin, setCutoffMin] = useState('')
  const [cutoffMax, setCutoffMax] = useState('')
  const [durationFilter, setDurationFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    'Technology', 'Medicine', 'Engineering', 'Law', 
    'Business', 'Education', 'Healthcare'
  ]

  const sortOptions = [
    { value: 'course__name', label: 'Name (A-Z)' },
    { value: '-course__name', label: 'Name (Z-A)' },
    { value: 'fees_ksh', label: 'Fees (Low-High)' },
    { value: '-fees_ksh', label: 'Fees (High-Low)' },
    { value: 'cutoff_points', label: 'Cutoff (Low-High)' },
    { value: '-cutoff_points', label: 'Cutoff (High-Low)' },
  ]

  useEffect(() => {
    if (!id) return

    const fetchPrograms = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params: any = {}
        if (searchQuery) params.search = searchQuery
        if (selectedCategory) params.category = selectedCategory
        if (sortBy) params.ordering = sortBy

        const universityId = id?.replace(/^university:/, '') || id
        if (!universityId) return

        const data = await api.courses.getUniversityPrograms(universityId, params)
        setUniversity(data.university)
        setPrograms(data.programs as unknown as FlatCourse[])
        setTotalPrograms(data.total_programs)
      } catch (err: any) {
        setError(err?.message || 'Failed to load university programs')
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [id, searchQuery, selectedCategory, sortBy])

  const durations = useMemo(() => {
    const s = new Set(programs.map(p => p.duration).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [programs])

  const displayedPrograms = useMemo(() => {
    return programs.filter(p => {
      if (feesMin && (p.avg_fees_ksh ?? 0) < Number(feesMin)) return false
      if (feesMax && (p.avg_fees_ksh ?? Infinity) > Number(feesMax)) return false
      if (cutoffMin && (p.cutoff_2023 ?? 0) < Number(cutoffMin)) return false
      if (cutoffMax && (p.cutoff_2023 ?? Infinity) > Number(cutoffMax)) return false
      if (durationFilter && p.duration !== durationFilter) return false
      return true
    })
  }, [programs, feesMin, feesMax, cutoffMin, cutoffMax, durationFilter])

  const activeFilterCount = [feesMin, feesMax, cutoffMin, cutoffMax, durationFilter, selectedCategory].filter(Boolean).length

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setFeesMin('')
    setFeesMax('')
    setCutoffMin('')
    setCutoffMax('')
    setDurationFilter('')
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">Loading university programs...</div>
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">{error}</div>
          <Link to="/directory" className="text-teal-400 hover:text-teal-300">
            ← Back to Directory
          </Link>
        </div>
      </PageContainer>
    )
  }

  if (!university) {
    return (
      <PageContainer>
        <div className="text-center py-8">
          <div className="text-gray-600 mb-4">University not found</div>
          <Link to="/directory" className="text-teal-400 hover:text-teal-300">
            ← Back to Directory
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* University Header with Logo Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50/20 dark:from-teal-950/20 dark:via-slate-900/40 dark:to-slate-950/80 border border-teal-100/50 dark:border-slate-800/80 shadow-sm">
          {/* Large Background Logo */}
          <div className="absolute -right-20 -top-20 text-[300px] opacity-10 select-none">
            {university.logo}
          </div>
          <div className="absolute -left-10 -bottom-10 text-[200px] opacity-5 select-none rotate-12">
            {university.logo}
          </div>
          
          {/* Content */}
          <Card className="relative bg-transparent border-0">
            <CardContent className="p-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4 flex-wrap sm:flex-nowrap">
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-5xl border border-slate-200 dark:border-slate-700 shadow-md">
                    {university.logo}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{university.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300 mt-2 flex-wrap gap-y-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        {university.location}
                      </span>
                      <Badge variant={university.type === 'Public' ? 'default' : 'secondary'} className="bg-teal-50 text-teal-800 border border-teal-200/50 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/40 font-semibold">
                        {university.type}
                      </Badge>
                      <span className="text-teal-600 dark:text-teal-400 font-semibold">Rank #{university.ranking}</span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-350 mt-3 max-w-2xl leading-relaxed">
                      {university.description}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link to="/directory">
                    <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/80 shadow-sm">
                      ← Back to Directory
                    </Button>
                  </Link>
                  <a href={university.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm">
                      Visit Website
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Row 1: search + category + sort + toggle */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="lg:w-44">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="lg:w-44">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  showFilters
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                More Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/30 dark:bg-teal-500 text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Row 2: advanced filters panel */}
            {showFilters && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Min Fees (KSh)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={feesMin}
                    onChange={e => setFeesMin(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Max Fees (KSh)</label>
                  <input
                    type="number"
                    placeholder="e.g. 300000"
                    value={feesMax}
                    onChange={e => setFeesMax(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Min Cutoff Pts</label>
                  <input
                    type="number"
                    placeholder="e.g. 30"
                    value={cutoffMin}
                    onChange={e => setCutoffMin(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Max Cutoff Pts</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={cutoffMax}
                    onChange={e => setCutoffMax(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Duration</label>
                  <select
                    value={durationFilter}
                    onChange={e => setDurationFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Any Duration</option>
                    {durations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 items-center pt-1">
                <span className="text-xs text-slate-500">Active:</span>
                {selectedCategory && <Chip label={`Category: ${selectedCategory}`} onRemove={() => setSelectedCategory('')} />}
                {feesMin && <Chip label={`Fees ≥ ${Number(feesMin).toLocaleString()}`} onRemove={() => setFeesMin('')} />}
                {feesMax && <Chip label={`Fees ≤ ${Number(feesMax).toLocaleString()}`} onRemove={() => setFeesMax('')} />}
                {cutoffMin && <Chip label={`Cutoff ≥ ${cutoffMin}`} onRemove={() => setCutoffMin('')} />}
                {cutoffMax && <Chip label={`Cutoff ≤ ${cutoffMax}`} onRemove={() => setCutoffMax('')} />}
                {durationFilter && <Chip label={`Duration: ${durationFilter}`} onRemove={() => setDurationFilter('')} />}
                <button onClick={clearAllFilters} className="text-xs text-red-400 hover:text-red-300 ml-1">Clear all</button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Programs Count */}
        <div className="flex items-center justify-between">
          <div className="text-slate-700 dark:text-slate-300 font-bold text-sm">
            Showing {displayedPrograms.length}{displayedPrograms.length !== totalPrograms ? ` of ${totalPrograms}` : ''} programs
          </div>
        </div>

        {/* Programs List */}
        <div className="space-y-4">
          {displayedPrograms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-600">
                  {searchQuery || selectedCategory || activeFilterCount > 0
                    ? 'No programs found matching your criteria.'
                    : 'No programs available for this university.'
                  }
                </div>
              </CardContent>
            </Card>
          ) : (
            displayedPrograms.map((program) => (
              <Card key={program.id} className="group relative border border-slate-200/80 dark:border-slate-800/80 hover:border-teal-500/50 hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900/40 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2.5">
                        {program.name}
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Category</div>
                          <div className="text-slate-800 dark:text-slate-200 font-semibold">{program.category || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Duration</div>
                          <div className="text-slate-800 dark:text-slate-200 font-semibold">{program.duration || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Fees (KSh)</div>
                          <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                            {program.avg_fees_ksh ? `Ksh ${program.avg_fees_ksh.toLocaleString()}` : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Cutoff Points</div>
                          <div className="text-cyan-700 dark:text-cyan-400 font-bold">
                            {program.cutoff_2023 || '—'}
                          </div>
                        </div>
                      </div>

                      {program.description && (
                        <div className="mb-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Description</div>
                          <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            {program.description.length > 200
                              ? `${program.description.substring(0, 200)}...`
                              : program.description}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/courses/${program.id}`}
                            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-semibold flex items-center gap-1.5"
                          >
                            View Course Details
                            <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </Link>
                        </div>
                        <ProgramDiscussionsBadge programName={program.name} />
                      </div>
                    </div>

                    <div className="ml-4">
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-semibold border-slate-200/50">{program.category || 'Course'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* University Stats */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">University Information</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 mb-1">Established</div>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-base">{university.established}</div>
              </div>
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 mb-1">Students</div>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-base">{university.students}</div>
              </div>
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 mb-1">Type</div>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-base">{university.type}</div>
              </div>
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 mb-1">Ranking</div>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-base">#{university.ranking}</div>
              </div>
            </div>
            
            {university.facilities && university.facilities.length > 0 && (
              <div className="mt-4">
                <div className="text-gray-600 mb-2">Facilities</div>
                <div className="flex flex-wrap gap-2">
                  {university.facilities.map((facility, index) => (
                    <Badge key={index} variant="secondary">{facility}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700/50 text-teal-700 dark:text-teal-300 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-teal-900 dark:hover:text-white transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

function ProgramDiscussionsBadge({ programName }: { programName: string }) {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.search.global(programName, 'posts')
        setCount(res.total_results || (res.results.posts?.length ?? 0))
      } catch {
        setCount(null)
      }
    })()
  }, [programName])
  
  // Create a search URL that will filter posts by the program name
  const searchUrl = `/hubs?search=${encodeURIComponent(programName)}`
  
  return (
    <Link to={searchUrl} className="text-teal-400 hover:text-teal-300 text-sm">
      See Discussions{count!=null ? ` (${count})` : ''}
    </Link>
  )
}
