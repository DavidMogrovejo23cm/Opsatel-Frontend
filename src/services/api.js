import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const clienteService = {
  
  crear: (data) => api.post('/clientes/', data),
  actualizar: (id, data) => api.patch(`/clientes/${id}`, data),
  
  
  getById: (id) => api.get(`/clientes/${id}`),
  pasarActivacion: (id) => api.patch(`/clientes/${id}/pasar-a-activacion`),
  activar: (id, data) => api.patch(`/clientes/${id}/configuracion-tecnica`, data),
  
  
  updateAdmin: (id, data) => api.patch(`/clientes/${id}/administracion`, data),
  pagar: (id, data) => api.post(`/clientes/${id}/pagar`, data),
  facturacionGlobal: () => api.post('/clientes/facturacion-mensual-global'),
  pagoGlobalTest: () => api.post('/clientes/pago-global-test'),
  
  
  listar: () => api.get('/clientes/'), 
  listarPagos: () => api.get('/clientes/pagos/historial'),
};

export default api;
