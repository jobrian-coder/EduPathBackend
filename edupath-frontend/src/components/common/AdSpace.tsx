import { Card, CardContent, CardHeader } from './Card'

export interface AdItem {
  id: string
  name: string
  tagline: string
  cta: string
  url: string
  badges?: string[]
}

const DEFAULT_ADS: AdItem[] = [
  {
    id: 'moringa',
    name: 'Moringa School',
    tagline: 'Become a Software Engineer in months, not years.',
    cta: 'Apply Today',
    url: 'https://moringaschool.com/',
    badges: ['Bootcamp', 'Scholarships', 'Job Support']
  },
  {
    id: 'alx',
    name: 'ALX Africa',
    tagline: 'Industry-level tech programs for ambitious talent.',
    cta: 'Join a Cohort',
    url: 'https://www.alxafrica.com/',
    badges: ['Remote', 'Africa-wide']
  },
  {
    id: 'andela',
    name: 'Andela Learning',
    tagline: 'Train with experts and build a global tech career.',
    cta: 'Explore Tracks',
    url: 'https://andela.com/',
    badges: ['Global', 'Mentorship']
  }
]

export function AdSpace({ title = 'Sponsored', ads = DEFAULT_ADS }: { title?: string; ads?: AdItem[] }) {
  return (
    <Card className="border-t-4 border-t-amber-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-600/30">Ad</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {ads.map(ad => (
          <a
            key={ad.id}
            href={ad.url}
            target="_blank"
            rel="noreferrer"
            className="block p-3 rounded-lg border border-slate-800 hover:border-amber-600/40 hover:bg-amber-500/5 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-100">{ad.name}</div>
                <div className="text-sm text-slate-400">{ad.tagline}</div>
              </div>
              <span className="shrink-0 text-xs px-2 py-1 rounded-md bg-amber-600 text-black font-semibold">
                {ad.cta}
              </span>
            </div>
            {ad.badges && ad.badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ad.badges.map((b, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </a>
        ))}
      </CardContent>
    </Card>
  )
}

export default AdSpace
