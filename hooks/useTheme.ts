'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export function useTheme(): { theme: Theme; toggle: () => void; isDark: boolean } {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('dineflow-theme') as Theme | null
    const initial = saved ?? 'dark'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  function toggle(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('dineflow-theme', next)
    applyTheme(next)
  }

  return { theme, toggle, isDark: theme === 'dark' }
}

function applyTheme(theme: Theme): void {
  const html = document.documentElement
  if (theme === 'light') {
    html.classList.add('light')
  } else {
    html.classList.remove('light')
  }
}
