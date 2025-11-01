import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'

// Import hub icons
import agricultureIcon from '../../../assets/hubs/agriculturehubicon.jpeg'
import aviationIcon from '../../../assets/hubs/aviationhubicon.jpeg'
import businessIcon from '../../../assets/hubs/businesshubicon.png'
import creativeIcon from '../../../assets/hubs/creativehubicon.jpeg'
import eduIcon from '../../../assets/hubs/eduhubicon.jpeg'
import engineeringIcon from '../../../assets/hubs/engineeringhubicon.png'
import healthIcon from '../../../assets/hubs/healthhubicon.png'
import hospitalityIcon from '../../../assets/hubs/hospitalityhubicon.png'
import lawIcon from '../../../assets/hubs/lawhubicon.png'
import techIcon from '../../../assets/hubs/techhubicon.jpeg'

// Import university icon utility
import { getUniversityIcon } from '../../../utils/universityIcons'
import defaultUniIcon from '../../../assets/universitiesicon/Open University of Kenya.jpg'

// Hub data with icons and descriptions (top 3 only)
const hubData = [
  {
    name: 'Technology Hub',
    slug: 'tech-hub',
    icon: techIcon,
    description: 'Kenya\'s tech community for developers, innovators, and tech enthusiasts',
    memberCount: 2156
  },
  {
    name: 'Engineering Hub',
    slug: 'engineering-hub',
    icon: engineeringIcon,
    description: 'Connect with engineers, share projects, and discuss engineering topics',
    memberCount: 1247
  },
  {
    name: 'Business Hub',
    slug: 'business-hub',
    icon: businessIcon,
    description: 'Entrepreneurs and business professionals sharing insights',
    memberCount: 1543
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
    <PageContainer>
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="absolute -top-40 -right-20 h-96 w-96 rounded-full bg-gradient-to-tr from-teal-100/50 to-teal-200/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-gradient-to-tr from-teal-200/30 to-cyan-300/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-5xl md:text-7xl font-extrabold tracking-tight">
                <span className="text-gray-900">Welcome</span>
                <span className="text-teal-600">.</span>
              </div>
              <p className="mt-6 text-gray-600 max-w-xl">
                Discover courses, universities, hubs and career paths tailored to you. Compare options and plan your journey.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3 max-w-xl">
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search courses, universities..." 
                  className="flex-1 rounded-xl bg-white text-gray-900 placeholder-gray-500 border-2 border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition" 
                />
                <button 
                  onClick={handleSearch}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 font-medium text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Search
                </button>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link to="/directory" className="text-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium shadow-lg hover:shadow-xl transition-all">Explore Directory</Link>
                <Link to="/courses/compare" className="text-center px-6 py-3 rounded-full border-2 border-gray-300 hover:bg-teal-50 hover:border-teal-600 transition-all text-gray-700 hover:text-teal-700">Compare Courses</Link>
              </div>
            </div>

            <div className="justify-self-center">
              <div className="relative h-72 w-72 md:h-96 md:w-96">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500 to-teal-700" />
                <div className="absolute inset-8 rounded-full bg-white" />
                <div className="absolute inset-0 animate-pulse opacity-20">
                  <svg viewBox="0 0 200 200" className="h-full w-full text-teal-400/40">
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

      {/* Hub Communities Section */}
      <section className="mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join Your <span className="text-teal-600">Career Community</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with like-minded professionals, students, and experts in your field. Share knowledge, ask questions, and grow together.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Hub Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            {hubData.map((hub, index) => (
              <div
                key={hub.slug}
                onClick={() => handleHubClick(hub.slug)}
                className="group cursor-pointer bg-white rounded-2xl border border-gray-200 hover:border-teal-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Hub Icon */}
                <div className="h-24 bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <img 
                    src={hub.icon} 
                    alt={hub.name}
                    className="w-12 h-12 rounded-full object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Hub Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {hub.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {hub.description}
                  </p>
                  
                  {/* Member Count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span>{hub.memberCount.toLocaleString()} members</span>
                    </div>
                    <div className="text-teal-600 text-sm font-medium group-hover:text-teal-700">
                      Join →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View More Communities Arrow */}
          <div className="flex items-center justify-center lg:justify-start">
            <Link 
              to="/hubs" 
              className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border border-teal-200 hover:border-teal-300 transition-all duration-300"
            >
              <div className="text-center">
                <div className="text-sm font-medium text-teal-700 group-hover:text-teal-800">View More</div>
                <div className="text-xs text-teal-600 group-hover:text-teal-700">Communities</div>
              </div>
              <svg className="w-6 h-6 text-teal-600 group-hover:text-teal-700 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Top Universities Section */}
      <section className="mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore Top <span className="text-teal-600">Universities</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover Kenya's leading universities and find the perfect institution for your academic journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {universityData.map((university, index) => (
            <div
              key={university.shortName}
              onClick={() => handleUniversityClick(university.name)}
              className="group cursor-pointer bg-white rounded-2xl border border-gray-200 hover:border-teal-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Top Half - University Icon */}
              <div className="h-40 bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-100/30 to-cyan-100/30 group-hover:from-teal-100/50 group-hover:to-cyan-100/50 transition-colors" />
                <img 
                  src={university.icon} 
                  alt={university.name}
                  className="w-20 h-20 rounded-full object-cover shadow-xl group-hover:scale-110 transition-transform duration-300 border-4 border-white"
                />
                {/* Ranking Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                  #{university.ranking}
                </div>
              </div>

              {/* Bottom Half - Teal Information Display */}
              <div className="h-40 bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 to-teal-700/20 group-hover:from-teal-600/30 group-hover:to-teal-700/30 transition-colors" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1 group-hover:text-teal-100 transition-colors">
                      {university.name}
                    </h3>
                    <p className="text-teal-200 font-medium text-sm">{university.shortName}</p>
                    <div className="mt-2 text-xs text-teal-200 bg-teal-600/30 px-2 py-1 rounded-full inline-block">
                      {university.type}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-teal-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{university.location}</span>
                      </div>
                      <div className="font-bold text-white">
                        {university.students}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-teal-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Est. {university.established}</span>
                      </div>
                      <div className="text-teal-200 text-sm font-medium group-hover:text-white transition-colors">
                        Explore →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Universities Button */}
        <div className="text-center mt-12">
          <Link 
            to="/directory" 
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            View All Universities
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-20">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-teal-600">EduPath</span>?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your comprehensive platform for educational guidance and career development in Kenya.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Discovery</h3>
              <p className="text-gray-600">Find courses and universities that match your interests and academic profile.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Compare & Analyze</h3>
              <p className="text-gray-600">Compare courses, fees, and requirements across different universities.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Support</h3>
              <p className="text-gray-600">Join career-focused communities and get support from peers and professionals.</p>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  )
}
