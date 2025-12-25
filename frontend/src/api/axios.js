import axios from 'axios';

// Jeden wspólny klient API dla całego frontu.
// Nginx robi proxy_pass /api -> backend (127.0.0.1:5000)
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kadryhr_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
      if (import.meta.env.MODE !== 'production') {
        console.log('[API] Dodano token do żądania:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          tokenPreview: token.substring(0, 20) + '...',
        });
      }
    } else if (!token) {
      console.warn('[API] Brak tokenu w localStorage dla żądania:', {
        method: config.method?.toUpperCase(),
        url: config.url,
      });
    }
    return config;
  },
  (error) => {
    console.error('[API] Błąd w request interceptor:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('[API] Sukces:', {
      status: response.status,
      method: response.config?.method?.toUpperCase(),
      url: response.config?.url,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.warn('[API] Błąd odpowiedzi:', {
        status: error.response.status,
        method: error.response.config?.method?.toUpperCase(),
        url: error.response.config?.url,
        message: error.response.data?.message,
      });

      // Jeśli 401 (Unauthorized), wyczyść localStorage i przekieruj do logowania
      if (error.response.status === 401) {
        console.error('[API] Token nieważny lub wygasł - czyszczenie sesji');
        localStorage.removeItem('kadryhr_token');
        localStorage.removeItem('kadryhr_user');
        
        // Przekieruj do logowania tylko jeśli nie jesteśmy już na stronie logowania
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else {
      console.error('[API] Błąd sieci lub brak odpowiedzi:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
