import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('rentease_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('rentease_token');
      sessionStorage.removeItem('rentease_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;