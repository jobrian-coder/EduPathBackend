export type BookmarkType = 'post' | 'course' | 'university'

export interface BookmarkItem {
  id: string
  type: BookmarkType
  title: string
  meta?: string
  payload?: any
}

const KEY = 'edupath.bookmarks.v1'

function read(): BookmarkItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as BookmarkItem[] : []
  } catch {
    return []
  }
}

function write(items: BookmarkItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('bookmarks:changed'))
}

export function listBookmarks(): BookmarkItem[] {
  return read()
}

export function isBookmarked(id: string, type: BookmarkType): boolean {
  return read().some(b => b.id === id && b.type === type)
}

export function toggleBookmark(item: BookmarkItem): boolean {
  const items = read()
  const idx = items.findIndex(b => b.id === item.id && b.type === item.type)
  if (idx >= 0) {
    items.splice(idx, 1)
    write(items)
    return false
  }
  items.unshift(item)
  write(items)
  return true
}
