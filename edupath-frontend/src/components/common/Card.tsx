import * as React from 'react'
import { twMerge } from 'tailwind-merge'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge('bg-white dark:bg-slate-900/40 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge('p-4 border-b border-gray-200 bg-teal-50 dark:border-slate-700 dark:bg-slate-800/50', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge('p-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge('p-4 border-t border-gray-200 bg-teal-50 dark:border-slate-700 dark:bg-slate-800/50', className)} {...props} />
}
