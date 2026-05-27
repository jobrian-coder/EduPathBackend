import { Link, NavLink } from 'react-router-dom'
import { GraduationCap, Home, Users, Bookmark, MoreHorizontal, User, LayoutDashboard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import eduguideIcon from '../../assets/eduguide.png'

export function Navbar() {
  const navLink =
    'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-teal-50 text-gray-700 hover:text-teal-700 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-teal-200'
  const active = 'bg-teal-100 text-teal-800 shadow-sm dark:bg-teal-900/30 dark:text-teal-200'
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAssociate, setIsAssociate] = useState(false)
  const { isAuthenticated, logout, user } = useAuth()
  const isAdmin = user?.is_staff || user?.is_superuser

  useEffect(() => {
    if (!isAuthenticated) { setIsAssociate(false); return }
    api.associates.getMe().then(() => setIsAssociate(true)).catch(() => setIsAssociate(false))
  }, [isAuthenticated])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md group-hover:shadow-lg transition-shadow">
            <GraduationCap size={20} />
          </div>
          <span className="bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">EduPath</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/directory" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
            <Home size={18}/> Home
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
              {isAssociate && !isAdmin && (
                <NavLink to="/associates/dashboard" className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
                  <LayoutDashboard size={18} /> My Dashboard
                </NavLink>
              )}
              <NavLink to={isAdmin ? "/admin" : "/profile"} className={({isActive}) => `${navLink} ${isActive ? active : ''}`}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <User size={12} className="text-white"/>
                </div>
                {isAdmin ? 'Admin Dashboard' : 'Profile'}
              </NavLink>
              <button onClick={logout} className="ml-1 inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 transition text-white shadow-sm w-28">
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
        </nav>

        {/* Mobile overflow menu */}
        <div className="md:hidden">
          <button aria-label="Open menu" onClick={() => setMenuOpen(v => !v)} className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/60">
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-4 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-xl p-2 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex flex-col gap-1">
                <NavLink to="/directory" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  Home
                </NavLink>
                <NavLink to="/courses/compare" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  Courses
                </NavLink>
                <NavLink to="/hubs" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  Hubs
                </NavLink>
                <NavLink to="/associates" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  Associates
                </NavLink>
                <NavLink to="/advisor" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md flex items-center gap-2 text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                  <img src={eduguideIcon} alt="EduGuide" className="w-[18px] h-[18px] flex-shrink-0" />
                  EduGuide
                </NavLink>
                {isAuthenticated ? (
                  <>
                    {isAssociate && !isAdmin && (
                      <NavLink to="/associates/dashboard" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 flex items-center gap-2 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                        <LayoutDashboard size={16} /> My Dashboard
                      </NavLink>
                    )}
                    <NavLink to={isAdmin ? "/admin" : "/profile"} onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                      {isAdmin ? 'Admin Dashboard' : 'Profile'}
                    </NavLink>
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="mt-1 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
                      Sign out
                    </button>
                  </>
                ) : (
                  <NavLink to="/auth" onClick={() => setMenuOpen(false)} className={({isActive}) => `px-3 py-2 rounded-md text-gray-700 dark:text-slate-200 ${isActive ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'hover:bg-teal-50 dark:hover:bg-slate-800/60'}`}>
                    Sign in
                  </NavLink>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
