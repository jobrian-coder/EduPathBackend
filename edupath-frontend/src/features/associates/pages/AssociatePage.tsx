import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Globe, Plus } from 'lucide-react'
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
  const { associateId } = useParams<{ associateId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [associate, setAssociate] = useState<Associate | null>(null)
  const [posts, setPosts] = useState<AssociatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

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

              {/* Follow button */}
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

      {/* Posts Grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-slate-400">This associate hasn't posted anything yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <PostGridItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PostGridItem({ post }: { post: AssociatePost }) {
  return (
    <div className="aspect-square bg-slate-800 relative group cursor-pointer overflow-hidden">
      {post.image_url ? (
        <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4">
          <p className="text-slate-400 text-sm text-center line-clamp-4">{post.body}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="text-white text-sm font-medium">
          {post.post_type}
        </div>
      </div>
    </div>
  )
}
