/**
 * @file api.js
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import axios from 'axios';
import { normalizePayloadFields } from '../utils/textUtils';

const CLIENTE_TEXT_FIELDS = [
  'nombre', 'direccion', 'parroquia', 'nodo', 'comentarios',
  'observaciones', 'notas_pago', 'tecnico', 'activador', 'nap',
  'referencia', 'bank', 'bank_plus', 'app', 'cuenta', 'arrienda'
];
const EXTRAS_TEXT_FIELDS = ['nombre_cliente', 'observaciones', 'proveedor', 'contacto', 'estado'];
const HOJARUTA_TEXT_FIELDS = ['nombre_cliente', 'ubicacion_cliente', 'ubicacion_caja', 'actividad', 'observacion', 'observacion_tecnico', 'tecnico', 'parroquia'];
const CALLCENTER_TEXT_FIELDS = ['cliente_nombre', 'direccion', 'a_cargo', 'problema', 'observacion_revision'];

// Firma de Integridad de Runtime y Autoría (David Mogrovejo - 2026)
export const INTERNAL_SYS_CHECKSUM = 'bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762';
export const SYS_BUILD_SIG = 'DM-2026-v1.0-4a8b9f10';

const API_BASE_URL = '/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyecgitar Token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Client-Build'] = SYS_BUILD_SIG;
  return config;
});

// Interceptor para capturar expiración de sesión (401) y redirigir limpiamente a login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('last_activity');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── CACHE GLOBAL DE CLIENTES (LOCALSTORAGE + MEMORIA) ───
const CLIENTES_CACHE_KEY = 'opsatel_cached_clientes';
const CLIENTES_CACHE_TIME_KEY = 'opsatel_cached_clientes_time';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos de validez en caché

let memoryClientesCache = null;
let memoryClientesCacheTime = 0;
let inFlightListarPromise = null;

export const clearStoredClientesCache = () => {
  memoryClientesCache = null;
  memoryClientesCacheTime = 0;
  inFlightListarPromise = null;
  try {
    localStorage.removeItem(CLIENTES_CACHE_KEY);
    localStorage.removeItem(CLIENTES_CACHE_TIME_KEY);
  } catch (e) {
    // ignorar error de acceso a storage
  }
};

export const getStoredClientesCache = () => {
  const now = Date.now();
  if (memoryClientesCache && (now - memoryClientesCacheTime) < CACHE_TTL_MS) {
    return memoryClientesCache;
  }
  try {
    const rawTime = localStorage.getItem(CLIENTES_CACHE_TIME_KEY);
    const rawData = localStorage.getItem(CLIENTES_CACHE_KEY);
    if (rawData && rawTime) {
      const savedTime = parseInt(rawTime, 10);
      if (!isNaN(savedTime) && (now - savedTime) < CACHE_TTL_MS) {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryClientesCache = parsed;
          memoryClientesCacheTime = savedTime;
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error al leer caché de clientes en localStorage:', e);
  }
  return null;
};

export const setStoredClientesCache = (data) => {
  if (!Array.isArray(data)) return;
  const now = Date.now();
  memoryClientesCache = data;
  memoryClientesCacheTime = now;
  try {
    localStorage.setItem(CLIENTES_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CLIENTES_CACHE_TIME_KEY, now.toString());
  } catch (e) {
    console.warn('No se pudo persistir clientes en localStorage (posible límite de cuota):', e);
  }
};

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        username: response.data.username,
        rol: response.data.rol
      }));
      localStorage.setItem('last_activity', Date.now().toString());
      clearStoredClientesCache();
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity');
    clearStoredClientesCache();
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const clienteService = {
  listar: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getStoredClientesCache();
      if (cached) {
        return { data: cached, status: 200, fromCache: true };
      }
    }

    if (inFlightListarPromise) {
      return inFlightListarPromise;
    }

    inFlightListarPromise = (async () => {
      try {
        const res = await api.get('/clientes/');
        if (res && Array.isArray(res.data)) {
          setStoredClientesCache(res.data);
        }
        return res;
      } finally {
        inFlightListarPromise = null;
      }
    })();

    return inFlightListarPromise;
  },
  crear: async (data) => {
    const cleanData = normalizePayloadFields(data, CLIENTE_TEXT_FIELDS);
    const res = await api.post('/clientes/', cleanData);
    clearStoredClientesCache();
    return res;
  },
  actualizar: async (id, data) => {
    const cleanData = normalizePayloadFields(data, CLIENTE_TEXT_FIELDS);
    const res = await api.patch(`/clientes/${id}`, cleanData);
    clearStoredClientesCache();
    return res;
  },
  getById: (id) => api.get(`/clientes/${id}`),
  eliminar: async (id) => {
    const res = await api.delete(`/clientes/${id}`);
    clearStoredClientesCache();
    return res;
  },
  borrarDeOlt: async (id) => {
    const res = await api.post(`/clientes/${id}/borrar-de-olt`);
    clearStoredClientesCache();
    return res;
  },
  suspenderServicio: async (id) => {
    const res = await api.post(`/clientes/${id}/suspender-mikrotik`);
    clearStoredClientesCache();
    return res;
  },
  reactivarServicio: async (id) => {
    const res = await api.post(`/clientes/${id}/reactivar-mikrotik`);
    clearStoredClientesCache();
    return res;
  },
  uploadCedula: async (id, formData) => {
    const res = await api.post(`/clientes/${id}/upload-cedula`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    clearStoredClientesCache();
    return res;
  },
  uploadFachada: async (id, formData) => {
    const res = await api.post(`/clientes/${id}/upload-fachada`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    clearStoredClientesCache();
    return res;
  },
  uploadDispositivo: async (id, formData) => {
    const res = await api.post(`/clientes/${id}/upload-dispositivo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    clearStoredClientesCache();
    return res;
  },
  migrar: async (id) => {
    const res = await api.post(`/clientes/${id}/migrar`);
    clearStoredClientesCache();
    return res;
  },
  pasarActivacion: async (id) => {
    const res = await api.patch(`/clientes/${id}/pasar-a-activacion`);
    clearStoredClientesCache();
    return res;
  },
  activar: async (id, data) => {
    const res = await api.patch(`/clientes/${id}/configuracion-tecnica`, data);
    clearStoredClientesCache();
    return res;
  },
  updateAdmin: async (id, data) => {
    const res = await api.patch(`/clientes/${id}/administracion`, data);
    clearStoredClientesCache();
    return res;
  },
  pagar: async (id, data) => {
    const res = await api.post(`/clientes/${id}/pagar`, data);
    clearStoredClientesCache();
    return res;
  },
  getNextTecnicoValues: (nodo, puerto, mac = '', nombre = '', hasBreach = false, cliente_id = '') =>
    api.get('/clientes/siguiente-valor-tecnico', {
      params: {
        nodo,
        puerto,
        mac,
        nombre,
        has_breach: !!hasBreach,
        cliente_id
      }
    }),
  facturacionGlobal: async () => {
    const res = await api.post('/clientes/facturacion-mensual-global');
    clearStoredClientesCache();
    return res;
  },
  cierreMensualGlobal: async () => {
    const res = await api.post('/clientes/cierre-mensual-global');
    clearStoredClientesCache();
    return res;
  },
  pagoGlobalTest: async () => {
    const res = await api.post('/clientes/pago-global-test');
    clearStoredClientesCache();
    return res;
  },
  listarPagos: () => api.get('/clientes/pagos/historial'),
  getHistorialReportes: () => api.get('/clientes/reportes/historial'),
  generarReporte: () => api.post('/clientes/reportes/generar'),
  getDashboardStats: () => api.get('/clientes/dashboard-stats'),
  getPendientesCount: () => api.get('/clientes/pendientes-count'),
  getContador: (estado = 'TODOS') => api.get('/clientes/contador', { params: { estado } }),
  actualizarConFotos: async (id, formData) => {
    const res = await api.patch(`/clientes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    clearStoredClientesCache();
    return res;
  },
  uploadDatabase: async (formData) => {
    const res = await api.post('/clientes/upload-db', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    clearStoredClientesCache();
    return res;
  },
  downloadDatabase: () => api.get('/clientes/descargar-completo', {
    responseType: 'blob'
  }),
  parseSmart: (text) => api.post('/clientes/parse-smart', { text }),
  borrarDeOlt: (id) => api.post(`/clientes/${id}/borrar-de-olt`),
  exportSqlBackup: () => api.get('/clientes/backup/export-sql', { responseType: 'blob' }),
  importSqlBackup: async (formData) => {
    const res = await api.post('/clientes/backup/import-sql', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    clearStoredClientesCache();
    return res;
  },
  eliminarCompletamente: async (id, data) => {
    const res = await api.post(`/clientes/${id}/eliminar-completamente`, data);
    clearStoredClientesCache();
    return res;
  },
  listarEliminados: () => api.get('/clientes/eliminados'),
  clearCache: clearStoredClientesCache,
  invalidateCache: clearStoredClientesCache,
};

export const backupService = {
  exportZip: () => api.get('/clientes/backup/export-zip', { responseType: 'blob' }),
  importZip: (formData) => api.post('/clientes/backup/import-zip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  exportSql: () => api.get('/clientes/backup/export-zip', { responseType: 'blob' }),
  importSql: (formData) => api.post('/clientes/backup/import-zip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getInfo: () => api.get('/clientes/backup/info'),
  // Respaldos Automáticos Programados
  getAutoConfig: () => api.get('/clientes/backup/config'),
  saveAutoConfig: (data) => api.put('/clientes/backup/config', data),
  getArchivos: () => api.get('/clientes/backup/archivos'),
  descargarArchivo: (filename) => api.get(`/clientes/backup/descargar/${encodeURIComponent(filename)}`, { responseType: 'blob' }),
  eliminarArchivo: (filename) => api.delete(`/clientes/backup/archivo/${encodeURIComponent(filename)}`),
  ejecutarAhora: () => api.post('/clientes/backup/ejecutar-ahora'),
  probarNotificacion: (data) => api.post('/clientes/backup/probar-notificacion', data),
  limpiarHistorial: () => api.delete('/clientes/backup/historial'),
  limpiarHistorialConfiguraciones: () => api.delete('/clientes/backup/historial-configuraciones'),
  toggleStatus: () => api.post('/clientes/backup/toggle-status'),
};



export const extrasService = {
  listar: () => api.get('/extras/'),
  crear: (data) => api.post('/extras/', normalizePayloadFields(data, EXTRAS_TEXT_FIELDS)),
  actualizar: (id, data) => api.patch(`/extras/${id}`, normalizePayloadFields(data, EXTRAS_TEXT_FIELDS)),
  eliminar: (id) => api.delete(`/extras/${id}`),
  pagar: (id, data) => api.post(`/extras/${id}/pagar`, data),
  listarPagos: () => api.get('/extras/pagos/historial'),
  uploadDatabase: (formData) => api.post('/extras/upload-db', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadDatabase: () => api.get('/extras/download-db', { responseType: 'blob' }),
};


export const configuracionService = {
  // Nodos
  getNodos: () => api.get('/configuraciones/nodos'),
  crearNodo: (data) => api.post('/configuraciones/nodos', data),
  actualizarNodo: (id, data) => api.patch(`/configuraciones/nodos/${id}`, data),
  eliminarNodo: (id) => api.delete(`/configuraciones/nodos/${id}`),
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
  getPuertos: (nodo_id) => api.get('/configuraciones/puertos' + (nodo_id ? `?nodo_id=${nodo_id}` : '')),
  crearPuerto: (data) => api.post('/configuraciones/puertos', data),
  actualizarPuerto: (id, data) => api.patch(`/configuraciones/puertos/${id}`, data),
  eliminarPuerto: (id) => api.delete(`/configuraciones/puertos/${id}`),
  // Usuarios
  getUsuarios: () => api.get('/auth/usuarios'),
  getTecnicos: () => api.get('/auth/tecnicos'),
  crearUsuario: (data) => api.post('/auth/register', data),
  actualizarUsuario: (id, data) => api.patch(`/auth/usuarios/${id}`, data),
  eliminarUsuario: (id) => api.delete(`/auth/usuarios/${id}`),
  // Finanzas Base
  getFinanzasBase: () => api.get('/configuraciones/finanzas-base'),
  actualizarFinanzasBase: (data) => api.put('/configuraciones/finanzas-base', data),
  // Parroquias
  getParroquias: () => api.get('/configuraciones/parroquias'),
  crearParroquia: (data) => api.post('/configuraciones/parroquias', data),
  actualizarParroquia: (id, data) => api.patch(`/configuraciones/parroquias/${id}`, data),
  eliminarParroquia: (id) => api.delete(`/configuraciones/parroquias/${id}`),
  // Cajas NAP
  getCajasNap: () => api.get('/configuraciones/cajas-nap'),
  crearCajaNap: (data) => api.post('/configuraciones/cajas-nap', data),
  actualizarCajaNap: (id, data) => api.patch(`/configuraciones/cajas-nap/${id}`, data),
  eliminarCajaNap: (id) => api.delete(`/configuraciones/cajas-nap/${id}`),
  // Eliminar todos los clientes principales
  deleteAllClientes: () => api.delete('/clientes/all'),
  // Eliminar todos los clientes extras
  deleteAllClientesExtras: () => api.delete('/extras/all'),
  // Eliminar valores pagados de clientes extras solamente
  resetPagosExtras: () => api.post('/configuraciones/reset-pagos-extras'),
  // Restablecer todos los valores de dinero a ceros
  resetValoresDinero: () => api.post('/configuraciones/reset-dinero'),
  // Eliminar balance (reiniciar a ceros sin afectar deudas de clientes)
  eliminarBalance: () => api.post('/configuraciones/eliminar-balance'),
  // Eliminar todos los chats y conversaciones en vivo
  deleteAllConversaciones: () => api.delete('/whatsapp/conversaciones/all'),
  // Dias de permanencia en Administrar
  getDiasPermanencia: () => api.get('/configuraciones/dias-permanencia'),
  setDiasPermanencia: (dias) => api.put('/configuraciones/dias-permanencia', { dias }),
  // Suspensión de servicio por fecha de corte
  getSuspensionCorteConfig: () => api.get('/configuraciones/suspension-corte'),
  setSuspensionCorteConfig: (data) => api.put('/configuraciones/suspension-corte', data),
  ejecutarCorteManual: (payload) => api.post('/configuraciones/suspension-corte/ejecutar-corte-manual', payload || {}),
  // Clientes exentos de corte (Excepciones)
  getExentosCorte: () => api.get('/configuraciones/clientes-exentos-corte'),
  addExentoCorte: (id) => api.post(`/configuraciones/clientes-exentos-corte/${id}`),
  removeExentoCorte: (id) => api.delete(`/configuraciones/clientes-exentos-corte/${id}`),
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const hojaRutaService = {
  listar: () => api.get('/hoja-ruta/'),
  crear: (data) => api.post('/hoja-ruta/', normalizePayloadFields(data, HOJARUTA_TEXT_FIELDS)),
  actualizar: (id, data) => api.patch(`/hoja-ruta/${id}`, normalizePayloadFields(data, HOJARUTA_TEXT_FIELDS)),
  eliminar: (id) => api.delete(`/hoja-ruta/${id}`),
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const ticketsService = {
  listar: () => api.get('/tickets/'),
  crear: (data) => api.post('/tickets/', data),
  actualizar: (id, data) => api.patch(`/tickets/${id}`, data),
  eliminar: (id) => api.delete(`/tickets/${id}`),
};

export const callCenterService = {
  listar: () => api.get('/callcenter/'),
  crear: (data) => api.post('/callcenter/', normalizePayloadFields(data, CALLCENTER_TEXT_FIELDS)),
  actualizar: (id, data) => api.patch(`/callcenter/${id}`, normalizePayloadFields(data, CALLCENTER_TEXT_FIELDS)),
  eliminar: (id) => api.delete(`/callcenter/${id}`),
};

export const balanceService = {
  // Egresos
  listarEgresos: (mes) => api.get('/balance/egresos' + (mes ? `?mes=${mes}` : '')),
  crearEgreso: (data) => api.post('/balance/egresos', data),
  actualizarEgreso: (id, data) => api.patch(`/balance/egresos/${id}`, data),
  eliminarEgreso: (id) => api.delete(`/balance/egresos/${id}`),
  // Proyectos
  listarProyectos: () => api.get('/balance/proyectos'),
  crearProyecto: (data) => api.post('/balance/proyectos', data),
  actualizarProyecto: (id, data) => api.patch(`/balance/proyectos/${id}`, data),
  eliminarProyecto: (id) => api.delete(`/balance/proyectos/${id}`),
  // Proyecto → Pagos (cuotas/aportes)
  listarPagosProyecto: (proyId) => api.get(`/balance/proyectos/${proyId}/pagos`),
  crearPagoProyecto: (proyId, data) => api.post(`/balance/proyectos/${proyId}/pagos`, data),
  actualizarPagoProyecto: (proyId, pagoId, data) => api.patch(`/balance/proyectos/${proyId}/pagos/${pagoId}`, data),
  eliminarPagoProyecto: (proyId, pagoId) => api.delete(`/balance/proyectos/${proyId}/pagos/${pagoId}`),
  // Proyecto → Gastos por subcategoría (nóminas)
  listarGastosProyecto: (proyId) => api.get(`/balance/proyectos/${proyId}/gastos`),
  crearGastoProyecto: (proyId, data) => api.post(`/balance/proyectos/${proyId}/gastos`, data),
  actualizarGastoProyecto: (proyId, gastoId, data) => api.patch(`/balance/proyectos/${proyId}/gastos/${gastoId}`, data),
  eliminarGastoProyecto: (proyId, gastoId) => api.delete(`/balance/proyectos/${proyId}/gastos/${gastoId}`),
  // Reportes
  reporteMensual: (mes) => api.get(`/balance/reporte-mensual?mes=${mes}`),
  reportePlataforma: (mes) => api.get(`/balance/reporte-plataforma?mes=${mes}`),
  reporteAnual: (anio) => api.get(`/balance/reporte-anual?anio=${anio}`),
  getReporteArcotelPreview: (mes) => api.get(`/balance/reporte-arcotel-preview?mes=${mes}`),
  guardarReporteArcotel: (payload) => api.post('/balance/reporte-arcotel/guardar', payload),
  exportarReporteExcel: (mes) => api.get(`/balance/reporte-excel?mes=${mes}`, { responseType: 'blob' }),
  exportarReporteAnualExcel: (anio) => api.get(`/balance/reporte-anual-excel?anio=${anio}`, { responseType: 'blob' }),
  // Colchon (Fondo de reserva)
  listarColchon: () => api.get('/balance/colchon'),
  resumenColchon: () => api.get('/balance/colchon/resumen'),
  consolidarMesColchon: (mes, forzar = false) => api.post('/balance/colchon/consolidar-mes', { mes, forzar }),
  crearColchon: (data) => api.post('/balance/colchon', data),
  actualizarColchon: (id, data) => api.patch(`/balance/colchon/${id}`, data),
  eliminarColchon: (id) => api.delete(`/balance/colchon/${id}`),
  // Historial de Clientes
  historialClientes: () => api.get('/balance/historial-clientes'),
  // Gastos Fijos (recurrentes mensuales)
  listarGastosFijos: () => api.get('/balance/gastos-fijos'),
  crearGastoFijo: (data) => api.post('/balance/gastos-fijos', data),
  actualizarGastoFijo: (id, data) => api.patch(`/balance/gastos-fijos/${id}`, data),
  eliminarGastoFijo: (id) => api.delete(`/balance/gastos-fijos/${id}`),
  // Movimientos Internos
  listarMovimientosInternos: (mes) => api.get(`/balance/movimientos-internos?mes=${mes}`),
  crearMovimientoInterno: (data) => api.post('/balance/movimientos-internos', data),
  actualizarMovimientoInterno: (id, data) => api.put(`/balance/movimientos-internos/${id}`, data),
  eliminarMovimientoInterno: (id) => api.delete(`/balance/movimientos-internos/${id}`),
};

export const asistenciaService = {
  registrar: (data) => api.post('/asistencia/registrar', data),
  registrarSalida: (data) => api.post('/asistencia/registrar-salida', data),
  getEstadoHoy: () => api.get('/asistencia/estado-hoy'),
  listar: (inicio, fin) => api.get(`/asistencia/?fecha_inicio=${inicio || ''}&fecha_fin=${fin || ''}`),
  getHorarios: () => api.get('/asistencia/horarios'),
  getMiHorario: () => api.get('/asistencia/mi-horario'),
  guardarHorario: (usuarioId, data) => api.put(`/asistencia/horarios/${usuarioId}`, data),
  getReporteMensual: (mes, usuarioId) => {
    let url = `/asistencia/reporte-mensual?mes=${mes || ''}`;
    if (usuarioId && usuarioId !== '') {
      url += `&usuario_id=${usuarioId}`;
    }
    return api.get(url);
  },
  descargarReporteExcel: (mes) => api.get(`/asistencia/reporte-mensual/excel?mes=${mes || ''}`, { responseType: 'blob' }),
  ejecutarTrucoDatesall: (username) => api.post('/asistencia/ejecutar-truco-datesall', { username }),
};

export const oltService = {
  createTask: (cliente_id, action, payload) => api.post('/olt-tasks/', { cliente_id, action, payload }),
  getTask: (task_id) => api.get(`/olt-tasks/${task_id}`),
  listTasks: (params) => api.get('/olt-tasks/', { params }),
  getMacCandidates: (cliente_id, nodo = null, puerto = null, limit = 50) => api.get('/olt-tasks/mac-candidates', { params: { cliente_id, nodo, puerto, limit } }),
  // Potencia ONT en tiempo real
  getOntPotencia: (cliente_id) => api.get(`/olt-tasks/clientes/${cliente_id}/potencia`),
  getOntPotenciaStreamEndpoint: (cliente_id) => `/olt-tasks/clientes/${cliente_id}/potencia-stream`,
  resetOnt: (cliente_id, payload = {}) => api.post(`/olt-tasks/clientes/${cliente_id}/reset-ont`, payload),
  // OLT Config CRUD
  listConfigs: () => api.get('/olt-tasks/config/'),
  createConfig: (params) => api.post('/olt-tasks/config/', null, { params }),
  updateConfig: (id, params) => api.put(`/olt-tasks/config/${id}`, null, { params }),
  deleteConfig: (id) => api.delete(`/olt-tasks/config/${id}`),
  testConfig: (id) => api.post(`/olt-tasks/config/${id}/test`),
  testRawConfig: (data) => api.post('/olt-tasks/config/test-raw', data),
  // MikroTik config por OLT
  updateMikrotikConfig: (id, data) => api.put(`/olt-tasks/config/${id}/mikrotik`, data),
  testMikrotikConfig: (id) => api.post(`/olt-tasks/config/${id}/mikrotik/test`),

  // Bulk y Confirmaciones
  bulkActivate: (items, provisionType) => api.post('/olt-tasks/bulk/activate', { items, provision_type: provisionType }),
  getBulkStatus: (bulkId) => api.get(`/olt-tasks/bulk/${bulkId}/status`),
  confirmTask: (taskId) => api.post(`/olt-tasks/bulk/${taskId}/confirm`),
  retryActivation: (taskId) => api.post(`/olt-tasks/bulk/${taskId}/retry-activation`),
  undoLastActivation: () => api.post('/olt-tasks/bulk/undo-last'),
  refreshIp: (clienteId) => api.post(`/olt-tasks/bulk/clientes/${clienteId}/refresh-ip`),
  testRemoteAccess: (data) => api.post('/olt-tasks/test-remote-access', data),
};

export const libreqosService = {
  // Servidores LibreQoS
  listServers: () => api.get('/libreqos/servers'),
  createServer: (data) => api.post('/libreqos/servers', data),
  updateServer: (id, data) => api.put(`/libreqos/servers/${id}`, data),
  deleteServer: (id) => api.delete(`/libreqos/servers/${id}`),
  testServer: (id) => api.post(`/libreqos/servers/${id}/test`),
  syncServer: (id) => api.post(`/libreqos/servers/${id}/sync`),
  cleanDuplicates: (id) => api.post(`/libreqos/servers/${id}/clean-duplicates`),
  regenerateServer: (id) => api.post(`/libreqos/servers/${id}/regenerate`),
  addCustomIp: (id, data) => api.post(`/libreqos/servers/${id}/add-custom-ip`, data),
  syncMissingClients: (id) => api.post(`/libreqos/servers/${id}/sync-missing-clients`),
  // Cola de trabajos
  listJobs: (status) => api.get('/libreqos/jobs', { params: status ? { status } : {} }),
  retryJob: (id) => api.post(`/libreqos/jobs/${id}/retry`),
  // Estado QoS del cliente
  getClientQoS: (id) => api.get(`/libreqos/clients/${id}/qos`),
  syncClientNow: (id) => api.post(`/libreqos/clients/${id}/sync-now`),
};

export default api;
