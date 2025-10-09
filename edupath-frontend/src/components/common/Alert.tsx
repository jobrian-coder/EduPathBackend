import * as React from 'react'
import { twMerge } from 'tailwind-merge'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const base = 'w-full rounded-lg border p-4 text-sm'
    const styles = variant === 'destructive'
      ? 'border-red-300 bg-red-50 text-red-800'
      : 'border-slate-200 bg-white text-slate-800'
    return <div ref={ref} className={twMerge(base, styles, className)} {...props} />
  }
)
Alert.displayName = 'Alert'

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={twMerge('mb-1 font-semibold', className)} {...props} />
)

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={twMerge('text-sm opacity-90', className)} {...props} />
)
