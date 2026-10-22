import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';


// Attach the signed-in staff token to every same-origin /api request,
// so protected Admin/Staff routes on the server know who is calling.
const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const isApiCall = url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`);
  const staffToken = localStorage.getItem('commonbrew_staff_token');
  if (isApiCall && staffToken) {
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${staffToken}`);
    }
    return originalFetch(input, { ...init, headers });
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
