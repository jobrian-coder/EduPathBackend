import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessageSquare, ThumbsUp, ThumbsDown, Share2, TrendingUp, Plus, Circle, X, Send, Eye, Menu } from 'lucide-react'
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
}

interface Comment {
  id: string
  author: any
  content: string
  upvotes: number
  downvotes: number
  created_at: string
  parent_comment?: string | null
  replies?: Comment[]
}

export default function HubFeedV2() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { isAuthenticated, user } = useAuth()
  
  const [hubs, setHubs] = useState<Hub[]>([])
  const [feedCache, setFeedCache] = useState<Record<string, Post[]>>({})
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [joinedHubIds, setJoinedHubIds] = useState<string[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Create post form state
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostType, setNewPostType] = useState<string>('discussion')
  const [isExpertPost, setIsExpertPost] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)

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
    if (!newPostTitle.trim() || !newPostContent.trim() || !selectedHub) return
    
    setIsCreatingPost(true)
    
    try {
      const newPost = await api.hubs.createPost({
        hub: selectedHub.id,
        title: newPostTitle,
        content: newPostContent,
        post_type: newPostType,
        is_expert_post: isExpertPost,
        tags: []
      })
      
      // Add new post to feed
      setPosts(prev => [newPost, ...prev])
      
      // Update cache
      setFeedCache(prev => ({
        ...prev,
        [selectedHub.id]: [newPost, ...(prev[selectedHub.id] || [])]
      }))
      
      // Reset form
      setNewPostTitle('')
      setNewPostContent('')
      setNewPostType('discussion')
      setIsExpertPost(false)
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
    navigate(`/hubs/${hub.slug}`, { replace: true })
    
    // Check cache first
    if (feedCache[hub.id]) {
      setPosts(feedCache[hub.id])
    } else {
      // Load from API
      try {
        const { results } = await api.hubs.listPosts({ hub: hub.id })
        setPosts(results)
        setFeedCache(prev => ({ ...prev, [hub.id]: results }))
      } catch (error) {
        console.error('Failed to load posts:', error)
      }
    }
  }, [feedCache, navigate])

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
      
      // Update cache
      if (selectedHub) {
        setFeedCache(prev => ({
          ...prev,
          [selectedHub.id]: posts
        }))
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      // Revert on error
      if (selectedHub) {
        const { results } = await api.hubs.listPosts({ hub: selectedHub.id })
        setPosts(results)
      }
    }
  }

  const handlePostClick = async (postId: string) => {
    setExpandedPostId(postId)
    setIsLoadingComments(true)
    
    try {
      const { results } = await api.hubs.listComments(postId)
      setComments(results)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleClosePost = () => {
    setExpandedPostId(null)
    setComments([])
    setNewComment('')
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !expandedPostId) return
    
    setIsSubmittingComment(true)
    
    // Optimistic update
    const tempComment: Comment = {
      id: 'temp-' + Date.now(),
      author: user || { username: 'You', id: 'temp' },
      content: newComment,
      upvotes: 0,
      downvotes: 0,
      created_at: new Date().toISOString(),
      parent_comment: null,
      replies: []
    }
    
    setComments(prev => [tempComment, ...prev])
    setNewComment('')

    try {
      const result = await api.hubs.createComment({
        post: expandedPostId,
        content: newComment,
        parent_comment: undefined
      })
      
      // Replace temp with real comment
      setComments(prev => prev.map(c => 
        c.id === tempComment.id ? result : c
      ))
      
      // Update post comment count
      setPosts(prev => prev.map(post =>
        post.id === expandedPostId
          ? { ...post, comment_count: post.comment_count + 1 }
          : post
      ))
    } catch (error) {
      console.error('Failed to post comment:', error)
      // Remove temp comment on error
      setComments(prev => prev.filter(c => c.id !== tempComment.id))
      setNewComment(tempComment.content)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !expandedPostId) return
    
    setIsSubmittingComment(true)
    
    try {
      const result = await api.hubs.createComment({
        post: expandedPostId,
        content: replyContent,
        parent_comment: parentCommentId
      })
      
      // Add reply to parent comment
      setComments(prev => prev.map(c => 
        c.id === parentCommentId 
          ? { ...c, replies: [...(c.replies || []), result] }
          : c
      ))
      
      // Update post comment count
      setPosts(prev => prev.map(post =>
        post.id === expandedPostId
          ? { ...post, comment_count: post.comment_count + 1 }
          : post
      ))
      
      // Clear reply state
      setReplyContent('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to post reply:', error)
      alert('Failed to post reply. Please try again.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const expandedPost = posts.find(p => p.id === expandedPostId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500">Loading hubs...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] gap-4 p-2 md:p-4 max-w-[1800px] mx-auto">
        
        {/* Left Sidebar - Hub Navigator (Hidden on mobile, visible on large screens) */}
        <aside className="hidden lg:block lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-3 md:p-4 space-y-2">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold px-2 mb-3">
              Communities
            </div>
            
            {hubs.map(hub => (
              <button
                key={hub.id}
                onClick={() => handleHubSwitch(hub)}
                className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  selectedHub?.id === hub.id 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800' 
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
                  <div className="text-xs md:text-sm font-medium text-slate-900 dark:text-white truncate">
                    {hub.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                    {hub.active_posts} posts
                  </div>
                </div>
                {selectedHub?.id === hub.id && (
                  <Circle className="w-2 h-2 fill-blue-500 text-blue-500 flex-shrink-0" />
                )}
              </button>
            ))}

            <button className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 mt-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all text-sm">
              <Plus className="w-4 h-4" />
              <span className="font-medium hidden md:inline">Create Hub</span>
              <span className="font-medium md:hidden">New</span>
            </button>
          </div>
        </aside>

        {/* Center - Main Feed or Post Detail */}
        <main className="space-y-3 min-w-0">
          {!expandedPostId ? (
            <>
              {/* Hub Header */}
              {selectedHub && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden mb-3 md:mb-4">
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
                        className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                      >
                        <Menu className="w-5 h-5" />
                      </button>

                      {/* Join/Leave Button */}
                      <button
                        onClick={() => joinedHubIds.includes(selectedHub.id) ? handleLeaveHub(selectedHub.id) : handleJoinHub(selectedHub.id)}
                        disabled={isJoining}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
                          joinedHubIds.includes(selectedHub.id)
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {joinedHubIds.includes(selectedHub.id) ? 'Joined' : 'Join'}
                      </button>
                    </div>
                    
                    {/* Create Post Button (only for joined members) */}
                    {joinedHubIds.includes(selectedHub.id) && (
                      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => setShowCreatePost(!showCreatePost)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="font-medium">Create Post</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Posts Feed */}
              {posts.map(post => (
                <article
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <div className="p-3 md:p-4">
                    {/* Post Header */}
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {selectedHub?.name}
                      </span>
                      
                      {/* Level + Post Type Tags */}
                      <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${
                        post.is_expert_post 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {post.is_expert_post ? '⭐ Expert' : '👤 Rookie'} · {
                          post.post_type === 'question' ? '❓' :
                          post.post_type === 'guide' ? '📚' :
                          post.post_type === 'success_story' ? '🎉' : '💬'
                        } {post.post_type.replace('_', ' ')}
                      </span>
                      
                      <span className="text-slate-500 dark:text-slate-400">
                        by {post.author?.username || 'Anonymous'}
                      </span>
                      <span className="text-slate-400 hidden md:inline">·</span>
                      <span className="text-slate-400 hidden md:inline">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Post Title - Clickable */}
                    <h2 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/posts/${post.id}`)
                      }}
                      className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      {post.title}
                      {(post as any).is_edited && (
                        <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400 italic">
                          (edited)
                        </span>
                      )}
                    </h2>

                    {/* Post Preview */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-3">
                      {post.content}
                    </p>

                    {/* Interaction Bar */}
                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVote(post.id, 'upvote')
                        }}
                        className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                          post.user_vote === 'upvote'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3 md:w-4 md:h-4" />
                        {post.upvotes}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVote(post.id, 'downvote')
                        }}
                        className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                          post.user_vote === 'downvote'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3 md:w-4 md:h-4" />
                      </button>

                      <button className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                        <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                        {post.comment_count}
                      </button>

                      {(post as any).view_count > 0 && (
                        <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          {(post as any).view_count}
                        </div>
                      )}

                      <button className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                        <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {/* Create Post Form - Now Below Posts */}
              {showCreatePost && selectedHub && joinedHubIds.includes(selectedHub.id) && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-3 md:p-4 mb-3 md:mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Post</h3>
                    <button
                      onClick={() => setShowCreatePost(false)}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
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
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Content */}
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your thoughts, ask a question, or start a discussion..."
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={5}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Post Type/Tag */}
                      <select
                        value={newPostType}
                        onChange={(e) => setNewPostType(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="question">❓ Question</option>
                        <option value="discussion">💬 Discussion</option>
                        <option value="guide">📚 Guide</option>
                        <option value="success_story">🎉 Success Story</option>
                      </select>
                      
                      {/* Contributor Level */}
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 cursor-pointer hover:border-purple-400 transition-all">
                        <input
                          type="checkbox"
                          checked={isExpertPost}
                          onChange={(e) => setIsExpertPost(e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-900 dark:text-white font-medium">
                          {isExpertPost ? '⭐ Expert Post' : '👤 Regular Post'}
                        </span>
                      </label>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowCreatePost(false)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostTitle.trim() || !newPostContent.trim() || isCreatingPost}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isCreatingPost ? 'Posting...' : 'Post to ' + selectedHub.name}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : expandedPost && (
            // Post Detail View
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                  {selectedHub?.name} › Post
                </div>
                <button
                  onClick={handleClosePost}
                  className="p-1 md:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              {/* Post Content */}
              <div className="p-3 md:p-6">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4">
                  {expandedPost.title}
                </h1>
                
                <div className="flex items-center gap-2 mb-3 md:mb-4 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                  <span>by {expandedPost.author?.username || 'Anonymous'}</span>
                  <span>·</span>
                  <span>{new Date(expandedPost.created_at).toLocaleDateString()}</span>
                </div>

                <div className="text-sm md:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-4 md:mb-6">
                  {expandedPost.content}
                </div>

                {/* Interaction Bar */}
                <div className="flex flex-wrap items-center gap-2 pb-4 md:pb-6 border-b border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleVote(expandedPost.id, 'upvote')}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      expandedPost.user_vote === 'upvote'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {expandedPost.upvotes}
                  </button>

                  <button
                    onClick={() => handleVote(expandedPost.id, 'downvote')}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      expandedPost.user_vote === 'downvote'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>

                  <button className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <MessageSquare className="w-4 h-4" />
                    {expandedPost.comment_count}
                  </button>
                </div>

                {/* Comments Section */}
                <div className="mt-4 md:mt-6">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-3 md:mb-4">
                    Comments
                  </h3>


                  {/* Comments List */}
                  {isLoadingComments ? (
                    <div className="text-center py-8 text-slate-500">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No comments yet. Be the first to comment!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map(comment => (
                        <div key={comment.id}>
                          <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 md:pl-4">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs md:text-sm font-medium flex-shrink-0">
                                {comment.author?.username?.[0]?.toUpperCase() || 'A'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1 text-xs md:text-sm">
                                  <span className="font-medium text-slate-900 dark:text-white">
                                    {comment.author?.username || 'Anonymous'}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    ID: {comment.author?.id?.toString().slice(0, 8) || 'N/A'}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {new Date(comment.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 mb-2">
                                  {comment.content}
                                </p>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  >
                                    {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                                  </button>
                                  <span className="text-xs text-slate-400">·</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {comment.upvotes} upvotes
                                  </span>
                                </div>

                                {/* Reply Input */}
                                {replyingTo === comment.id && (
                                  <div className="mt-3 space-y-2">
                                    <textarea
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder={`Reply to ${comment.author?.username || 'Anonymous'}...`}
                                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setReplyingTo(null)
                                          setReplyContent('')
                                        }}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSubmitReply(comment.id)}
                                        disabled={!replyContent.trim() || isSubmittingComment}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Replies (One Level) */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-8 md:ml-12 mt-3 space-y-3">
                              {comment.replies.map((reply: Comment) => (
                                <div key={reply.id} className="border-l-2 border-blue-200 dark:border-blue-800 pl-3 md:pl-4">
                                  <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                      {reply.author?.username?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-1 mb-1 text-xs">
                                        <span className="font-medium text-slate-900 dark:text-white">
                                          {reply.author?.username || 'Anonymous'}
                                        </span>
                                        <span className="text-slate-400">·</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                          ID: {reply.author?.id?.toString().slice(0, 8) || 'N/A'}
                                        </span>
                                        <span className="text-slate-400">·</span>
                                        <span className="text-slate-500 dark:text-slate-400">
                                          {new Date(reply.created_at).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-slate-700 dark:text-slate-300">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment - Now Below Comments */}
                  {isAuthenticated && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex gap-2">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your thoughts..."
                          className="flex-1 px-3 md:px-4 py-2 md:py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm md:text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || isSubmittingComment}
                          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                        >
                          <Send className="w-4 h-4" />
                          Comment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Only visible on large screens and when no post expanded */}
        {!expandedPostId && (
          <aside className="hidden lg:block h-[calc(100vh-2rem)] sticky top-4 overflow-y-auto custom-scrollbar space-y-4">
            {/* Related Professional Societies */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Related Professional Societies
              </h3>
              <div className="space-y-3">
                {selectedHub?.related_societies?.slice(0, 4).map((society: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {society.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                          {society.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {society.description}
                        </div>
                        <a
                          href={society.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          Visit Website →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => navigate('/societies')}
                  className="w-full text-xs text-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Explore All Societies →
                </button>
              </div>
            </div>

            {/* Trending - Using real post data */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Trending Now
                </h3>
              </div>
              <div className="space-y-3">
                {posts.slice(0, 3).sort((a, b) => b.upvotes - a.upvotes).map((post, index) => (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    <div className="flex gap-2">
                      <div className="text-lg font-bold text-slate-400">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
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
        )}

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileMenu(false)}>
            <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-800 shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                {/* Close Button */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hub Menu</h3>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Sidebar Content */}
                <div className="space-y-4">
                  {/* Related Professional Societies */}
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Related Professional Societies
                    </h4>
                    <div className="space-y-3">
                      {selectedHub?.related_societies?.slice(0, 4).map((society: any, index: number) => (
                        <div key={index} className="p-3 rounded-lg hover:bg-white dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {society.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                                {society.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                {society.description}
                              </div>
                              <a
                                href={society.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                              >
                                Visit Website →
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <button
                        onClick={() => {
                          navigate('/societies')
                          setShowMobileMenu(false)
                        }}
                        className="w-full text-xs text-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Explore All Societies →
                      </button>
                    </div>
                  </div>

                  {/* Trending Now */}
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Trending Now
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {posts.slice(0, 3).sort((a, b) => b.upvotes - a.upvotes).map((post, index) => (
                        <div
                          key={post.id}
                          onClick={() => {
                            handlePostClick(post.id)
                            setShowMobileMenu(false)
                          }}
                          className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-600 transition-all cursor-pointer"
                        >
                          <div className="flex gap-2">
                            <div className="text-lg font-bold text-slate-400">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

