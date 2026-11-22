import type { ReactNode } from 'react'

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(120%_70%_at_50%_0%,#2b1d62,#07060f_72%)] px-4 py-6 safe-top sm:py-10">
      {/* my-auto centers when there is room and starts at the top when there is not */}
      <div className="mx-auto my-auto w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center text-white">
          <img src="/logo-truevento.png" alt="TRUEVENTO kiteschool" className="h-20 w-20 rounded-full shadow-[0_0_40px_rgba(124,58,237,0.45)] sm:h-24 sm:w-24" />
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-bold text-night-900">{title}</h1>
          {subtitle && <div className="mt-1.5 text-sm text-ink-mute">{subtitle}</div>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
