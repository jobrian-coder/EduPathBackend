import { useMemo, useState } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import api from '../../../services/api'
import edupathIcon from '../../../assets/login/edupathicong.png'
import eduBackground from '../../../assets/login/eduimg.png'

export default function AuthPage() {
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Background style for the auth page
  const backgroundStyle = {
    backgroundImage: `url('/assets/edupathbackground.gif')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: -1,
  } as React.CSSProperties;

  // login fields
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  // signup fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [spw, setSpw] = useState('')
  const [spw2, setSpw2] = useState('')

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

  function appleLogin() {
    alert('Apple login (stub)')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-12 lg:px-16 xl:px-20 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src={edupathIcon} alt="EduPath" className="w-8 h-8" />
            <span className="text-2xl font-bold text-gray-900">EduPath</span>
          </div>

          {/* Welcome Message */}
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome Back!' : 'Join EduPath!'}
            </h1>
          </div>

          {/* Instructional Text */}
          <p className="text-gray-600 mb-8">
            {mode === 'login' 
              ? "Sign in to access your dashboard and continue your educational journey." 
              : "Create your account to start exploring courses, universities, and career paths."
            }
          </p>

          {/* Form */}
          <form onSubmit={mode === 'login' ? onLoginSubmit : onSignupSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={mode === 'login' ? identifier : email}
                  onChange={(e) => mode === 'login' ? setIdentifier(e.target.value) : setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
              {errors.identifier && mode === 'login' && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
              )}
              {errors.email && mode === 'signup' && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={mode === 'login' ? password : spw}
                  onChange={(e) => mode === 'login' ? setPassword(e.target.value) : setSpw(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && mode === 'login' && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              {errors.spw && mode === 'signup' && (
                <p className="mt-1 text-sm text-red-600">{errors.spw}</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={spw2}
                  onChange={(e) => setSpw2(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  placeholder="Confirm your password"
                />
                {errors.spw2 && (
                  <p className="mt-1 text-sm text-red-600">{errors.spw2}</p>
                )}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-teal-600 hover:text-teal-500"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button
              onClick={googleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={appleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          {/* Sign Up/Login Link */}
          <div className="mt-6 text-center">
            <span className="text-gray-600">
              {mode === 'login' ? "Don't have an Account? " : "Already have an Account? "}
            </span>
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-teal-600 hover:text-teal-500 font-medium"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Marketing Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${eduBackground})` }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-teal-800/70 to-teal-900/80" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Transform Your Educational Journey with Smart Guidance
            </h2>
            
            {/* Testimonial */}
            <div className="mb-8">
              <div className="text-6xl font-serif text-white/60 mb-4">"</div>
              <blockquote className="text-lg leading-relaxed mb-4">
                EduPath has completely transformed how I navigate my academic choices. It's intuitive, comprehensive, and helps me make informed decisions about my future.
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold">MC</span>
            </div>
                <div>
                  <div className="font-semibold">Michael Carter</div>
                  <div className="text-white/80">Computer Science Student at UoN</div>
                    </div>
              </div>
            </div>

            {/* Join Section */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
                JOIN 10K+ STUDENTS
              </h3>
              <div className="grid grid-cols-2 gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold">UoN</div>
                  <span className="text-sm">University of Nairobi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold">KU</div>
                  <span className="text-sm">Kenyatta University</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold">MU</div>
                  <span className="text-sm">Moi University</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold">JKUAT</div>
                  <span className="text-sm">JKUAT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold">KU</div>
                  <span className="text-sm">KCA University</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold">USIU</div>
                  <span className="text-sm">USIU-Africa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold">TUK</div>
                  <span className="text-sm">Technical University of Kenya</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold">MKU</div>
                  <span className="text-sm">Mount Kenya University</span>
                      </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}