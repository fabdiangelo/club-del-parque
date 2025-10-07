import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AuthProvider from "./contexts/AuthProvider"; 
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'
import { NotificationProvider } from './contexts/NotificacionContext.jsx';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
      <NotificationProvider>

        <App />
      </NotificationProvider>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
