// Automatically detects if running on localhost to use local backend, or deployed backend
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : 'https://audit-mbfr.onrender.com');

export default API_BASE;

