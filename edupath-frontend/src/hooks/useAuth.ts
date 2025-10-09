import { useEffect, useState } from 'react'
import api, { type User } from '../services/api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('edupath.auth.token')
    if (!token) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const me = await api.auth.getProfile()
        setUser(me)
      } catch {
        localStorage.removeItem('edupath.auth.token')
        localStorage.removeItem('edupath.user')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('edupath.auth.token')
      localStorage.removeItem('edupath.user')
      window.location.href = '/auth'
    }
  }

  return { user, loading, isAuthenticated: !!user, logout }
}
