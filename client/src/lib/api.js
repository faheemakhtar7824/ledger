import axios from 'axios';

// Backend base URL — set VITE_API_URL in client/.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send/receive HTTP-only cookies (per security requirements)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Central response error handling — normalize errors, handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired/invalid — let calling code redirect to login
      // (kept minimal here; auth context will react to this)
    }
    return Promise.reject(error);
  }
);

export default api;