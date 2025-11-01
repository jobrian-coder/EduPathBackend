import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, MessageSquare, Plus, ThumbsUp, Users } from 'lucide-react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'
import { Button } from '../../../components/common/Button'
import { Dialog } from '../../../components/common/Dialog'
import AdSpace from '../../../components/common/AdSpace'
import { toggleBookmark, isBookmarked } from '../../../lib/bookmarks'
import api, {
  type SocietyPost,
  type SocietyPostType,
} from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'
import { useHubPosts } from '../../hubs/hooks/useHubPosts'

interface SocietyPostFormValues {
  title: string
  content: string
  post_type: SocietyPostType
  tags: string[]
}

const SOCIETY_POST_TYPES: Array<{ value: SocietyPostType; label: string; emoji: string }> = [
  { value: 'question', label: 'Question', emoji: '❓' },
  { value: 'discussion', label: 'Discussion', emoji: '💬' },
  { value: 'announcement', label: 'Project/Showcase', emoji: '🚀' },
  { value: 'opportunity', label: 'Help/Advice', emoji: '🤝' },
]

const SocietyPostForm = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: SocietyPostFormValues) => Promise<void>
  isSubmitting: boolean
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<SocietyPostType>('discussion')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setTitle('')
    setContent('')
    setPostType('discussion')
    setTags([])
    setTagInput('')
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Title and details are required.')
      return
    }

    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        post_type: postType,
        tags,
      })
      reset()
      onClose()
    } catch (err) {
      console.error('Failed to create society post', err)
      setError('Unable to create post. Please try again later.')
    }
  }

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags((prev) => [...prev, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Share with the society">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Post type</label>
          <div className="grid grid-cols-2 gap-2">
            {SOCIETY_POST_TYPES.map((type) => (
              <button
                type="button"
                key={type.value}
                onClick={() => setPostType(type.value)}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition ${
                  postType === type.value
                    ? 'border-teal-500 bg-teal-50 text-teal-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{type.emoji}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="society-post-title">
            Title
          </label>
          <input
            id="society-post-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="What would you like to share?"
            maxLength={300}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="society-post-content">
            Details
          </label>
          <textarea
            id="society-post-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Share more context, links, or resources..."
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="society-post-tags">
            Tags (optional)
          </label>
          <div className="flex flex-wrap gap-2 pb-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-700">
                #{tag}
                <button
                  type="button"
                  className="rounded-full bg-teal-200 px-1 text-teal-600 hover:bg-teal-300"
                  onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            id="society-post-tags"
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={handleAddTag}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Press Enter to add a tag"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="default" disabled={isSubmitting}>
            Post
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function Societies() {
  const navigate = useNavigate()
  const [joined, setJoined] = useState<Record<string, boolean>>({})
  const [societies, setSocieties] = useState<any[]>([])
  const [selectedSocietyId, setSelectedSocietyId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(true)
  const [societiesError, setSocietiesError] = useState<string | null>(null)

  const { isAuthenticated } = useAuth()
  const { postsQuery, createPost, isCreatingPost, voteOnPost, unvoteOnPost, isVoting } = useHubPosts(selectedSocietyId)

  useEffect(() => {
    let isMounted = true

    const fetchHubs = async () => {
      setIsLoadingSocieties(true)
      setSocietiesError(null)
      try {
        const { results } = await api.hubs.listHubs()
        if (!isMounted) return
        setSocieties(results)
        if (results.length > 0 && !selectedSocietyId) {
          setSelectedSocietyId(String(results[0].id))
        }
      } catch (error) {
        console.error('Failed to load communities', error)
        if (isMounted) {
          setSocietiesError('Failed to load communities. Please try again later.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingSocieties(false)
        }
      }
    }

    fetchHubs()

    return () => {
      isMounted = false
    }
  }, [selectedSocietyId])

  const joinedCount = useMemo(() => Object.values(joined).filter(Boolean).length, [joined])

  const selectedSociety = selectedSocietyId
    ? societies.find((society) => String(society.id) === String(selectedSocietyId)) ?? null
    : null

  const posts = (postsQuery.data as SocietyPost[] | undefined) ?? []
  const isLoadingPosts = postsQuery.isLoading
  const isPostsError = postsQuery.isError

  const handleToggleJoin = (societyId: string) => {
    setJoined((prev) => ({ ...prev, [societyId]: !prev[societyId] }))
  }

  const handleCreatePostClick = () => {
    if (!isAuthenticated) {
      alert('Please sign in to share a post in this society.')
      return
    }
    if (selectedSocietyId && !joined[selectedSocietyId]) {
      alert('Join the society first to share a post.')
      return
    }
    setIsCreateOpen(true)
  }

  const handleCreatePost = async (values: SocietyPostFormValues) => {
    if (!selectedSocietyId) return
    await createPost({
      title: values.title,
      content: values.content,
      post_type: values.post_type,
      tags: values.tags,
    })
  }

  const handleUpvote = async (post: SocietyPost) => {
    if (!isAuthenticated) {
      alert('Sign in to upvote posts.')
      return
    }
    try {
      if (post.user_vote === 'upvote') {
        await unvoteOnPost({ postId: post.id })
      } else {
        await voteOnPost({ postId: post.id, voteType: 'upvote' })
      }
    } catch (error) {
      console.error('Failed to update vote', error)
    }
  }

  return (
    <PageContainer title="Communities">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="border-t-4 border-t-teal-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-semibold">Explore Communities</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Joined: {joinedCount}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {isLoadingSocieties && (
                <div className="flex items-center justify-center py-6 text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading communities...
                </div>
              )}

              {societiesError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {societiesError}
                </div>
              )}

              {!isLoadingSocieties && !societiesError && societies.length === 0 && (
                <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
                  No communities available yet. Check back soon.
                </div>
              )}

              {societies.map((society) => (
                <div
                  key={society.id}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    selectedSocietyId === String(society.id)
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                  onClick={() => setSelectedSocietyId(String(society.id))}
                >
                  <div className="flex items-start gap-3">
                    {(society as any).icon_url ? (
                      <img 
                        src={(society as any).icon_url} 
                        alt={society.name}
                        className="h-12 w-12 rounded-full object-cover border border-slate-300"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 text-2xl">
                        {society.icon || '🏛️'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div 
                            className="font-medium text-lg cursor-pointer hover:text-teal-600 transition"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/hubs/${society.slug}`)
                            }}
                          >
                            {society.name}
                          </div>
                          <div className="text-xs uppercase tracking-wide text-slate-500">{society.field || society.type}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/hubs/${society.slug}`)
                            }}
                            className="rounded-full border border-teal-600 px-3 py-1 text-xs text-teal-600 hover:bg-teal-50 transition"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleToggleJoin(String(society.id))
                            }}
                            className={`rounded-full px-2 py-1 text-xs transition ${
                              joined[String(society.id)]
                                ? 'border border-slate-600 bg-slate-800 text-slate-100'
                                : 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800'
                            }`}
                          >
                            {joined[String(society.id)] ? 'Joined' : 'Join'}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{society.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-teal-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" /> {selectedSociety?.acronym ?? 'Select a community'}
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Community Feed</h2>
                </div>
                <Button variant="default" onClick={handleCreatePostClick} disabled={!selectedSocietyId}>
                  <Plus className="mr-2 h-4 w-4" /> Share Post
                </Button>
              </div>
              {selectedSociety && (
                <p className="mt-2 text-sm text-slate-500">
                  {selectedSociety.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {!selectedSocietyId && (
                <div className="rounded-lg border border-slate-200 p-6 text-center text-slate-500">
                  Select a community to view its posts.
                </div>
              )}

              {selectedSocietyId && isLoadingPosts && (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading posts...
                </div>
              )}

              {selectedSocietyId && isPostsError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  Unable to load posts right now. Please try again later.
                </div>
              )}

              {selectedSocietyId && !isLoadingPosts && !isPostsError && posts.length === 0 && (
                <div className="rounded-lg border border-slate-200 p-6 text-center">
                  <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-800">No posts yet</h3>
                  <p className="text-sm text-slate-500">
                    Be the first to spark a conversation in this community.
                  </p>
                  <Button className="mt-4" onClick={handleCreatePostClick} disabled={!selectedSocietyId || isCreatingPost}>
                    <Plus className="mr-2 h-4 w-4" /> Create Post
                  </Button>
                </div>
              )}

              {posts.map((post) => {
                const authorName = post.author
                  ? post.author.first_name || post.author.last_name
                    ? `${post.author.first_name ?? ''} ${post.author.last_name ?? ''}`.trim()
                    : post.author.username
                  : 'Anonymous'

                return (
                  <div key={post.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-400">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-600">
                            {post.post_type}
                          </span>
                          <span>By {authorName}</span>
                        </div>
                        <span>{new Date(post.created_at).toLocaleString()}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
                      <p className="text-sm text-slate-600 whitespace-pre-line">{post.content}</p>

                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => handleUpvote(post)}
                          disabled={isVoting}
                          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
                            post.user_vote === 'upvote'
                              ? 'border-teal-600 bg-teal-100 text-teal-700'
                              : 'border-slate-200 hover:border-teal-400 hover:text-teal-500'
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" /> {post.upvotes}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            toggleBookmark({
                              id: `society-post:${post.id}`,
                              type: 'post',
                              title: post.title,
                              meta: selectedSociety?.name ?? 'Society',
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-100"
                        >
                          {isBookmarked(`society-post:${post.id}`, 'post') ? '✓ Saved' : '💾 Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <AdSpace title="Sponsored Schools & Bootcamps" />

          <Card className="border-t-4 border-t-teal-500">
            <CardHeader>
              <div className="font-semibold">✍️ Share a community post</div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">
                Join a community to unlock posting. Posts can be questions, discussions, projects, or helpful content.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {societies.map((society) => (
                  <button
                    key={society.id}
                    onClick={() => {
                      setSelectedSocietyId(String(society.id))
                      handleCreatePostClick()
                    }}
                    disabled={!joined[String(society.id)]}
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      joined[String(society.id)]
                        ? 'border border-slate-200 hover:bg-slate-100'
                        : 'border border-slate-400 text-slate-500'
                    }`}
                  >
                    ＋ {society.acronym}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-teal-500">
            <CardHeader>
              <div className="font-semibold">🔥 Popular Communities</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {societies.slice(0, 5).map((society) => (
                <div
                  key={society.id}
                  className="rounded-lg border border-slate-200 p-3 hover:border-teal-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {(society as any).icon_url ? (
                        <img 
                          src={(society as any).icon_url} 
                          alt={society.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="text-xl">{society.icon || '🏛️'}</div>
                      )}
                      <div>
                        <div className="text-lg font-medium">{society.name}</div>
                        <p className="text-xs text-slate-500">{society.field || society.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSocietyId(society.id)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-100"
                    >
                      Join
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">{society.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <SocietyPostForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreatePost}
        isSubmitting={isCreatingPost}
      />
    </PageContainer>
  )
}
