import { ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  // Don't show back button on landing page, auth pages, or root
  const hideOnPaths = ['/', '/auth', '/auth/login', '/auth/register']
  if (hideOnPaths.includes(location.pathname)) {
    return null
  }

  // Also hide on associate pages since they have their own back button
  if (location.pathname.startsWith('/associates/') || location.pathname.startsWith('/hubs/')) {
    return null
  }

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed top-20 left-4 z-30 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm backdrop-blur-sm transition-all text-sm font-medium"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden sm:inline">Back</span>
    </button>
  )
}

export default BackButton
