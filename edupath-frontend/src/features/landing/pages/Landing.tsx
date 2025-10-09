import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'

export default function Landing() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/directory')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }
  return (
    <PageContainer>
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-black text-white">
        <div className="absolute -top-40 -right-20 h-96 w-96 rounded-full bg-gradient-to-tr from-purple-600/30 to-blue-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-5xl md:text-7xl font-extrabold tracking-tight">
                <span className="text-white">Welcome</span>
                <span className="text-blue-400">.</span>
              </div>
              <p className="mt-6 text-slate-300 max-w-xl">
                Discover courses, universities, hubs and career paths tailored to you. Compare options and plan your journey.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3 max-w-xl">
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search courses, universities..." 
                  className="flex-1 rounded-xl bg-slate-900/60 text-white placeholder-slate-400 border-2 border-slate-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                />
                <button 
                  onClick={handleSearch}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Search
                </button>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link to="/directory" className="text-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all">Explore Directory</Link>
                <Link to="/courses/compare" className="text-center px-6 py-3 rounded-full border-2 border-slate-700 hover:bg-slate-900/60 hover:border-blue-500 transition-all">Compare Courses</Link>
              </div>
            </div>

            <div className="justify-self-center">
              <div className="relative h-72 w-72 md:h-96 md:w-96">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 opacity-80" />
                <div className="absolute inset-8 rounded-full bg-black" />
                <div className="absolute inset-0 animate-pulse opacity-40">
                  <svg viewBox="0 0 200 200" className="h-full w-full text-blue-400/40">
                    <defs>
                      <radialGradient id="grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="currentColor" />
                        <stop offset="100%" stopColor="transparent" />
                      </radialGradient>
                    </defs>
                    <circle cx="100" cy="100" r="90" fill="url(#grad)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  )
}
