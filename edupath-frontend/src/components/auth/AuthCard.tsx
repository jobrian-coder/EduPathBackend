import { Card, CardContent, CardHeader } from '../common/Card'

export default function AuthCard({ title, children, subtitle }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader>
        <div>
          <div className="text-xl font-semibold text-slate-100">{title}</div>
          {subtitle && <div className="text-sm text-slate-400">{subtitle}</div>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}
