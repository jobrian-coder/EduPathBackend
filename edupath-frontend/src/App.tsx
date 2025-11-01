import { Outlet, useLocation } from 'react-router-dom'
import './index.css'
import { Navbar } from './components/common/Navbar'
import CompactSidebar from './components/common/CompactSidebar'

function App() {
  const location = useLocation()
  const hideSidebar = location.pathname.startsWith('/auth')
  const showLandingBackground = location.pathname === '/'
  
  // Add background style for the landing page
  const landingPageStyle = {
    backgroundImage: `url('/assets/edupathbackground.gif')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: -1,
  } as React.CSSProperties;

  return (
    <>
      {showLandingBackground && <div style={landingPageStyle} />}
      <div className={"min-h-screen text-gray-900 " + (showLandingBackground ? 'bg-black bg-opacity-50 ' : '') + (hideSidebar ? '' : 'grid grid-cols-1 md:grid-cols-[64px_1fr]') }>
        {!hideSidebar && (
          <aside className="hidden md:block bg-white bg-opacity-90 border-r border-gray-200 pt-20">
            <CompactSidebar />
          </aside>
        )}
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 p-4 md:p-6 bg-white bg-opacity-90">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}

export default App
