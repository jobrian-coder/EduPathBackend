import * as React from 'react'
import { Card, CardContent, CardHeader } from '../common/Card'

export function AuthWrapper({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-xl font-semibold">{title}</h2>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}

export default AuthWrapper
