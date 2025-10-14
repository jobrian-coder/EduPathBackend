import React, { useState, useEffect } from 'react'
import { BookOpen, X } from 'lucide-react'
import { coursesAPI } from '../../services/api'
import type { Course } from '../../services/api'

interface ProgramTagsProps {
  programIds: string[]
  maxDisplay?: number
  showRemove?: boolean
  onRemove?: (programId: string) => void
  className?: string
}

export default function ProgramTags({
  programIds,
  maxDisplay = 3,
  showRemove = false,
  onRemove,
  className = ""
}: ProgramTagsProps) {
  const [programs, setPrograms] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadPrograms = async () => {
      if (programIds.length === 0) {
        setPrograms([])
        return
      }

      setIsLoading(true)
      try {
        const programDetails = await Promise.all(
          programIds.slice(0, maxDisplay).map(async (programId) => {
            try {
              return await coursesAPI.getCourse(programId)
            } catch (error) {
              console.error(`Failed to load program ${programId}:`, error)
              return null
            }
          })
        )
        
        setPrograms(programDetails.filter(Boolean) as Course[])
      } catch (error) {
        console.error('Failed to load program details:', error)
        setPrograms([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPrograms()
  }, [programIds, maxDisplay])

  if (isLoading) {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {Array.from({ length: Math.min(programIds.length, maxDisplay) }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded-md text-xs animate-pulse"
          >
            <BookOpen className="w-3 h-3" />
            <span className="w-20 h-3 bg-teal-200 rounded"></span>
          </div>
        ))}
      </div>
    )
  }

  if (programs.length === 0) {
    return null
  }

  const remainingCount = programIds.length - maxDisplay

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {programs.map((program) => (
        <div
          key={program.id}
          className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded-md text-xs border border-teal-200 hover:bg-teal-200 transition-colors"
        >
          <BookOpen className="w-3 h-3 flex-shrink-0" />
          <span className="font-medium truncate max-w-[120px]" title={program.name}>
            {program.name}
          </span>
          {showRemove && onRemove && (
            <button
              onClick={() => onRemove(program.id)}
              className="text-teal-600 hover:text-teal-800 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-800 rounded-md text-xs border border-cyan-200">
          <BookOpen className="w-3 h-3" />
          <span className="font-medium">
            +{remainingCount} more
          </span>
        </div>
      )}
    </div>
  )
}
