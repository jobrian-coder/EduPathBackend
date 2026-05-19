import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, MapPin } from 'lucide-react'
import api from '../../../services/api'
import type { Associate } from '../../../services/api'
import type { Hub } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'

type TypeFilter = 'ALL' | 'MENTOR' | 'SOCIETY' | 'SCHOOL'

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  MENTOR:  { label: 'Mentor',  cls: 'bg-teal-500/20 text-teal-600 border-teal-500/30' },
  SOCIETY: { label: 'Society', cls: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  SCHOOL:  { label: 'School',  cls: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
}

export default function AssociateDirectory() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [associates, setAssociates] = useState<Associate[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [followLoading, setFollowLoading] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { results: hubResults } = await api.hubs.listHubs()

        // Load associates for all hubs in parallel
        const allAssociatesArrays = await Promise.all(
          hubResults.map((hub: Hub) =>
            api.associates.listForHub(hub.id).catch(() => [])
          )
        )
        const all = allAssociatesArrays.flat() as Associate[]
        // Sort by follower_count descending
        all.sort((a, b) => b.follower_count - a.follower_count)
        setAssociates(all)
      } catch (error) {
        console.error('Failed to load directory:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleFollow = async (associateId: number, isFollowing: boolean) => {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setFollowLoading(associateId)
    setAssociates(prev => prev.map(a => {
      if (a.id !== associateId) return a
      return {
        ...a,
        is_following: !isFollowing,
        follower_count: a.follower_count + (isFollowing ? -1 : 1),
      }
    }))

    try {
      if (isFollowing) {
        await api.associates.unfollow(associateId)
      } else {
        await api.associates.follow(associateId)
      }
    } catch {
      // Revert
      setAssociates(prev => prev.map(a => {
        if (a.id !== associateId) return a
        return {
          ...a,
          is_following: isFollowing,
          follower_count: a.follower_count + (isFollowing ? 1 : -1),
        }
      }))
    } finally {
      setFollowLoading(null)
    }
  }

  const filtered = associates.filter(a => {
    if (typeFilter !== 'ALL' && a.associate_type !== typeFilter) return false
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.bio.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">Associate Directory</h1>
              <p className="text-slate-400 text-sm">Mentors, societies, and schools across all hubs</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or bio..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Type filter toggles */}
          <div className="flex gap-2 mt-3">
            {(['ALL', 'MENTOR', 'SOCIETY', 'SCHOOL'] as TypeFilter[]).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {type === 'ALL' ? 'All' : TYPE_BADGE[type]?.label ?? type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {searchQuery || typeFilter !== 'ALL'
                ? 'No Associates match your filters.'
                : 'No verified Associates yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(assoc => {
              const badge = TYPE_BADGE[assoc.associate_type] ?? TYPE_BADGE.MENTOR
              return (
                <div
                  key={assoc.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {assoc.profile_image ? (
                      <img src={assoc.profile_image} alt={assoc.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {assoc.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{assoc.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">{assoc.follower_count} followers</p>
                    </div>
                  </div>

                  {assoc.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{assoc.location}
                    </p>
                  )}

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">{assoc.bio}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/hubs/_/associates/${assoc.id}`)}
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-medium hover:from-teal-600 hover:to-cyan-600 transition-all"
                    >
                      View Page
                    </button>
                    <button
                      onClick={() => handleFollow(assoc.id, assoc.is_following)}
                      disabled={followLoading === assoc.id}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        assoc.is_following
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-teal-900/40 text-teal-400 hover:bg-teal-900/60'
                      }`}
                    >
                      {assoc.is_following ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
