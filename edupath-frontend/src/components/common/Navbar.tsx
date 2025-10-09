import { Link, NavLink } from 'react-router-dom'
import { GraduationCap, Home, Users, Bookmark, BookOpen, Moon, Sun, MoreHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function Navbar() {
  const navLink = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20'
  const active = 'bg-gradient-to-r from-blue-100 to-purple-100 text-slate-900 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-slate-100 shadow-sm'
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    const saved = localStorage.getItem('edupath.theme') as 'light'|'dark' | null
    return saved ?? 'dark'
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-black/80 backdrop-blur-xl shadow-sm">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md group-hover:shadow-lg transition-shadow">
            <GraduationCap size={20} />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EduPath</span>
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
                <img src="/profile-pics/default.svg" className="w-5 h-5 rounded-full"/>
                Profile
              </NavLink>
              <button onClick={logout} className="ml-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/auth" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
              <img src="/profile-pics/default.svg" className="w-5 h-5 rounded-full"/>
              Sign in
            </NavLink>
          )}
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all">
            {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
            <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </nav>
        {/* Mobile overflow menu */}
        <div className="md:hidden">
          <button aria-label="Open menu" onClick={() => setMenuOpen(v => !v)} className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-800 bg-black text-slate-100 hover:bg-slate-900">
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-4 top-full mt-2 w-56 rounded-lg border border-slate-800 bg-black shadow-xl p-2">
              <div className="flex flex-col">
                <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-900'}`}>
                  Home
                </NavLink>
                <NavLink to="/directory" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-900'}`}>
                  Directory
                </NavLink>
                <NavLink to="/courses/compare" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-900'}`}>
                  Courses
                </NavLink>
                <NavLink to="/societies" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-900'}`}>
                  Societies
                </NavLink>
                {isAuthenticated ? (
                  <>
                    <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-900'}`}>
                      Profile
                    </NavLink>
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-800 hover:bg-slate-900">
                      Sign out
                    </button>
                  </>
                ) : (
                  <NavLink to="/auth" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-900'}`}>
                    Sign in
                  </NavLink>
                )}
                <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMenuOpen(false); }} className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-800 hover:bg-slate-900">
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
