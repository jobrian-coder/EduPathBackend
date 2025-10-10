import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Landing from '../features/landing/pages/Landing'
import AuthPage from '../features/auth/pages/Auth'

export function HomeGate() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-white">Loading...</div>
    </div>
  }
  
  return isAuthenticated ? <Landing /> : <AuthPage />
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <>{children}</>
}

// Role-based guard
// Usage: <RequireRole roles={["contributor", "expert"]}><Protected /></RequireRole>
export function RequireRole({ roles, children }: { roles: Array<'novice' | 'contributor' | 'expert'>, children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />

  // If roles is empty or not provided, allow
  if (!roles || roles.length === 0) return <>{children}</>

  if (!roles.includes(user.role)) {
    // Optional: could redirect to 403 page; for now, send to home
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
