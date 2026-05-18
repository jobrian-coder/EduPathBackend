import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import api, { type Hub, type Post } from '../../../services/api'
import { RoleBadge } from '../components/RoleBadge'
import { LinkPreviewCard } from '../components/LinkPreviewCard'

const MOCK_INSTITUTIONS = [
  {
    id: 1,
    name: 'Moringa School',
    logo: '🎓',
    type: 'bootcamp' as const,
    website: 'https://moringaschool.com',
    description: 'Africa\'s leading tech bootcamp — software engineering, data science, and UX design programmes.',
  },
  {
    id: 2,
    name: 'Strathmore University',
    logo: '🏫',
    type: 'school' as const,
    website: 'https://strathmore.edu',
    description: 'Top-ranked Kenyan university with a strong faculty of IT and computer science.',
  },
  {
    id: 3,
    name: 'Andela Kenya',
    logo: '💼',
    type: 'company' as const,
    website: 'https://andela.com',
    description: 'Global talent marketplace connecting African software engineers to world-class opportunities.',
  },
]

export default function HubProfile() {
  const { slug = '' } = useParams()
  const [hub, setHub] = useState<Hub | null>(null)
  const [posts, setPosts] = useState<(Post & { upvoted?: boolean })[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<'question' | 'guide' | 'discussion' | 'success_story'>('discussion')

  useEffect(() => {
    (async () => {
      try {
        const h = await api.hubs.getHub(String(slug))
        setHub(h)
      } catch { setHub(null) }
      try {
        const { results } = await api.hubs.listPosts({ hub: String(slug) })
        setPosts(results.map(r => ({ ...r, upvoted: false } as any)))
      } catch { setPosts([]) }
    })()
  }, [slug])

  function toggleUpvote(id: string) {
    setPosts((prev) => prev.map((p) => {
      if (String(p.id) !== String(id)) return p
      const was = (p as any).upvoted
      const nextUpvotes = was ? Math.max(0, (p.upvotes ?? 0) - 1) : (p.upvotes ?? 0) + 1
      return { ...p, upvoted: !was, upvotes: nextUpvotes }
    }))
  }

  async function createPost() {
    if (!hub || !title.trim() || !content.trim()) return
    const newPost = await api.hubs.createPost({ hub: String(hub.id), title, content, post_type: postType, tags: [] })
    setPosts(prev => [{ ...newPost, upvoted: false } as any, ...prev])
    setTitle('')
    setContent('')
    setPostType('discussion')
  }

  if (!hub) {
    return (
      <PageContainer title="Hub Not Found">
        <Card>
          <CardContent>
            <div className="text-slate-600 dark:text-slate-300">No hub found. Go back to <Link to="/hubs" className="text-blue-600">Hubs</Link>.</div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Hub Header/Profile */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-6xl">{hub.icon ?? '💼'}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{hub.name}</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">{hub.description}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{(hub.member_count ?? 0).toLocaleString()}</span> members
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{(hub.active_posts ?? 0).toLocaleString()}</span> posts
                </div>
                {hub.created_at && (
                  <div className="flex items-center gap-1">
                    Created {new Date(hub.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 font-medium">
                  Join Community
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="font-semibold">Community Posts</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts.length === 0 && (
                <div className="text-slate-500">No posts yet. Be the first to post.</div>
              )}
              {posts.map((p:any)=> (
                <Link to={`/posts/${p.id}`} key={p.id} className="block hover:no-underline">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-500/50 transition">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {p.post_type === 'link' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">🔗 Link</span>
                      )}
                      {p.post_type === 'image' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">🖼️ Image</span>
                      )}
                    </div>
                    <div className="text-lg font-semibold text-black dark:text-white">{p.title}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2 flex-wrap">
                      <span>Posted by <span className="text-blue-500">{p.author?.username ?? 'anonymous'}</span></span>
                      {p.author?.is_expert_post && <RoleBadge role="mentor" size="sm" />}
                      {p.author?.role && <RoleBadge role={p.author.role} size="sm" />}
                    </div>
                    {p.post_type === 'link' && p.link_url && (
                      <LinkPreviewCard url={p.link_url} title={p.content || undefined} />
                    )}
                    {p.post_type === 'image' && p.image_url && (
                      <div className="mt-2 mb-2 rounded-lg overflow-hidden max-h-40 border border-slate-200 dark:border-slate-700">
                        <img src={p.image_url} alt={p.title} className="w-full object-cover max-h-40" onClick={e => e.preventDefault()} />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-sm mt-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleUpvote(p.id); }} 
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition ${p.upvoted ? 'bg-orange-600/20 border-orange-700 text-orange-400' : 'border-slate-200 dark:border-slate-700 hover:bg-orange-500/10 hover:text-orange-400'}`}
                      >
                        ▲ {p.upvotes}
                      </button>
                      <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                        💬 {p.comment_count}
                      </button>
                      <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition">
                        ↗ Share
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><div className="font-semibold">Create a Post</div></CardHeader>
            <CardContent className="space-y-3">
              <input 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                placeholder="Title" 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white" 
              />
              <textarea 
                value={content} 
                onChange={e=>setContent(e.target.value)} 
                placeholder="Share something with the hub..." 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white min-h-[120px]" 
              />
              <select 
                value={postType} 
                onChange={e=>setPostType(e.target.value as any)} 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-black dark:text-white"
              >
                <option value="discussion">Discussion</option>
                <option value="question">Question</option>
                <option value="guide">Guide</option>
                <option value="success_story">Success Story</option>
              </select>
              <button onClick={createPost} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700">Post</button>
            </CardContent>
          </Card>

          {hub.rules && (
            <Card>
              <CardHeader><div className="font-semibold">Community Rules</div></CardHeader>
              <CardContent>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {hub.rules}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><div className="font-semibold">About</div></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Category</span>
                  <span className="font-medium text-slate-900 dark:text-white">{hub.field}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Members</span>
                  <span className="font-medium text-slate-900 dark:text-white">{(hub.member_count ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Posts</span>
                  <span className="font-medium text-slate-900 dark:text-white">{(hub.active_posts ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affiliated Institutions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-semibold">Affiliated Institutions</div>
                <RoleBadge role="institution" size="sm" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_INSTITUTIONS.map(inst => (
                <div key={inst.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400/60 dark:hover:border-amber-600/40 transition-all">
                  <div className="text-2xl flex-shrink-0">{inst.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{inst.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 capitalize">{inst.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{inst.description}</p>
                    <a
                      href={inst.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Visit <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-1">
                Institutions marked 🏛️ can post links & resources in this hub.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
