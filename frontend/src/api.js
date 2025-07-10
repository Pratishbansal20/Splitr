import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Change if your backend uses a different URL or port
  withCredentials: false, // Set to true if using cookies/auth
});

export default api;
