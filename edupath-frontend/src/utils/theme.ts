const STORAGE_KEY = 'edupath-theme'

export type ThemeMode = 'light' | 'dark' | 'system'

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && systemDark)

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function setTheme(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode)
  applyTheme(mode)
}

export function getTheme(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system'
}

export function initTheme() {
  const saved = getTheme()
  applyTheme(saved)
  
  // Listen for system theme changes when in system mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = getTheme()
    if (current === 'system') {
      applyTheme('system')
    }
  })
}
