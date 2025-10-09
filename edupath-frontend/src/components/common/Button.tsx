import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] disabled:opacity-50 disabled:pointer-events-none active:translate-y-px',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] dark:bg-[var(--color-primary)] dark:hover:bg-[var(--color-primary-hover)]',
        outline: 'border border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-[var(--color-primary)] dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800',
        accent: 'bg-[var(--color-secondary)] text-teal-900 hover:brightness-95 dark:bg-[var(--color-secondary)]',
        ghost: 'text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={twMerge(buttonVariants({ variant, size }), className)} {...props} />
    )
  }
)
Button.displayName = 'Button'

