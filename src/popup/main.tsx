import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './App.css';
import { installGlobalErrorHandlers } from '@/utils/analytics';

// Bắt lỗi runtime chưa xử lý trong popup (window error / promise rejection)
installGlobalErrorHandlers('popup');

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
