import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const el = document.getElementById('loadcheck');
try {
  if (el) el.textContent = 'React mounting...';
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  if (el) el.textContent = 'React mounted OK';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
} catch (e: any) {
  if (el) { el.textContent = 'MOUNT ERROR: ' + e.message; el.style.color = 'red'; }
}
