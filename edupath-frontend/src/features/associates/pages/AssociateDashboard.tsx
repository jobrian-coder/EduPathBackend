import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Edit2, Globe, MapPin, Users, BarChart2,
  Trash2, Eye, Calendar, ExternalLink, AlertTriangle,
} from 'lucide-react'
import api from '../../../services/api'
import type { Associate, AssociatePost } from '../../../services/api'

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

export default function AssociateDashboard() {
  const navigate = useNavigate()

  const [associate, setAssociate] = useState<Associate | null>(null)
  const [posts, setPosts] = useState<AssociatePost[]>([])
  const [loading, setLoading] = useState(true)
  const [notAssociate, setNotAssociate] = useState(false)

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState({ bio: '', website: '', location: '', profile_image: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Delete post confirmation
  const [deletePostId, setDeletePostId] = useState<number | null>(null)
  const [deletingPost, setDeletingPost] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [assoc, assocPosts] = await Promise.all([
          api.associates.getMe(),
          api.associates.getMe().then(a => api.associates.listPosts(a.id)),
        ])
        setAssociate(assoc)
        setPosts(assocPosts)
      } catch {
        setNotAssociate(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const openEditProfile = () => {
    if (!associate) return
    setProfileDraft({
      bio: associate.bio ?? '',
      website: associate.website ?? '',
      location: associate.location ?? '',
      profile_image: associate.profile_image ?? '',
    })
    setEditingProfile(true)
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const updated = await api.associates.updateMe(profileDraft)
      setAssociate(updated)
      setEditingProfile(false)
    } catch (e: any) {
      alert(e?.message || 'Failed to save profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const confirmDelete = async () => {
    if (deletePostId == null) return
    setDeletingPost(true)
    try {
      await api.associates.deletePost(deletePostId)
      setPosts(prev => prev.filter(p => p.id !== deletePostId))
      setDeletePostId(null)
    } catch (e: any) {
      alert(e?.message || 'Failed to delete post.')
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

  if (notAssociate || !associate) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-5 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <h2 className="text-xl font-bold text-white">No Associate Profile Found</h2>
        <p className="text-slate-400 max-w-sm text-sm">
          Your account is not yet linked to a verified Associate profile. Apply to become one, or contact the admin if you believe this is an error.
        </p>
        <div className="flex gap-3">
          <Link to="/associates/apply" className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors">
            Apply as Associate
          </Link>
          <Link to="/" className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const typeCfg = TYPE_CONFIG
  const totalUpvotes = posts.reduce((sum, p) => sum + p.upvotes, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
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
                onClick={confirmDelete}
                disabled={deletingPost}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {deletingPost ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit profile modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-white font-semibold text-lg">Edit Profile</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Bio</label>
                <textarea
                  rows={4}
                  value={profileDraft.bio}
                  onChange={e => setProfileDraft(d => ({ ...d, bio: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Website</label>
                  <input
                    type="url"
                    value={profileDraft.website}
                    onChange={e => setProfileDraft(d => ({ ...d, website: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={profileDraft.location}
                    onChange={e => setProfileDraft(d => ({ ...d, location: e.target.value }))}
                    placeholder="e.g. Nairobi"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Profile Image URL</label>
                <input
                  type="url"
                  value={profileDraft.profile_image}
                  onChange={e => setProfileDraft(d => ({ ...d, profile_image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditingProfile(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-teal-400 font-medium mb-1">Associate Dashboard</p>
            <h1 className="text-2xl font-bold text-white">{associate.name}</h1>
            <span className={`mt-1 inline-block text-xs px-2.5 py-1 rounded-full border font-medium ${ASSOCIATE_TYPE_BADGE[associate.associate_type]}`}>
              {associate.associate_type.charAt(0) + associate.associate_type.slice(1).toLowerCase()}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openEditProfile}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={() => navigate(`/hubs/_/associates/${associate.id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
            >
              <Eye className="w-4 h-4" /> View Public Page
            </button>
            <button
              onClick={() => navigate('/associates/dashboard/create')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>
        </div>

        {/* Profile card + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Profile info */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-4">
              {associate.profile_image ? (
                <img src={associate.profile_image} alt={associate.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-slate-700" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {associate.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">{associate.name}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  {associate.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{associate.location}</span>
                  )}
                  {associate.website && (
                    <a href={associate.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-400 hover:text-teal-300">
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{associate.bio}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {[
              { icon: <BarChart2 className="w-5 h-5 text-teal-400" />, label: 'Total Posts', value: posts.length },
              { icon: <Users className="w-5 h-5 text-violet-400" />, label: 'Followers', value: associate.follower_count },
              { icon: <Eye className="w-5 h-5 text-amber-400" />, label: 'Total Upvotes', value: totalUpvotes },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                {stat.icon}
                <div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Posts section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Posts</h2>
            <button
              onClick={() => navigate('/associates/dashboard/create')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600/20 border border-teal-600/40 text-teal-300 hover:bg-teal-600/30 text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Post
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
              <Plus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No posts yet.</p>
              <button
                onClick={() => navigate('/associates/dashboard/create')}
                className="mt-4 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium"
              >
                Create your first post
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => {
                const cfg = typeCfg[post.post_type] ?? typeCfg.UPDATE
                return (
                  <div key={post.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-4 items-start">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                        {post.deadline && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {post.title && (
                        <p className="text-white font-semibold text-sm">{post.title}</p>
                      )}
                      <p className="text-slate-400 text-sm line-clamp-2 mt-0.5">{post.body}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 3).map(tag => (
                            <button
                              key={tag.tag}
                              onClick={() => navigate(`/hubs/_?tag=${tag.tag}`)}
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
                      {post.external_url && (
                        <a href={post.external_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                          <ExternalLink className="w-3 h-3" /> {post.cta_label || 'View Link'}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {post.upvotes}
                      </span>
                      <button
                        onClick={() => setDeletePostId(post.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
