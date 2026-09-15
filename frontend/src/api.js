import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && !err.config.url.includes('/api/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Notify the AuthContext so the in-memory user is cleared and protected
      // routes redirect to /login instead of showing stale "logged in" UI.
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export default api;
