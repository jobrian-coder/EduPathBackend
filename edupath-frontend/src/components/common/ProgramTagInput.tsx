import React, { useState, useEffect, useRef } from 'react'
import { Search, X, BookOpen, Tag } from 'lucide-react'
import { coursesAPI } from '../../services/api'
import type { Course } from '../../services/api'

interface ProgramTagInputProps {
  selectedPrograms: string[]
  onProgramsChange: (programIds: string[]) => void
  placeholder?: string
  maxPrograms?: number
}

interface ProgramOption extends Course {
  displayName: string
}

export default function ProgramTagInput({
  selectedPrograms,
  onProgramsChange,
  placeholder = "Search for programs to tag...",
  maxPrograms = 5
}: ProgramTagInputProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProgramOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedProgramDetails, setSelectedProgramDetails] = useState<Course[]>([])
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load details for selected programs
  useEffect(() => {
    const loadSelectedProgramDetails = async () => {
      if (selectedPrograms.length === 0) {
        setSelectedProgramDetails([])
        return
      }

      try {
        const programDetails = await Promise.all(
          selectedPrograms.map(async (programId) => {
            try {
              return await coursesAPI.getCourse(programId)
            } catch (error) {
              console.error(`Failed to load program ${programId}:`, error)
              return null
            }
          })
        )
        
        setSelectedProgramDetails(programDetails.filter(Boolean) as Course[])
      } catch (error) {
        console.error('Failed to load selected program details:', error)
      }
    }

    loadSelectedProgramDetails()
  }, [selectedPrograms])

  // Search for programs
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { results } = await coursesAPI.listCourses({
          search: searchQuery.trim(),
          ordering: 'name'
        })
        
        // Filter out already selected programs and create display names
        const availablePrograms = results
          .filter(program => !selectedPrograms.includes(program.id))
          .map(program => ({
            ...program,
            displayName: program.name
          }))
        
        setSearchResults(availablePrograms.slice(0, 10)) // Limit to 10 results
      } catch (error) {
        console.error('Failed to search programs:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, selectedPrograms])

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProgramSelect = (program: ProgramOption) => {
    if (selectedPrograms.length >= maxPrograms) {
      alert(`You can only tag up to ${maxPrograms} programs per post.`)
      return
    }

    onProgramsChange([...selectedPrograms, program.id])
    setSearchQuery('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleProgramRemove = (programId: string) => {
    onProgramsChange(selectedPrograms.filter(id => id !== programId))
  }

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setShowDropdown(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowDropdown(value.length >= 2)
  }

  return (
    <div className="relative">
      {/* Selected Programs Display */}
      {selectedProgramDetails.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedProgramDetails.map((program) => (
            <div
              key={program.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-800 rounded-lg text-sm border border-teal-200"
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-medium truncate max-w-[200px]">
                {program.name}
              </span>
              <button
                onClick={() => handleProgramRemove(program.id)}
                className="text-teal-600 hover:text-teal-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-teal-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-teal-200 rounded-lg bg-white text-slate-800 placeholder-teal-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        
        {/* Loading indicator */}
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-teal-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {searchResults.map((program) => (
            <button
              key={program.id}
              onClick={() => handleProgramSelect(program)}
              className="w-full px-4 py-3 text-left hover:bg-teal-50 border-b border-teal-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Tag className="w-4 h-4 text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate">
                    {program.displayName}
                  </div>
                  <div className="text-sm text-teal-600 mt-1">
                    {program.category} • {program.duration}
                  </div>
                  {program.description && (
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {program.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showDropdown && !isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-teal-200 rounded-lg shadow-lg p-4">
          <div className="text-center text-slate-600">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-teal-400" />
            <p className="text-sm">No programs found matching "{searchQuery}"</p>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-2 text-xs text-teal-600">
        {selectedPrograms.length > 0 && (
          <span className="block">
            {selectedPrograms.length} of {maxPrograms} programs tagged
          </span>
        )}
        <span className="block">
          Type at least 2 characters to search for programs
        </span>
      </div>
    </div>
  )
}
