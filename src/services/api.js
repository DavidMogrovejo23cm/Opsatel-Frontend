import axios from 'axios';

// ========================================================================
// CONEXIÓN FRONTEND -> BACKEND (API)
// ========================================================================
// Aquí es donde React se comunica con FastAPI. 
// Axios actúa como el puente que envía y trae datos hacia la Base de Datos.
// Si el backend se mueve a un servidor real, debes cambiar esto por la IP pública o dominio.
const API_BASE_URL = 'http://127.0.0.1:8000';

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

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        username: response.data.username,
        rol: response.data.rol
      }));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const clienteService = {
  listar: () => api.get('/clientes/'), 
  crear: (data) => api.post('/clientes/', data),
  actualizar: (id, data) => api.patch(`/clientes/${id}`, data),
  getById: (id) => api.get(`/clientes/${id}`),
  eliminar: (id) => api.delete(`/clientes/${id}`),
  uploadCedula: (id, formData) => api.post(`/clientes/${id}/upload-cedula`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  pasarActivacion: (id) => api.patch(`/clientes/${id}/pasar-a-activacion`),
  activar: (id, data) => api.patch(`/clientes/${id}/configuracion-tecnica`, data),
  updateAdmin: (id, data) => api.patch(`/clientes/${id}/administracion`, data),
  pagar: (id, data) => api.post(`/clientes/${id}/pagar`, data),
  getNextTecnicoValues: (parroquia, puerto, mac = '', nombre = '', hasBreach = false) => api.get(`/clientes/siguiente-valor-tecnico?parroquia=${encodeURIComponent(parroquia)}&puerto=${puerto}&mac=${encodeURIComponent(mac)}&nombre=${encodeURIComponent(nombre)}&has_breach=${hasBreach}`),
  facturacionGlobal: () => api.post('/clientes/facturacion-mensual-global'),
  cierreMensualGlobal: () => api.post('/clientes/cierre-mensual-global'),
  pagoGlobalTest: () => api.post('/clientes/pago-global-test'),
  listarPagos: () => api.get('/clientes/pagos/historial'),
  getHistorialReportes: () => api.get('/clientes/reportes/historial'),
  generarReporte: () => api.post('/clientes/reportes/generar'),
  getDashboardStats: () => api.get('/clientes/dashboard-stats'),
};


export const configuracionService = {
  // Parroquias
  getParroquias: () => api.get('/configuraciones/parroquias'),
  crearParroquia: (data) => api.post('/configuraciones/parroquias', data),
  actualizarParroquia: (id, data) => api.patch(`/configuraciones/parroquias/${id}`, data),
  eliminarParroquia: (id) => api.delete(`/configuraciones/parroquias/${id}`),
  // Planes
  getPlanes: () => api.get('/configuraciones/planes'),
  crearPlan: (data) => api.post('/configuraciones/planes', data),
  actualizarPlan: (id, data) => api.patch(`/configuraciones/planes/${id}`, data),
  eliminarPlan: (id) => api.delete(`/configuraciones/planes/${id}`),
  // Bancos
  getBancos: () => api.get('/configuraciones/bancos'),
  crearBanco: (data) => api.post('/configuraciones/bancos', data),
  actualizarBanco: (id, data) => api.patch(`/configuraciones/bancos/${id}`, data),
  eliminarBanco: (id) => api.delete(`/configuraciones/bancos/${id}`),
  // Puertos
  getPuertos: (parroquia_id) => api.get('/configuraciones/puertos' + (parroquia_id ? `?parroquia_id=${parroquia_id}` : '')),
  crearPuerto: (data) => api.post('/configuraciones/puertos', data),
  actualizarPuerto: (id, data) => api.patch(`/configuraciones/puertos/${id}`, data),
  eliminarPuerto: (id) => api.delete(`/configuraciones/puertos/${id}`),
  // Usuarios
  getUsuarios: () => api.get('/auth/usuarios'),
  crearUsuario: (data) => api.post('/auth/register', data),
  actualizarUsuario: (id, data) => api.patch(`/auth/usuarios/${id}`, data),
  eliminarUsuario: (id) => api.delete(`/auth/usuarios/${id}`),
  // Finanzas Base
  getFinanzasBase: () => api.get('/configuraciones/finanzas-base'),
  actualizarFinanzasBase: (data) => api.put('/configuraciones/finanzas-base', data),
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default api;
