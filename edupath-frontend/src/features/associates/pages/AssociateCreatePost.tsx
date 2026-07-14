import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send, AlertTriangle, Image as ImageIcon, Link as LinkIcon, Calendar, Megaphone, FileText, X, Upload, Lock } from 'lucide-react'
import api, { type Associate } from '../../../services/api'

type PostType = 'UPDATE' | 'OPPORTUNITY' | 'EVENT' | 'RESOURCE'

const POST_TYPES: { value: PostType; label: string; icon: any; desc: string; color: string }[] = [
  {
    value: 'UPDATE',
    label: 'Text Update',
    icon: FileText,
    desc: 'Share news, announcements, or general information',
    color: 'border-slate-500 bg-slate-500/10 text-slate-300',
  },
  {
    value: 'OPPORTUNITY',
    label: 'Ad / Banner',
    icon: Megaphone,
    desc: 'Post opportunities with images, banners, or promotional content',
    color: 'border-teal-500 bg-teal-500/10 text-teal-300',
  },
  {
    value: 'EVENT',
    label: 'Event',
    icon: Calendar,
    desc: 'Workshops, seminars, open days, or meetups',
    color: 'border-violet-500 bg-violet-500/10 text-violet-300',
  },
  {
    value: 'RESOURCE',
    label: 'Link / Resource',
    icon: LinkIcon,
    desc: 'Share useful links, guides, PDFs, tools, or reading materials',
    color: 'border-blue-500 bg-blue-500/10 text-blue-300',
  },
]

const NEEDS_EXTERNAL = new Set<PostType>(['OPPORTUNITY', 'EVENT', 'RESOURCE'])
const NEEDS_CTA      = new Set<PostType>(['OPPORTUNITY', 'EVENT', 'RESOURCE'])
const NEEDS_DEADLINE = new Set<PostType>(['OPPORTUNITY', 'EVENT'])

export default function AssociateCreatePost() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialType = (location.state as { postType?: PostType })?.postType || 'UPDATE'

  const [postType, setPostType] = useState<PostType>(initialType)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [deadline, setDeadline] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isApproved, setIsApproved] = useState<boolean | null>(null)
  const [associate, setAssociate] = useState<Associate | null>(null)

  useEffect(() => {
    api.associates.getApplicationStatus().then(res => {
      setIsApproved(res.application_status === 'APPROVED' && res.is_verified)
    }).catch(() => {
      setIsApproved(false)
    })

    api.associates.getMe().then(assoc => {
      setAssociate(assoc)
    }).catch(() => {})
  }, [])

  const selectedType = POST_TYPES.find(t => t.value === postType)!
  const SelectedIcon = selectedType.icon

  const handleTypeChange = (type: PostType) => {
    if (associate?.tier === 'FREE' && type !== 'UPDATE') {
      setError('Opportunities, Events, and Resources are locked under the Free plan. Please upgrade your plan in the dashboard to publish these post types.')
      return
    }
    setPostType(type)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!body.trim()) {
      setError('Body is required.')
      return
    }
    if (NEEDS_EXTERNAL.has(postType) && !externalUrl.trim()) {
      setError('A link URL is required for this post type.')
      return
    }
    if (NEEDS_CTA.has(postType) && !ctaLabel.trim()) {
      setError('A button label (CTA) is required for this post type.')
      return
    }

    setSubmitting(true)
    try {
      await api.associates.createPost({
        post_type: postType,
        title: title.trim() || undefined,
        body: body.trim(),
        image_url: imageUrl.trim() || undefined,
        external_url: externalUrl.trim() || undefined,
        cta_label: ctaLabel.trim() || undefined,
        deadline: deadline || undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to create post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-5 text-center px-4">
        <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center text-4xl">
          ✅
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Post Published!</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs">
          Your {selectedType.label.toLowerCase()} post is now live on your associate page.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSuccess(false)
              setTitle('')
              setBody('')
              setImageUrl('')
              setExternalUrl('')
              setCtaLabel('')
              setDeadline('')
            }}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
          >
            Create another
          </button>
          <button
            onClick={() => navigate('/associates')}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium"
          >
            Back to My Posts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        <button
          onClick={() => navigate('/associates')}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Posts
        </button>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create a Post</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">Choose a type, fill in the details, and publish to your page.</p>

        {/* Post type selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {POST_TYPES.map(type => {
            const TypeIcon = type.icon
            const isLocked = associate?.tier === 'FREE' && type.value !== 'UPDATE'
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  postType === type.value
                    ? type.color
                    : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-350 bg-slate-900/10'
                } ${isLocked ? 'opacity-55' : ''}`}
              >
                {isLocked && <Lock className="w-3.5 h-3.5 absolute top-2 right-2 text-yellow-500" />}
                <TypeIcon className="w-6 h-6" />
                <span className="text-xs font-semibold">{type.label}</span>
              </button>
            )
          })}
        </div>

        {/* Quota info banner */}
        {associate && (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 mb-6 flex justify-between items-center text-xs text-slate-300">
            <span>
              Active Plan: <strong className="text-white uppercase font-bold">{associate.tier}</strong>
            </span>
            <span>
              Quota used: <strong className="text-teal-400 font-bold">
                {associate.tier === 'FREE' && `${associate.monthly_post_count} / 3 posts`}
                {associate.tier === 'STANDARD' && `${associate.monthly_post_count} / 10 posts`}
                {associate.tier === 'PREMIUM' && `${associate.monthly_post_count} / Unlimited`}
              </strong> this month
            </span>
          </div>
        )}

        {/* Type description */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-6">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <SelectedIcon className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{selectedType.label}</p>
            <p className="text-slate-400 text-xs mt-0.5">{selectedType.desc}</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-5 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Approval banner */}
        {isApproved === false && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-5 text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Application Pending Approval</p>
              <p className="text-amber-500/80 mt-1">You can draft your post now, but you'll only be able to publish it once your application is approved by our team.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Title <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                postType === 'OPPORTUNITY' ? 'e.g. Software Engineering Internship 2025' :
                postType === 'EVENT'       ? 'e.g. Annual Career Fair at UoN' :
                postType === 'RESOURCE'    ? 'e.g. KCSE Chemistry Revision Guide' :
                'e.g. Company News Update'
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Body <span className="text-red-400">*</span>
              <span className={`ml-2 text-xs font-normal ${body.length > 1000 ? 'text-red-400' : 'text-slate-500'}`}>
                {body.length}/1000
              </span>
            </label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={
                postType === 'OPPORTUNITY' ? 'Describe the opportunity, eligibility, and what students should expect…' :
                postType === 'EVENT'       ? 'Describe the event, what attendees can expect, and who should attend…' :
                postType === 'RESOURCE'    ? 'Describe the resource and how it helps students…' :
                'Write your update or announcement here…'
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-sm"
            />
          </div>

          {/* External URL — required for OPPORTUNITY, EVENT, RESOURCE */}
          {NEEDS_EXTERNAL.has(postType) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {postType === 'RESOURCE' ? 'Resource URL' : 'Application / Registration Link'} <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={e => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          )}

          {/* CTA Label — required for OPPORTUNITY, EVENT, RESOURCE */}
          {NEEDS_CTA.has(postType) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Button Label <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={e => setCtaLabel(e.target.value)}
                placeholder={
                  postType === 'OPPORTUNITY' ? 'e.g. Apply Now' :
                  postType === 'EVENT'       ? 'e.g. Register Here' :
                  'e.g. View Resource'
                }
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          )}

          {/* Deadline — optional for OPPORTUNITY, EVENT */}
          {NEEDS_DEADLINE.has(postType) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {postType === 'EVENT' ? 'Event Date' : 'Application Deadline'}
                <span className="text-slate-500 font-normal"> (optional)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          )}

          {/* Image / Banner URL — available for all post types */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Banner / Image URL
                <span className="text-slate-500 font-normal">(optional)</span>
              </div>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder={
                postType === 'OPPORTUNITY' ? 'https://... (banner image for your ad/opportunity)' :
                postType === 'EVENT' ? 'https://... (event banner or poster)' :
                postType === 'RESOURCE' ? 'https://... (preview image for your resource)' :
                'https://... (image to accompany your update)'
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            {imageUrl && (
              <div className="mt-3 relative">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="rounded-xl w-full h-48 object-cover border border-slate-700" 
                  onError={e => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  Unable to load image. Please check the URL.
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-900/80 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="mt-1.5 text-xs text-slate-500">
              Add an image to make your post more engaging. Recommended size: 1200x630px.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/associates')}
              className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || body.length > 1000 || isApproved === false}
              className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Publishing…' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
