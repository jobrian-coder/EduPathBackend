import { Outlet, useLocation } from 'react-router-dom'
import './index.css'
import { Navbar } from './components/common/Navbar'
import CompactSidebar from './components/common/CompactSidebar'

function App() {
  const location = useLocation()
  const hideSidebar = location.pathname.startsWith('/auth')
  return (
    <div className={"min-h-screen bg-black text-slate-100 " + (hideSidebar ? '' : 'grid grid-cols-1 md:grid-cols-[64px_1fr]') }>
      {!hideSidebar && (
        <aside className="hidden md:block bg-black">
          <CompactSidebar />
        </aside>
      )}
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default App
