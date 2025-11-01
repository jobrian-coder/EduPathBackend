import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import api, { type Hub, type Post } from '../../../services/api'

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
            <div className="text-slate-600 dark:text-slate-300">No hub found. Go back to <Link to="/societies" className="text-blue-600">Hubs</Link>.</div>
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
                    <div className="text-lg font-semibold text-black dark:text-white">{p.title}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Posted by <span className="text-blue-500">{p.author?.username ?? 'anonymous'}</span></div>
                    <div className="flex flex-wrap items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
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
        </div>
      </div>
    </PageContainer>
  )
}
