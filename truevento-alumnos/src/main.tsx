import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'
import { applyTheme } from './lib/theme'
import { SessionProvider } from './context/Session'
import { ConfirmProvider, ToastProvider } from './components/ui'
import { I18nProvider } from './i18n'

applyTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
      <ToastProvider>
        <ConfirmProvider>
          <SessionProvider>
            <App />
          </SessionProvider>
        </ConfirmProvider>
      </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)
