/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_USERNAME_DOMAIN?: string
  /** '1' only in the self-contained demo build (npm run build:demo) */
  readonly VITE_DEMO?: string
  /** single-person mode: no login screen (see src/lib/singleUser.ts) */
  readonly VITE_AUTO_LOGIN_PASSWORD?: string
  readonly VITE_AUTO_LOGIN_USER?: string
}
