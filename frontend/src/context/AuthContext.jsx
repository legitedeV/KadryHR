import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('kadryhr_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  
  // Get token for realtime events
  const token = localStorage.getItem('kadryhr_token');
  
  // Connect to realtime events when user is logged in
  const { isConnected: realtimeConnected } = useRealtimeEvents(user ? token : null);

  const login = (data) => {
    console.log('[AuthContext] Logowanie użytkownika:', data.user);
    localStorage.setItem('kadryhr_token', data.token);
    localStorage.setItem('kadryhr_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    console.log('[AuthContext] Wylogowywanie użytkownika');
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('[AuthContext] Błąd podczas wylogowania:', err);
    }
    localStorage.removeItem('kadryhr_token');
    localStorage.removeItem('kadryhr_user');
    setUser(null);
  };

  // Weryfikuj token przy starcie aplikacji
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('kadryhr_token');
      const storedUser = localStorage.getItem('kadryhr_user');

      if (!token || !storedUser) {
        console.log('[AuthContext] Brak tokenu lub użytkownika w localStorage');
        setLoading(false);
        return;
      }

      try {
        console.log('[AuthContext] Weryfikacja tokenu...');
        const { data } = await api.get('/auth/me');
        console.log('[AuthContext] Token ważny, użytkownik:', data);
        setUser(data);
        localStorage.setItem('kadryhr_user', JSON.stringify(data));
      } catch (err) {
        console.error('[AuthContext] Token nieważny, czyszczenie sesji:', err.response?.data?.message);
        localStorage.removeItem('kadryhr_token');
        localStorage.removeItem('kadryhr_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, realtimeConnected }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
