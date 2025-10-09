import { NavLink } from 'react-router-dom'
import { Home, Layers, Users, User, BookOpen } from 'lucide-react'

export function Sidebar() {
  const item = 'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:scale-105'
  const active = 'bg-gradient-to-r from-blue-100 to-purple-100 text-slate-900 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-slate-100 shadow-md scale-105'

  return (
    <div className="h-full p-4">
      <div className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-2 mb-3">Navigation</div>
      <div className="space-y-1">
        <NavLink end to="/" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Home size={18}/> Home
        </NavLink>
        <NavLink to="/directory" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <BookOpen size={18}/> Directory
        </NavLink>
        <NavLink to="/courses/compare" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Layers size={18}/> Courses
        </NavLink>
        <NavLink to="/societies" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Users size={18}/> Societies
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <User size={18}/> Profile
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
