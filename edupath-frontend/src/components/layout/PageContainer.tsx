import * as React from 'react'

export function PageContainer({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {title && <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>}
      {children}
    </div>
  )
}

export default PageContainer
