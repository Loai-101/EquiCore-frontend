import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * Axios instance for future EquiCore backend integration.
 * Attach auth token from storage when backend is ready.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('equicore_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
