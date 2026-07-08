import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NodeProvider } from './context/NodeContext'
import { AlertsProvider } from './context/AlertsContext'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NodeProvider>
      <AlertsProvider>
        <App />
      </AlertsProvider>
    </NodeProvider>
  </StrictMode>,
)
