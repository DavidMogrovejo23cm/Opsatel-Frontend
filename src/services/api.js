import axios from 'axios';

const API_BASE_URL = '/';

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
  borrarDeOlt: (id) => api.post(`/clientes/${id}/borrar-de-olt`),
  suspenderServicio: (id) => api.post(`/clientes/${id}/suspender-mikrotik`),
  uploadCedula: (id, formData) => api.post(`/clientes/${id}/upload-cedula`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  pasarActivacion: (id) => api.patch(`/clientes/${id}/pasar-a-activacion`),
  activar: (id, data) => api.patch(`/clientes/${id}/configuracion-tecnica`, data),
  updateAdmin: (id, data) => api.patch(`/clientes/${id}/administracion`, data),
  pagar: (id, data) => api.post(`/clientes/${id}/pagar`, data),
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
  facturacionGlobal: () => api.post('/clientes/facturacion-mensual-global'),
  cierreMensualGlobal: () => api.post('/clientes/cierre-mensual-global'),
  pagoGlobalTest: () => api.post('/clientes/pago-global-test'),
  listarPagos: () => api.get('/clientes/pagos/historial'),
  getHistorialReportes: () => api.get('/clientes/reportes/historial'),
  generarReporte: () => api.post('/clientes/reportes/generar'),
  getDashboardStats: () => api.get('/clientes/dashboard-stats'),
  getPendientesCount: () => api.get('/clientes/pendientes-count'),
  actualizarConFotos: (id, formData) => api.patch(`/clientes/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadDatabase: (formData) => api.post('/clientes/upload-db', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadDatabase: () => api.get('/clientes/descargar-completo', {
    responseType: 'blob'
  }),
  parseSmart: (text) => api.post('/clientes/parse-smart', { text }),
  borrarDeOlt: (id) => api.post(`/clientes/${id}/borrar-de-olt`),
  eliminarCompletamente: (id, data) => api.post(`/clientes/${id}/eliminar-completamente`, data),
  listarEliminados: () => api.get('/clientes/eliminados'),
};


export const extrasService = {
  listar: () => api.get('/extras/'),
  crear: (data) => api.post('/extras/', data),
  actualizar: (id, data) => api.patch(`/extras/${id}`, data),
  eliminar: (id) => api.delete(`/extras/${id}`),
  pagar: (id, data) => api.post(`/extras/${id}/pagar`, data),
  listarPagos: () => api.get('/extras/pagos/historial'),
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
  // Eliminar todos los clientes
  deleteAllClientes: () => api.delete('/clientes/all'),
  // Dias de permanencia en Administrar
  getDiasPermanencia: () => api.get('/configuraciones/dias-permanencia'),
  setDiasPermanencia: (dias) => api.put('/configuraciones/dias-permanencia', { dias }),
  // Suspensión de servicio por fecha de corte
  getSuspensionCorteConfig: () => api.get('/configuraciones/suspension-corte'),
  setSuspensionCorteConfig: (data) => api.put('/configuraciones/suspension-corte', data),
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
  crear: (data) => api.post('/hoja-ruta/', data),
  actualizar: (id, data) => api.patch(`/hoja-ruta/${id}`, data),
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
  crear: (data) => api.post('/callcenter/', data),
  actualizar: (id, data) => api.patch(`/callcenter/${id}`, data),
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
  exportarReporteExcel: (mes) => api.get(`/balance/reporte-excel?mes=${mes}`, { responseType: 'blob' }),
  exportarReporteAnualExcel: (anio) => api.get(`/balance/reporte-anual-excel?anio=${anio}`, { responseType: 'blob' }),
  // Colchon (Fondo de reserva)
  listarColchon: () => api.get('/balance/colchon'),
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
};

export const libreqosService = {
  // Servidores LibreQoS
  listServers:   ()         => api.get('/libreqos/servers'),
  createServer:  (data)     => api.post('/libreqos/servers', data),
  updateServer:  (id, data) => api.put(`/libreqos/servers/${id}`, data),
  deleteServer:  (id)       => api.delete(`/libreqos/servers/${id}`),
  testServer:    (id)       => api.post(`/libreqos/servers/${id}/test`),
  syncServer:    (id)       => api.post(`/libreqos/servers/${id}/sync`),
  // Cola de trabajos
  listJobs:      (status)   => api.get('/libreqos/jobs', { params: status ? { status } : {} }),
  retryJob:      (id)       => api.post(`/libreqos/jobs/${id}/retry`),
  // Estado QoS del cliente
  getClientQoS:  (id)       => api.get(`/libreqos/clients/${id}/qos`),
  syncClientNow: (id)       => api.post(`/libreqos/clients/${id}/sync-now`),
};

export default api;
