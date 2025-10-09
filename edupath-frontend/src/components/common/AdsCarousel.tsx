import { useRef } from 'react'

interface AdItem {
  id: string
  title: string
  subtitle?: string
  image?: string
  cta?: string
  href?: string
  brand?: string
}

export default function AdsCarousel({
  items = [
    { id: 'moringa', title: 'Moringa School', subtitle: 'Full-time & Part-time Tech Programs', cta: 'Apply Now', href: '#', brand: 'Moringa' },
    { id: 'alx', title: 'ALX Africa', subtitle: 'Software Engineering & Data', cta: 'Explore', href: '#' },
    { id: 'modcom', title: 'Modcom Institute', subtitle: 'Cybersecurity & IoT', cta: 'Learn More', href: '#' },
  ],
  title = 'Sponsored',
}: { items?: AdItem[]; title?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  const scrollBy = (dir: 'left' | 'right') => {
    const el = ref.current
    if (!el) return
    const w = el.clientWidth
    el.scrollBy({ left: dir === 'left' ? -w : w, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{title}</div>
        <div className="hidden sm:flex gap-2">
          <button aria-label="Prev" onClick={() => scrollBy('left')} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">◀</button>
          <button aria-label="Next" onClick={() => scrollBy('right')} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">▶</button>
        </div>
      </div>
      <div ref={ref} className="flex overflow-x-auto snap-x snap-mandatory gap-3 scrollbar-hide">
        {items.map((ad) => (
          <a key={ad.id} href={ad.href || '#'} className="min-w-full snap-center">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/40 hover:shadow-md transition">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Sponsored</div>
              <div className="text-xl font-semibold">{ad.title}</div>
              {ad.subtitle && <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{ad.subtitle}</div>}
              <div className="mt-3">
                <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow-md transition-all">
                  {ad.cta || 'Learn More'}
                </button>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
