import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessageSquare, ThumbsUp, ThumbsDown, Share2, TrendingUp, Plus, Circle } from 'lucide-react'
import api from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'

interface Hub {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  member_count: number
  active_posts: number
}

interface Post {
  id: string
  hub: any
  author: any
  title: string
  content: string
  post_type: string
  upvotes: number
  downvotes: number
  comment_count: number
  user_vote: string | null
  created_at: string
}

interface ActiveUser {
  id: string
  username: string
  avatar?: string
  is_active: boolean
  last_seen?: string
}

export default function HubFeed() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { isAuthenticated } = useAuth()
  
  const [hubs, setHubs] = useState<Hub[]>([])
  const [followedHubs, setFollowedHubs] = useState<string[]>([])
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load hubs and initial data
  useEffect(() => {
    loadHubs()
  }, [])

  // Load posts when hub changes
  useEffect(() => {
    if (selectedHub) {
      loadPosts(selectedHub.id)
      loadActiveUsers(selectedHub.id)
      loadTrendingPosts(selectedHub.id)
    }
  }, [selectedHub])

  // Set selected hub from URL or default to first
  useEffect(() => {
    if (hubs.length > 0) {
      if (slug) {
        const hub = hubs.find(h => h.slug === slug)
        if (hub) setSelectedHub(hub)
      } else {
        setSelectedHub(hubs[0])
      }
    }
  }, [hubs, slug])

  const loadHubs = async () => {
    try {
      const { results } = await api.hubs.listHubs()
      setHubs(results)
      // Simulate followed hubs (in real app, fetch from user profile)
      setFollowedHubs(results.slice(0, 5).map((h: Hub) => h.id))
    } catch (error) {
      console.error('Failed to load hubs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPosts = async (hubId: string) => {
    try {
      const { results } = await api.hubs.listPosts({ hub: hubId })
      setPosts(results)
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  }

  const loadActiveUsers = async (hubId: string) => {
    // Simulated active users - in real app, fetch from API
    setActiveUsers([
      { id: '1', username: 'john_doe', is_active: true },
      { id: '2', username: 'jane_smith', is_active: true },
      { id: '3', username: 'tech_guru', is_active: false, last_seen: '5m ago' },
    ])
  }

  const loadTrendingPosts = async (hubId: string) => {
    try {
      const { results } = await api.hubs.listPosts({ hub: hubId })
      // Get top 3 posts by upvotes
      const sorted = results.sort((a: Post, b: Post) => b.upvotes - a.upvotes)
      setTrendingPosts(sorted.slice(0, 3))
    } catch (error) {
      console.error('Failed to load trending:', error)
    }
  }

  const handleHubClick = (hub: Hub) => {
    setSelectedHub(hub)
    navigate(`/hubs/${hub.slug}`)
  }

  const handlePostClick = (postId: string) => {
    setExpandedPost(postId)
  }

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      alert('Please sign in to vote')
      return
    }
    try {
      await api.hubs.votePost(postId, voteType)
      // Reload posts
      if (selectedHub) loadPosts(selectedHub.id)
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Loading hubs...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="grid grid-cols-[280px_1fr_320px] gap-4 p-4 max-w-[1800px] mx-auto">
        {/* Left Sidebar - Hub Navigator */}
        <aside className="h-[calc(100vh-2rem)] sticky top-4 overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 space-y-2">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold px-2 mb-3">
              Your Hubs
            </div>
            
            {hubs.filter(h => followedHubs.includes(h.id)).map(hub => (
              <button
                key={hub.id}
                onClick={() => handleHubClick(hub)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  selectedHub?.id === hub.id 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800' 
                    : 'border border-transparent'
                }`}
              >
                <div className="text-2xl">{hub.icon}</div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {hub.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {hub.active_posts} posts
                  </div>
                </div>
                {selectedHub?.id === hub.id && (
                  <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                )}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold px-2 mb-3">
                Discover
              </div>
              
              {hubs.filter(h => !followedHubs.includes(h.id)).map(hub => (
                <button
                  key={hub.id}
                  onClick={() => handleHubClick(hub)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <div className="text-2xl">{hub.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{hub.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {hub.member_count} members
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Hub</span>
            </button>
          </div>
        </aside>

        {/* Center - The Feed */}
        <main className="space-y-3">
          {selectedHub && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{selectedHub.icon}</div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedHub.name}
                  </h1>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedHub.member_count.toLocaleString()} members · {selectedHub.active_posts} posts
                  </div>
                </div>
              </div>
            </div>
          )}

          {posts.map(post => (
            <article
              key={post.id}
              onClick={() => handlePostClick(post.id)}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
            >
              <div className="p-4">
                {/* Post Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {selectedHub?.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    by {post.author?.username || 'Anonymous'}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Post Title */}
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                  {post.title}
                </h2>

                {/* Post Preview */}
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-3">
                  {post.content}
                </p>

                {/* Interaction Bar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVote(post.id, 'upvote')
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      post.user_vote === 'upvote'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {post.upvotes}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVote(post.id, 'downvote')
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      post.user_vote === 'downvote'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                    <MessageSquare className="w-4 h-4" />
                    {post.comment_count}
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </main>

        {/* Right Sidebar - People & Trending */}
        <aside className="h-[calc(100vh-2rem)] sticky top-4 overflow-y-auto custom-scrollbar space-y-4">
          {/* Who's Here */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Who's Here
            </h3>
            <div className="space-y-2">
              {activeUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-medium">
                      {user.username[0].toUpperCase()}
                    </div>
                    {user.is_active && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {user.username}
                    </div>
                    {!user.is_active && user.last_seen && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {user.last_seen}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Trending Now
              </h3>
            </div>
            <div className="space-y-3">
              {trendingPosts.map((post, index) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex gap-2">
                    <div className="text-lg font-bold text-slate-400">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                        {post.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{post.upvotes} upvotes</span>
                        <span>·</span>
                        <span>{post.comment_count} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

