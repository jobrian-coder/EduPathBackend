import * as React from 'react'
import { twMerge } from 'tailwind-merge'

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}
const TabsCtx = React.createContext<TabsContextValue | null>(null)

export const Tabs: React.FC<{ value: string; onValueChange: (v: string) => void; className?: string; children: React.ReactNode }>
  = ({ value, onValueChange, className, children }) => {
  return (
    <TabsCtx.Provider value={{ value, setValue: onValueChange }}>
      <div className={twMerge('border theme-border rounded-lg theme-surface', className)}>{children}</div>
    </TabsCtx.Provider>
  )
}

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={twMerge('flex border-b theme-border rounded-t-lg theme-surface', className)} {...props} />
)

export const TabsTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>
  = ({ className, value, children, ...props }) => {
  const ctx = React.useContext(TabsCtx)!
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={twMerge(
        'px-4 py-3 text-sm font-medium flex items-center justify-center',
        active
          ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary-hover)] theme-surface'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export const TabsContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { value: string }>
  = ({ className, value, children, ...props }) => {
  const ctx = React.useContext(TabsCtx)!
  if (ctx.value !== value) return null
  return (
    <div className={twMerge('p-0', className)} {...props}>
      {children}
    </div>
  )
}

