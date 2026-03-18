import { Link } from 'react-router-dom'

export default function SidebarMenu() {
  const item = 'block px-4 py-2 rounded-lg hover:bg-slate-100'
  return (
    <div className="space-y-2">
      <Link to="/" className={item}>Home</Link>
      <Link to="/careers/compare" className={item}>Careers</Link>
      <Link to="/hubs" className={item}>Hubs</Link>
      <Link to="/profile" className={item}>Profile</Link>
    </div>
  )
}
