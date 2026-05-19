import { NavLink } from 'react-router-dom'
import { Home, Layers, Users, User, BookOpen, Building2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function CompactSidebar() {
  const { isAuthenticated, user } = useAuth()
  
  const item =
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-teal-50 text-gray-700 hover:text-teal-700 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-teal-200 whitespace-nowrap'
  const active = 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200'

  return (
    <div className="group fixed top-16 bottom-0 left-0 p-3 w-16 hover:w-64 transition-all duration-300 overflow-hidden bg-white shadow-md hover:shadow-2xl z-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800">
      
      {/* Profile Section prominently on top */}
      <NavLink to="/profile" className="flex items-center gap-3 px-1 py-2 mb-4 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800/60 transition-colors">
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
          {isAuthenticated && (user as any)?.avatar ? (
            <img src={(user as any).avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={20} className="text-white"/>
          )}
        </div>
        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
            {isAuthenticated ? ((user as any)?.username || 'User') : 'Guest Account'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isAuthenticated ? 'View Profile' : 'Sign in'}
          </span>
        </div>
      </NavLink>

      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600 px-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity">Menu</div>
      <div className="space-y-2">
        <NavLink end to="/" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Home size={20} className="flex-shrink-0"/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity transition-delay-100">Home</span>
        </NavLink>
        <NavLink to="/directory" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <BookOpen size={20} className="flex-shrink-0"/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity transition-delay-100">Directory</span>
        </NavLink>
        <NavLink to="/courses/compare" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Layers size={20} className="flex-shrink-0"/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity transition-delay-100">Courses</span>
        </NavLink>
        <NavLink to="/hubs" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Users size={20} className="flex-shrink-0"/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity transition-delay-100">Hubs</span>
        </NavLink>
        <NavLink to="/associates" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Building2 size={20} className="flex-shrink-0"/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity transition-delay-100">Associates</span>
        </NavLink>
      </div>
    </div>
  )
}
