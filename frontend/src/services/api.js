import axios from 'axios';

// Get API base URL from Vite environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server returns 401 Unauthorized (e.g. token expired, invalid)
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized. Logging out.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Optionally redirect to login, but we will let AuthContext handle state updates
    }
    return Promise.reject(error);
  }
);

export default api;
