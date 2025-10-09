import { twMerge } from 'tailwind-merge'

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary'
}

export default function AuthButton({ loading, variant = 'primary', className, children, ...props }: AuthButtonProps) {
  const base = 'w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:cursor-not-allowed'
  const styles = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
    : 'bg-slate-800 hover:bg-slate-700 text-slate-100 focus:ring-slate-600 border border-slate-700'
  return (
    <button {...props} className={twMerge(base, styles, className)} disabled={props.disabled || loading}>
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}
      <span>{children}</span>
    </button>
  )
}
