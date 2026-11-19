import type { ReactNode } from 'react'

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(120%_70%_at_50%_0%,#14406e,#061a2e_70%)] px-4 py-10 safe-top">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <img src="/icons/icon-192.png" alt="" className="h-20 w-20 rounded-3xl shadow-[0_0_50px_rgba(14,165,233,0.45)]" />
          <div className="mt-4 font-display text-3xl font-extrabold tracking-[0.14em]">TRUEVENTO</div>
          <div className="mt-1 text-xs font-semibold tracking-[0.5em] text-sky-300">KITESCHOOL</div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-bold text-ocean-900">{title}</h1>
          {subtitle && <div className="mt-1.5 text-sm text-ink-mute">{subtitle}</div>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
