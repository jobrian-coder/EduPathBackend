import React from 'react'
import { ExternalLink, Link2 } from 'lucide-react'

interface LinkPreviewCardProps {
  url: string
  title?: string
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, title }) => {
  const domain = getDomain(url)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-start gap-3 mt-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
        <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
            {title}
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-0.5">
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{domain}</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{url}</div>
      </div>
    </a>
  )
}
