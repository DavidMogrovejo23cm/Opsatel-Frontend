import axios from 'axios';

const API_BASE_URL = 'https://web-production-d6621.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar Token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const whatsappService = {
  // Envío manual
  enviarManual: (numero, mensaje) => 
    api.post('/whatsapp/enviar-manual', {
      numero: numero,
      mensaje: mensaje
    }),

  // Programar envío automático
  programar: (hora, mensaje, enviar_a_todos = true, fecha = null) =>
    api.post('/whatsapp/programar', {
      hora: hora,
      mensaje: mensaje,
      enviar_a_todos: enviar_a_todos,
      fecha: fecha
    }),

  // Obtener configuración actual
  obtenerConfiguracion: () =>
    api.get('/whatsapp/configuracion'),

  // Actualizar configuración
  actualizarConfiguracion: (config_id, hora, mensaje, fecha = null) =>
    api.patch(`/whatsapp/configuracion/${config_id}`, {
      hora: hora,
      mensaje: mensaje,
      fecha: fecha
    }),

  // Eliminar configuración
  eliminarConfiguracion: (config_id) =>
    api.delete(`/whatsapp/configuracion/${config_id}`),

  // Obtener historial
  obtenerHistorial: (limite = 50) =>
    api.get('/whatsapp/historial', {
      params: { limite: limite }
    }),

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};
