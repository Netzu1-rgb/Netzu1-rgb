/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** public key for notifications on the phone (Web Push) */
  readonly VITE_VAPID_PUBLIC_KEY?: string
  readonly VITE_USERNAME_DOMAIN?: string
  readonly VITE_SPOT_LAT?: string
  readonly VITE_SPOT_LON?: string
  /** '1' only in the self-contained demo build (npm run build:demo) */
  readonly VITE_DEMO?: string
}
