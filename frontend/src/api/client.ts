import axios from 'axios';

// Instancia global de Axios para conectar con el backend de Yordy (Spring Boot).
// Se configura con la URL base, pero se puede sobreescribir mediante variables de entorno en producción.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para agregar token si en el futuro tenemos JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_veedor');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor genérico de errores (muy útil para debuggear el backend de Yordy)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
