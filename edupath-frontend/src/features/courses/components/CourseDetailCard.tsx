import React from 'react'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ExternalLink, 
  Users,
  Award,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { Course, CourseUniversity } from '../../../services/api'

interface CourseDetailCardProps {
  course: Course
  onClose?: () => void
}

export const CourseDetailCard: React.FC<CourseDetailCardProps> = ({ 
  course, 
  onClose 
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    universities: true,
    requirements: false,
    careerPaths: false,
    modules: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{course.name}</h1>
                <div className="flex items-center gap-4 text-blue-100">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {course.category}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {course.cluster_points} cluster points
                  </span>
                </div>
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
              About This Program
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Universities Offering This Course */}
          {course.universities && course.universities.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('universities')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Universities Offering This Course ({course.universities.length})
                </h3>
                {expandedSections.universities ? 
                  <ChevronUp className="w-5 h-5" /> : 
                  <ChevronDown className="w-5 h-5" />
                }
              </button>
              
              {expandedSections.universities && (
                <div className="space-y-4">
                  {course.universities.map((courseUni: CourseUniversity) => (
                    <Card key={courseUni.id} className="border border-slate-200 dark:border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                              {courseUni.university.short_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {courseUni.university.name}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <MapPin className="w-4 h-4" />
                                {courseUni.university.location}
                                <Badge variant="outline" className="text-xs">
                                  {courseUni.university.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-500 dark:text-slate-400">Ranking</div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              #{courseUni.university.ranking}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">Annual Fees</div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {formatCurrency(courseUni.fees_ksh)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Target className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">Cutoff Points (2023)</div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {courseUni.cutoff_points}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">Application Deadline</div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {formatDate(courseUni.application_deadline)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Additional Information Row */}
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          {(courseUni as any).cutoff_2022 && (
                            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <Target className="w-5 h-5 text-orange-600" />
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Cutoff Points (2022)</div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {(courseUni as any).cutoff_2022}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {(courseUni as any).program_code && (
                            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <BookOpen className="w-5 h-5 text-cyan-600" />
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Program Code</div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {(courseUni as any).program_code}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {(courseUni as any).cluster_subjects && (courseUni as any).cluster_subjects.length > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <Award className="w-5 h-5 text-indigo-600" />
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Cluster Subjects</div>
                                <div className="font-semibold text-slate-900 dark:text-white text-xs">
                                  {(courseUni as any).cluster_subjects.slice(0, 2).join(', ')}
                                  {(courseUni as any).cluster_subjects.length > 2 && '...'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {courseUni.course_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              More information available
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(courseUni.course_url, '_blank')}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Entry Requirements */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('requirements')}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5" />
                Entry Requirements
              </h3>
              {expandedSections.requirements ? 
                <ChevronUp className="w-5 h-5" /> : 
                <ChevronDown className="w-5 h-5" />
              }
            </button>
            
            {expandedSections.requirements && (
              <Card className="border border-slate-200 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">
                        Cluster Requirements
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                          <span className="text-slate-600 dark:text-slate-300">Required Points</span>
                          <Badge variant="secondary">{course.cluster_points}</Badge>
                        </div>
                        {course.cluster_subjects && course.cluster_subjects.length > 0 && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                              Cluster Subjects:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {course.cluster_subjects.map((subject, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">
                        Subject Requirements
                      </h4>
                      <div className="space-y-2">
                        {course.mandatory_subjects && course.mandatory_subjects.length > 0 && (
                          <div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                              Mandatory Subjects:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {course.mandatory_subjects.map((subject, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {course.alternative_subjects && course.alternative_subjects.length > 0 && (
                          <div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                              Alternative Subjects:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {course.alternative_subjects.map((subject, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Career Paths */}
          {course.career_paths && course.career_paths.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('careerPaths')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Career Opportunities ({course.career_paths.length})
                </h3>
                {expandedSections.careerPaths ? 
                  <ChevronUp className="w-5 h-5" /> : 
                  <ChevronDown className="w-5 h-5" />
                }
              </button>
              
              {expandedSections.careerPaths && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {course.career_paths.map((career, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="font-medium text-slate-900 dark:text-white">
                        {career}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Course Modules */}
          {course.modules && course.modules.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('modules')}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Modules ({course.modules.length})
                </h3>
                {expandedSections.modules ? 
                  <ChevronUp className="w-5 h-5" /> : 
                  <ChevronDown className="w-5 h-5" />
                }
              </button>
              
              {expandedSections.modules && (
                <div className="grid md:grid-cols-2 gap-3">
                  {course.modules.map((module, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-slate-900 dark:text-white">{module}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Course ID: {course.id}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                Compare Courses
              </Button>
              <Button variant="primary" size="sm">
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
