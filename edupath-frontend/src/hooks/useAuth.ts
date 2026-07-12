import { useEffect, useState } from 'react'
import api, { type User } from '../services/api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('edupath.auth.token')
    const cachedUser = localStorage.getItem('edupath.user')
    
    if (!token) {
      setLoading(false)
      return
    }

    // Immediately use cached user while validating token in background
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser))
      } catch {
        // Invalid cached user, will fetch from API
      }
    }
    
    // Validate token and get fresh user data
    ;(async () => {
      try {
        const me = await api.auth.getProfile()
        setUser(me)
        localStorage.setItem('edupath.user', JSON.stringify(me))
      } catch (error) {
        localStorage.removeItem('edupath.auth.token')
        localStorage.removeItem('edupath.user')
        setUser(null)
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
      // Clear persisted advisor session so a new user starts fresh
      const advisorKeys = [
        'edupath.advisor.mode',
        'edupath.advisor.sessionId',
        'edupath.advisor.recommendations',
        'edupath.advisor.suggestedHubs',
        'edupath.advisor.interviewMessages',
        'edupath.advisor.interviewQuestionCount',
        'edupath.advisor.chatConversationId',
        'edupath.advisor.chatMessages',
      ]
      advisorKeys.forEach(k => sessionStorage.removeItem(k))
      window.location.href = '/auth'
    }
  }

  return { user, loading, isAuthenticated: !!user, logout }
}
