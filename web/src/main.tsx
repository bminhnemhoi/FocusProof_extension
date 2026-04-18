import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AnalyticsProvider>
          <ToastProvider>
            <UserProvider>
              <App />
            </UserProvider>
          </ToastProvider>
        </AnalyticsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
