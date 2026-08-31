import api from './api';

export const whatsappService = {
  // Envío manual
  enviarManual: (numero, mensaje) => 
    api.post('/whatsapp/enviar-manual', {
      numero: numero,
      mensaje: mensaje
    }),

  // Programar envío automático
  programar: (hora, mensaje, enviar_a_todos = true, fecha = null, recurrencia = "diario") =>
    api.post('/whatsapp/programar', {
      hora: hora,
      mensaje: mensaje,
      enviar_a_todos: enviar_a_todos,
      fecha: fecha,
      recurrencia: recurrencia
    }),

  // Obtener configuración actual
  obtenerConfiguracion: () =>
    api.get('/whatsapp/configuracion'),

  // Actualizar configuración
  actualizarConfiguracion: (config_id, hora, mensaje, fecha = null, recurrencia = null) =>
    api.patch(`/whatsapp/configuracion/${config_id}`, {
      hora: hora,
      mensaje: mensaje,
      fecha: fecha,
      recurrencia: recurrencia
    }),

  // Eliminar configuración
  eliminarConfiguracion: (config_id) =>
    api.delete(`/whatsapp/configuracion/${config_id}`),

  // Obtener historial
  obtenerHistorial: (limite = 50) =>
    api.get('/whatsapp/historial', {
      params: { limite: limite }
    }),

  // Marcar mensaje como enviado en el historial
  marcarEnviado: (historial_id) =>
    api.post(`/whatsapp/historial/${historial_id}/marcar-enviado`),

  // Obtener estado del puente
  obtenerStatusBridge: () =>
    api.get('/whatsapp/status-bridge'),

  // Obtener código QR del puente
  obtenerQrBridge: () =>
    api.get('/whatsapp/qr-bridge'),

  // Difusión global masiva
  enviarGlobal: (mensaje) =>
    api.post('/whatsapp/enviar-global', { mensaje: mensaje }),

  // Administradores de WhatsApp
  obtenerAdministradores: () =>
    api.get('/whatsapp/administradores'),

  crearAdministrador: (numero, nombre, permisos = 'admin_total', activo = true) =>
    api.post('/whatsapp/administradores', {
      numero: numero,
      nombre: nombre,
      permisos: permisos,
      activo: activo
    }),

  actualizarAdministrador: (admin_id, data) =>
    api.patch(`/whatsapp/administradores/${admin_id}`, data),

  eliminarAdministrador: (admin_id) =>
    api.delete(`/whatsapp/administradores/${admin_id}`),

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

