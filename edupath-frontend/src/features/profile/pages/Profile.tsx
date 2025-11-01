import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import { listBookmarks } from '../../../lib/bookmarks'
import type { BookmarkItem } from '../../../lib/bookmarks'
import api from '../../../services/api'

// interface ProfileStats {
//   followers: number
//   posts: number
//   likes: number
// }

const DEFAULT_PROFILE = {
  username: 'john_kariuki',
  fullName: 'John Kariuki',
  bio: 'Aspiring software engineer passionate about technology and innovation.',
  profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  location: 'Nairobi, Kenya',
  role: 'Software Engineering Student',
}

// const DEFAULT_STATS: ProfileStats = {
//   followers: 1280,
//   posts: 56,
//   likes: 3421,
// }

const DEFAULT_SOCIAL = {
  email: 'john@example.com',
  website: 'https://portfolio.john.codes',
  linkedin: 'https://linkedin.com/in/john-kariuki',
  twitter: '@john_codes',
}

const DEFAULT_INTERESTS = ['AI Research', 'Fullstack Development', 'Community Meetups']

// const DEFAULT_ACTIVITY = [
//   { id: 1, title: 'Joined Tech Hub', time: '2 days ago' },
//   { id: 2, title: 'Saved "BSc Computer Science" course', time: '5 days ago' },
//   { id: 3, title: 'Commented on "Public health internships in Nairobi"', time: '1 week ago' },
// ]

function useBookmarks(): BookmarkItem[] {
  const [items, setItems] = useState<BookmarkItem[]>([])

  useEffect(() => {
    setItems(listBookmarks())
    const handler = () => setItems(listBookmarks())
    window.addEventListener('bookmarks:changed', handler)
    return () => window.removeEventListener('bookmarks:changed', handler)
  }, [])

  return items
}

export default function Profile() {
  const bookmarks = useBookmarks()
  const [user, setUser] = useState<any | null>(null)
  const [editing, setEditing] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [locationDraft, setLocationDraft] = useState('')
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isRequestingUpgrade, setIsRequestingUpgrade] = useState(false)
  const [upgradeStatus, setUpgradeStatus] = useState<null | 'idle' | 'requested' | 'error'>(null)
  const [activeTab, setActiveTab] = useState<'academic' | 'bookmarks' | 'role'>('academic')
  const [academic, setAcademic] = useState<any | null>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false)
  const [, setIsLoadingAnalytics] = useState(false)

  const fetchProfile = async () => {
    try {
      const me = await api.auth.getProfile()
      setUser(me)
      setBioDraft(me?.bio ?? '')
      setLocationDraft(me?.location ?? '')
    } catch {
      // ignore; keep defaults
    }
  }

  const fetchAchievements = async () => {
    setIsLoadingAchievements(true)
    try {
      const response = await api.auth.getAchievements()
      setAchievements(response)
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setIsLoadingAchievements(false)
    }
  }

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true)
    try {
      const response = await api.auth.getAnalytics()
      setAnalytics(response)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    
    // Reload profile when window regains focus (e.g., after navigating back)
    const handleFocus = () => {
      fetchProfile()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchAchievements()
      fetchAnalytics()
    }
  }, [user?.id])

  const profile = useMemo(() => ({
    ...DEFAULT_PROFILE,
    ...(user ? {
      username: user.username ?? DEFAULT_PROFILE.username,
      fullName: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username || DEFAULT_PROFILE.fullName,
      bio: user.bio ?? DEFAULT_PROFILE.bio,
      profilePicture: user.profile_picture ?? DEFAULT_PROFILE.profilePicture,
      location: user.location ?? DEFAULT_PROFILE.location,
      role: (user.role ?? DEFAULT_PROFILE.role)?.toString().replace(/\b\w/g, (c: string) => c.toUpperCase()),
      email: user.email,
    } : {})
  }), [user])

  // Fetch user's posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?.id) return;
      
      setIsLoadingPosts(true);
      try {
        // First get all posts and filter by author on the client side
        const response = await api.hubs.listPosts({});
        const userPosts = response.results.filter((post: any) => post.author?.id === user.id);
        setUserPosts(userPosts);
      } catch (error) {
        console.error('Failed to fetch user posts:', error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [user?.id]);
  // Fetch saved academic profile for summary display
  useEffect(() => {
    (async () => {
      try {
        const prof = await api.academic.getProfile().catch(() => null)
        setAcademic(prof)
      } catch (e) {
        // ignore
      }
    })()
  }, [])
  // Refresh academic summary when AcademicProfile saves
  useEffect(() => {
    const handler = async () => {
      try {
        const prof = await api.academic.getProfile().catch(() => null)
        setAcademic(prof)
      } catch {
        // ignore
      }
    }
    window.addEventListener('academic:saved', handler)
    return () => window.removeEventListener('academic:saved', handler)
  }, [])
  const bookmarkedCourses = useMemo(() => bookmarks.filter(b => b.type === 'course'), [bookmarks])
  const bookmarkedPosts = useMemo(() => bookmarks.filter(b => b.type === 'post'), [bookmarks])
  const bookmarkedUniversities = useMemo(() => bookmarks.filter(b => b.type === 'university'), [bookmarks])

  // Simple cluster formula helper (uses payload if provided)
  const clusterPoints = (raw: number, mean: number) => {
    if (!raw || !mean) return null
    const base = (raw * mean) / (48 * 84)
    if (base <= 0) return 0
    return Math.sqrt(base) * 48
  }
  const eligibilityBadge = (item: BookmarkItem) => {
    const payload = item.payload || {}
    const userMean = Number(payload.mean_points) || 0
    const rawCluster = Number(payload.raw_cluster) || 0
    const courseCutoff = Number(payload.required_points || payload.cluster_points) || 0
    const userPoints = clusterPoints(rawCluster, userMean)
    if (userPoints == null || !courseCutoff) return 'Unknown'
    return userPoints >= courseCutoff ? 'Eligible ✅' : 'Not eligible ❌'
  }

  return (
    <PageContainer title="Profile">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto p-4 space-y-6">
          {/* Bio Card (persistent) */}
          <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg">
            <div className="absolute inset-0">
              <div className="absolute -top-32 -right-24 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-teal-50/50 dark:from-blue-900/20 dark:via-transparent dark:to-teal-900/20" />
            </div>
          <CardContent className="relative z-10 p-6 md:p-8 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-6 md:flex-1">
              <img src={profile.profilePicture} className="w-24 h-24 rounded-full border-4 border-white/80 shadow-2xl" alt="Profile photo" />
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{profile.role}</div>
                <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{profile.fullName}</h2>
                <div className="text-sm text-slate-600 dark:text-slate-300">@{profile.username} · {profile.location}</div>
                {!editing ? (
                  <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{profile.bio}</p>
                ) : (
                  <div className="mt-3 max-w-2xl space-y-2">
                    <textarea value={bioDraft} onChange={e=>setBioDraft(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500" placeholder="Your bio..." />
                    <input value={locationDraft} onChange={e=>setLocationDraft(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500" placeholder="Location" />
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                  {academic?.kcse_year && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2">
                      <span className="text-lg">🎓</span>
                      <span>KCSE {academic.kcse_year}</span>
                    </span>
                  )}
                  {academic?.kcse_school && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2">
                      <span className="text-lg">🏫</span>
                      <span>{academic.kcse_school}</span>
                    </span>
                  )}
                  {academic?.kcse_mean_points && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2">
                      <span className="text-lg">⭐</span>
                      <span>{Number(academic.kcse_mean_points).toFixed(1)}/84 Points</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2">
                    <span className="text-lg">🌐</span>
                    <span>Open to collaborations</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:w-auto">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  { label: 'Posts', value: analytics?.total_posts || 0 },
                  { label: 'Comments', value: analytics?.total_comments || 0 },
                  { label: 'Upvotes', value: analytics?.upvotes_received || 0 }
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl bg-slate-100 dark:bg-slate-700 px-3 py-2">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{stat.value.toLocaleString()}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-300">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button className="flex-1 rounded-lg bg-teal-500 px-4 py-2 font-medium tracking-wide hover:bg-teal-600 transition text-white">Follow</button>
                <button className="flex-1 rounded-lg bg-slate-200 dark:bg-slate-700 px-4 py-2 font-medium tracking-wide hover:bg-slate-300 dark:hover:bg-slate-600 transition text-slate-700 dark:text-slate-300">Message</button>
                {!editing ? (
                  <button onClick={()=>{ setEditing(true); setBioDraft(user?.bio ?? ''); setLocationDraft(user?.location ?? '') }} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 font-medium tracking-wide hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300">Edit Profile</button>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <button onClick={async()=>{
                      try {
                        const updated = await api.auth.updateProfile({ bio: bioDraft, location: locationDraft })
                        setUser(updated)
                        setEditing(false)
                      } catch (e) {
                        console.error(e)
                        alert('Failed to save profile. Please ensure you are logged in.')
                      }
                    }} className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium tracking-wide hover:bg-green-700 transition text-white">Save</button>
                    <button onClick={()=>{ setEditing(false); setBioDraft(user?.bio ?? ''); setLocationDraft(user?.location ?? '') }} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 font-medium tracking-wide hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completion & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Completion Tracker */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900 dark:text-white">Profile Completion</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {user?.profile_completion || 0}% Complete
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${user?.profile_completion || 0}%` }}
                  ></div>
                </div>
                
                {/* Completion Details */}
                {user?.profile_completion_details && (
                  <div className="space-y-2 text-sm">
                    {Object.entries(user.profile_completion_details).map(([key, completed]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          completed ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {completed ? '✓' : '○'}
                        </span>
                        <span className={`${completed ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                          {key.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="font-semibold text-slate-900 dark:text-white">Achievements</div>
            </CardHeader>
            <CardContent>
              {isLoadingAchievements ? (
                <div className="text-center py-4 text-slate-500">Loading achievements...</div>
              ) : achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.slice(0, 6).map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <span className="text-lg">{achievement.achievement.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {achievement.achievement.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  No achievements yet. Start engaging to earn badges!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="font-semibold text-slate-900 dark:text-white">Your Activity Analytics</div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {analytics.total_posts || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Posts Created</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analytics.total_comments || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Comments Made</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {analytics.upvotes_received || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Upvotes Received</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analytics.recent_posts || 0}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Posts (30 days)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Menu */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'academic', label: 'Academic & Interests' },
            { id: 'bookmarks', label: 'Bookmarks' },
            { id: 'role', label: 'Role & Posts' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-full text-sm border transition ${activeTab === (t.id as any) ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sections */}
        {activeTab === 'academic' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Existing Academic Profile entry card (unchanged design) */}
            <Card>
              <CardHeader><div className="font-semibold">Academic Profile</div></CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Add your KCSE subjects and grades to unlock accurate course eligibility checks and better recommendations.
                </div>
                <div>
                  <Link to="/profile/academic" className="inline-block px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">
                    Complete Academic Profile
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Academic Summary from backend */}
            <Card>
              <CardHeader><div className="font-semibold">Academic Summary</div></CardHeader>
              <CardContent className="space-y-3">
                {!academic?.kcse_grades || Object.keys(academic.kcse_grades).length === 0 ? (
                  <div className="text-sm text-slate-500">No grades yet. Use "Complete Academic Profile" to add your grades.</div>
                ) : (
                  <>
                    {academic?.kcse_mean_points != null && (
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">KCSE Mean Points</div>
                        <div className="text-lg font-semibold">{Number(academic.kcse_mean_points).toFixed(2)}/84</div>
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(academic.kcse_grades).map(([code, grade]: any) => (
                        <div key={code} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                          <div className="text-xs uppercase tracking-wide text-slate-500">{code}</div>
                          <div className="mt-1 text-2xl font-bold">{grade}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Interests (existing styling) */}
            <Card className="lg:col-span-2">
              <CardHeader><div className="font-semibold">Interests</div></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {DEFAULT_INTERESTS.map((interest, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-sm">{interest}</span>
                ))}
                <button className="px-3 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300">+ Add interest</button>
              </CardContent>
            </Card>

            {/* Joined Hubs */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Joined Communities</div>
                  <Link to="/hubs" className="text-sm text-teal-600 hover:text-teal-700">View all →</Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {user?.joined_hubs?.length > 0 ? (
                    user.joined_hubs.map((hub: any) => (
                      <Link 
                        key={hub.id}
                        to={`/hubs/${hub.slug}`}
                        className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all group"
                      >
                        {hub.icon_url ? (
                          <img 
                            src={hub.icon_url} 
                            alt={hub.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="text-2xl">{hub.icon}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-teal-600">
                            {hub.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {hub.member_count} members
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      You haven't joined any communities yet. <Link to="/hubs" className="text-teal-600 hover:underline">Explore hubs</Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* My Recent Posts */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">My Recent Posts</div>
                  {userPosts.length > 3 && (
                    <span className="text-sm text-slate-500">Showing {Math.min(3, userPosts.length)} of {userPosts.length}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPosts ? (
                  <div className="text-center py-8 text-slate-500">Loading posts...</div>
                ) : userPosts.length > 0 ? (
                  <div className="space-y-3">
                    {userPosts.slice(0, 3).map((post: any) => (
                      <Link
                        key={post.id}
                        to={`/posts/${post.id}`}
                        className="block p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {post.hub?.name || 'Hub'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                post.is_expert_post 
                                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' 
                                  : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                              }`}>
                                {post.is_expert_post ? '⭐ Expert' : '👤 Rookie'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors mb-1 line-clamp-1">
                              {post.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>👍 {post.upvotes || 0}</span>
                              <span>💬 {post.comment_count || 0}</span>
                              {post.view_count > 0 && <span>👁️ {post.view_count}</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    You haven't created any posts yet. <Link to="/hubs" className="text-teal-600 hover:underline">Start contributing!</Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><div className="font-semibold">Bookmarked Courses</div></CardHeader>
              <CardContent className="space-y-3">
                {bookmarkedCourses.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No courses saved yet.</div>}
                {bookmarkedCourses.map(item => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-800 dark:text-slate-100">{item.title}</div>
                      <div className="text-sm">{eligibilityBadge(item)}</div>
                    </div>
                    {item.meta && <div className="text-sm text-slate-500 dark:text-slate-400">{item.meta}</div>}
                    <div className="mt-2 text-sm text-teal-500 hover:text-teal-600 cursor-pointer">View course</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="font-semibold">Bookmarked Universities</div></CardHeader>
              <CardContent className="space-y-3">
                {bookmarkedUniversities.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No universities saved yet.</div>}
                {bookmarkedUniversities.map(item => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{item.title}</div>
                    {item.meta && <div className="text-sm text-slate-500 dark:text-slate-400">{item.meta}</div>}
                    <div className="mt-2 text-sm text-teal-500 hover:text-teal-600 cursor-pointer">View university</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><div className="font-semibold">Bookmarked Posts</div></CardHeader>
              <CardContent className="space-y-3">
                {bookmarkedPosts.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No posts saved yet.</div>}
                {bookmarkedPosts.map(item => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{item.title}</div>
                    {item.meta && <div className="text-sm text-slate-500 dark:text-slate-400">{item.meta}</div>}
                    <div className="mt-2 text-sm text-teal-500 hover:text-teal-600 cursor-pointer">Open discussion</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'role' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><div className="font-semibold">Role & Access</div></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Current role:</span>
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{user?.role ?? 'novice'}</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Unlock contributor/expert features by increasing your community participation.</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Suggested next steps: complete profile, post helpful content, and engage in discussions.</div>
                {user?.role !== 'expert' && (
                  <div className="pt-2">
                    <button disabled={isRequestingUpgrade || upgradeStatus === 'requested'} onClick={async () => {
                      try { setIsRequestingUpgrade(true); await new Promise(r => setTimeout(r, 800)); setUpgradeStatus('requested') }
                      catch (e) { console.error(e); setUpgradeStatus('error') }
                      finally { setIsRequestingUpgrade(false) }
                    }} className={`px-4 py-2 rounded-lg font-medium transition ${upgradeStatus === 'requested' ? 'bg-green-600 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}>
                      {upgradeStatus === 'requested' ? 'Upgrade Request Sent' : isRequestingUpgrade ? 'Requesting…' : 'Request Upgrade'}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="font-semibold">Personal Information</div></CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                <div><span className="font-semibold">Full name:</span> {profile.fullName}</div>
                <div><span className="font-semibold">Email:</span> {user?.email ?? DEFAULT_SOCIAL.email}</div>
                <div><span className="font-semibold">Role:</span> {profile.role}</div>
                <div><span className="font-semibold">Location:</span> {profile.location}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="font-semibold">Contact & Social</div></CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                <div className="flex justify-between gap-4"><span className="font-semibold">Website</span><a className="text-teal-500" href={DEFAULT_SOCIAL.website} target="_blank" rel="noreferrer">Visit</a></div>
                <div className="flex justify-between gap-4"><span className="font-semibold">LinkedIn</span><a className="text-teal-500" href={DEFAULT_SOCIAL.linkedin} target="_blank" rel="noreferrer">Open</a></div>
                <div className="flex justify-between gap-4"><span className="font-semibold">Twitter</span><a className="text-teal-500" href={`https://twitter.com/${DEFAULT_SOCIAL.twitter.replace('@','')}`} target="_blank" rel="noreferrer">Follow</a></div>
                <div className="flex justify-between gap-4"><span className="font-semibold">Email</span><a className="text-teal-500" href={`mailto:${DEFAULT_SOCIAL.email}`}>Send</a></div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><div className="font-semibold">My Posts</div></CardHeader>
              <CardContent className="space-y-3">
                {isLoadingPosts ? (
                  <div className="text-center py-4 text-slate-500">Loading posts...</div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">No posts yet. Create your first post in any hub!</div>
                ) : (
                  userPosts.map((post) => (
                    <Link to={`/posts/${post.id}`} key={post.id} className="block hover:no-underline">
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-500/50 transition">
                        <div className="text-lg font-semibold text-black dark:text-white">{post.title}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Posted in <span className="text-teal-500">{post.hub_name || 'a hub'}</span> • {new Date(post.created_at).toLocaleDateString()}</div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{post.post_type?.replace('_', ' ') || 'Post'}</span>
                          <span className="text-slate-500 dark:text-slate-400">{post.comment_count || 0} comments • {post.upvotes || 0} upvotes</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </PageContainer>
  )
}
