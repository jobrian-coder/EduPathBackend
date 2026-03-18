import { NavLink } from 'react-router-dom'
import { Home, Layers, Users, User, BookOpen } from 'lucide-react'

export default function CompactSidebar() {
  const item =
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-teal-50 text-gray-700 hover:text-teal-700 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-teal-200'
  const active = 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200'

  return (
    <div className="group h-full p-3 w-16 hover:w-56 transition-all duration-200 overflow-hidden bg-white shadow-sm hover:shadow-md dark:bg-slate-900/60">
      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600 px-2 mb-4">Menu</div>
      <div className="space-y-2">
        <NavLink end to="/" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Home size={18}/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Home</span>
        </NavLink>
        <NavLink to="/directory" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <BookOpen size={18}/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Directory</span>
        </NavLink>
        <NavLink to="/courses/compare" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Layers size={18}/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Courses</span>
        </NavLink>
        <NavLink to="/hubs" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Users size={18}/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Hubs</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <User size={18}/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Profile</span>
        </NavLink>
      </div>
    </div>
  )
}
