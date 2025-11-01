import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { Badge } from '../../../components/common/Badge'
import api, { type CourseUniversity, type University } from '../../../services/api'

export default function UniversityPrograms() {
  const { id } = useParams<{ id: string }>()
  const [university, setUniversity] = useState<University | null>(null)
  const [programs, setPrograms] = useState<CourseUniversity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('course__name')
  const [totalPrograms, setTotalPrograms] = useState(0)

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

        const data = await api.courses.getUniversityPrograms(id, params)
        setUniversity(data.university)
        setPrograms(data.programs)
        setTotalPrograms(data.total_programs)
      } catch (err: any) {
        setError(err?.message || 'Failed to load university programs')
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [id, searchQuery, selectedCategory, sortBy])

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
        {/* University Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{university.logo}</div>
                <div>
                  <h1 className="text-2xl font-bold text-black">{university.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <span>{university.location}</span>
                    <Badge variant={university.type === 'Public' ? 'default' : 'secondary'}>
                      {university.type}
                    </Badge>
                    <span>Rank #{university.ranking}</span>
                  </div>
                  <div className="text-sm text-gray-700 mt-2 max-w-2xl">
                    {university.description}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link to="/directory">
                  <Button variant="outline" size="sm">← Back to Directory</Button>
                </Link>
                <a href={university.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="default" size="sm">Visit Website</Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Category Filter */}
              <div className="lg:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="lg:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Programs Count */}
        <div className="flex items-center justify-between">
          <div className="text-black">
            Showing {programs.length} of {totalPrograms} programs
          </div>
          {(searchQuery || selectedCategory) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Programs List */}
        <div className="space-y-4">
          {programs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-600">
                  {searchQuery || selectedCategory 
                    ? 'No programs found matching your criteria.'
                    : 'No programs available for this university.'
                  }
                </div>
              </CardContent>
            </Card>
          ) : (
            programs.map((program) => (
              <Card key={program.id} className="hover:bg-teal-50 hover:border-teal-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {typeof program.course === 'string' ? program.course : program.course.name}
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-gray-600">Category</div>
                          <div className="text-black">
                            {typeof program.course === 'object' ? program.course.category : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Duration</div>
                          <div className="text-black">
                            {typeof program.course === 'object' ? program.course.duration : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Fees (KSh)</div>
                          <div className="text-black font-medium">
                            {program.fees_ksh?.toLocaleString() || '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Cutoff Points</div>
                          <div className="text-black font-medium">
                            {program.cutoff_points || '—'}
                          </div>
                        </div>
                      </div>

                      {typeof program.course === 'object' && program.course.description && (
                        <div className="mb-4">
                          <div className="text-gray-600 text-sm mb-1">Description</div>
                          <div className="text-gray-700 text-sm">
                            {program.course.description.length > 200 
                              ? `${program.course.description.substring(0, 200)}...`
                              : program.course.description
                            }
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/courses/${typeof program.course === 'object' ? program.course.id : program.course}`}
                            className="text-teal-400 hover:text-teal-300 text-sm font-medium"
                          >
                            View Course Details
                          </Link>
                          {program.course_url && (
                            <a 
                              href={program.course_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300 text-sm font-medium"
                            >
                              Apply Now →
                            </a>
                          )}
                        </div>
                        <ProgramDiscussionsBadge 
                          programName={typeof program.course === 'object' ? program.course.name : program.course} 
                        />
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Badge variant="secondary">
                        {typeof program.course === 'object' ? program.course.category : 'Course'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* University Stats */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-black">University Information</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Established</div>
                <div className="text-black font-medium">{university.established}</div>
              </div>
              <div>
                <div className="text-gray-600">Students</div>
                <div className="text-black font-medium">{university.students}</div>
              </div>
              <div>
                <div className="text-gray-600">Type</div>
                <div className="text-black font-medium">{university.type}</div>
              </div>
              <div>
                <div className="text-gray-600">Ranking</div>
                <div className="text-black font-medium">#{university.ranking}</div>
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
  const searchUrl = `/societies?search=${encodeURIComponent(programName)}`
  
  return (
    <Link to={searchUrl} className="text-teal-400 hover:text-teal-300 text-sm">
      See Discussions{count!=null ? ` (${count})` : ''}
    </Link>
  )
}
