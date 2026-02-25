import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Change if your backend uses a different URL or port
  withCredentials: false,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
