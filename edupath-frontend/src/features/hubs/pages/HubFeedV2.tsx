import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessageSquare, ThumbsUp, ThumbsDown, Share2, TrendingUp, Plus, Circle, Eye, Menu, BookOpen, X, Link2, Image, Users, MapPin, ExternalLink } from 'lucide-react'
import api from '../../../services/api'
import type { Associate } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'
import ProgramTagInput from '../../../components/common/ProgramTagInput'
import ProgramTags from '../../../components/common/ProgramTags'
import FloatingChatButton from '../../chatbot/components/FloatingChatButton'
import { LinkPreviewCard } from '../components/LinkPreviewCard'
import { RoleBadge } from '../components/RoleBadge'

interface Hub {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  member_count: number
  active_posts: number
  related_societies?: Array<{
    name: string
    website: string
    description: string
  }>
}

interface Post {
  id: string
  hub: any
  author: any
  title: string
  content: string
  post_type: string
  is_expert_post: boolean
  upvotes: number
  downvotes: number
  comment_count: number
  user_vote?: string | null
  created_at: string
  tags?: { tag: string; course_id: string; course_name: string }[]
  link_url?: string
  image_url?: string
  author_role?: string
}

export default function HubFeedV2() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { isAuthenticated } = useAuth()
  
  const [hubs, setHubs] = useState<Hub[]>([])
  const [feedCache, setFeedCache] = useState<Record<string, Post[]>>({})
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joinedHubIds, setJoinedHubIds] = useState<string[]>([])
  const [isJoining, setIsJoining] = useState(false)
  
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Create post form state
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostType, setNewPostType] = useState<string>('discussion')
  const [isExpertPost, setIsExpertPost] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [newPostLinkUrl, setNewPostLinkUrl] = useState('')
  const [newPostImageFile, setNewPostImageFile] = useState<File | null>(null)
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null)

  // Associates tab
  const [hubTab, setHubTab] = useState<'posts' | 'associates'>('posts')
  const [associates, setAssociates] = useState<Associate[]>([])
  const [associatesLoading, setAssociatesLoading] = useState(false)

  // Tag filtering
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Feed sort & filter
  const [feedSortBy, setFeedSortBy] = useState<'newest' | 'popular' | 'discussed'>('newest')
  const [feedPostType, setFeedPostType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const displayedPosts = useMemo(() => {
    let result = [...posts]
    if (feedPostType) result = result.filter(p => p.post_type === feedPostType)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.content.toLowerCase().includes(q) ||
        p.tags?.some(t => t.course_name?.toLowerCase().includes(q) || t.tag?.toLowerCase().includes(q))
      )
    }
    result.sort((a, b) => {
      if (feedSortBy === 'popular') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
      if (feedSortBy === 'discussed') return b.comment_count - a.comment_count
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return result
  }, [posts, feedSortBy, feedPostType, searchQuery])

  // Load associates for selected hub
  const loadAssociates = useCallback(async (hubId: string) => {
    setAssociatesLoading(true)
    try {
      const data = await api.associates.listForHub(hubId)
      setAssociates(Array.isArray(data) ? data : [])
    } catch {
      setAssociates([])
    } finally {
      setAssociatesLoading(false)
    }
  }, [])

  // Function definitions BEFORE useEffect hooks
  const loadHubs = async () => {
    try {
      const { results } = await api.hubs.listHubs()
      setHubs(results)
    } catch (error) {
      console.error('Failed to load hubs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadJoinedHubs = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      // Get user's joined hubs from API
      const profile = await api.auth.getProfile()
      if ((profile as any).joined_hubs) {
        setJoinedHubIds((profile as any).joined_hubs.map((h: any) => h.id))
      }
    } catch (error) {
      console.error('Failed to load joined hubs:', error)
    }
  }, [isAuthenticated])

  // Load hubs on mount and whenever authentication changes
  useEffect(() => {
    loadHubs()
  }, [])

  // Load joined hubs whenever authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadJoinedHubs()
    }
  }, [isAuthenticated, loadJoinedHubs])

  // Handle hub selection from URL or default
  useEffect(() => {
    if (hubs.length > 0) {
      if (slug) {
        const hub = hubs.find(h => h.slug === slug)
        if (hub && hub.id !== selectedHub?.id) {
          handleHubSwitch(hub)
        }
      } else if (!selectedHub) {
        handleHubSwitch(hubs[0])
      }
    }
  }, [hubs, slug])

  const handleJoinHub = async (hubId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to join communities')
      return
    }

    setIsJoining(true)
    try {
      await api.hubs.joinHub(hubId)
      setJoinedHubIds(prev => [...prev, hubId])
      
      // Update member count optimistically
      setHubs(prev => prev.map(h => 
        h.id === hubId ? { ...h, member_count: h.member_count + 1 } : h
      ))
      
      // Reload current hub if it's the one we joined
      if (selectedHub?.id === hubId) {
        const { results } = await api.hubs.listHubs()
        const updatedHub = results.find((h: Hub) => h.id === hubId)
        if (updatedHub) setSelectedHub(updatedHub)
      }
    } catch (error) {
      console.error('Failed to join hub:', error)
      alert('Failed to join community. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveHub = async (hubId: string) => {
    setIsJoining(true)
    try {
      await api.hubs.leaveHub(hubId)
      setJoinedHubIds(prev => prev.filter(id => id !== hubId))
      
      // Update member count
      setHubs(prev => prev.map(h => 
        h.id === hubId ? { ...h, member_count: Math.max(0, h.member_count - 1) } : h
      ))
      
      if (selectedHub?.id === hubId) {
        const { results } = await api.hubs.listHubs()
        const updatedHub = results.find((h: Hub) => h.id === hubId)
        if (updatedHub) setSelectedHub(updatedHub)
      }
    } catch (error) {
      console.error('Failed to leave hub:', error)
      alert('Failed to leave community. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !selectedHub) return
    if (newPostType !== 'link' && newPostType !== 'image' && !newPostContent.trim()) return
    
    setIsCreatingPost(true)
    
    try {
      // Build payload — image posts encode preview as data URL into image_url for now
      const payload: any = {
        hub: selectedHub.id,
        title: newPostTitle,
        content: newPostContent,
        post_type: newPostType,
        is_expert_post: isExpertPost,
      }
      if (newPostType === 'link' && newPostLinkUrl.trim()) {
        payload.link_url = newPostLinkUrl.trim()
      }
      if (newPostType === 'image' && newPostImagePreview) {
        payload.image_url = newPostImagePreview
      }

      const newPost = await api.hubs.createPost(payload)

      // Add new post to feed with local enrichment
      const enriched: Post = {
        ...newPost,
        link_url: payload.link_url,
        image_url: payload.image_url,
      }
      setPosts(prev => [enriched, ...prev])
      
      // Update cache
      setFeedCache(prev => ({
        ...prev,
        [selectedHub.id]: [enriched, ...(prev[selectedHub.id] || [])]
      }))
      
      // Reset form
      setNewPostTitle('')
      setNewPostContent('')
      setNewPostType('discussion')
      setIsExpertPost(false)
      setSelectedPrograms([])
      setNewPostLinkUrl('')
      setNewPostImageFile(null)
      setNewPostImagePreview(null)
      setShowCreatePost(false)
      
      // Update hub post count
      setHubs(prev => prev.map(h => 
        h.id === selectedHub.id ? { ...h, active_posts: h.active_posts + 1 } : h
      ))
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleHubSwitch = useCallback(async (hub: Hub) => {
    setSelectedHub(hub)
    setHubTab('posts')
    setAssociates([])
    navigate(`/hubs/${hub.slug}`, { replace: true })
    
    // Load associates for sidebar (non-blocking)
    loadAssociates(hub.id)

    // Check cache first
    if (feedCache[hub.id]) {
      setPosts(feedCache[hub.id])
    } else {
      // Load from API
      try {
        const { results } = await api.hubs.listPosts({ hub: hub.id })
        setPosts(results as Post[])
        setFeedCache(prev => ({ ...prev, [hub.id]: results as Post[] }))
      } catch (error) {
        console.error('Failed to load posts:', error)
      }
    }
  }, [feedCache, navigate, loadAssociates])

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      alert('Please sign in to vote')
      return
    }

    // Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post

      const wasUpvoted = post.user_vote === 'upvote'
      const wasDownvoted = post.user_vote === 'downvote'

      let newUpvotes = post.upvotes
      let newDownvotes = post.downvotes
      let newUserVote: string | null = voteType

      if (voteType === 'upvote') {
        if (wasUpvoted) {
          newUpvotes--
          newUserVote = null
        } else {
          newUpvotes++
          if (wasDownvoted) newDownvotes--
        }
      } else {
        if (wasDownvoted) {
          newDownvotes--
          newUserVote = null
        } else {
          newDownvotes++
          if (wasUpvoted) newUpvotes--
        }
      }

      return {
        ...post,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        user_vote: newUserVote
      }
    }))

    // Real API call
    try {
      const currentPost = posts.find(p => p.id === postId)
      if (currentPost?.user_vote === voteType) {
        await api.hubs.unvotePost(postId)
      } else {
        await api.hubs.votePost(postId, voteType)
      }
      if (selectedHub) {
        setFeedCache(prev => ({ ...prev, [selectedHub.id]: posts }))
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      if (selectedHub) {
        const { results } = await api.hubs.listPosts({ hub: selectedHub.id })
        setPosts(results as Post[])
      }
    }
  }

  const handleTagClick = async (tagSlug: string) => {
    setActiveTag(tagSlug)
    try {
      const { results } = await api.hubs.getPostsByTag(tagSlug)
      setPosts(results as Post[])
    } catch (error) {
      console.error('Failed to load posts by tag:', error)
    }
  }

  const handleFollowAssociate = async (associateId: number, isFollowing: boolean) => {
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }

    // Optimistic update
    setAssociates(prev => prev.map(assoc => {
      if (assoc.id !== associateId) return assoc
      return {
        ...assoc,
        is_following: !isFollowing,
        follower_count: assoc.follower_count + (isFollowing ? -1 : 1),
      }
    }))

    try {
      if (isFollowing) {
        await api.associates.unfollow(associateId)
      } else {
        await api.associates.follow(associateId)
      }
    } catch {
      // Revert on error
      setAssociates(prev => prev.map(assoc => {
        if (assoc.id !== associateId) return assoc
        return {
          ...assoc,
          is_following: isFollowing,
          follower_count: assoc.follower_count + (isFollowing ? 1 : -1),
        }
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <div className="text-slate-600 dark:text-slate-300">Loading hubs...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/60 dark:to-teal-950/60">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] gap-4 p-2 md:p-4 max-w-[1800px] mx-auto">
        
        {/* Left Sidebar - Hub Navigator (Hidden on mobile, visible on large screens) */}
        <aside className="hidden lg:block lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-3 md:p-4 space-y-2">
            <div className="text-xs uppercase tracking-wide text-teal-600 dark:text-teal-400 font-semibold px-2 mb-3">
              Communities
            </div>
            
            {hubs.map(hub => (
                  <button
                key={hub.id}
                onClick={() => handleHubSwitch(hub)}
                className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-xl transition-all hover:bg-teal-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 ${
                  selectedHub?.id === hub.id 
                    ? 'bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-950/40 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-800' 
                    : 'border border-transparent'
                }`}
              >
                {(hub as any).icon_url ? (
                  <img 
                    src={(hub as any).icon_url} 
                    alt={hub.name}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="text-xl md:text-2xl">{hub.icon}</div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs md:text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {hub.name}
                  </div>
                  <div className="text-xs text-teal-600 hidden md:block">
                    {hub.active_posts} posts
                  </div>
                </div>
                {selectedHub?.id === hub.id && (
                  <Circle className="w-2 h-2 fill-teal-500 text-teal-500 flex-shrink-0" />
                )}
              </button>
            ))}

            <button className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 mt-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-teal-600 dark:text-teal-400 hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-sm">
              <Plus className="w-4 h-4" />
              <span className="font-medium hidden md:inline">Create Hub</span>
              <span className="font-medium md:hidden">New</span>
            </button>
          </div>
        </aside>

        {/* Center - Main Feed */}
        <main className="space-y-3 min-w-0">
          {/* Hub Header */}
          {selectedHub && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-6 mb-3 md:mb-4">
              {/* Background Image */}
              {(selectedHub as any).icon_url && (
                <div 
                  className="h-32 md:h-40 bg-cover bg-center relative"
                  style={{ 
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${(selectedHub as any).icon_url})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                  }}
                >
                  <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 flex items-center gap-2 md:gap-3">
                    <img 
                      src={(selectedHub as any).icon_url} 
                      alt={selectedHub.name}
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg flex-shrink-0"
                    />
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                        {selectedHub.name}
                      </h1>
                      <div className="text-xs md:text-sm text-white/90 drop-shadow">
                        {selectedHub.member_count.toLocaleString()} members · {selectedHub.active_posts} posts
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Content Section */}
              <div className="p-3 md:p-4">
                <div className="flex items-center justify-between gap-2 md:gap-3">
                  {!(selectedHub as any).icon_url && (
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="text-3xl md:text-4xl">{selectedHub.icon}</div>
                      <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                          {selectedHub.name}
                        </h1>
                        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                          {selectedHub.member_count.toLocaleString()} members · {selectedHub.active_posts} posts
                        </div>
                      </div>
                    </div>
                  )}
                
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="lg:hidden p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  {/* Join/Leave Button */}
                  <button
                    onClick={() => joinedHubIds.includes(selectedHub.id) ? handleLeaveHub(selectedHub.id) : handleJoinHub(selectedHub.id)}
                    disabled={isJoining}
                    className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
                      joinedHubIds.includes(selectedHub.id)
                        ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {joinedHubIds.includes(selectedHub.id) ? 'Joined' : 'Join'}
                  </button>
                </div>
                
              </div>
            </div>
          )}

          {/* Tab switcher */}
          {selectedHub && (
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setHubTab('posts')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  hubTab === 'posts'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => {
                  setHubTab('associates')
                  if (associates.length === 0) loadAssociates(selectedHub.id)
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  hubTab === 'associates'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Users className="w-4 h-4" />
                Associates
              </button>
            </div>
          )}

          {/* Active Tag Filter */}
          {activeTag && (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-800/50">
              <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                Filtered by: <span className="font-bold">#{activeTag}</span>
              </span>
              <button
                onClick={async () => {
                  setActiveTag(null)
                  if (selectedHub) {
                    const data = await api.hubs.listPosts({ hub: selectedHub.id })
                    setPosts(data.results)
                  }
                }}
                className="p-1 rounded hover:bg-teal-200 dark:hover:bg-teal-800/50 text-teal-600 dark:text-teal-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Associates Grid */}
          {hubTab === 'associates' && selectedHub && (
            <div>
              {associatesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : associates.length === 0 ? (
                <div className="text-center py-16 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No Associates in this hub yet. Know a mentor or organisation that should be here? Share EduPath with them.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {associates.map(assoc => {
                    const badgeCls =
                      assoc.associate_type === 'MENTOR'  ? 'bg-violet-500/20 text-violet-600 border-violet-500/30' :
                      assoc.associate_type === 'SOCIETY' ? 'bg-blue-500/20 text-blue-600 border-blue-500/30' :
                                                           'bg-amber-500/20 text-amber-600 border-amber-500/30'
                    return (
                      <div key={assoc.id} className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          {assoc.profile_image ? (
                            <img src={assoc.profile_image} alt={assoc.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {assoc.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{assoc.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeCls}`}>
                                {assoc.associate_type.charAt(0) + assoc.associate_type.slice(1).toLowerCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {assoc.location && (
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{assoc.location}
                                </p>
                              )}
                              <p className="text-xs text-slate-500">{assoc.follower_count} followers</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{assoc.bio}</p>
                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={() => navigate(`/hubs/${selectedHub.id}/associates/${assoc.id}`)}
                            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-medium hover:from-teal-600 hover:to-cyan-600 transition-all"
                          >
                            View Page
                          </button>
                          <button
                            onClick={() => handleFollowAssociate(assoc.id, assoc.is_following)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              assoc.is_following
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                            }`}
                          >
                            {assoc.is_following ? 'Following' : 'Follow'}
                          </button>
                          {assoc.website && (
                            <a
                              href={assoc.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-teal-500 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Posts Feed with Associate post interleaving */}
          {hubTab === 'posts' && (() => {
            const items: React.ReactNode[] = []
            let assocIdx = 0

            if (displayedPosts.length > 0 || feedPostType) {
              items.push(
                <div key="sort-bar" className="flex flex-wrap gap-2 items-center p-2.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 text-xs">
                    {([['newest', 'Newest'], ['popular', 'Top'], ['discussed', 'Most Discussed']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={e => { e.stopPropagation(); setFeedSortBy(val) }}
                        className={`px-3 py-1.5 font-medium transition-colors ${
                          feedSortBy === val
                            ? 'bg-teal-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <select
                    value={feedPostType}
                    onChange={e => { e.stopPropagation(); setFeedPostType(e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">All types</option>
                    <option value="question">❓ Questions</option>
                    <option value="guide">📚 Guides</option>
                    <option value="discussion">💬 Discussions</option>
                    <option value="success_story">🎉 Success Stories</option>
                  </select>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { e.stopPropagation(); setSearchQuery(e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    placeholder="Search posts..."
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-48 ml-auto"
                  />
                  <span className="text-xs text-slate-400">{displayedPosts.length} posts</span>
                </div>
              )
            }

            displayedPosts.forEach((post, idx) => {
              // Insert associate post banner every 5 student posts
              if (idx > 0 && idx % 5 === 0 && assocIdx < associates.length) {
                const assoc = associates[assocIdx++]
                items.push(
                  <div key={`assoc-banner-${assoc.id}`} className="rounded-2xl border border-teal-200 dark:border-teal-800/50 bg-teal-50/60 dark:bg-teal-950/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-teal-100/80 dark:bg-teal-900/30 border-b border-teal-200 dark:border-teal-800/40">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide">From our Associates</span>
                    </div>
                    <div
                      className="p-4 flex items-start gap-3 cursor-pointer hover:bg-teal-100/40 dark:hover:bg-teal-900/20 transition-colors"
                      onClick={() => navigate(`/hubs/${selectedHub?.id}/associates/${assoc.id}`)}
                    >
                      {assoc.profile_image ? (
                        <img src={assoc.profile_image} alt={assoc.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {assoc.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{assoc.name}</p>
                        <p className="text-xs text-teal-600 dark:text-teal-400 mb-1">{assoc.associate_type.charAt(0) + assoc.associate_type.slice(1).toLowerCase()} · {assoc.follower_count} followers</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{assoc.bio}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleFollowAssociate(assoc.id, assoc.is_following) }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          assoc.is_following
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            : 'bg-teal-600 text-white hover:bg-teal-500'
                        }`}
                      >
                        {assoc.is_following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  </div>
                )
              }

              items.push(
                <article
                  key={post.id}
                  onClick={() => navigate(`/posts/${post.id}`)}
                  className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-400/40"
                >
                  <div className="p-3 md:p-4">
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700">
                        {selectedHub?.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${
                        post.post_type === 'link'  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        post.post_type === 'image' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' :
                        post.is_expert_post        ? 'bg-teal-200 text-teal-800' : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {post.post_type === 'link'  ? '🔗 Link' :
                         post.post_type === 'image' ? '🖼️ Image' :
                         post.is_expert_post ? '⭐ Expert' : '👤 Rookie'} · {
                          post.post_type === 'question'      ? '❓' :
                          post.post_type === 'guide'         ? '📚' :
                          post.post_type === 'success_story' ? '🎉' :
                          post.post_type === 'link'          ? '' :
                          post.post_type === 'image'         ? '' : '💬'
                        } {!['link','image'].includes(post.post_type) && post.post_type.replace('_', ' ')}
                      </span>
                      <span className="text-teal-600 flex items-center gap-1">
                        by {post.author?.username || 'Anonymous'}
                        {post.author_role && <RoleBadge role={post.author_role as any} size="sm" />}
                        {post.is_expert_post && !post.author_role && <RoleBadge role="mentor" size="sm" />}
                      </span>
                      <span className="text-teal-400 hidden md:inline">·</span>
                      <span className="text-teal-400 hidden md:inline">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 line-clamp-2 hover:text-teal-600 dark:hover:text-teal-300 cursor-pointer transition-colors">
                      {post.title}
                      {(post as any).is_edited && (
                        <span className="ml-2 text-xs font-normal text-teal-600 italic">(edited)</span>
                      )}
                    </h2>

                    {post.post_type !== 'link' && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 mb-3">{post.content}</p>
                    )}
                    {post.post_type === 'link' && post.link_url && (
                      <LinkPreviewCard url={post.link_url} title={post.content || undefined} />
                    )}
                    {post.post_type === 'image' && post.image_url && (
                      <div className="mt-2 mb-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-72">
                        <img src={post.image_url} alt={post.title} className="w-full object-cover max-h-72" onClick={e => e.stopPropagation()} />
                      </div>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map(tag => (
                          <button
                            key={tag.tag}
                            onClick={e => { e.stopPropagation(); handleTagClick(tag.tag) }}
                            className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-xs font-medium hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                          >
                            #{tag.course_name}
                          </button>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">+{post.tags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleVote(post.id, 'upvote') }}
                        className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${post.user_vote === 'upvote' ? 'bg-teal-200 dark:bg-teal-800/40 text-teal-700 dark:text-teal-300' : 'bg-teal-50 dark:bg-slate-700 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-slate-600'}`}
                      >
                        <ThumbsUp className="w-3 h-3 md:w-4 md:h-4" />{post.upvotes}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleVote(post.id, 'downvote') }}
                        className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${post.user_vote === 'downvote' ? 'bg-cyan-200 dark:bg-cyan-800/40 text-cyan-700 dark:text-cyan-300' : 'bg-cyan-50 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-slate-600'}`}
                      >
                        <ThumbsDown className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-teal-50 dark:bg-slate-700 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-slate-600 transition-all">
                        <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />{post.comment_count}
                      </button>
                      {(post as any).view_count > 0 && (
                        <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-teal-600">
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />{(post as any).view_count}
                        </div>
                      )}
                      <button className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-teal-50 dark:bg-slate-700 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-slate-600 transition-all">
                        <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })

            return items
          })()}

          {/* Create Post Form - Now Below Posts */}
          {showCreatePost && selectedHub && (
            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 md:p-4 mb-3 md:mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Create Post</h3>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-teal-600 hover:text-teal-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Title */}
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Post title..."
                  className="w-full px-4 py-2.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                
                {/* Content */}
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts, ask a question, or start a discussion..."
                  className="w-full px-4 py-3 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={5}
                />
                
                {/* Program Tagging */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    Tag Programs (Optional)
                  </label>
                  <ProgramTagInput
                    selectedPrograms={selectedPrograms}
                    onProgramsChange={setSelectedPrograms}
                    placeholder="Search for programs like 'Computer Science', 'Medicine'..."
                    maxPrograms={5}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Post Type/Tag */}
                  <select
                    value={newPostType}
                    onChange={(e) => {
                      setNewPostType(e.target.value)
                      setNewPostLinkUrl('')
                      setNewPostImageFile(null)
                      setNewPostImagePreview(null)
                    }}
                    className="px-4 py-2.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="question">❓ Question</option>
                    <option value="discussion">💬 Discussion</option>
                    <option value="guide">📚 Guide</option>
                    <option value="success_story">🎉 Success Story</option>
                    <option value="link">🔗 Share a Link</option>
                    <option value="image">🖼️ Share an Image</option>
                  </select>
                  
                  {/* Contributor Level */}
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900/40 cursor-pointer hover:border-teal-400 transition-all">
                    <input
                      type="checkbox"
                      checked={isExpertPost}
                      onChange={(e) => setIsExpertPost(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {isExpertPost ? '⭐ Expert / Mentor Post' : '👤 Regular Post'}
                    </span>
                  </label>
                </div>

                {/* Link URL Input */}
                {newPostType === 'link' && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                    <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <input
                      type="url"
                      value={newPostLinkUrl}
                      onChange={(e) => setNewPostLinkUrl(e.target.value)}
                      placeholder="Paste a URL (e.g. https://moringaschool.com/courses)"
                      className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* Image Upload */}
                {newPostType === 'image' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-pink-300 dark:border-pink-700 bg-pink-50 dark:bg-pink-950/20 cursor-pointer hover:border-pink-400 transition-all">
                      <Image className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {newPostImageFile ? newPostImageFile.name : 'Click to upload image (PNG, JPG, GIF)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setNewPostImageFile(file)
                          const reader = new FileReader()
                          reader.onload = (ev) => setNewPostImagePreview(ev.target?.result as string)
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                    {newPostImagePreview && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48">
                        <img src={newPostImagePreview} alt="preview" className="w-full object-cover max-h-48" />
                        <button
                          type="button"
                          onClick={() => { setNewPostImageFile(null); setNewPostImagePreview(null) }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="px-4 py-2.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={
                      !newPostTitle.trim() || isCreatingPost ||
                      (newPostType === 'link' && !newPostLinkUrl.trim()) ||
                      (newPostType === 'image' && !newPostImagePreview) ||
                      (!['link','image'].includes(newPostType) && !newPostContent.trim())
                    }
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isCreatingPost ? 'Posting...' : 'Post to ' + selectedHub.name}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Only visible on large screens */}
        {selectedHub && (
          <aside className="hidden lg:block h-[calc(100vh-2rem)] sticky top-4 overflow-y-auto custom-scrollbar space-y-4">
            {/* Associates Sidebar Widget — shown above societies */}
            {associates.length > 0 && (
              <div className="bg-white dark:bg-slate-900/40 rounded-2xl shadow-sm border border-teal-100 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-teal-500" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Associates</h3>
                </div>
                <div className="space-y-3">
                  {associates.slice(0, 3).map(assoc => (
                    <div
                      key={assoc.id}
                      onClick={() => navigate(`/hubs/${selectedHub.id}/associates/${assoc.id}`)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
                    >
                      {assoc.profile_image ? (
                        <img src={assoc.profile_image} alt={assoc.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {assoc.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{assoc.name}</div>
                        <div className="text-xs text-teal-600">{assoc.associate_type.charAt(0) + assoc.associate_type.slice(1).toLowerCase()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {associates.length > 3 && (
                  <button
                    onClick={() => setHubTab('associates')}
                    className="w-full mt-3 text-xs text-center text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    View all {associates.length} associates →
                  </button>
                )}
              </div>
            )}

            {/* Related Professional Societies */}
            <div className="bg-white dark:bg-slate-900/40 rounded-2xl shadow-sm border border-teal-100 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Related Hubs
              </h3>
              <div className="space-y-3">
                {selectedHub?.related_societies?.slice(0, 4).map((society: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800/60 transition-all border border-teal-100 dark:border-teal-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                        {society.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                          {society.name}
                        </div>
                        <div className="text-xs text-teal-600 line-clamp-2 mt-1">
                          {society.description}
                        </div>
                        <a
                          href={society.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          Visit Website →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-teal-200">
                <button
                  onClick={() => navigate('/hubs')}
                  className="w-full text-xs text-center text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Explore All Hubs →
                </button>
              </div>
            </div>

            {/* Trending - Using real post data */}
            <div className="bg-white dark:bg-slate-900/40 rounded-2xl shadow-sm border border-teal-100 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-teal-500" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Trending Now
                </h3>
              </div>
              <div className="space-y-3">
                {posts.slice(0, 3).sort((a, b) => b.upvotes - a.upvotes).map((post, index) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/posts/${post.id}`)}
                      className="p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                  >
                    <div className="flex gap-2">
                      <div className="text-lg font-bold text-teal-500">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                          {post.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-teal-600">
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
        )}

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileMenu(false)}>
            <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-900/70 shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                {/* Close Button */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Hub Menu</h3>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 rounded-lg hover:bg-teal-50 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Sidebar Content */}
                <div className="space-y-4">
                  {/* Related Professional Societies */}
                  <div className="bg-teal-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      Related Hubs
                    </h4>
                    <div className="space-y-3">
                      {selectedHub?.related_societies?.slice(0, 4).map((society: any, index: number) => (
                        <div key={index} className="p-3 rounded-lg hover:bg-white transition-all border border-teal-200">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                              {society.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                {society.name}
                              </div>
                              <div className="text-xs text-teal-600 line-clamp-2 mt-1">
                                {society.description}
                              </div>
                              <a
                                href={society.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-xs text-teal-600 hover:text-teal-700 transition-colors"
                              >
                                Visit Website →
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-teal-200">
                      <button
                        onClick={() => {
                          navigate('/hubs')
                          setShowMobileMenu(false)
                        }}
                        className="w-full text-xs text-center text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        Explore All Hubs →
                      </button>
                    </div>
                  </div>

                  {/* Trending Now */}
                  <div className="bg-teal-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-teal-500" />
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Trending Now
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {posts.slice(0, 3).sort((a, b) => b.upvotes - a.upvotes).map((post, index) => (
                        <div
                          key={post.id}
                          onClick={() => {
                            navigate(`/posts/${post.id}`)
                            setShowMobileMenu(false)
                          }}
                          className="p-2 rounded-lg hover:bg-white transition-all cursor-pointer"
                        >
                          <div className="flex gap-2">
                            <div className="text-lg font-bold text-teal-500">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                {post.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-teal-600">
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Create Post Button */}
        {selectedHub && (
          <button
            onClick={() => {
              console.log('Create post button clicked, current state:', showCreatePost)
              setShowCreatePost(!showCreatePost)
            }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center z-50"
            title="Create Post"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Floating Chat Button */}
        {selectedHub && (
          <FloatingChatButton 
            hubId={selectedHub.id}
            contextType="hub_general"
            position="bottom-right"
          />
        )}
      </div>
    </div>
  )
}