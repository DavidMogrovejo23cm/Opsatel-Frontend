/**
 * @file whatsappService.js
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import api from './api';
import {
  comprobantesCache,
  conversacionesCache,
  whatsappAdminsCache,
  whatsappDestinosCache
} from '../utils/storageCache';

export const whatsappService = {
  // Envío manual
  enviarManual: (numero, mensaje, historial_id = null) => 
    api.post('/whatsapp/enviar-manual', {
      numero: numero,
      mensaje: mensaje,
      historial_id: historial_id
    }),

  // Programar envío automático
  programar: (hora, mensaje, enviar_a_todos = true, fecha = null, recurrencia = "diario", dia_mes = null, filtro_clientes = "todos", desde_cliente_id = null, nodo = null) =>
    api.post('/whatsapp/programar', {
      hora: hora,
      mensaje: mensaje,
      enviar_a_todos: enviar_a_todos,
      fecha: fecha,
      recurrencia: recurrencia,
      dia_mes: dia_mes,
      filtro_clientes: filtro_clientes,
      desde_cliente_id: desde_cliente_id,
      nodo: nodo
    }),

  // Obtener todas las configuraciones programadas
  obtenerConfiguraciones: () =>
    api.get('/whatsapp/configuraciones'),

  // Obtener configuración actual
  obtenerConfiguracion: () =>
    api.get('/whatsapp/configuracion'),

  // Alternar activo/pausado de configuración
  toggleActivoConfiguracion: (config_id) =>
    api.patch(`/whatsapp/configuracion/${config_id}/toggle-activo`),

  // Actualizar configuración
  actualizarConfiguracion: (config_id, hora, mensaje, fecha = null, recurrencia = null, dia_mes = null, filtro_clientes = null, desde_cliente_id = null, nodo = null) =>
    api.patch(`/whatsapp/configuracion/${config_id}`, {
      hora: hora,
      mensaje: mensaje,
      fecha: fecha,
      recurrencia: recurrencia,
      dia_mes: dia_mes,
      filtro_clientes: filtro_clientes,
      desde_cliente_id: desde_cliente_id,
      nodo: nodo
    }),

  // Eliminar configuración
  eliminarConfiguracion: (config_id) =>
    api.delete(`/whatsapp/configuracion/${config_id}`),

  // Obtener historial (con difusiones y mensajes detallados)
  obtenerHistorial: (limite = 100) =>
    api.get('/whatsapp/historial', {
      params: { limite: limite }
    }),

  // Marcar mensaje como enviado en el historial
  marcarEnviado: (historial_id) =>
    api.post(`/whatsapp/historial/${historial_id}/marcar-enviado`),

  // Reintentar todos los mensajes fallidos en segundo plano
  reintentarFallidos: () =>
    api.post('/whatsapp/historial/reintentar-fallidos'),

  // Cancelar una difusión masiva específica en curso
  cancelarDifusion: (difusion_id) =>
    api.post(`/whatsapp/difusion/${difusion_id}/cancelar`),

  // Cancelar de emergencia todos los envíos masivos y reintentos en curso
  cancelarTodosLosEnvios: () =>
    api.post('/whatsapp/cancelar-todos-envios'),

  // Obtener estado del puente
  obtenerStatusBridge: () =>
    api.get('/whatsapp/status-bridge'),

  // Obtener código QR del puente
  obtenerQrBridge: () =>
    api.get('/whatsapp/qr-bridge'),

  // Cerrar sesión / Desvincular puente WhatsApp
  cerrarSesionBridge: () =>
    api.post('/whatsapp/logout'),

  // Difusión global masiva con control de ritmo, lotes, rango de IDs, límite de mensajes y puertos
  enviarGlobal: (mensaje, nodo = null, estado = 'ACTIVO', delay_min = 30.0, delay_max = 120.0, batch_size = 10, batch_pause_min = 300.0, batch_pause_max = 600.0, desde_id = null, hasta_id = null, limite_mensajes = null, puertos = null) =>
    api.post('/whatsapp/enviar-global', { 
      mensaje: mensaje, 
      nodo: nodo, 
      estado: estado,
      delay_min: delay_min,
      delay_max: delay_max,
      batch_size: batch_size,
      batch_pause_min: batch_pause_min,
      batch_pause_max: batch_pause_max,
      desde_id: desde_id,
      hasta_id: hasta_id,
      limite_mensajes: limite_mensajes,
      puertos: puertos
    }),

  // Administradores de WhatsApp
  obtenerAdministradores: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = whatsappAdminsCache.get();
      if (cached && Array.isArray(cached) && cached.length > 0) return { data: cached, status: 200, fromCache: true };
    }
    const res = await api.get('/whatsapp/administradores');
    if (res && Array.isArray(res.data)) whatsappAdminsCache.set(res.data);
    return res;
  },

  crearAdministrador: async (numero, nombre, permisos = 'admin_total', activo = true) => {
    const res = await api.post('/whatsapp/administradores', {
      numero: numero,
      nombre: nombre,
      permisos: permisos,
      activo: activo
    });
    whatsappAdminsCache.clear();
    return res;
  },

  actualizarAdministrador: async (admin_id, data) => {
    const res = await api.patch(`/whatsapp/administradores/${admin_id}`, data);
    whatsappAdminsCache.clear();
    return res;
  },

  eliminarAdministrador: async (admin_id) => {
    const res = await api.delete(`/whatsapp/administradores/${admin_id}`);
    whatsappAdminsCache.clear();
    return res;
  },

  // Destinos de Reenvío para Comprobantes OCR
  obtenerDestinosOCR: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = whatsappDestinosCache.get();
      if (cached && Array.isArray(cached) && cached.length > 0) return { data: cached, status: 200, fromCache: true };
    }
    const res = await api.get('/whatsapp/destinos-ocr');
    if (res && Array.isArray(res.data)) whatsappDestinosCache.set(res.data);
    return res;
  },

  crearDestinoOCR: async (numero, nombre, activo = true) => {
    const res = await api.post('/whatsapp/destinos-ocr', {
      numero: numero,
      nombre: nombre,
      activo: activo
    });
    whatsappDestinosCache.clear();
    return res;
  },

  toggleActivoDestinoOCR: async (destino_id) => {
    const res = await api.patch(`/whatsapp/destinos-ocr/${destino_id}/toggle-activo`);
    whatsappDestinosCache.clear();
    return res;
  },

  eliminarDestinoOCR: async (destino_id) => {
    const res = await api.delete(`/whatsapp/destinos-ocr/${destino_id}`);
    whatsappDestinosCache.clear();
    return res;
  },

  // Conversaciones y Chat en vivo (Historial de 30 mensajes por cliente)
  obtenerConversaciones: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = conversacionesCache.get();
      if (cached && Array.isArray(cached) && cached.length > 0) return { data: cached, status: 200, fromCache: true };
    }
    const res = await api.get('/whatsapp/conversaciones');
    if (res && Array.isArray(res.data)) conversacionesCache.set(res.data);
    return res;
  },

  obtenerChat: (numero) =>
    api.get(`/whatsapp/conversaciones/${encodeURIComponent(numero)}`),

  enviarMensajeChat: async (numero, mensaje) => {
    const res = await api.post(`/whatsapp/conversaciones/${encodeURIComponent(numero)}/enviar`, { mensaje: mensaje });
    conversacionesCache.clear();
    return res;
  },

  vincularClienteChat: async (numero, cliente_id) => {
    const res = await api.post(`/whatsapp/conversaciones/${encodeURIComponent(numero)}/vincular-cliente`, { cliente_id: cliente_id });
    conversacionesCache.clear();
    return res;
  },

  buscarClientesChat: (q) =>
    api.get('/whatsapp/buscar-clientes-chat', { params: { q: q } }),

  // Eliminar todas las conversaciones y chats en vivo
  deleteAllConversaciones: async () => {
    const res = await api.delete('/whatsapp/conversaciones/all');
    conversacionesCache.clear();
    return res;
  },

  // Eliminar una conversación individual
  eliminarConversacion: async (numero) => {
    const res = await api.delete(`/whatsapp/conversaciones/${encodeURIComponent(numero)}`);
    conversacionesCache.clear();
    return res;
  },

  // Comprobantes de pago descargados en uploadscr
  obtenerComprobantes: async (params = {}, forceRefresh = false) => {
    const isDefaultQuery = !params || Object.keys(params).length === 0 || (Object.keys(params).length === 1 && params.categoria === 'CONFIRMACION_RECIBO');
    if (!forceRefresh && isDefaultQuery) {
      const cached = comprobantesCache.get();
      if (cached && Array.isArray(cached) && cached.length > 0) return { data: cached, status: 200, fromCache: true };
    }
    const res = await api.get('/whatsapp/comprobantes', { params });
    if (res && Array.isArray(res.data) && isDefaultQuery) {
      comprobantesCache.set(res.data);
    }
    return res;
  },

  actualizarComprobante: async (id, data) => {
    const res = await api.patch(`/whatsapp/comprobantes/${id}`, data);
    comprobantesCache.clear();
    return res;
  },

  aprobarPagoComprobante: async (id, data = {}) => {
    const res = await api.post(`/whatsapp/comprobantes/${id}/aprobar-pago`, data);
    comprobantesCache.clear();
    return res;
  },

  eliminarComprobante: async (id, eliminarArchivo = false) => {
    const res = await api.delete(`/whatsapp/comprobantes/${id}`, { params: { eliminar_archivo: eliminarArchivo } });
    comprobantesCache.clear();
    return res;
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

