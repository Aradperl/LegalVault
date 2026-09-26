import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { FluentProvider } from '@fluentui/react-components'
import { legalVaultDarkTheme, legalVaultLightTheme } from './theme'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'

function ThemedApp() {
  const { theme } = useTheme()
  return (
    <FluentProvider theme={theme === 'light' ? legalVaultLightTheme : legalVaultDarkTheme}>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </FluentProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </StrictMode>,
  )
} catch (error) {
  console.error('Failed to render app:', error)
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Error Loading Application</h1>
      <p>Please check the console for details.</p>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `
}
