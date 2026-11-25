import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router'
import './index.css'
import App from './App'
import { applyTheme } from './lib/theme'
import { AuthProvider } from './context/AuthContext'
import { ConfirmProvider, ToastProvider } from './components/ui'

// the demo runs inside a sandboxed page without its own URL, so it keeps routes in memory
const Router = import.meta.env.VITE_DEMO === '1' ? MemoryRouter : BrowserRouter
// the demo viewer already pads the page for the phone's status bar
if (import.meta.env.VITE_DEMO === '1') document.documentElement.classList.add('in-viewer')

applyTheme()
// the page is in Spanish (also when a host page wraps it without a lang)
document.documentElement.lang = 'es'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </Router>
  </StrictMode>,
)
