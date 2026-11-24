import { useEffect, useState } from 'react'

// Light (the default) / dark / automatic (follows the phone). A per-device preference,
// so it lives in localStorage; index.html applies it before the first paint.

export type ThemeChoice = 'light' | 'dark' | 'system'
const KEY = 'truevento-alumnos-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'system' ? v : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(choice: ThemeChoice = getThemeChoice()) {
  const dark = choice === 'dark' || (choice === 'system' && media().matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#07060f' : '#110d24')
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(getThemeChoice)
  useEffect(() => {
    applyTheme(choice)
    if (choice !== 'system') return
    const m = media()
    const onChange = () => applyTheme('system')
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [choice])
  return {
    choice,
    setChoice(next: ThemeChoice) {
      try { localStorage.setItem(KEY, next) } catch { /* the choice lasts until reload */ }
      setChoice(next)
    },
  }
}
