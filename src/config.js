// Centralized configuration for the application
// Priority: Environment Variable > Production URL > Localhost (Fallback)

// FORCED PRODUCTION override if you want to be 100% sure:
// const FORCE_PRODUCTION = true;

const PRODUCTION_API_URL = 'https://backend-g6uy.onrender.com';
const LOCAL_API_URL = 'http://localhost:8001';

// Dynamic detection: if hostname is localhost or 127.0.0.1, use local API
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isLocal ? LOCAL_API_URL : PRODUCTION_API_URL;

console.log('App Config Loaded. API_URL:', API_URL, 'Mode:', isLocal ? 'LOCAL' : 'PRODUCTION');
