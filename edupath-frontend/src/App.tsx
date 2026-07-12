import { Outlet, useLocation } from 'react-router-dom'
import './index.css'
import { Navbar } from './components/common/Navbar'
import CompactSidebar from './components/common/CompactSidebar'
import { Footer } from './components/common/Footer'
import { BackButton } from './components/common/BackButton'

function App() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const hideSidebar = isLandingPage || location.pathname.startsWith('/auth') || location.pathname.startsWith('/associates')

  return (
    <>
      <div className={"min-h-screen text-gray-900 dark:text-slate-100 " + (hideSidebar ? '' : 'grid grid-cols-1 md:grid-cols-[64px_1fr]') }>
        {!hideSidebar && (
          <aside className="hidden md:block bg-white bg-opacity-90 border-r border-gray-200 pt-20 dark:bg-slate-900/60 dark:border-slate-700">
            <CompactSidebar />
          </aside>
        )}
        <div className="flex min-h-screen flex-col">
          {!hideSidebar && <Navbar />}
          {!hideSidebar && <BackButton />}
          <main className={`flex-1 ${hideSidebar ? '' : 'p-4 md:p-6'} bg-white bg-opacity-90 dark:bg-slate-900/60 dark:border-slate-700 backdrop-blur-xl`}>
            <Outlet />
          </main>
          {isLandingPage && <Footer />}
        </div>
      </div>
    </>
  )
}

export default App
