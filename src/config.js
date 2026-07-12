// Centralized configuration for the application
// Priority: Environment Variable > Production URL > Localhost (Fallback)

const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'https://backend-g6uy.onrender.com';
const LOCAL_API_URL = 'http://localhost:8001';

// Dynamic detection: if hostname is localhost or 127.0.0.1, use local API
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use production URL if defined in env, otherwise decide based on hostname
export const API_URL = isLocal ? LOCAL_API_URL : PRODUCTION_API_URL;

if (import.meta.env.DEV) {
  console.log('App Config Loaded. API_URL:', API_URL, 'Mode:', isLocal ? 'LOCAL' : 'PRODUCTION');
}

