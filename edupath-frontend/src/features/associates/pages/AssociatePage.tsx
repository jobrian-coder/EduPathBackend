import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Globe, Calendar, ThumbsUp, Flag, ExternalLink, Plus, Check, Minus, User } from 'lucide-react'
import api from '../../../services/api'
import type { Associate, AssociatePost } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  MENTOR:  { label: 'Mentor',  cls: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  SOCIETY: { label: 'Society', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  SCHOOL:  { label: 'School',  cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
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
  const { hubId, associateId } = useParams<{ hubId: string; associateId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [associate, setAssociate] = useState<Associate | null>(null)
  const [posts, setPosts] = useState<AssociatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Report modal state
  const [reportPostId, setReportPostId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportToast, setReportToast] = useState<string | null>(null)

  // Load more pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!associateId) return

    const id = parseInt(associateId, 10)

    // Load associate details and posts
    Promise.all([
      api.associates.getDetails(id),
      api.associates.listPosts(id),
    ])
      .then(([associateData, postsData]) => {
        setAssociate(associateData)
        setPosts(postsData)
        setHasMore(postsData.length >= 10)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [associateId])

  const handleFollow = async () => {
    if (!associate || !isAuthenticated) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setFollowLoading(true)
    const wasFollowing = associate.is_following

    // Optimistic UI update
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
      // Revert on error
      setAssociate({
        ...associate,
        is_following: wasFollowing,
        follower_count: associate.follower_count,
      })
    } finally {
      setFollowLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!associateId || !hasMore) return

    const id = parseInt(associateId, 10)
    const nextPage = page + 1

    try {
      const morePosts = await api.associates.listPosts(id)
      // In a real implementation, you'd pass pagination params to the API
      // For now, just simulate loading more
      if (morePosts.length === 0) {
        setHasMore(false)
      } else {
        setPosts(prev => [...prev, ...morePosts])
        setPage(nextPage)
      }
    } catch {
      setHasMore(false)
    }
  }

  const handleReport = async () => {
    if (!reportPostId || !reportReason.trim()) return
    setReportSubmitting(true)
    try {
      await api.associates.report(reportPostId, reportReason)
      setReportToast('Report submitted. Thank you for helping keep EduPath safe.')
    } catch {
      setReportToast('Failed to submit report. Please try again.')
    } finally {
      setReportSubmitting(false)
      setReportPostId(null)
      setReportReason('')
      setTimeout(() => setReportToast(null), 4000)
    }
  }

  const getDeadlineColor = (deadline: string | null) => {
    if (!deadline) return 'text-slate-400 bg-slate-700/50'
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) return 'text-red-300 bg-red-500/20'
    if (diffDays <= 30) return 'text-amber-300 bg-amber-500/20'
    return 'text-slate-400 bg-slate-700/50'
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
  const accentColor = HUB_ACCENT_COLORS[associate.hub as string] || 'from-teal-600 to-cyan-600'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Toast */}
      {reportToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-teal-500/40 text-teal-300 text-sm px-4 py-3 rounded-xl shadow-lg">
          {reportToast}
        </div>
      )}

      {/* Report modal */}
      {reportPostId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-white font-semibold text-lg">Report Post</h3>
            <p className="text-slate-400 text-sm">Why are you reporting this post?</p>
            <textarea
              rows={4}
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="For example: This opportunity listing link is broken or This content is not relevant to this hub"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setReportPostId(null); setReportReason('') }}
                className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim() || reportSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {reportSubmitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with banner */}
      <div className="relative">
        {/* Banner (4:1 aspect ratio) */}
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

              {/* Follow button */}
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  associate.is_following
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-teal-600 text-white hover:bg-teal-500'
                }`}
              >
                {associate.is_following ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Following
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Follow
                  </span>
                )}
              </button>
            </div>

            {/* Full bio */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6">{associate.bio}</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-around text-sm">
            <div className="text-center">
              <div className="text-white font-semibold">{posts.length}</div>
              <div className="text-slate-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold">{associate.follower_count}</div>
              <div className="text-slate-500">Followers</div>
            </div>
            {hubId && (
              <div className="text-center">
                <button
                  onClick={() => navigate(`/hubs/${hubId}?tab=associates`)}
                  className="text-teal-400 hover:text-teal-300 font-semibold"
                >
                  View Hub
                </button>
                <div className="text-slate-500">Hub</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts feed */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-900/40 border border-slate-800 rounded-2xl">
            No posts yet.
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isAuthenticated={isAuthenticated}
                onReport={() => setReportPostId(post.id)}
                getDeadlineColor={getDeadlineColor}
              />
            ))}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white text-sm font-medium transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PostCard({ post, isAuthenticated, onReport, getDeadlineColor }: {
  post: AssociatePost
  isAuthenticated: boolean
  onReport: () => void
  getDeadlineColor: (deadline: string | null) => string
}) {
  const isClosingSoon = post.deadline && (() => {
    const deadlineDate = new Date(post.deadline)
    const now = new Date()
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  })()

  const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
    UPDATE:  { label: 'Update',  cls: 'bg-slate-600/20 text-slate-300' },
    OPPORTUNITY: { label: 'Opportunity', cls: 'bg-teal-500/20 text-teal-300' },
    EVENT:  { label: 'Event', cls: 'bg-violet-500/20 text-violet-300' },
    RESOURCE:  { label: 'Resource', cls: 'bg-blue-500/20 text-blue-300' },
  }

  const typeBadge = TYPE_BADGE[post.post_type] ?? TYPE_BADGE.UPDATE

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden relative group">
      {/* Report button */}
      {isAuthenticated && (
        <button
          onClick={onReport}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all z-10"
          title="Report this post"
        >
          <Flag className="w-4 h-4" />
        </button>
      )}

      {/* CLOSING SOON badge */}
      {isClosingSoon && post.post_type === 'OPPORTUNITY' && (
        <div className="absolute top-4 right-14 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
          CLOSING SOON
        </div>
      )}

      {/* Event image */}
      {post.post_type === 'EVENT' && post.image_url && (
        <img src={post.image_url} alt="" className="w-full h-48 object-cover" />
      )}

      <div className="p-5">
        {/* Associate identity row */}
        <div className="flex items-center gap-3 mb-4">
          {post.associate_image ? (
            <img src={post.associate_image} alt={post.associate_name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              {post.associate_name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{post.associate_name}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge.cls}`}>
                {typeBadge.label}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <h3 className="text-white font-semibold text-lg mb-2">{post.title}</h3>
        )}

        {/* Body */}
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{post.body}</p>

        {/* Deadline badge (Opportunity) */}
        {post.post_type === 'OPPORTUNITY' && post.deadline && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium mb-4 ${getDeadlineColor(post.deadline)}`}>
            <Calendar className="w-3.5 h-3.5" />
            Deadline: {new Date(post.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}

        {/* Deadline badge (Event) - calendar style */}
        {post.post_type === 'EVENT' && post.deadline && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium mb-4 bg-violet-500/20 text-violet-300">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(post.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        )}

        {/* CTA button (Opportunity, Event) */}
        {(post.post_type === 'OPPORTUNITY' || post.post_type === 'EVENT') && post.external_url && (
          <a
            href={post.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors mb-4"
          >
            {post.cta_label || 'Learn More'}
          </a>
        )}

        {/* Resource card-within-card */}
        {post.post_type === 'RESOURCE' && post.external_url && (
          <a
            href={post.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors mb-4"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-teal-400" />
              <span className="text-teal-400 text-sm font-medium">{post.cta_label || 'View Resource'}</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">{new URL(post.external_url).hostname}</p>
          </a>
        )}

        {/* Divider */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{post.upvotes} upvotes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
