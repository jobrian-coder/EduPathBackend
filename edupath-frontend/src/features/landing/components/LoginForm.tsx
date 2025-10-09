import { useState } from 'react'
import { Button } from '../../../components/common/Button'

export default function LoginForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="bg-white rounded-2xl shadow-card border p-6">
      <div className="flex gap-2 mb-4">
        <Button variant={mode==='login'? 'default':'outline'} onClick={() => setMode('login')}>Log In</Button>
        <Button variant={mode==='signup'? 'default':'outline'} onClick={() => setMode('signup')}>Sign Up</Button>
      </div>
      <form className="space-y-3">
        {mode==='signup' && (
          <input required placeholder="Username" className="w-full rounded-lg border p-3" />
        )}
        <input required type="email" placeholder="Email" className="w-full rounded-lg border p-3" />
        <input required type="password" placeholder="Password" className="w-full rounded-lg border p-3" />
        {mode==='signup' && (
          <input required type="password" placeholder="Confirm Password" className="w-full rounded-lg border p-3" />
        )}
        <Button className="w-full" type="submit">{mode==='login' ? 'Log In' : 'Create Account'}</Button>
      </form>
    </div>
  )
}
