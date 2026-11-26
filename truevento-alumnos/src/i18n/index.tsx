import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DB_MESSAGES, en, es, pt, SKILLS, type Key } from './messages'

export type Lang = 'es' | 'pt' | 'en'
export const LANGS: { value: Lang; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
]
const DICTS = { es, pt, en }
const LOCALES: Record<Lang, string> = { es: 'es-AR', pt: 'pt-BR', en: 'en-GB' }
const KEY = 'truevento-lang'

/** Saved choice, else the phone's language (Portuguese or English), else Spanish. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'es' || saved === 'pt' || saved === 'en') return saved
  } catch { /* no storage */ }
  const nav = (typeof navigator !== 'undefined' ? navigator.languages?.[0] ?? navigator.language : 'es').toLowerCase()
  if (nav.startsWith('pt')) return 'pt'
  if (nav.startsWith('es')) return 'es'
  return nav.startsWith('en') ? 'en' : 'es'
}

let current: Lang = initialLang()
if (typeof document !== 'undefined') document.documentElement.lang = current

export const getLang = () => current
/** Sets the language without React (tests); the app uses useLang().setLang. */
export function setLanguage(l: Lang) {
  current = l
  if (typeof document !== 'undefined') document.documentElement.lang = l
}
/** Locale for dates and numbers in the current language. */
export const locale = () => LOCALES[current]

/** Text in the current language; {name} placeholders are filled from vars. */
export function t(key: Key, vars?: Record<string, string | number>): string {
  let s = DICTS[current][key] ?? es[key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

/** A message from the database (written in Spanish), in the current language. */
export function dbMessage(msg: string): string {
  if (current === 'es') return msg
  const missing = /^Falta el precio por hora de (.+): lo pone/.exec(msg)
  if (missing) return t('err.missingPrice', { name: missing[1] })
  return DB_MESSAGES[msg]?.[current] ?? msg
}

/** A skill of the starting learning path, in the current language. */
export function skillText(name: string, description: string | null): [string, string | null] {
  if (current === 'es') return [name, description]
  const tr = SKILLS[name]?.[current]
  return tr ? [tr[0], tr[1] ?? description] : [name, description]
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: current, setLang: () => {} })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current)
  function setLang(l: Lang) {
    setLanguage(l)
    try { localStorage.setItem(KEY, l) } catch { /* the choice lasts until reload */ }
    setLangState(l)
  }
  // remount on change so every text (also outside React state) is drawn again
  return <Ctx.Provider value={{ lang, setLang }}><div key={lang} className="contents">{children}</div></Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

/** Language buttons, used on the welcome screen and in settings. */
export function LanguagePicker({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang()
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('settings.language')}>
      {LANGS.map((l) => (
        <button key={l.value} type="button" lang={l.value} aria-pressed={lang === l.value} onClick={() => setLang(l.value)}
          className={dark
            ? `min-h-10 rounded-full px-4 text-sm font-semibold transition ${lang === l.value ? 'bg-white text-night-900' : 'border border-white/25 text-brand-100'}`
            : lang === l.value ? 'chip-on' : 'chip'}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

/** Compact language switch for the top bar: shows the current code, opens the three options. */
/** `up`: opens above the button (at the bottom of the sidebar). */
export function LanguageMenu({ up = false }: { up?: boolean }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  // Escape closes the menu
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])
  return (
    <div className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={t('lang.menu')} onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-white transition hover:bg-white/10">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {lang.toUpperCase()}
      </button>
      {open && (
        <>
          <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div role="menu" className={`pop absolute z-50 ${up ? 'bottom-12 left-0' : 'right-0 top-12'} w-44 overflow-hidden rounded-2xl border border-line bg-surface py-1 text-ink shadow-xl`}>
            {LANGS.map((l) => (
              <button key={l.value} type="button" role="menuitemradio" aria-checked={lang === l.value} lang={l.value}
                onClick={() => { setOpen(false); setLang(l.value) }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left font-semibold transition hover:bg-surface-2 ${lang === l.value ? 'text-brand-deep' : 'text-ink'}`}>
                {l.label}
                {lang === l.value && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
