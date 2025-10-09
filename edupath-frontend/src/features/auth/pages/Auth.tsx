import { useMemo, useState } from 'react'
import AuthCard from '../../../components/auth/AuthCard'
import AuthInput from '../../../components/auth/AuthInput'
import AuthButton from '../../../components/auth/AuthButton'
import api from '../../../services/api'
import logo from '../../../assets/edupath icon.jpg'
import bg1 from '../../../assets/lalianda.jpg'
import bg2 from '../../../assets/loliondo.jpg'
import bg3 from '../../../assets/loliende.jpg'

function strengthInfo(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const level = score <= 2 ? 'Weak' : score === 3 ? 'Medium' : 'Strong'
  const color = score <= 2 ? 'bg-red-500' : score === 3 ? 'bg-yellow-500' : 'bg-green-500'
  const pct = Math.min(100, (score / 5) * 100)
  return { score, level, color, pct }
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login'|'signup'>('signup')
  const [loading, setLoading] = useState(false)

  // login fields
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  // signup fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [spw, setSpw] = useState('')
  const [spw2, setSpw2] = useState('')

  const pwInfo = useMemo(() => strengthInfo(spw), [spw])

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validateLogin() {
    const e: Record<string, string> = {}
    if (!identifier) e.identifier = 'Please enter email or username.'
    if (!password) e.password = 'Please enter your password.'
    setErrors(e)
    return Object.keys(e).length === 0
  }
  function validateSignup() {
    const e: Record<string, string> = {}
    if (!fullName) e.fullName = 'Full name is required.'
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = 'Enter a valid email.'
    if (!spw) e.spw = 'Create a password.'
    if (spw && spw.length < 8) e.spw = 'Password should be at least 8 characters.'
    if (spw2 !== spw) e.spw2 = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateLogin()) return
    setLoading(true)
    try {
      const { user, token } = await api.auth.login({ email: identifier, password })
      localStorage.setItem('edupath.auth.token', token)
      localStorage.setItem('edupath.user', JSON.stringify(user))
      window.location.href = '/'
    } catch (err: any) {
      setErrors({ identifier: 'Invalid credentials', password: 'Invalid credentials' })
      alert(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function onSignupSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateSignup()) return
    setLoading(true)
    try {
      const firstName = (fullName || '').trim().split(' ')[0] || ''
      const lastName = (fullName || '').trim().split(' ').slice(1).join(' ') || ''
      const username = (email || '').split('@')[0] || (firstName || 'user')
      const { user, token } = await api.auth.register({
        email,
        username,
        password: spw,
        password_confirm: spw2,
        first_name: firstName,
        last_name: lastName,
      })
      localStorage.setItem('edupath.auth.token', token)
      localStorage.setItem('edupath.user', JSON.stringify(user))
      window.location.href = '/'
    } catch (err: any) {
      alert(err?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  function googleLogin() {
    alert('Google login (stub)')
  }
  function continueGuest() {
    alert('Continue as guest (stub)')
  }

  const bgs = [bg1, bg2, bg3]
  const chosenBg = useMemo(() => bgs[new Date().getDate() % bgs.length], [])

  return (
    <div className="min-h-[calc(100vh-64px)] grid md:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden md:flex items-center justify-center p-10 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${chosenBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-black/40 to-purple-900/50" />
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-lg mb-4">
            <img src={logo} alt="EduPath" className="w-full h-full object-cover" />
          </div>
          <div className="text-3xl font-extrabold">EduPath</div>
          <p className="mt-2 text-slate-300">Your path from KCSE to university, simplified.</p>
          <div className="mt-6 rounded-xl border border-slate-700/80 bg-slate-900/60 backdrop-blur-sm p-4 text-left shadow-xl">
            <div className="text-slate-400 text-sm">Why join?</div>
            <ul className="mt-2 space-y-1 text-slate-300 text-sm list-disc list-inside">
              <li>Compare courses and universities easily</li>
              <li>Save favorites and track opportunities</li>
              <li>Join hubs and learn from peers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right forms */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="md:hidden mb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden shadow-lg mb-3">
              <img src={logo} alt="EduPath" className="w-full h-full object-cover" />
            </div>
            <p className="mt-1 text-slate-400 text-sm">Your path from KCSE to university, simplified.</p>
          </div>

          {mode === 'login' ? (
            <div className="animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-xl" style={{backgroundImage: `url(${bgs[new Date().getDate() % bgs.length]})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
                <AuthCard title="Welcome back" subtitle="Log in to continue">
                  <form onSubmit={onLoginSubmit} className="space-y-4">
                    <AuthInput label="Email or Username" value={identifier} onChange={e=>setIdentifier(e.currentTarget.value)} placeholder="you@example.com" error={errors.identifier} />
                    <AuthInput label="Password" type="password" value={password} onChange={e=>setPassword(e.currentTarget.value)} error={errors.password} rightSlot={
                      <button type="button" onClick={()=>setPassword('')} className="px-3 text-sm text-slate-400 hover:text-slate-200">Clear</button>
                    } />
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <label className="inline-flex items-center gap-2"><input type="checkbox" className="rounded border-slate-700 bg-slate-900" /> Remember me</label>
                      <button type="button" className="text-blue-400 hover:text-blue-300">Forgot password?</button>
                    </div>
                    <AuthButton type="submit" className="w-full" disabled={loading}>Sign in</AuthButton>
                  </form>
                </AuthCard>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-xl" style={{backgroundImage: `url(${bgs[new Date().getDate() % bgs.length]})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
                <AuthCard title="Create your account" subtitle="Sign up to get started">
                  <form onSubmit={onSignupSubmit} className="space-y-4">
                    <AuthInput label="Full name" value={fullName} onChange={e=>setFullName(e.currentTarget.value)} error={errors.fullName} />
                    <AuthInput label="Email" type="email" value={email} onChange={e=>setEmail(e.currentTarget.value)} error={errors.email} />
                    <AuthInput label="Password" type="password" value={spw} onChange={e=>setSpw(e.currentTarget.value)} error={errors.spw} rightSlot={
                      <div className="flex items-center gap-2 px-2">
                        <div className={`h-1 w-16 rounded ${pwInfo.color}`} />
                        <span className="text-xs text-slate-400">{pwInfo.level}</span>
                      </div>
                    } />
                    <AuthInput label="Confirm password" type="password" value={spw2} onChange={e=>setSpw2(e.currentTarget.value)} error={errors.spw2} />
                    <AuthButton type="submit" className="w-full" disabled={loading}>Create account</AuthButton>
                  </form>
                </AuthCard>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <AuthButton variant="secondary" onClick={googleLogin}>Google</AuthButton>
            <AuthButton variant="secondary" onClick={continueGuest}>Guest</AuthButton>
            <AuthButton variant="secondary" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'Sign up':'Log in'}</AuthButton>
          </div>
        </div>
      </div>
    </div>
  )
}
