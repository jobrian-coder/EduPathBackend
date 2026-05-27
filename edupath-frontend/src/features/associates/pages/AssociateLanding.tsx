import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, Grid, LayoutGrid, Users, MapPin, Globe, Calendar, Heart, Share2, AlertCircle, CheckCircle, Clock, ArrowRight, Edit, Trash2, Image, FileText, Link as LinkIcon, Megaphone } from 'lucide-react'
import api from '../../../services/api'
import type { Associate, AssociatePost, Hub } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'

type ApplicationStatus = {
  has_application: boolean
  is_verified: boolean
  application_status: 'PENDING' | 'AWAITING_RESPONSE' | 'APPROVED' | 'REJECTED' | null
  is_suspended: boolean
  rejection_reason: string | null
}

const TYPE_CONFIG = {
  UPDATE:      { label: 'Update',      icon: '📢', cls: 'bg-slate-600/20 text-slate-300 border-slate-600/30' },
  OPPORTUNITY: { label: 'Opportunity', icon: '🎯', cls: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  EVENT:       { label: 'Event',       icon: '📅', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  RESOURCE:    { label: 'Resource',    icon: '📚', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
}

const ASSOCIATE_TYPE_BADGE: Record<string, string> = {
  MENTOR:  'bg-teal-500/20 text-teal-300 border-teal-500/30',
  SOCIETY: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  SCHOOL:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const POST_TYPE_OPTIONS = [
  { type: 'UPDATE', icon: FileText, label: 'Text Update', desc: 'Share news & announcements' },
  { type: 'OPPORTUNITY', icon: Megaphone, label: 'Ad / Banner', desc: 'Promote opportunities with images' },
  { type: 'EVENT', icon: Calendar, label: 'Event', desc: 'Workshops, seminars, meetups' },
  { type: 'RESOURCE', icon: LinkIcon, label: 'Link / Resource', desc: 'Share useful links & materials' },
]

export default function AssociateLanding() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const [myPosts, setMyPosts] = useState<AssociatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [myAssociate, setMyAssociate] = useState<Associate | null>(null)
  const [hubs, setHubs] = useState<Hub[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'hubs'>('profile')
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null)
  const [showPostTypeSelector, setShowPostTypeSelector] = useState(false)

  useEffect(() => {
    // Wait for auth to finish initializing before checking authentication
    if (authLoading) return

    const load = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/auth')
          return
        }

        // First check application status
        try {
          const status = await api.associates.getApplicationStatus()
          setAppStatus(status)

          if (status.has_application && status.is_verified && !status.is_suspended) {
            // Verified associate - load full data
            const assoc = await api.associates.getMe()
            setMyAssociate(assoc)
            const posts = await api.associates.listPosts(assoc.id)
            setMyPosts(posts)
          }
          
          // Always load hubs for display
          const { results: hubResults } = await api.hubs.listHubs()
          setHubs(hubResults)
        } catch (err) {
          console.error('Failed to load application status:', err)
        }
      } catch (error) {
        console.error('Failed to load associate data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated, authLoading, navigate])

  const handleLogout = () => {
    localStorage.removeItem('edupath.auth.token')
    localStorage.removeItem('edupath.user')
    localStorage.removeItem('edupath.associate.mode')
    window.location.href = '/auth'
  }

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await api.associates.deletePost(postId)
      setMyPosts(myPosts.filter(p => p.id !== postId))
    } catch (err) {
      alert('Failed to delete post')
    }
  }

  const getStatusDisplay = () => {
    if (!appStatus?.has_application) {
      return { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'Not Applied', action: 'Apply Now' }
    }
    switch (appStatus.application_status) {
      case 'PENDING':
        return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'Pending Review', action: null }
      case 'AWAITING_RESPONSE':
        return { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'Awaiting Your Response', action: 'View Details' }
      case 'REJECTED':
        return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'Not Approved', action: 'Reapply' }
      case 'APPROVED':
      default:
        if (appStatus.is_suspended) {
          return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'Suspended', action: 'Contact Support' }
        }
        return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'Verified Associate', action: null }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statusDisplay = getStatusDisplay()
  const StatusIcon = statusDisplay.icon
  const isVerified = appStatus?.is_verified && !appStatus?.is_suspended

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Custom Header - No Navbar */}
      <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">EduPath Associates</h1>
              <p className="text-xs text-slate-400">{isVerified ? `Welcome, ${myAssociate?.name || user?.first_name}` : 'Partner Portal'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusDisplay.bg} border ${statusDisplay.border}`}>
              <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
              <span className={`text-xs font-medium ${statusDisplay.color}`}>{statusDisplay.text}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sticky top-24">
              
              {/* Not Applied State */}
              {!appStatus?.has_application && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Become an Associate</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Join EduPath to connect with thousands of students and share opportunities, events, and resources.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Create posts with images, banners & links</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Reach students in your chosen hubs</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span>Track engagement & follower growth</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/associates/apply')}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Apply as Associate
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Pending State */}
              {appStatus?.has_application && !appStatus?.is_verified && appStatus?.application_status === 'PENDING' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-10 h-10 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Application Pending</h2>
                  <p className="text-slate-400 text-sm mb-4">
                    Your application is under review. We'll notify you via email once a decision is made.
                  </p>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-400">
                    <p>Review typically takes 2-5 business days.</p>
                  </div>
                </div>
              )}

              {/* Rejected State */}
              {appStatus?.has_application && appStatus?.application_status === 'REJECTED' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Application Not Approved</h2>
                  {appStatus?.rejection_reason && (
                    <p className="text-slate-400 text-sm mb-4">
                      Reason: {appStatus.rejection_reason}
                    </p>
                  )}
                  <button
                    onClick={() => navigate('/associates/apply')}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Reapply
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Verified Associate Profile */}
              {isVerified && myAssociate && (
                <>
                  {/* Profile Image */}
                  <div className="flex flex-col items-center mb-6">
                    {myAssociate.profile_image ? (
                      <img 
                        src={myAssociate.profile_image} 
                        alt={myAssociate.name} 
                        className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-teal-500/30" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold mb-4">
                        {myAssociate.name.charAt(0)}
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-white text-center">{myAssociate.name}</h2>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      <span className={`text-xs px-3 py-1 rounded-full border font-medium ${ASSOCIATE_TYPE_BADGE[myAssociate.associate_type] || ASSOCIATE_TYPE_BADGE.MENTOR}`}>
                        {myAssociate.associate_type}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 font-medium">
                        VERIFIED
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 text-center">{myAssociate.bio}</p>

                  {/* Info */}
                  <div className="space-y-2 mb-6">
                    {myAssociate.location && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{myAssociate.location}</span>
                      </div>
                    )}
                    {myAssociate.website && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Globe className="w-4 h-4" />
                        <a href={myAssociate.website} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                          {myAssociate.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-800">
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">{myPosts.length}</div>
                      <div className="text-slate-400 text-xs">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">{myAssociate.follower_count}</div>
                      <div className="text-slate-400 text-xs">Followers</div>
                    </div>
                  </div>

                  {/* Quick Create Post Buttons */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Create Post</p>
                    {POST_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.type}
                          onClick={() => navigate('/associates/dashboard/create', { state: { postType: option.type } })}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-teal-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{option.label}</p>
                            <p className="text-xs text-slate-500 truncate">{option.desc}</p>
                          </div>
                          <Plus className="w-4 h-4 text-slate-500" />
                        </button>
                      )
                    })}
                  </div>

                  {/* Edit Profile Link */}
                  <button
                    onClick={() => navigate('/associates/dashboard')}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs - Only show for verified associates */}
            {isVerified && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  My Posts
                </button>
                <button
                  onClick={() => setActiveTab('hubs')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'hubs'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  My Hubs
                </button>
              </div>
            )}

            {/* Content based on verification status */}
            {!isVerified ? (
              /* Show Hubs for non-verified users */
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Available Career Hubs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hubs.map((hub) => (
                    <div key={hub.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{hub.icon}</span>
                        <h3 className="text-white font-semibold text-lg">{hub.name}</h3>
                      </div>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{hub.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{hub.member_count} members</span>
                        <span>{hub.active_posts} posts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'profile' ? (
              /* Verified - My Posts Tab */
              <div>
                {/* Prominent Create Post CTA at top */}
                <div className="bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border border-teal-500/30 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Create a New Post</h3>
                      <p className="text-slate-400 text-sm">Share updates, opportunities, events, or resources with students</p>
                    </div>
                    <button
                      onClick={() => navigate('/associates/dashboard/create')}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Create Post
                    </button>
                  </div>
                </div>

                {myPosts.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Image className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                      Start sharing content with students! Create posts with images, banners, links, and more.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {POST_TYPE_OPTIONS.slice(0, 3).map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.type}
                            onClick={() => navigate('/associates/dashboard/create', { state: { postType: option.type } })}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myPosts.map((post) => (
                      <PostCard key={post.id} post={post} isOwner={true} onDelete={() => handleDeletePost(post.id)} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Verified - Hubs Tab */
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Your Hub</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hubs.filter(h => h.id === myAssociate?.hub).map((hub) => (
                    <div key={hub.id} className="bg-slate-900/60 border border-teal-500/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{hub.icon}</span>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{hub.name}</h3>
                          <span className="text-xs text-teal-400">Your Primary Hub</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm mb-4">{hub.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{hub.member_count} members</span>
                        <span>{hub.active_posts} posts</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-slate-400 text-sm mt-6">
                  Your posts are visible to students browsing this hub. Create engaging content to attract followers!
                </p>
              </div>
            )}
          </div>
        </div>
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

      {/* Content */}
      <div className="p-4">
        {/* Image Banner for posts with images */}
        {post.image_url && (
          <img src={post.image_url} alt="" className="w-full h-56 object-cover rounded-xl mb-4" />
        )}
        
        {post.title && (
          <h3 className="text-white font-semibold text-lg mb-2">{post.title}</h3>
        )}
        
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{post.body}</p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map(tag => (
              <span
                key={tag.tag}
                className="px-2 py-0.5 rounded-full bg-teal-900/30 text-teal-300 text-xs font-medium"
              >
                #{tag.course_name}
              </span>
            ))}
          </div>
        )}

        {/* Deadline badge */}
        {post.post_type === 'OPPORTUNITY' && post.deadline && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium mb-4 bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Calendar className="w-3.5 h-3.5" />
            Deadline: {new Date(post.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}

        {/* Type Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${typeConfig.cls} border`}>
          <span>{typeConfig.icon}</span>
          <span>{typeConfig.label}</span>
        </div>

        {/* External Link CTA */}
        {post.external_url && (
          <a
            href={post.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600/30 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            {post.cta_label || 'Learn More'}
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors">
            <Heart className="w-4 h-4" />
            <span className="text-xs">{post.upvotes || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-teal-400 transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-xs">Share</span>
          </button>
        </div>
        <span className="text-xs text-slate-500">
          Visible in hub
        </span>
      </div>
    </div>
  )
}
