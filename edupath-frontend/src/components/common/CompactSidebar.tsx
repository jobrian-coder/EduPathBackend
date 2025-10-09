import { NavLink } from 'react-router-dom'
import { Home, Layers, Users, User, BookOpen } from 'lucide-react'

export default function CompactSidebar() {
  const item = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-slate-800/50'
  const active = 'bg-slate-800/70 text-white'

  return (
    <div className="group h-full p-3 w-16 hover:w-56 transition-all duration-200 overflow-hidden border-r border-slate-800">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-3">Menu</div>
      <div className="space-y-1">
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
        <NavLink to="/societies" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <Users size={18}/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Societies</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `${item} ${isActive ? active : ''}`}>
          <User size={18}/>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Profile</span>
        </NavLink>
      </div>
    </div>
  )
}
