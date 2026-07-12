import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  MapPin, Globe, Plus, ArrowLeft, Edit2, ExternalLink, Calendar, 
  ThumbsUp, Trash2, AlertTriangle, MessageSquare, Image as ImageIcon, X 
} from 'lucide-react'
import api from '../../../services/api'
import type { Associate, AssociatePost, User } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  MENTOR:  { label: 'Mentor',  cls: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  SOCIETY: { label: 'Society', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  SCHOOL:  { label: 'School',  cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; cls: string }> = {
  UPDATE:      { label: 'Update',      icon: '📢', cls: 'bg-slate-600/20 text-slate-300 border-slate-600/30' },
  OPPORTUNITY: { label: 'Opportunity', icon: '🎯', cls: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  EVENT:       { label: 'Event',       icon: '📅', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  RESOURCE:    { label: 'Resource',    icon: '📚', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
}

const HUB_ACCENT_COLORS: Record<string, string> = {
  'Business & Finance': 'from-blue-600 to-cyan-600',
  'Technology & Engineering': 'from-violet-600 to-purple-600',
  'Health & Medicine': 'from-emerald-600 to-teal-600',
  'Law & Governance': 'from-amber-600 to-orange-600',
  'Education & Teaching': 'from-pink-600 to-rose-600',
  'Media & Creative Arts': 'from-fuchsia-600 to-pink-600',
  'Agriculture & Environment': 'from-green-600 to-emerald-600',
  'Hospitality & Tourism': 'from-orange-600 to-amber-600',
  'Manufacturing & Industry': 'from-slate-600 to-gray-600',
  'Sports & Recreation': 'from-red-600 to-orange-600',
}

export default function AssociatePage() {
  const { associateId } = useParams<{ associateId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [associate, setAssociate] = useState<Associate | null>(null)
  const [posts, setPosts] = useState<AssociatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  
  // Post creation state (for owners)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPostType, setNewPostType] = useState<'UPDATE' | 'OPPORTUNITY' | 'EVENT' | 'RESOURCE'>('UPDATE')
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostBody, setNewPostBody] = useState('')
  const [newPostUrl, setNewPostUrl] = useState('')
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null)
  const [creatingPost, setCreatingPost] = useState(false)
  
  // Delete confirmation
  const [deletePostId, setDeletePostId] = useState<number | null>(null)
  const [deletingPost, setDeletingPost] = useState(false)

  useEffect(() => {
    if (!associateId) return

    const id = parseInt(associateId, 10)

    Promise.all([
      api.associates.getDetails(id),
      api.associates.listPosts(id),
    ])
      .then(([associateData, postsData]) => {
        setAssociate(associateData)
        setPosts(postsData)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [associateId])

  // Check if current user is the owner of this associate profile
  const isOwner = isAuthenticated && associate && user && associate.user === user.id

  const handleFollow = async () => {
    if (!associate || !isAuthenticated) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setFollowLoading(true)
    const wasFollowing = associate.is_following

    setAssociate({
      ...associate,
      is_following: !wasFollowing,
      follower_count: associate.follower_count + (wasFollowing ? -1 : 1),
    })

    try {
      if (wasFollowing) {
        await api.associates.unfollow(associate.id)
      } else {
        await api.associates.follow(associate.id)
      }
    } catch {
      setAssociate({
        ...associate,
        is_following: wasFollowing,
        follower_count: associate.follower_count + (wasFollowing ? 1 : -1),
      })
    } finally {
      setFollowLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostBody.trim()) return
    
    setCreatingPost(true)
    try {
      // Use FormData for multipart file upload
      const formData = new FormData()
      formData.append('post_type', newPostType)
      if (newPostTitle) formData.append('title', newPostTitle)
      formData.append('body', newPostBody)
      if (newPostUrl) formData.append('external_url', newPostUrl)
      if (newPostImage) formData.append('image', newPostImage)
      
      const response = await fetch('http://127.0.0.1:8000/api/associates/me/posts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create post')
      }
      
      const newPost = await response.json()
      setPosts([newPost, ...posts])
      setShowCreateForm(false)
      setNewPostTitle('')
      setNewPostBody('')
      setNewPostUrl('')
      setNewPostImage(null)
      setNewPostImagePreview(null)
    } catch (e: any) {
      alert(e?.message || 'Failed to create post')
    } finally {
      setCreatingPost(false)
    }
  }
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewPostImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewPostImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleRemoveImage = () => {
    setNewPostImage(null)
    setNewPostImagePreview(null)
  }

  const handleDeletePost = async () => {
    if (!deletePostId) return
    setDeletingPost(true)
    try {
      await api.associates.deletePost(deletePostId)
      setPosts(posts.filter(p => p.id !== deletePostId))
      setDeletePostId(null)
    } catch (e: any) {
      alert(e?.message || 'Failed to delete post')
    } finally {
      setDeletingPost(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !associate) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <p>Associate not found or no longer active.</p>
        <button onClick={() => navigate(-1)} className="text-teal-400 hover:underline">Go back</button>
      </div>
    )
  }

  const badge = TYPE_BADGE[associate.associate_type] ?? TYPE_BADGE.MENTOR
  const accentColor = HUB_ACCENT_COLORS[(associate as any).hub] || 'from-teal-600 to-cyan-600'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Delete confirmation modal */}
      {deletePostId !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold text-lg">Delete Post?</h3>
            <p className="text-slate-400 text-sm">This cannot be undone. The post will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePostId(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                disabled={deletingPost}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {deletingPost ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Header with banner */}
      <div className="relative">
        {/* Banner */}
        <div className={`w-full h-48 bg-gradient-to-r ${accentColor}`} />
        
        {/* Header content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative -mt-12">
            {/* Profile image overlapping banner */}
            <div className="flex items-end gap-4 mb-4">
              {associate.profile_image ? (
                <img 
                  src={associate.profile_image} 
                  alt={associate.name} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-950 flex-shrink-0" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-950 flex-shrink-0">
                  {associate.name.charAt(0)}
                </div>
              )}
              
              <div className="flex-1 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{associate.name}</h1>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                  {associate.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{associate.location}</span>
                  )}
                  {associate.website && (
                    <a href={associate.website} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-teal-400 hover:text-teal-300 underline">
                      <Globe className="w-3.5 h-3.5" />{associate.website}
                    </a>
                  )}
                </div>
              </div>

              {/* Action buttons - Show Edit/Post for owner, Follow for others */}
              <div className="flex items-center gap-2">
                {isOwner ? (
                  <>
                    <Link
                      to="/associates/dashboard"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Profile
                    </Link>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" /> New Post
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      associate.is_following
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-teal-600 text-white hover:bg-teal-500'
                    } disabled:opacity-50`}
                  >
                    {followLoading ? 'Loading...' : associate.is_following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 py-4 border-b border-slate-800">
              <div className="text-center">
                <div className="text-white font-bold text-lg">{posts.length}</div>
                <div className="text-slate-400 text-sm">posts</div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-lg">{associate.follower_count}</div>
                <div className="text-slate-400 text-sm">followers</div>
              </div>
            </div>

            {/* Bio */}
            <div className="py-4">
              <p className="text-slate-300 text-sm leading-relaxed">{associate.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Form (for owners) */}
      {isOwner && showCreateForm && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Create New Post</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {(['UPDATE', 'OPPORTUNITY', 'EVENT', 'RESOURCE'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setNewPostType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    newPostType === type 
                      ? 'bg-teal-600 border-teal-600 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {TYPE_CONFIG[type].icon} {TYPE_CONFIG[type].label}
                </button>
              ))}
            </div>
            
            <input
              type="text"
              placeholder="Title (optional)"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            
            <textarea
              placeholder="What's on your mind?"
              value={newPostBody}
              onChange={(e) => setNewPostBody(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            
            <input
              type="url"
              placeholder="External URL (optional)"
              value={newPostUrl}
              onChange={(e) => setNewPostUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Add Image (optional)</label>
              {!newPostImagePreview ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="post-image-upload"
                  />
                  <label
                    htmlFor="post-image-upload"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-slate-800/50 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-400">Click to upload image</span>
                  </label>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={newPostImagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostBody.trim() || creatingPost}
                className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {creatingPost ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-slate-400">
              {isOwner ? 'Create your first post to share updates with your followers.' : "This associate hasn't posted anything yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                isOwner={isOwner} 
                onDelete={() => setDeletePostId(post.id)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PostCard({ post, isOwner, onDelete }: { post: AssociatePost; isOwner?: boolean; onDelete?: () => void }) {
  const typeConfig = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.UPDATE

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/50 transition-all">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          {post.associate_image ? (
            <img src={post.associate_image} alt={post.associate_name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              {post.associate_name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{post.associate_name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-300 border border-emerald-500/30">
                VERIFIED ASSOCIATE
              </span>
              <span className="text-xs text-slate-500">
                {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${typeConfig.cls}`}>
            {typeConfig.icon} {typeConfig.label}
          </span>
          {isOwner && onDelete && (
            <button 
              onClick={onDelete}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Image Banner for posts with images */}
        {post.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img src={post.image_url} alt="" className="w-full h-48 object-cover" />
          </div>
        )}
        
        {post.title && (
          <h3 className="text-white font-semibold text-lg mb-2">{post.title}</h3>
        )}
        
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
        
        {post.external_url && (
          <a 
            href={post.external_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {post.cta_label || 'Learn more'}
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-teal-400 transition-colors text-sm">
            <ThumbsUp className="w-4 h-4" />
            {post.upvotes || 0}
          </button>
          <span className="flex items-center gap-1.5 text-slate-500 text-sm">
            <MessageSquare className="w-4 h-4" />
            Comments coming soon
          </span>
        </div>
        
        {post.deadline && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            Deadline: {new Date(post.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
