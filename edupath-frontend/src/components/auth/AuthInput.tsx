import { twMerge } from 'tailwind-merge'
import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  rightSlot?: ReactNode
}

export default function AuthInput({ label, className, error, hint, type, rightSlot, ...props }: AuthInputProps) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <div className={twMerge('relative flex items-stretch rounded-lg border border-slate-800 bg-slate-900 focus-within:ring-2 focus-within:ring-blue-600', error && 'border-red-600')}>
        <input
          id={id}
          type={inputType}
          className={twMerge('w-full bg-transparent px-3 py-2 text-slate-100 placeholder-slate-500 outline-none', className)}
          aria-invalid={!!error}
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="px-3 text-sm text-slate-400 hover:text-slate-200"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
        {rightSlot}
      </div>
      {hint && <div id={`${id}-hint`} className="mt-1 text-xs text-slate-400">{hint}</div>}
      {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
    </div>
  )
}
