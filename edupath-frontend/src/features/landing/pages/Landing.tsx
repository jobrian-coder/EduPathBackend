import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'


import businessIcon from '../../../assets/hubs/businesshubicon.png'
import engineeringIcon from '../../../assets/hubs/engineeringhubicon.png'
import techIcon from '../../../assets/hubs/techhubicon.jpeg'

import edupathIcon from '../../../assets/login/edupathicong.png'

// Import university icon utility
import { getUniversityIcon } from '../../../utils/universityIcons'

// Hub data with icons and descriptions (top 3 only)
const hubData = [
  {
    name: 'Technology Hub',
    slug: 'tech-hub',
    icon: techIcon,
    description: 'Kenya\'s tech community for developers, innovators, and tech enthusiasts',
    memberCount: 2
  },
  {
    name: 'Engineering Hub',
    slug: 'engineering-hub',
    icon: engineeringIcon,
    description: 'Connect with engineers, share projects, and discuss engineering topics',
    memberCount: 3
  },
  {
    name: 'Business Hub',
    slug: 'business-hub',
    icon: businessIcon,
    description: 'Entrepreneurs and business professionals sharing insights',
    memberCount: 2
  }
]

// University data with icons and information
const universityData = [
  {
    name: 'University of Nairobi',
    shortName: 'UoN',
    icon: getUniversityIcon('University of Nairobi'),
    type: 'Public',
    location: 'Nairobi',
    established: 1970,
    students: '84,000+',
    ranking: 1,
    description: 'Kenya\'s premier university and leading research institution'
  },
  {
    name: 'Kenyatta University',
    shortName: 'KU',
    icon: getUniversityIcon('Kenyatta University'),
    type: 'Public',
    location: 'Kiambu',
    established: 1985,
    students: '75,000+',
    ranking: 2,
    description: 'A leading public university focused on education and social sciences'
  },
  {
    name: 'Jomo Kenyatta University of Agriculture and Technology',
    shortName: 'JKUAT',
    icon: getUniversityIcon('Jomo Kenyatta University of Agriculture and Technology'),
    type: 'Public',
    location: 'Kiambu',
    established: 1994,
    students: '45,000+',
    ranking: 3,
    description: 'Premier technical university specializing in agriculture and technology'
  }
]

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

  const handleHubClick = (slug: string) => {
    navigate(`/hubs/${slug}`)
  }

  const handleUniversityClick = (universityName: string) => {
    // Navigate to directory with university filter
    navigate(`/directory?view=universities&search=${encodeURIComponent(universityName)}`)
  }
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Dynamic Animated Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-teal-400/20 blur-[120px] mix-blend-multiply dark:mix-blend-overlay"></div>
        <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-cyan-400/20 blur-[120px] mix-blend-multiply dark:mix-blend-overlay"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-emerald-400/20 blur-[120px] mix-blend-multiply dark:mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[50px] dark:bg-slate-900/40 dark:backdrop-blur-[60px]"></div>
      </div>

      {/* Main Content Overlay */}
      <div className="relative z-10 flex flex-col items-center pt-24 pb-32 px-6">
        {/* Modern Hero Area */}
        <div className="max-w-5xl w-full text-center space-y-10">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 backdrop-blur-md px-5 py-2 text-sm font-medium text-teal-800 dark:text-teal-300 shadow-sm hover:scale-105 transition-transform duration-300 cursor-default">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            Discover your next step after KCSE
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm leading-tight">
            Design your future  <br className="hidden md:block"/>
            with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">crystal clarity</span>.
          </h1>

          <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium">
            Seamlessly explore courses, map out paths and let an <span className="text-teal-600 dark:text-teal-400 font-bold">intelligent AI guide</span> illuminate your choices without friction.
          </p>

          {/* Fluid Search Bar */}
          <div className="mx-auto max-w-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 flex items-center gap-3 w-full rounded-[2rem] bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 backdrop-blur-xl px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:ring-4 focus-within:ring-teal-500/20 transition-all duration-300">
              <svg className="h-6 w-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search courses, universities, or paths..."
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-lg focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-8 py-4 rounded-[2rem] bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold text-lg shadow-[0_8px_25px_rgba(20,184,166,0.5)] hover:shadow-[0_12px_35px_rgba(20,184,166,0.6)] hover:-translate-y-1 transition-all duration-300"
            >
              Explore
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <Link to="/directory" className="px-6 py-3 rounded-full bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 backdrop-blur-md text-slate-800 dark:text-white font-semibold transition-all hover:scale-[1.03] shadow-sm">
              View Directory
            </Link>
            <Link to="/courses/compare" className="px-6 py-3 rounded-full bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 backdrop-blur-md text-slate-800 dark:text-white font-semibold transition-all hover:scale-[1.03] shadow-sm">
              Compare Options
            </Link>
            <Link to="/hubs" className="px-6 py-3 rounded-full bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 backdrop-blur-md text-slate-800 dark:text-white font-semibold transition-all hover:scale-[1.03] shadow-sm">
              Discover Hubs
            </Link>
          </div>
        </div>

        {/* Floating EduGuide Promo - The Core Call to Action */}
        <div className="w-full max-w-5xl mt-24">
          <div className="relative rounded-[3rem] p-1 bg-gradient-to-br from-teal-400 via-cyan-500 to-emerald-500 shadow-[0_0_60px_rgba(20,184,166,0.3)] hover:shadow-[0_0_80px_rgba(20,184,166,0.5)] transition-all duration-700 group cursor-pointer overflow-hidden transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-white/20 filter blur-xl group-hover:bg-white/30 transition-all duration-700"></div>
            <div className="relative rounded-[2.9rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="inline-block rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 px-4 py-1.5 text-teal-700 dark:text-teal-300 font-bold text-sm tracking-wide uppercase">
                  AI Powered Assistance
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">EduGuide</span> <br/>
                  Your Personal Path Finder.
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 font-medium max-w-md">
                  Uncertain about which course to take? Answer a few quick questions and let our AI model analyze the best tailored paths specifically for you.
                </p>
                <button
                  onClick={() => navigate('/advisor')}
                  className="mt-4 px-8 py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg hover:scale-105 shadow-xl transition-transform duration-300 flex items-center justify-center gap-3 mx-auto md:mx-0 w-full md:w-auto"
                >
                  Ask EduGuide Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
              <div className="relative group-hover:scale-110 transition-transform duration-700 ease-out">
                <div className="absolute inset-0 bg-teal-400/30 blur-3xl rounded-full"></div>
                <img src={edupathIcon} alt="EduGuide AI" className="relative h-64 w-64 md:h-80 md:w-80 object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.2)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Soft Flowing Content - Hubs */}
        <div className="w-full max-w-6xl mt-32 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
              Vibrant <span className="text-teal-500">Communities</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Immerse yourself in active hubs with peers and professionals sharing the same interests.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hubData.map((hub) => (
              <div
                key={hub.slug}
                onClick={() => handleHubClick(hub.slug)}
                className="group relative cursor-pointer rounded-[2rem] bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(20,184,166,0.1)] hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-100/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative flex items-start gap-5">
                  <div className="rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-500 p-0.5 shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0">
                    <img src={hub.icon} alt={hub.name} className="w-16 h-16 rounded-2xl object-cover bg-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-teal-500 transition-colors">
                      {hub.name}
                    </h4>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {hub.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                      </span>
                      {hub.memberCount.toLocaleString()} engaged
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Soft Flowing Content - Universities */}
        <div className="w-full max-w-6xl mt-32 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
              Top <span className="text-teal-500">Universities</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Explore institutions tailored to excellence and unparalleled student experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {universityData.map((uni) => (
              <div
                key={uni.shortName}
                onClick={() => handleUniversityClick(uni.name)}
                className="group relative cursor-pointer rounded-[2rem] bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)] hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col items-center text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative mb-6">
                  <div className="absolute -inset-4 bg-teal-200/50 dark:bg-teal-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <img src={uni.icon} alt={uni.name} className="relative w-24 h-24 rounded-full object-cover shadow-xl border-4 border-white dark:border-slate-800 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute -bottom-2 -right-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    #{uni.ranking}
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">
                  {uni.name}
                </h4>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-xs font-semibold">
                  {uni.type} • {uni.location}
                </div>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {uni.students} Students
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link 
              to="/directory" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold hover:bg-white dark:hover:bg-slate-700 hover:scale-105 hover:shadow-xl transition-all duration-300"
            >
              Browse All Institutions
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
