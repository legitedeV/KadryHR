import axios from 'axios';

// Jeden wspólny klient API dla całego frontu.
// Nginx robi proxy_pass /api -> backend (127.0.0.1:5000)
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.warn(
        `API error ${error.response.status} ${error.response.config?.method?.toUpperCase()} ${error.response.config?.url}`
      );
    }
    return Promise.reject(error);
  }
);

export default api;
