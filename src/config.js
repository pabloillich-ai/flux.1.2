// Centralized configuration for the application
// Priority: Environment Variable > Production URL > Localhost (Fallback)

const LOCAL_API_URL = 'http://localhost:8001';

// Dynamic detection: if hostname is localhost or 127.0.0.1, use local API
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// In production, use relative URL (same origin, proxied via Vercel rewrites)
// In development, use local backend
export const API_URL = isLocal ? LOCAL_API_URL : '';

if (import.meta.env.DEV) {
  console.log('App Config Loaded. API_URL:', API_URL || '(same origin)', 'Mode:', isLocal ? 'LOCAL' : 'PRODUCTION');
}

