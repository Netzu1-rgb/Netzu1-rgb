import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router'
import './index.css'
import App from './App'
import { applyTheme } from './lib/theme'
import { SessionProvider } from './context/Session'
import { ConfirmProvider, ToastProvider } from './components/ui'
import { I18nProvider } from './i18n'
import { WhatsAppPreview } from './components/WhatsAppPreview'

// the demo runs inside a sandboxed page without its own URL, so it keeps routes in memory
const Router = import.meta.env.VITE_DEMO === '1' ? MemoryRouter : BrowserRouter
if (import.meta.env.VITE_DEMO === '1') document.documentElement.classList.add('in-viewer')

applyTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <I18nProvider>
      <ToastProvider>
        <WhatsAppPreview />
        <ConfirmProvider>
          <SessionProvider>
            <App />
          </SessionProvider>
        </ConfirmProvider>
      </ToastProvider>
      </I18nProvider>
    </Router>
  </StrictMode>,
)
