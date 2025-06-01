// frontend-admin/src/services/api.ts
import axios from 'axios';
import { getToken, removeToken } from './auth';

// Crear instancia de axios
const api = axios.create({
  // CAMBIO: usar puerto 5001 para el backend admin
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api', // ← CAMBIO de 5000 a 5001
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token expiró o es inválido, cerrar sesión
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;