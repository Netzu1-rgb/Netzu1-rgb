import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'

// ------------------------------------------------------------------ icons (inline, no extra dependency)

const paths: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  plus: 'M12 5v14M5 12h14',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  kite: 'M12 2 4 9l8 13 8-13zM4 9h16M12 2v20',
  wallet: 'M20 7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h15V7M16 14h.01',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  cloudOff: 'M2 2l20 20M17.58 17.58A5 5 0 0 1 16 18H7a5 5 0 0 1-1.6-9.74M9.5 5.5A7 7 0 0 1 21 11a4.5 4.5 0 0 1-1.07 4.95',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
  install: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
}

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 2 }: { name: keyof typeof paths | string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[name] ?? ''} />
    </svg>
  )
}

// ------------------------------------------------------------------ layout pieces

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-night-900 sm:text-3xl">{title}</h1>
        {subtitle && <div className="mt-0.5 text-sm text-ink-mute">{subtitle}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-mute" role="status">
      <Spinner className="h-6 w-6 text-brand" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-coral/30 bg-coral-soft px-4 py-3 text-sm text-[#9d1c48]" role="alert">
      <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">{message}</div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">Reintentar</button>
      )}
    </div>
  )
}

export function OfflineNote({ savedAt }: { savedAt: string | null }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl bg-sand px-4 py-2.5 text-sm text-ink-soft">
      <Icon name="cloudOff" className="h-4 w-4 shrink-0" />
      <span>
        Sin conexión: mostrando lo último guardado en este dispositivo
        {savedAt ? ` (${new Date(savedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })})` : ''}.
      </span>
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand-deep">
        <Icon name="kite" className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-night-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-mute">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ------------------------------------------------------------------ form fields

interface FieldProps {
  label: string
  error?: string | null
  hint?: ReactNode
  children: (id: string) => ReactNode
  className?: string
}

export function Field({ label, error, hint, children, className }: FieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}</label>
      {children(id)}
      {error ? <p className="mt-1.5 text-sm font-medium text-coral">{error}</p>
        : hint ? <p className="mt-1.5 text-sm text-ink-mute">{hint}</p> : null}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex min-h-12 items-center gap-3 text-left">
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-violet' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

// ------------------------------------------------------------------ dialogs

export function Modal({ open, title, onClose, children, footer }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose() }}
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-night-950/50 backdrop:backdrop-blur-[2px] sm:m-auto sm:max-w-lg sm:rounded-3xl">
      {open && (
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-lg font-semibold text-night-900">{title}</h2>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" aria-label="Cerrar">
              <Icon name="x" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="safe-bottom flex gap-3 border-t border-line px-5 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
}

const ConfirmCtx = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(v: boolean) => void>(() => {})
  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolver.current = resolve
    setOpts(o)
  }), [])
  const close = (v: boolean) => {
    resolver.current(v)
    setOpts(null)
  }
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal open={opts !== null} title={opts?.title ?? ''} onClose={() => close(false)}
        footer={<>
          <button type="button" className="btn-ghost flex-1" onClick={() => close(false)}>Cancelar</button>
          <button type="button" className={`${opts?.danger ? 'btn-danger' : 'btn-primary'} flex-1`} onClick={() => close(true)}>
            {opts?.confirmLabel ?? 'Confirmar'}
          </button>
        </>}>
        <div className="text-ink-soft">{opts?.message}</div>
      </Modal>
    </ConfirmCtx.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmCtx)

// ------------------------------------------------------------------ toasts

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem { id: number; kind: ToastKind; text: string }
const ToastCtx = createContext<(text: string, kind?: ToastKind) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs, { id, kind, text }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3500)
  }, [])
  const colors: Record<ToastKind, string> = {
    success: 'bg-night-900 text-white',
    error: 'bg-coral text-white',
    info: 'bg-white text-ink border border-line',
  }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),12px)]" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${colors[t.kind]}`}>
            <Icon name={t.kind === 'error' ? 'alert' : 'check'} className="h-5 w-5 shrink-0" />
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

// ------------------------------------------------------------------ stat card

export function Stat({ label, value, hint, tone = 'default' }: {
  label: string; value: ReactNode; hint?: ReactNode; tone?: 'default' | 'sky' | 'violet' | 'coral' | 'dark'
}) {
  const tones = {
    default: 'bg-white border-line',
    sky: 'bg-brand-soft border-brand/20',
    violet: 'bg-violet-soft border-violet/25',
    coral: 'bg-coral-soft border-coral/25',
    dark: 'bg-night-900 border-night-900 text-white',
  }
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide ${tone === 'dark' ? 'text-brand-200' : 'text-ink-mute'}`}>{label}</div>
      <div className={`tabular mt-1.5 font-display text-2xl font-bold ${tone === 'dark' ? 'text-white' : 'text-night-900'}`}>{value}</div>
      {hint && <div className={`mt-1 text-xs ${tone === 'dark' ? 'text-brand-100/80' : 'text-ink-mute'}`}>{hint}</div>}
    </div>
  )
}
