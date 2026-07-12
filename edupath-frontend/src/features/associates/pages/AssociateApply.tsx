import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, CheckCircle, ChevronDown } from 'lucide-react'
import api from '../../../services/api'
import type { Hub } from '../../../services/api'

const TYPE_OPTIONS = [
  { value: 'MENTOR', label: 'Professional Mentor', icon: '🧑‍💼', desc: 'An individual working in industry who mentors students' },
  { value: 'SOCIETY', label: 'University Society', icon: '🎓', desc: 'A student or alumni society at a Kenyan university' },
  { value: 'SCHOOL', label: 'School / Bootcamp / Training Provider', icon: '🏫', desc: 'A secondary school, coding bootcamp, or training centre' },
]

export default function AssociateApply() {
  const navigate = useNavigate()
  const [hubs, setHubs] = useState<Hub[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    associate_type: '' as 'MENTOR' | 'SOCIETY' | 'SCHOOL' | '',
    hub_id: '',
    bio: '',
    website: '',
    location: '',
    contact_email: '',
  })

  useEffect(() => {
    api.hubs.listHubs().then(({ results }) => setHubs(results))
  }, [])

  const bioLen = form.bio.length
  const bioOver = bioLen > 300

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.associate_type || !form.hub_id) return
    if (bioOver) return
    setSubmitting(true)
    setError(null)
    try {
      await api.associates.apply({
        name: form.name,
        associate_type: form.associate_type as 'MENTOR' | 'SOCIETY' | 'SCHOOL',
        bio: form.bio,
        website: form.website || undefined,
        location: form.location || undefined,
        contact_email: form.contact_email,
        hub_id: form.hub_id,
      })
      navigate('/associates/dashboard/create')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Application Received!</h2>
          <p className="text-slate-400">
            Thank you for applying. You will be contacted at <span className="text-teal-400">{form.contact_email}</span> once your application has been reviewed by our team.
          </p>
          <p className="text-sm text-slate-500">
            This usually takes 2–5 business days.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-400 text-sm font-medium mb-4">
            <User className="w-4 h-4" />
            Join EduPath as an Associate
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Become an Associate</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Reach thousands of motivated Kenyan students at the exact moment they are making career decisions. Apply to get a verified page inside your hub.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Name / Organisation Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. James Mwangi or Moringa School"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Associate Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, associate_type: opt.value as any }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.associate_type === opt.value
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.icon}</div>
                  <div className="text-sm font-medium text-white">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hub */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Hub (Community) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={form.hub_id}
                onChange={e => setForm(f => ({ ...f, hub_id: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select a hub…</option>
                {hubs.map(h => (
                  <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Bio <span className="text-red-400">*</span>
              <span className={`ml-2 text-xs font-normal ${bioOver ? 'text-red-400' : 'text-slate-500'}`}>
                {bioLen}/300
              </span>
            </label>
            <textarea
              required
              rows={4}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Describe your background, what you offer students, and why you're joining EduPath..."
              className={`w-full px-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                bioOver ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {bioOver && <p className="text-xs text-red-400 mt-1">Bio must be 300 characters or fewer.</p>}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Contact Email <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="email"
              value={form.contact_email}
              onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Nairobi, Kenya"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || bioOver || !form.associate_type || !form.hub_id}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            By submitting you agree to EduPath's community guidelines. Applications are reviewed within 2–5 business days.
          </p>
        </form>
      </div>
    </div>
  )
}
