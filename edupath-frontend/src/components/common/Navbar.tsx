import { Link, NavLink } from 'react-router-dom'
import { GraduationCap, Home, Users, Bookmark, BookOpen, Moon, Sun, MoreHorizontal, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function Navbar() {
  const navLink = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-teal-50 text-gray-700 hover:text-teal-700'
  const active = 'bg-teal-100 text-teal-800 shadow-sm'
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    const saved = localStorage.getItem('edupath.theme') as 'light'|'dark' | null
    return saved ?? 'light'
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('edupath.theme', theme)
  }, [theme])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md group-hover:shadow-lg transition-shadow">
            <GraduationCap size={20} />
          </div>
          <span className="bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">EduPath</span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <Home size={18}/> Home
          </NavLink>
          <NavLink to="/directory" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <BookOpen size={18}/> Directory
          </NavLink>
          <NavLink to="/courses/compare" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <Bookmark size={18}/> Courses
          </NavLink>
          <NavLink to="/societies" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <Users size={18}/> Societies
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/profile" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <User size={12} className="text-white"/>
                </div>
                Profile
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
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 transition-all text-teal-700">
            {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
            <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </nav>
        {/* Mobile overflow menu */}
        <div className="md:hidden">
          <button aria-label="Open menu" onClick={() => setMenuOpen(v => !v)} className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-4 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-xl p-2">
              <div className="flex flex-col">
                <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 ${isActive ? 'bg-teal-100 text-teal-800' : 'hover:bg-teal-50'}`}>
                  Home
                </NavLink>
                <NavLink to="/directory" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 ${isActive ? 'bg-teal-100 text-teal-800' : 'hover:bg-teal-50'}`}>
                  Directory
                </NavLink>
                <NavLink to="/courses/compare" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 ${isActive ? 'bg-teal-100 text-teal-800' : 'hover:bg-teal-50'}`}>
                  Courses
                </NavLink>
                <NavLink to="/societies" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 ${isActive ? 'bg-teal-100 text-teal-800' : 'hover:bg-teal-50'}`}>
                  Societies
                </NavLink>
                {isAuthenticated ? (
                  <>
                    <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 ${isActive ? 'bg-teal-100 text-teal-800' : 'hover:bg-teal-50'}`}>
                      Profile
                    </NavLink>
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700">
                      Sign out
                    </button>
                  </>
                ) : (
                  <NavLink to="/auth" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 ${isActive ? 'bg-teal-100 text-teal-800' : 'hover:bg-teal-50'}`}>
                    Sign in
                  </NavLink>
                )}
                <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMenuOpen(false); }} className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700">
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
