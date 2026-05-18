import { Link, NavLink, useNavigate } from 'react-router-dom'
import { GraduationCap, Home, Users, Bookmark, BookOpen, Moon, Sun, MoreHorizontal, User, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import eduguideIcon from '../../assets/eduguide.png'

export function Navbar() {
  const navLink =
    'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-teal-50 text-gray-700 hover:text-teal-700 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-teal-200'
  const active = 'bg-teal-100 text-teal-800 shadow-sm dark:bg-teal-900/30 dark:text-teal-200'
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    const saved = localStorage.getItem('edupath.theme') as 'light'|'dark' | null
    return saved ?? 'light'
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')
  const { isAuthenticated, logout, user } = useAuth()
  const isAdmin = user?.is_staff || user?.is_superuser

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('edupath.theme', theme)
  }, [theme])

  const handleGlobalSearch = () => {
    const q = globalQuery.trim()
    if (!q) return
    navigate(`/directory?search=${encodeURIComponent(q)}`)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md group-hover:shadow-lg transition-shadow">
            <GraduationCap size={20} />
          </div>
          <span className="bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">EduPath</span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleGlobalSearch()
            }}
            className="hidden lg:flex items-center ml-2"
          >
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Global search..."
                className="w-64 pl-9 pr-3 h-9 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-700"
              />
            </div>
            <button
              type="submit"
              className="ml-2 h-9 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-all shadow-sm"
              aria-label="Search"
              title="Search"
            >
              <Search size={16} />
            </button>
          </form>

          <NavLink to="/" end className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <Home size={18}/> Home
          </NavLink>
          <NavLink to="/directory" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <BookOpen size={18}/> Directory
          </NavLink>
          <NavLink to="/courses/compare" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <Bookmark size={18}/> Courses
          </NavLink>
          <NavLink to="/hubs" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <Users size={18}/> Hubs
          </NavLink>
          <NavLink to="/advisor" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
             <img src={eduguideIcon} alt="EduGuide" className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="font-medium">EduGuide</span>
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to={isAdmin ? "/admin" : "/profile"} className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <User size={12} className="text-white"/>
                </div>
                {isAdmin ? 'Admin Dashboard' : 'Profile'}
              </NavLink>
              <button onClick={logout} className="ml-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-100 transition text-gray-700">
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/auth" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <User size={12} className="text-white"/>
              </div>
              Sign in
            </NavLink>
          )}
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 transition-all text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 dark:text-teal-200">
            {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
            <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </nav>
        {/* Mobile overflow menu */}
        <div className="md:hidden">
          <button aria-label="Open menu" onClick={() => setMenuOpen(v => !v)} className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/60">
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-4 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-xl p-2 dark:border-slate-700 dark:bg-slate-900/70">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleGlobalSearch()
                }}
                className="p-2 mb-2 rounded-lg bg-white/60 dark:bg-slate-900/40 dark:shadow-none dark:border-slate-700 border border-gray-200"
              >
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <input
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-700"
                  />
                </div>
                <button type="submit" className="mt-2 w-full h-9 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-all shadow-sm">
                  Search
                </button>
              </form>
              <div className="flex flex-col">
                <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  Home
                </NavLink>
                <NavLink to="/directory" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  Directory
                </NavLink>
                <NavLink to="/courses/compare" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  Courses
                </NavLink>
                <NavLink to="/hubs" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  Hubs
                </NavLink>
                <NavLink to="/advisor" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md flex items-center gap-2 text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  <img src={eduguideIcon} alt="EduGuide" className="w-[18px] h-[18px] flex-shrink-0" />
                  EduGuide
                </NavLink>
                {isAuthenticated ? (
                  <>
                    <NavLink to={isAdmin ? "/admin" : "/profile"} onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                      {isAdmin ? 'Admin Dashboard' : 'Profile'}
                    </NavLink>
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-slate-700 dark:hover:bg-slate-800/60 dark:text-slate-200">
                      Sign out
                    </button>
                  </>
                ) : (
                  <NavLink to="/auth" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                    Sign in
                  </NavLink>
                )}
                <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMenuOpen(false); }} className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 dark:text-teal-200">
                  {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
                  <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
