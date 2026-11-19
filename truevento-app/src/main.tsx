import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ConfirmProvider, ToastProvider } from './components/ui'

// the demo runs inside a sandboxed page without its own URL, so it keeps routes in memory
const Router = import.meta.env.VITE_DEMO === '1' ? MemoryRouter : BrowserRouter

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
