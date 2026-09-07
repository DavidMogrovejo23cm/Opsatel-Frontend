import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos de inactividad

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificación de expiración al cargar / montar el componente
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    const storedToken = localStorage.getItem('token');
    const lastActivity = localStorage.getItem('last_activity');

    if (storedUser && storedToken) {
      const now = Date.now();
      if (lastActivity) {
        const elapsed = now - parseInt(lastActivity, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          // Expiró por más de 30 minutos de inactividad o ausencia
          authService.logout();
          setUser(null);
        } else {
          setUser(storedUser);
          localStorage.setItem('last_activity', now.toString());
        }
      } else {
        // Primera vez o sin registro previo -> inicializar marca de tiempo
        setUser(storedUser);
        localStorage.setItem('last_activity', now.toString());
      }
    } else {
      authService.logout();
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Escuchador de actividad del usuario (mientras está usando la app)
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      const lastActivity = localStorage.getItem('last_activity');
      const now = Date.now();
      // Actualizar marca de tiempo con throttling de 1 minuto
      if (!lastActivity || now - parseInt(lastActivity, 10) > 60000) {
        localStorage.setItem('last_activity', now.toString());
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Revisar periódidamente cada minuto si han transcurrido más de 30 minutos de inactividad
    const interval = setInterval(() => {
      const lastActivity = localStorage.getItem('last_activity');
      if (lastActivity && Date.now() - parseInt(lastActivity, 10) > SESSION_TIMEOUT_MS) {
        authService.logout();
        setUser(null);
      }
    }, 60000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(interval);
    };
  }, [user]);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser({ username: data.username, rol: data.rol });
    localStorage.setItem('last_activity', Date.now().toString());
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
