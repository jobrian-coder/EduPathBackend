import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import api, { type Bookmark } from '../../../services/api'
import { TermsAcceptanceModal, hasConsented } from '../../legal/components/TermsAcceptanceModal'
import { ShieldCheck, Sparkles, Coins, GraduationCap, RefreshCw } from 'lucide-react'


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

// Helper to fetch course/university details for bookmarks
async function enrichBookmark(bookmark: Bookmark) {
  try {
    if (bookmark.bookmark_type === 'course') {
      const course = await api.courses.getById(bookmark.bookmark_id)
      return {
        id: bookmark.bookmark_id,
        type: 'course' as const,
        title: course.name,
        meta: course.institution || course.category,
        payload: course,
      }
    } else if (bookmark.bookmark_type === 'university') {
      const university = await api.courses.getUniversity(bookmark.bookmark_id)
      return {
        id: bookmark.bookmark_id,
        type: 'university' as const,
        title: university.name,
        meta: university.location,
        payload: university,
      }
    }
    return null
  } catch {
    return null
  }
}

export default function Profile() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [savedRecs, setSavedRecs] = useState<any[]>([])
  const [user, setUser] = useState<any | null>(null)
  const [editing, setEditing] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [locationDraft, setLocationDraft] = useState('')
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [avatarStyle, setAvatarStyle] = useState('avataaars')
  const [avatarSeed, setAvatarSeed] = useState('')
  const [profilePictureDraft, setProfilePictureDraft] = useState('')
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isRequestingUpgrade, setIsRequestingUpgrade] = useState(false)
  const [upgradeStatus, setUpgradeStatus] = useState<null | 'idle' | 'requested' | 'error'>(null)
  const [activeTab, setActiveTab] = useState<'academic' | 'activity' | 'role' | 'classroom'>('academic')
  const [academic, setAcademic] = useState<any | null>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false)
  const [, setIsLoadingAnalytics] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [followedAssociates, setFollowedAssociates] = useState<any[]>([])
  
  // Classroom codes states
  const [classroomCodes, setClassroomCodes] = useState<any[]>([])
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [generateCount, setGenerateCount] = useState(5)
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false)

  // Fetch codes when activeTab is classroom
  useEffect(() => {
    if (activeTab === 'classroom' && user?.id) {
      fetchClassroomCodes()
    }
  }, [activeTab, user?.id])

  const fetchClassroomCodes = async () => {
    setLoadingCodes(true)
    try {
      const data = await api.auth.listOfferCodes()
      setClassroomCodes(data)
    } catch (error) {
      console.error('Failed to fetch classroom codes:', error)
    } finally {
      setLoadingCodes(false)
    }
  }

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (generateCount <= 0) return
    setIsGeneratingCodes(true)
    try {
      const res = await api.auth.generateOfferCodes(generateCount)
      alert(res.message)
      if (user) {
        setUser({ ...user, ai_trials_balance: res.ai_trials_balance })
      }
      fetchClassroomCodes()
    } catch (error: any) {
      alert(error.message || 'Failed to generate offer codes.')
    } finally {
      setIsGeneratingCodes(false)
    }
  }

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
      api.associates.listFollowed().then(setFollowedAssociates).catch(() => {})
      
      // Fetch bookmarks from backend
      api.bookmarks.list().then(async (backendBookmarks) => {
        const enriched = await Promise.all(
          backendBookmarks.map(enrichBookmark)
        )
        setBookmarks(enriched.filter(Boolean))
      }).catch(() => {})
      
      // Fetch saved recommendations from localStorage (temporary until backend endpoint is added)
      try {
        const saved = localStorage.getItem('edupath_saved_recommendations')
        if (saved) {
          const recs = JSON.parse(saved)
          setSavedRecs(Array.isArray(recs) ? recs.slice(0, 6) : [])
        }
      } catch {
        // ignore
      }
    }
  }, [user?.id])

  const profile = useMemo(() => {
    const storedPic = user?.id ? localStorage.getItem(`edupath_avatar_${user.id}`) : null;
    return {
      ...DEFAULT_PROFILE,
      ...(user ? {
        username: user.username ?? DEFAULT_PROFILE.username,
        fullName: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username || DEFAULT_PROFILE.fullName,
        bio: user.bio ?? DEFAULT_PROFILE.bio,
        profilePicture: storedPic || user.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'John'}`,
        location: user.location ?? DEFAULT_PROFILE.location,
        role: (user.role ?? DEFAULT_PROFILE.role)?.toString().replace(/\b\w/g, (c: string) => c.toUpperCase()),
        email: user.email,
      } : {})
    };
  }, [user])

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
  const bookmarkedCourses = useMemo(() => bookmarks.filter(b => b?.type === 'course'), [bookmarks])
  const bookmarkedPosts = useMemo(() => bookmarks.filter(b => b?.type === 'post'), [bookmarks])

  // Simple cluster formula helper (uses payload if provided)
  const clusterPoints = (raw: number, mean: number) => {
    if (!raw || !mean) return null
    const base = (raw * mean) / (48 * 84)
    if (base <= 0) return 0
    return Math.sqrt(base) * 48
  }
  const eligibilityBadge = (item: any) => {
    const payload = item.payload || {}
    const userMean = Number(payload.mean_points) || 0
    const rawCluster = Number(payload.raw_cluster) || 0
    const courseCutoff = Number(payload.required_points || payload.cluster_points || payload.cutoff_2023) || 0
    const userPoints = clusterPoints(rawCluster, userMean)
    if (userPoints == null || !courseCutoff) return 'Unknown'
    return userPoints >= courseCutoff ? 'Eligible ✅' : 'Not eligible ❌'
  }

  const handleTermsAccepted = async () => {
    setShowTermsModal(false)
    if (profilePictureDraft && user?.id) {
      localStorage.setItem(`edupath_avatar_${user.id}`, profilePictureDraft);
    }
    // Retry saving after consent
    try {
      const updated = await api.auth.updateProfile({ bio: bioDraft, location: locationDraft })
      setUser(updated)
      setEditing(false)
    } catch (e) {
      console.error(e)
      alert('Failed to save profile. Please ensure you are logged in.')
    }
  }

  return (
    <PageContainer title="Profile">
      <div className="min-h-screen theme-bg">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* Profile Header - Full Width */}
          <Card className="relative overflow-hidden border-0 theme-surface text-slate-900 dark:text-white card-shadow">
            <div className="absolute inset-0">
              <div className="absolute -top-32 -right-24 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-teal-50/50 dark:from-blue-900/20 dark:via-transparent dark:to-teal-900/20" />
            </div>
            <CardContent className="relative z-10 p-6 md:p-8 flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-6 md:flex-1">
                <div className="relative group flex-shrink-0">
                  {/* Glowing, rotating gradient ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-500 opacity-75 blur-sm group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-tilt"></div>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <img 
                      src={editing ? profilePictureDraft || profile.profilePicture : profile.profilePicture} 
                      className="w-full h-full object-cover" 
                      alt="Profile photo" 
                    />
                  </div>
                  {/* Floating role-based graphical badge */}
                  <div className="absolute -bottom-1 -right-1 rounded-full p-2 bg-gradient-to-r from-teal-600 to-cyan-600 border-2 border-white dark:border-slate-800 text-white shadow-lg flex items-center justify-center">
                    {user?.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                    {user?.role === 'expert' && <Sparkles className="w-3.5 h-3.5" />}
                    {user?.role === 'contributor' && <Coins className="w-3.5 h-3.5" />}
                    {(user?.role === 'novice' || !user?.role) && <GraduationCap className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">{profile.role}</div>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{profile.fullName}</h2>
                  <div className="text-sm text-slate-600 dark:text-slate-300">@{profile.username} · {profile.location}</div>
                  {!editing ? (
                    <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{profile.bio}</p>
                  ) : (
                    <div className="mt-3 max-w-2xl space-y-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-850">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Bio</label>
                        <textarea value={bioDraft} onChange={e=>setBioDraft(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 text-sm" placeholder="Your bio..." rows={2} />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Location</label>
                        <input value={locationDraft} onChange={e=>setLocationDraft(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 text-sm" placeholder="Location" />
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 space-y-2">
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">🎨 Graphic Avatar Customizer</span>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 dark:text-slate-400">Avatar Style</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {[
                              { id: 'avataaars', label: 'Avatars' },
                              { id: 'bottts', label: 'Robots' },
                              { id: 'adventurer', label: 'Adventurer' },
                              { id: 'pixel-art', label: 'Pixel' },
                              { id: 'lorelei', label: 'Artistic' }
                            ].map(style => (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => {
                                  setAvatarStyle(style.id);
                                  setProfilePictureDraft(`https://api.dicebear.com/7.x/${style.id}/svg?seed=${avatarSeed || user?.username || 'John'}`);
                                }}
                                className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-all ${
                                  avatarStyle === style.id
                                    ? 'bg-teal-500 border-teal-500 text-white shadow-sm font-semibold'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-750'
                                }`}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 dark:text-slate-400">Custom Seed Word</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={avatarSeed}
                              onChange={e => {
                                setAvatarSeed(e.target.value);
                                setProfilePictureDraft(`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${e.target.value || user?.username || 'John'}`);
                              }}
                              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              placeholder="Type something to randomize avatar..."
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const rand = Math.random().toString(36).substring(7);
                                setAvatarSeed(rand);
                                setProfilePictureDraft(`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${rand}`);
                              }}
                              className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                            >
                              🎲 Random
                            </button>
                          </div>
                        </div>
                      </div>
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
                  <button onClick={()=>{
                    setEditing(true);
                    setBioDraft(user?.bio ?? '');
                    setLocationDraft(user?.location ?? '');
                    
                    // Parse seed and style from current avatar URL if it is a Dicebear URL
                    const currentPic = profile.profilePicture;
                    let parsedStyle = 'avataaars';
                    let parsedSeed = user?.username || 'John';
                    if (currentPic.includes('dicebear.com')) {
                      const parts = currentPic.split('/');
                      const styleIdx = parts.indexOf('7.x') + 1;
                      if (styleIdx > 0 && styleIdx < parts.length) {
                        parsedStyle = parts[styleIdx];
                      }
                      const seedParam = currentPic.split('seed=')[1];
                      if (seedParam) {
                        parsedSeed = seedParam.split('&')[0];
                      }
                    }
                    setAvatarStyle(parsedStyle);
                    setAvatarSeed(parsedSeed);
                    setProfilePictureDraft(currentPic);
                  }} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 font-medium tracking-wide hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300">Edit Profile</button>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <button onClick={async()=>{
                      // Check for data consent
                      if (!hasConsented('personal')) {
                        setShowTermsModal(true)
                        return
                      }
                      
                      // Save chosen avatar to localStorage
                      if (profilePictureDraft && user?.id) {
                        localStorage.setItem(`edupath_avatar_${user.id}`, profilePictureDraft);
                      }
                      
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

          {/* Two Column Layout: Interests/Grades | Saved Courses */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: User Interests and Grades */}
            <Card className="theme-surface card-shadow theme-border">
              <CardHeader>
                <div className="font-semibold text-slate-900 dark:text-white text-lg">👤 User Interests and Grades</div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Interests Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_INTERESTS.map((interest, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-sm font-medium">{interest}</span>
                    ))}
                    <button className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 transition">+ Add</button>
                  </div>
                </div>

                {/* Academic Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Academic Profile</h3>
                  {!academic?.kcse_grades || Object.keys(academic.kcse_grades).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <div className="text-3xl mb-2">📚</div>
                      <div className="text-sm mb-3">No grades added yet</div>
                      <Link to="/profile/academic" className="inline-block px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium">
                        Add KCSE Grades
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {academic?.kcse_mean_points != null && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-700">
                          <div className="text-xs uppercase tracking-wide text-teal-600 dark:text-teal-400 font-semibold mb-1">KCSE Mean Points</div>
                          <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">{Number(academic.kcse_mean_points).toFixed(1)}<span className="text-lg text-slate-500">/84</span></div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(academic.kcse_grades).slice(0, 6).map(([code, grade]: any) => (
                          <div key={code} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center">
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{code}</div>
                            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{grade}</div>
                          </div>
                        ))}
                      </div>
                      {Object.keys(academic.kcse_grades).length > 6 && (
                        <Link to="/profile/academic" className="block text-center text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400">
                          View all {Object.keys(academic.kcse_grades).length} subjects →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right: Saved Courses */}
            <Card className="theme-surface card-shadow theme-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 dark:text-white text-lg">📚 Saved Courses</div>
                  <Link to="/directory" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium">Browse →</Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookmarkedCourses.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <div className="text-4xl mb-3">�</div>
                    <div className="text-sm mb-3">No courses saved yet</div>
                    <Link to="/directory" className="inline-block px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium">
                      Explore Courses
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {bookmarkedCourses.map(item => (
                      <div key={item.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all bg-white dark:bg-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 dark:text-slate-100 text-sm leading-tight">{item.title}</div>
                            {item.meta && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.meta}</div>}
                          </div>
                          <div className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap">{eligibilityBadge(item)}</div>
                        </div>
                        <Link to={`/courses/${item.id}`} className="mt-2 text-xs text-teal-500 hover:text-teal-600 dark:text-teal-400 block font-medium">View details →</Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full Width: Recommended Courses and Hubs */}
          <Card className="theme-surface card-shadow theme-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900 dark:text-white text-lg">✨ Recommended Courses and Hubs</div>
                <Link to="/advisor" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium">
                  {savedRecs.length > 0 ? 'Get new recommendations →' : 'Start EduGuide AI →'}
                </Link>
              </div>
            </CardHeader>
          <CardContent>
            {savedRecs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <div className="text-5xl mb-3">✨</div>
                <div className="text-base mb-3 font-medium">No AI recommendations yet</div>
                <div className="text-sm mb-4">Get personalized course recommendations based on your academic profile</div>
                <Link to="/advisor" className="inline-block px-5 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium">
                  Start EduGuide AI →
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedRecs.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                        #{idx + 1} Match
                      </span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                        {rec.match_score || '95'}%
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-white leading-tight mb-1">
                      {rec.course_name || rec.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {rec.institution}
                    </div>
                    {rec.cutoff_2023 && (
                      <div className="text-xs text-slate-400 mt-2">
                        Cutoff: {rec.cutoff_2023} points
                      </div>
                    )}
                    {rec.career_paths?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {rec.career_paths.slice(0, 2).map((c: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Tab Menu (secondary content) ── */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'academic', label: 'Academic & Interests' },
            { id: 'activity', label: 'Activity & Stats' },
            { id: 'role', label: 'Role & Posts' },
            { id: 'classroom', label: 'Classroom Codes 🎟️' },
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

            {/* Following Associates */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Following</div>
                  <Link to="/associates" className="text-sm text-teal-600 hover:text-teal-700">Discover more →</Link>
                </div>
              </CardHeader>
              <CardContent>
                {followedAssociates.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                    You're not following any Associates yet.{' '}
                    <Link to="/associates" className="text-teal-600 hover:underline">Browse the directory</Link> to find mentors and societies in your field.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {followedAssociates.map((assoc: any) => (
                      <Link
                        key={assoc.id}
                        to={`/hubs/_/associates/${assoc.id}`}
                        className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all group"
                      >
                        {assoc.profile_image ? (
                          <img src={assoc.profile_image} alt={assoc.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {assoc.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-teal-600">
                            {assoc.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {assoc.associate_type.charAt(0) + assoc.associate_type.slice(1).toLowerCase()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
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

        {activeTab === 'activity' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Profile Completion Tracker */}
            <Card className="bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 dark:text-white">Profile Completion</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{user?.profile_completion || 0}% Complete</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${user?.profile_completion || 0}%` }}
                    ></div>
                  </div>
                  {user?.profile_completion_details && (
                    <div className="space-y-2 text-sm">
                      {Object.entries(user.profile_completion_details).map(([key, completed]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${completed ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
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
              <CardHeader><div className="font-semibold text-slate-900 dark:text-white">Achievements</div></CardHeader>
              <CardContent>
                {isLoadingAchievements ? (
                  <div className="text-center py-4 text-slate-500">Loading achievements...</div>
                ) : achievements.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {achievements.slice(0, 6).map((achievement: any) => (
                      <div key={achievement.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-lg">{achievement.achievement.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{achievement.achievement.title}</div>
                          <div className="text-xs text-slate-500">{new Date(achievement.earned_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500">No achievements yet. Start engaging to earn badges!</div>
                )}
              </CardContent>
            </Card>

            {/* Analytics */}
            {analytics && (
              <Card className="lg:col-span-2 bg-white dark:bg-slate-800">
                <CardHeader><div className="font-semibold text-slate-900 dark:text-white">Activity Analytics</div></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{analytics.total_posts || 0}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Posts Created</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.total_comments || 0}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Comments Made</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.upvotes_received || 0}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Upvotes Received</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.recent_posts || 0}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Posts (30 days)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Saved Posts */}
            <Card className="lg:col-span-2">
              <CardHeader><div className="font-semibold">Saved Posts</div></CardHeader>
              <CardContent className="space-y-3">
                {bookmarkedPosts.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No posts saved yet.</div>}
                {bookmarkedPosts.map(item => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{item.title}</div>
                    {item.meta && <div className="text-sm text-slate-500 dark:text-slate-400">{item.meta}</div>}
                    <Link to={`/posts/${item.id}`} className="mt-2 text-sm text-teal-500 hover:text-teal-600 block">Open discussion</Link>
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

        {activeTab === 'classroom' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Generate codes box */}
            <Card className="theme-surface card-shadow border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="font-semibold text-slate-900 dark:text-white text-lg">🎟️ Generate Shareable Codes</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 rounded-xl text-xs text-teal-850 dark:text-teal-350 space-y-1">
                  <div className="font-bold">Available balance to share:</div>
                  <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {user?.ai_trials_balance || 0} Tokens
                  </div>
                  <p className="mt-1 leading-normal">
                    Generate student codes from your pool. 1 token will be locked per code created and credited to the student who redeems it.
                  </p>
                </div>

                <form onSubmit={handleGenerateCodes} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Number of codes to generate
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, user?.ai_trials_balance || 0)}
                      required
                      value={generateCount}
                      onChange={(e) => setGenerateCount(parseInt(e.target.value) || 0)}
                      disabled={isGeneratingCodes || !user?.ai_trials_balance}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isGeneratingCodes || !user?.ai_trials_balance || generateCount <= 0}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    {isGeneratingCodes ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Codes'
                    )}
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* List generated codes */}
            <Card className="lg:col-span-2 theme-surface card-shadow border border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 dark:text-white text-lg">List of Class Invite Codes</div>
                  <button
                    onClick={fetchClassroomCodes}
                    disabled={loadingCodes}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCodes ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCodes ? (
                  <div className="text-center py-12 text-slate-505">Loading offer codes...</div>
                ) : classroomCodes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <div className="text-4xl mb-2">🎫</div>
                    <p className="text-sm font-medium">No invite codes generated yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Use the panel on the left to generate student codes.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-550 uppercase tracking-wider font-bold">
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Created</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classroomCodes.map((codeItem) => (
                          <tr key={codeItem.id} className="border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white text-sm select-all">{codeItem.code}</td>
                            <td className="py-3 px-3">{new Date(codeItem.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-3">
                              {codeItem.is_claimed ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-250 dark:border-slate-700">
                                  Redeemed by @{codeItem.claimed_by}
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-semibold animate-pulse">
                                  Active (Unused)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(codeItem.code);
                                  alert('Code copied to clipboard!');
                                }}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-250 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium"
                              >
                                Copy
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
            </Card>
          </div>
        )}
        </div>
      </div>
      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccepted}
        onCancel={() => setShowTermsModal(false)}
        dataType="personal"
      />
    </PageContainer>
  )
}
