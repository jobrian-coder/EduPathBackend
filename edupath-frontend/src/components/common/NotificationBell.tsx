import { useEffect, useState, useCallback } from 'react'
import { Bell, Check, MessageSquare, Users, ExternalLink } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import type { Post, Hub } from '../../services/api'
import { Link } from 'react-router-dom'

interface Notification {
  id: string
  type: 'post'
  title: string
  message: string
  hubName: string
  hubSlug: string
  postId: string
  createdAt: string
  read: boolean
}

const STORAGE_KEY = 'edupath_notifications_last_read'

export function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load last read timestamp from localStorage
  const getLastRead = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Date(stored) : new Date(0)
  }, [])

  const setLastRead = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
  }, [])

  // Fetch new posts from joined hubs
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      // Get all hubs and filter for joined ones
      const hubsData = await api.hubs.listHubs()
      const joinedHubs = hubsData.results.filter((hub: Hub) => hub.is_member)

      if (joinedHubs.length === 0) {
        setNotifications([])
        setUnreadCount(0)
        return
      }

      // Fetch recent posts from joined hubs
      const lastRead = getLastRead()
      const allNotifications: Notification[] = []

      await Promise.all(
        joinedHubs.map(async (hub: Hub) => {
          try {
            const postsData = await api.hubs.listPosts({ hub: hub.id, ordering: '-created_at' })
            const recentPosts = postsData.results.slice(0, 5) // Get last 5 posts

            recentPosts.forEach((post: Post) => {
              const postDate = new Date(post.created_at)
              if (postDate > lastRead) {
                allNotifications.push({
                  id: `post-${post.id}`,
                  type: 'post',
                  title: post.title || 'New post',
                  message: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
                  hubName: hub.name,
                  hubSlug: hub.slug,
                  postId: post.id,
                  createdAt: post.created_at,
                  read: false,
                })
              }
            })
          } catch (e) {
            console.error(`Failed to fetch posts for hub ${hub.id}`, e)
          }
        })
      )

      // Sort by date, newest first
      allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Limit to 20 most recent
      const limited = allNotifications.slice(0, 20)
      setNotifications(limited)
      setUnreadCount(limited.length)
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, getLastRead])

  // Poll for notifications every 2 minutes
  useEffect(() => {
    if (!isAuthenticated) return

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000) // 2 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, fetchNotifications])

  // Mark all as read when dropdown is opened
  const handleOpen = () => {
    if (!isOpen) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  const markAllRead = () => {
    setLastRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No new notifications</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    New posts from hubs you joined will appear here
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={`/hubs/${notification.hubSlug}`}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      !notification.read ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-teal-600 dark:text-teal-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {notification.hubName}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400">{formatTime(notification.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <Link
                  to="/hubs"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium flex items-center justify-center gap-1"
                >
                  View all hubs
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
