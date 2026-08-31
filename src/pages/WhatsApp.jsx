import React, { useState, useEffect } from 'react';
import { whatsappService } from '../services/whatsappService';
import { motion } from 'framer-motion';
import { showAlert, showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';


const WhatsApp = () => {
    const [activeTab, setActiveTab] = useState('Envío Manual');
    
    // Envío manual
    const [numeroManual, setNumeroManual] = useState('');
    const [mensajeManual, setMensajeManual] = useState('');
    const [enviando, setEnviando] = useState(false);
    
    // Envío programado
    const [hora, setHora] = useState('');
    const [fecha, setFecha] = useState('');
    const [recurrencia, setRecurrencia] = useState('diario');
    const [mensajeProgramado, setMensajeProgramado] = useState('ESTE ES UN MENSAJE DE PRUEBA NO RESPONDER');
    const [configuracion, setConfiguracion] = useState(null);
    const [editandoConfig, setEditandoConfig] = useState(false);
    
    // Difusión Masiva (Global)
    const [mensajeGlobal, setMensajeGlobal] = useState('');
    const [enviandoGlobal, setEnviandoGlobal] = useState(false);

    // Estado del puente (Conexión QR)
    const [connectionStatus, setConnectionStatus] = useState('OFFLINE');
    const [connectionData, setConnectionData] = useState(null);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [cargandoConexion, setCargandoConexion] = useState(false);

    // Historial
    const [historial, setHistorial] = useState([]);

    // Administradores autorizados
    const [administradores, setAdministradores] = useState([]);
    const [nombreAdmin, setNombreAdmin] = useState('');
    const [numeroAdmin, setNumeroAdmin] = useState('');
    const [permisosAdmin, setPermisosAdmin] = useState('admin_total');
    const [guardandoAdmin, setGuardandoAdmin] = useState(false);
    const [cargandoAdmins, setCargandoAdmins] = useState(false);

    useEffect(() => {
        cargarConfiguracion();
        cargarHistorial();
        cargarEstadoConexion();
        cargarAdministradores();
        
        // Recargar historial cada 30 segundos
        const intervalo = setInterval(cargarHistorial, 30000);
        return () => clearInterval(intervalo);
    }, []);

    const cargarAdministradores = async () => {
        setCargandoAdmins(true);
        try {
            const respuesta = await whatsappService.obtenerAdministradores();
            setAdministradores(respuesta.data || respuesta || []);
        } catch (error) {
            console.error("Error cargando administradores:", error);
        } finally {
            setCargandoAdmins(false);
        }
    };

    const manejarGuardarAdministrador = async () => {
        if (!nombreAdmin.trim() || !numeroAdmin.trim()) {
            showWarning('Ingresa el nombre y el número de teléfono del Administrador');
            return;
        }

        setGuardandoAdmin(true);
        try {
            await whatsappService.crearAdministrador(numeroAdmin, nombreAdmin, permisosAdmin, true);
            showSuccess('Administrador registrado correctamente');
            setNombreAdmin('');
            setNumeroAdmin('');
            setPermisosAdmin('admin_total');
            cargarAdministradores();
        } catch (error) {
            showError('Error al guardar administrador: ' + (error.response?.data?.detail || error.message));
        } finally {
            setGuardandoAdmin(false);
        }
    };

    const manejarAlternarEstadoAdmin = async (admin) => {
        try {
            await whatsappService.actualizarAdministrador(admin.id, { activo: !admin.activo });
            showSuccess(`Administrador ${!admin.activo ? 'activado' : 'desactivado'}`);
            cargarAdministradores();
        } catch (error) {
            showError('Error al actualizar estado: ' + (error.response?.data?.detail || error.message));
        }
    };

    const manejarEliminarAdmin = async (admin) => {
        const confirmado = await showConfirm(
            '🗑️ Eliminar Administrador',
            `¿Estás seguro de eliminar a ${admin.nombre} (${admin.numero}) como Administrador? Ya no podrá enviar comandos por WhatsApp.`,
            'Sí, eliminar',
            'Cancelar'
        );
        if (!confirmado) return;

        try {
            await whatsappService.eliminarAdministrador(admin.id);
            showSuccess('Administrador eliminado correctamente');
            cargarAdministradores();
        } catch (error) {
            showError('Error al eliminar: ' + (error.response?.data?.detail || error.message));
        }
    };


    // Polling del estado de conexión cuando estamos en la pestaña de Conexión o si no está conectado
    useEffect(() => {
        let intervaloConexion;
        
        const poll = () => {
            cargarEstadoConexion(false); // Silencioso
        };

        if (activeTab === 'Conexión QR' || (connectionStatus !== 'CONNECTED' && connectionStatus !== 'GREEN_API')) {
            poll();
            intervaloConexion = setInterval(poll, 5000);
        }
        
        return () => {
            if (intervaloConexion) clearInterval(intervaloConexion);
        };
    }, [activeTab, connectionStatus]);

    const cargarEstadoConexion = async (mostrarCargando = true) => {
        if (mostrarCargando) setCargandoConexion(true);
        try {
            const respuesta = await whatsappService.obtenerStatusBridge();
            const data = respuesta.data;
            setConnectionStatus(data.status);
            setConnectionData(data);
            
            if (data.status === 'QR_READY') {
                const resQr = await whatsappService.obtenerQrBridge();
                setQrCodeData(resQr.data.qr);
            } else {
                setQrCodeData(null);
            }
        } catch (error) {
            console.error("Error cargando estado de conexión:", error);
            setConnectionStatus('OFFLINE');
            setConnectionData(null);
            setQrCodeData(null);
        } finally {
            if (mostrarCargando) setCargandoConexion(false);
        }
    };

    const cargarConfiguracion = async () => {
        try {
            const respuesta = await whatsappService.obtenerConfiguracion();
            setConfiguracion(respuesta);
            if (respuesta.hora) {
                setHora(respuesta.hora);
                setMensajeProgramado(respuesta.mensaje);
                setFecha(respuesta.fecha || '');
                setRecurrencia(respuesta.recurrencia || 'diario');
            }
        } catch (error) {
            console.error("Error cargando configuración:", error);
        }
    };

    const cargarHistorial = async () => {
        try {
            const respuesta = await whatsappService.obtenerHistorial();
            setHistorial(respuesta.historial || []);
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
    };

    const manejarEnvioManual = async () => {
        if (!numeroManual.trim() || !mensajeManual.trim()) {
            showWarning('Ingresa número y mensaje');
            return;
        }

        setEnviando(true);
        try {
            // Enviar a través de la pasarela silenciosa del backend
            await whatsappService.enviarManual(numeroManual, mensajeManual);
            showSuccess('Mensaje enviado exitosamente desde el servidor');
            setNumeroManual('');
            setMensajeManual('');
            cargarHistorial();
        } catch (error) {
            showError('Error al enviar mensaje: ' + (error.response?.data?.detail || error.message));
        } finally {
            setEnviando(false);
        }
    };

    const manejarProgramacion = async () => {
        if (!hora || !mensajeProgramado.trim()) {
            showWarning('Ingresa hora y mensaje');
            return;
        }

        try {
            const fechaParaEnviar = (recurrencia === 'unico' || recurrencia === 'mensual') ? fecha : (editandoConfig ? 'vaciar' : null);
            if (editandoConfig && configuracion?.id) {
                await whatsappService.actualizarConfiguracion(configuracion.id, hora, mensajeProgramado, fechaParaEnviar, recurrencia);
                showSuccess('Configuración actualizada');
            } else {
                await whatsappService.programar(hora, mensajeProgramado, true, fechaParaEnviar, recurrencia);
                let msg = 'Envío programado para las ' + hora;
                if (recurrencia === 'unico' && fecha) msg += ' el día ' + fecha;
                if (recurrencia === 'mensual' && fecha) msg += ' el día ' + new Date(fecha + 'T00:00:00').getDate() + ' de cada mes';
                showSuccess(msg);
            }
            setEditandoConfig(false);
            cargarConfiguracion();
        } catch (error) {
            showError('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const manejarEnviarMensajePendiente = async (msg) => {
        try {
            // Enviar mensaje pendiente directamente usando la pasarela
            await whatsappService.enviarManual(msg.numero, msg.mensaje);
            await whatsappService.marcarEnviado(msg.id);
            showSuccess('Mensaje enviado y marcado en el historial');
            cargarHistorial();
        } catch (error) {
            showError('Error al enviar mensaje pendiente: ' + (error.response?.data?.detail || error.message));
        }
    };

    const manejarEliminarConfiguracion = async () => {
        const confirmado = await showConfirm('¿Eliminar programación?', '¿Estás seguro de eliminar la programación?', 'Sí, eliminar', 'Cancelar');
        if (!confirmado) return;

        try {
            if (configuracion?.id) {
                await whatsappService.eliminarConfiguracion(configuracion.id);
                showSuccess('Programación eliminada');
                setConfiguracion(null);
                setHora('');
                setFecha('');
                setMensajeProgramado('');
            }
        } catch (error) {
            showError('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const manejarEnvioGlobal = async () => {
        if (!mensajeGlobal.trim()) {
            showWarning('Por favor ingresa el mensaje para la difusión masiva.');
            return;
        }

        const confirmacion1 = await showConfirm(
            '⚠️ ADVERTENCIA DE SEGURIDAD',
            'Estás a punto de enviar un mensaje masivo a TODOS los clientes con estado "Activo" en Opsatel.\n\nEsto enviará mensajes uno tras otro de forma asíncrona.\n\n¿Estás seguro de continuar con el envío?',
            'Continuar',
            'Cancelar'
        );
        if (!confirmacion1) return;

        const confirmacion2 = await showConfirm(
            '🚨 CONFIRMACIÓN DE DOBLE SEGURIDAD',
            '¿Realmente deseas ejecutar la difusión masiva ahora?\nEste proceso NO se puede cancelar una vez iniciado.',
            'Sí, ejecutar difusión',
            'Cancelar'
        );
        if (!confirmacion2) return;

        setEnviandoGlobal(true);
        try {
            await whatsappService.enviarGlobal(mensajeGlobal);
            showSuccess('Difusión masiva iniciada en segundo plano con éxito. Puedes revisar el avance en la pestaña de Historial.');
            setMensajeGlobal('');
            setActiveTab('Historial');
            cargarHistorial();
        } catch (error) {
            showError('Error al iniciar difusión: ' + (error.response?.data?.detail || error.message));
        } finally {
            setEnviandoGlobal(false);
        }
    };

    // Renderizar indicador de estado de conexión
    const renderConnectionBadge = () => {
        let text = 'Desconocido';
        let color = '#9ca3af';
        let bgColor = 'rgba(156, 163, 175, 0.15)';
        let animate = false;

        switch (connectionStatus) {
            case 'CONNECTED':
                text = 'Conectado';
                color = '#4ade80';
                bgColor = 'rgba(74, 222, 128, 0.15)';
                break;
            case 'QR_READY':
                text = 'Esperando Vinculación QR';
                color = '#f59e0b';
                bgColor = 'rgba(245, 158, 11, 0.15)';
                animate = true;
                break;
            case 'INITIALIZING':
                text = 'Iniciando en Servidor...';
                color = '#60a5fa';
                bgColor = 'rgba(96, 165, 250, 0.15)';
                animate = true;
                break;
            case 'OFFLINE':
            case 'DISCONNECTED':
                text = 'Desconectado / Offline';
                color = '#f87171';
                bgColor = 'rgba(248, 113, 113, 0.15)';
                break;
            case 'GREEN_API':
                text = '✅ Green API Conectado';
                color = '#4ade80';
                bgColor = 'rgba(74, 222, 128, 0.15)';
                break;
            case 'GREEN_API_NO_CREDENTIALS':
                text = '⚠️ Green API sin credenciales';
                color = '#f59e0b';
                bgColor = 'rgba(245, 158, 11, 0.15)';
                animate = true;
                break;
            default:
                break;
        }

        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: color,
                background: bgColor,
                border: `1px solid ${color}33`,
                marginLeft: '15px'
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: color,
                    animation: animate ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
                }}></span>
                {text}
            </div>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass-card glass" 
            style={{ minHeight: '80vh' }}
        >
            <div className="page-header">
                <div className="page-header-info">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <h1 style={{ background: 'linear-gradient(90deg, #06b6d4, #06d4af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                            📱 Centro de WhatsApp
                        </h1>
                        {renderConnectionBadge()}
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        Envía y gestiona notificaciones automáticas y masivas usando la pasarela de WhatsApp.
                    </p>
                </div>
            </div>

            <div className="page-actions" style={{ gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                {['Envío Manual', 'Envío Programado', 'Difusión Masiva', 'Historial', 'Conexión QR', 'Administradores'].map(tab => (
                    <button

                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
                
                {/* ENVÍO MANUAL */}
                {activeTab === 'Envío Manual' && (
                    <div>
                        <h3>📤 Enviar Mensaje Manual</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                            Envía un mensaje de WhatsApp a un número específico directamente desde el servidor.
                        </p>

                        <div style={{ 
                            background: 'rgba(6, 182, 212, 0.05)', 
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            padding: '20px',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <div className="input-group">
                                <label className="label">Número de teléfono</label>
                                <input 
                                    type="text"
                                    className="input" 
                                    value={numeroManual}
                                    onChange={e => setNumeroManual(e.target.value)}
                                    placeholder="+593999999999 o 0999999999"
                                    style={{ marginTop: '8px' }}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                    Incluye código de país (+593) o el número móvil (se autocompletará con el prefijo de Ecuador).
                                </small>
                            </div>

                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label className="label">Mensaje</label>
                                <textarea 
                                    className="input" 
                                    value={mensajeManual}
                                    onChange={e => setMensajeManual(e.target.value)}
                                    placeholder="Escribe tu mensaje aquí..."
                                    rows="4"
                                    style={{ marginTop: '8px', fontFamily: 'monospace' }}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                    Caracteres: {mensajeManual.length}
                                </small>
                            </div>

                            <button 
                                className="btn btn-primary"
                                onClick={manejarEnvioManual}
                                disabled={enviando || connectionStatus !== 'CONNECTED'}
                                style={{ 
                                    marginTop: '15px', 
                                    width: '100%', 
                                    opacity: (enviando || connectionStatus !== 'CONNECTED') ? 0.6 : 1 
                                }}
                            >
                                {connectionStatus !== 'CONNECTED' 
                                    ? '🔌 WhatsApp Desconectado (Vincula la cuenta en la pestaña Conexión QR)' 
                                    : (enviando ? '⏳ Enviando...' : '✉️ Enviar Mensaje desde Servidor')
                                }
                            </button>
                        </div>
                    </div>
                )}
            

                {/* ENVÍO PROGRAMADO */}
                {activeTab === 'Envío Programado' && (
                    <div>
                        <h3>⏰ Programar Envío Automático</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                            Configura una hora para que se envíe automáticamente un mensaje a TODOS los clientes con celular registrado.
                        </p>

                        {configuracion?.configurado && !editandoConfig ? (
                            <div style={{ 
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '2px solid rgba(34, 197, 94, 0.5)',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '20px'
                            }}>
                                <h4 style={{ color: '#86efac', margin: '0 0 15px 0' }}>✅ Envío Programado Activo</h4>
                                
                                <div style={{ display: 'flex', gap: '30px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>Hora de envío:</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#86efac', margin: 0 }}>
                                            {configuracion.hora}
                                        </p>
                                    </div>
                                    {configuracion.fecha && (
                                        <div>
                                            <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>
                                                {configuracion.recurrencia === 'mensual' ? 'Día de cobro/envío:' : 'Fecha única:'}
                                            </p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#86efac', margin: 0 }}>
                                                {configuracion.recurrencia === 'mensual' 
                                                    ? `Día ${new Date(configuracion.fecha + 'T00:00:00').getDate()} de cada mes` 
                                                    : configuracion.fecha}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>Tipo de Envío:</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#86efac', margin: 0 }}>
                                            {configuracion.recurrencia === 'mensual' 
                                                ? '🗓️ Recurrente Mensual' 
                                                : (configuracion.recurrencia === 'unico' ? '📅 Único Programado' : '🔁 Recurrente Diario')}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>Mensaje a despachar:</p>
                                    <div style={{ 
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        color: '#86efac',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                        maxHeight: '150px',
                                        overflow: 'auto'
                                    }}>
                                        {configuracion.mensaje}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        className="btn"
                                        onClick={() => setEditandoConfig(true)}
                                        style={{ background: '#3b82f6', flex: 1 }}
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button 
                                        className="btn"
                                        onClick={manejarEliminarConfiguracion}
                                        style={{ background: '#ef4444', flex: 1 }}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ 
                                background: 'rgba(6, 182, 212, 0.05)', 
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                    <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                                        <label className="label">Hora (HH:MM)</label>
                                        <input 
                                            type="time"
                                            className="input" 
                                            value={hora}
                                            onChange={e => setHora(e.target.value)}
                                            style={{ marginTop: '8px' }}
                                        />
                                        <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                            Hora local en Ecuador (GMT-5)
                                        </small>
                                    </div>

                                    <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                                        <label className="label">Tipo de Recurrencia</label>
                                        <select 
                                            className="input" 
                                            value={recurrencia} 
                                            onChange={e => {
                                                setRecurrencia(e.target.value);
                                                if (e.target.value === 'diario') setFecha('');
                                            }}
                                            style={{ marginTop: '8px', height: '40px', background: '#0e1726', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0 10px' }}
                                        >
                                            <option value="diario">🔁 Recurrente Diario (Todos los días)</option>
                                            <option value="unico">📅 Envío Único (Una fecha fija)</option>
                                            <option value="mensual">🗓️ Recurrente Mensual (Mismo día del mes)</option>
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                            Frecuencia con la que se disparará el cron.
                                        </small>
                                    </div>

                                    {(recurrencia === 'unico' || recurrencia === 'mensual') && (
                                        <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                                            <label className="label">
                                                {recurrencia === 'mensual' ? 'Día base del mes' : 'Fecha exacta de envío'}
                                            </label>
                                            <input 
                                                type="date"
                                                className="input" 
                                                value={fecha}
                                                onChange={e => setFecha(e.target.value)}
                                                style={{ marginTop: '8px' }}
                                            />
                                            <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                                {recurrencia === 'mensual' ? 'Se repetirá el mismo día de cada mes (ej: el 15)' : 'Fecha fija.'}
                                            </small>
                                        </div>
                                    )}
                                </div>

                                <div className="input-group" style={{ marginTop: '15px' }}>
                                    <label className="label">Mensaje Automático</label>
                                    <textarea 
                                        className="input" 
                                        value={mensajeProgramado}
                                        onChange={e => setMensajeProgramado(e.target.value)}
                                        placeholder="Mensaje que se enviará automáticamente..."
                                        rows="4"
                                        style={{ marginTop: '8px', fontFamily: 'monospace' }}
                                    />
                                    <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                        Caracteres: {mensajeProgramado.length}
                                    </small>
                                </div>

                                <button 
                                    className="btn btn-primary"
                                    onClick={manejarProgramacion}
                                    style={{ marginTop: '15px', width: '100%' }}
                                >
                                    {editandoConfig ? '💾 Actualizar Configuración' : '⏰ Guardar Envío Programado'}
                                </button>
                                
                                {editandoConfig && (
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setEditandoConfig(false);
                                            cargarConfiguracion();
                                        }}
                                        style={{ marginTop: '10px', width: '100%' }}
                                    >
                                        ❌ Cancelar Edición
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}


                {/* DIFUSIÓN MASIVA */}
                {activeTab === 'Difusión Masiva' && (
                    <div>
                        <h3>📢 Difusión Global de Emergencia</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                            Envía un mensaje masivo a todos los clientes que se encuentran en estado **"Activo"**. El proceso corre en segundo plano y no congela el servidor.
                        </p>

                        <div style={{ 
                            background: 'rgba(239, 68, 68, 0.05)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '20px',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <div className="input-group">
                                <label className="label" style={{ color: '#fca5a5', fontWeight: 'bold' }}>⚠️ Mensaje de Difusión Masiva</label>
                                <textarea 
                                    className="input" 
                                    value={mensajeGlobal}
                                    onChange={e => setMensajeGlobal(e.target.value)}
                                    placeholder="Ingresa el comunicado de corte, cobro o advertencia para todos los clientes activos..."
                                    rows="5"
                                    style={{ marginTop: '8px', fontFamily: 'monospace', borderColor: 'rgba(239,68,68,0.2)' }}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                    Caracteres: {mensajeGlobal.length}. Recuerda usar un lenguaje claro.
                                </small>
                            </div>

                            <button 
                                className="btn"
                                onClick={manejarEnvioGlobal}
                                disabled={enviandoGlobal || connectionStatus !== 'CONNECTED'}
                                style={{ 
                                    marginTop: '20px', 
                                    width: '100%', 
                                    background: 'linear-gradient(90deg, #ef4444, #b91c1c)',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    opacity: (enviandoGlobal || connectionStatus !== 'CONNECTED') ? 0.6 : 1
                                }}
                            >
                                {connectionStatus !== 'CONNECTED' 
                                    ? '🔌 WhatsApp Desconectado (Vincula la cuenta en la pestaña Conexión QR)' 
                                    : (enviandoGlobal ? '⏳ Difundiendo en background...' : '🚀 Lanzar Difusión Masiva')
                                }
                            </button>
                        </div>

                        <div style={{ 
                            background: 'rgba(245, 158, 11, 0.05)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '15px',
                            borderRadius: '8px'
                        }}>
                            <p style={{ color: '#fde047', margin: 0, fontSize: '0.85rem' }}>
                                <strong>🚨 Doble Seguridad:</strong> Se solicitarán dos confirmaciones adicionales antes de despachar la difusión. Por favor, asegúrate de que el texto es correcto.
                            </p>
                        </div>
                    </div>
                )}


                {/* HISTORIAL */}
                {activeTab === 'Historial' && (
                    <div>
                        <h3>📋 Historial de Envíos</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                            Listado de los últimos mensajes despachados por el sistema.
                        </p>

                        {historial.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '40px',
                                color: 'var(--text-muted)'
                            }}>
                                <p style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>📭</p>
                                <p>No hay mensajes registrados en el historial</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '12px' }}>Fecha/Hora</th>
                                            <th style={{ padding: '12px' }}>Número</th>
                                            <th style={{ padding: '12px' }}>Mensaje</th>
                                            <th style={{ padding: '12px' }}>Tipo</th>
                                            <th style={{ padding: '12px' }}>Estado</th>
                                            <th style={{ padding: '12px' }}>Re-enviar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historial.map((msg, idx) => (
                                            <tr 
                                                key={idx}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                                                    {msg.fecha || 'Pendiente'}
                                                </td>
                                                <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                                                    {msg.numero}
                                                </td>
                                                <td style={{ padding: '12px', maxWidth: '300px' }}>
                                                    <span style={{ 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        display: 'block'
                                                    }}>
                                                        {msg.mensaje}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                                                    {msg.tipo === 'automatico' 
                                                        ? '⏰ Programado' 
                                                        : (msg.tipo === 'difusion_global' ? '📢 Difusión' : '📤 Manual')}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 'bold',
                                                        background: msg.estado === 'enviado' 
                                                            ? 'rgba(34, 197, 94, 0.2)' 
                                                            : (msg.estado === 'pendiente' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                                                        color: msg.estado === 'enviado' 
                                                            ? '#86efac' 
                                                            : (msg.estado === 'pendiente' ? '#fef08a' : '#fca5a5')
                                                    }}>
                                                        {msg.estado === 'enviado' 
                                                            ? '✅ Enviado' 
                                                            : (msg.estado === 'pendiente' ? '⏳ Pendiente' : '❌ Fallido')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {msg.estado === 'fallido' && (
                                                        <button 
                                                            className="btn btn-secondary"
                                                            onClick={() => manejarEnviarMensajePendiente(msg)}
                                                            style={{ 
                                                                padding: '6px 12px', 
                                                                fontSize: '0.8rem', 
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            🔄 Reintentar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}


                {/* CONEXIÓN QR */}
                {activeTab === 'Conexión QR' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <h3>🔗 Vinculación de WhatsApp Web</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '0.9rem' }}>
                            Conecta tu cuenta de WhatsApp para habilitar los envíos automatizados desde el servidor.
                        </p>

                        <div style={{
                            maxWidth: '450px',
                            margin: '0 auto',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '30px',
                            borderRadius: '16px'
                        }}>
                            {cargandoConexion ? (
                                <div style={{ padding: '40px 0' }}>
                                    <div className="spinner" style={{ margin: '0 auto 15px auto', width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    <p style={{ color: 'var(--text-muted)' }}>Cargando estado del puente...</p>
                                </div>
                            ) : (
                                <div>
                                    {connectionStatus === 'CONNECTED' && (
                                        <div style={{ padding: '20px 0' }}>
                                            <div style={{ fontSize: '4.5rem', marginBottom: '15px' }}>✅</div>
                                            <h4 style={{ color: '#4ade80', fontSize: '1.25rem', marginBottom: '10px' }}>¡WhatsApp Conectado!</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                Tu número de WhatsApp está exitosamente vinculado al servidor de Opsatel.
                                                Los envíos se despacharán de manera instantánea y silenciosa en segundo plano.
                                            </p>
                                        </div>
                                    )}

                                    {connectionStatus === 'QR_READY' && (
                                        <div>
                                            <h4 style={{ color: '#f59e0b', fontSize: '1.2rem', marginBottom: '15px' }}>Escanea el Código QR</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.4' }}>
                                                Ve a tu celular → Abre WhatsApp → <strong>Dispositivos Vinculados</strong> → <strong>Vincular dispositivo</strong>.
                                            </p>
                                            
                                            {qrCodeData ? (
                                                <div style={{ 
                                                    background: '#fff', 
                                                    padding: '15px', 
                                                    borderRadius: '12px', 
                                                    display: 'inline-block',
                                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                                                    marginBottom: '20px'
                                                }}>
                                                    <img 
                                                        src={qrCodeData} 
                                                        alt="Código QR de WhatsApp" 
                                                        style={{ width: '220px', height: '220px', display: 'block' }} 
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{
                                                    height: '220px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '12px',
                                                    marginBottom: '20px',
                                                    border: '1px dashed rgba(255,255,255,0.1)'
                                                }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Cargando imagen QR...</span>
                                                </div>
                                            )}
                                            
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                El código QR se refresca automáticamente. La sesión persistirá tras conectarse.
                                            </p>
                                        </div>
                                    )}

                                    {/* GREEN API - Configurado correctamente */}
                                    {connectionStatus === 'GREEN_API' && (
                                        <div style={{ textAlign: 'left', padding: '10px 0' }}>
                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🟢</div>
                                                <h4 style={{ color: '#4ade80', fontSize: '1.2rem', margin: 0 }}>Green API Activo</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                                                    Instancia: <code style={{ color: '#67e8f9' }}>{connectionData?.instance_id}</code>
                                                </p>
                                            </div>
                                            <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '15px', marginBottom: '15px' }}>
                                                <p style={{ color: '#86efac', fontSize: '0.9rem', margin: '0 0 8px 0' }}>
                                                    <strong>✅ El backend envía mensajes vía Green API.</strong>
                                                </p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                                                    La sesión y el QR de WhatsApp se gestionan en el panel de Green API. Si tu número se desconectó o necesitas vincular de nuevo, sigue los pasos de abajo.
                                                </p>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 'bold' }}>Para vincular / re-vincular tu número:</p>
                                            <ol style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.8', paddingLeft: '20px' }}>
                                                <li>Ve a <a href="https://console.green-api.com" target="_blank" rel="noreferrer" style={{ color: '#67e8f9' }}>console.green-api.com</a></li>
                                                <li>Selecciona tu instancia y haz clic en <strong>"Scan QR code"</strong></li>
                                                <li>Escanea el QR con tu WhatsApp desde tu celular</li>
                                                <li>Cuando el estado cambie a <strong>"Online"</strong>, los envíos funcionarán automáticamente</li>
                                            </ol>
                                        </div>
                                    )}

                                    {/* GREEN API - Sin credenciales */}
                                    {connectionStatus === 'GREEN_API_NO_CREDENTIALS' && (
                                        <div style={{ padding: '10px 0', textAlign: 'left' }}>
                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>⚙️</div>
                                                <h4 style={{ color: '#f59e0b', fontSize: '1.2rem' }}>Configurar Green API</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    El proveedor es <code>green-api</code> pero faltan las credenciales en el servidor.
                                                </p>
                                            </div>
                                            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '15px', marginBottom: '15px' }}>
                                                <p style={{ color: '#fde047', fontSize: '0.85rem', margin: '0 0 8px 0', fontWeight: 'bold' }}>Pasos para configurar:</p>
                                                <ol style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.9', paddingLeft: '20px', margin: 0 }}>
                                                    <li>Crea una cuenta gratis en <a href="https://green-api.com" target="_blank" rel="noreferrer" style={{ color: '#67e8f9' }}>green-api.com</a></li>
                                                    <li>Crea una nueva instancia y copia el <strong>Instance ID</strong> y el <strong>Token</strong></li>
                                                    <li>En Railway → Variables de entorno del backend, agrega:<br/>
                                                        <code style={{ color: '#86efac', display: 'block', marginTop: '5px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                            WHATSAPP_PROVIDER = green-api<br/>
                                                            WHATSAPP_INSTANCE_ID = tu_instance_id<br/>
                                                            WHATSAPP_TOKEN = tu_token_api
                                                        </code>
                                                    </li>
                                                    <li>Redeploy del backend en Railway</li>
                                                    <li>Escanea el QR en el panel de Green API con tu WhatsApp</li>
                                                </ol>
                                            </div>
                                        </div>
                                    )}

                                    {(connectionStatus === 'INITIALIZING' || connectionStatus === 'DISCONNECTED') && (
                                        <div style={{ padding: '20px 0' }}>
                                            <div className="spinner" style={{ margin: '0 auto 20px auto', width: '35px', height: '35px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                            <h4 style={{ color: '#f59e0b', fontSize: '1.15rem', marginBottom: '10px' }}>
                                                {connectionStatus === 'INITIALIZING' ? 'Inicializando Sesión...' : 'Sesión Desconectada'}
                                            </h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                El servidor está cargando el motor de WhatsApp Web en segundo plano. Esto puede demorar unos segundos.
                                            </p>
                                        </div>
                                    )}

                                    {connectionStatus === 'OFFLINE' && (
                                        <div style={{ padding: '20px 0' }}>
                                            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>⚠️</div>
                                            <h4 style={{ color: '#f87171', fontSize: '1.2rem', marginBottom: '10px' }}>Servidor Puente Fuera de Línea</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
                                                No se puede conectar con el microservicio en el puerto `3001`. Asegúrate de que el script de Node.js esté ejecutándose en el servidor.
                                            </p>
                                        </div>
                                    )}

                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={() => cargarEstadoConexion(true)}
                                        style={{ width: '100%', marginTop: '10px' }}
                                    >
                                        🔄 Actualizar Estado
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ADMINISTRADORES */}
                {activeTab === 'Administradores' && (
                    <div>
                        <h3>👑 Números Autorizados como Administradores</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Registra y gestiona los números de teléfono de WhatsApp que tienen permisos para ejecutar comandos especiales (Alta directa en Hoja de Ruta, consulta de caja, reportes de mora, etc.).
                        </p>

                        <div style={{ 
                            background: 'rgba(234, 179, 8, 0.05)', 
                            border: '1px solid rgba(234, 179, 8, 0.3)',
                            padding: '20px',
                            borderRadius: '8px',
                            marginBottom: '25px'
                        }}>
                            <h4 style={{ color: '#fef08a', margin: '0 0 15px 0' }}>➕ Registrar Nuevo Administrador</h4>
                            
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                                    <label className="label">Nombre / Alias del Administrador</label>
                                    <input 
                                        type="text"
                                        className="input" 
                                        value={nombreAdmin}
                                        onChange={e => setNombreAdmin(e.target.value)}
                                        placeholder="Ej: Ing. David - Gerente"
                                        style={{ marginTop: '8px' }}
                                    />
                                </div>

                                <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                                    <label className="label">Número de WhatsApp</label>
                                    <input 
                                        type="text"
                                        className="input" 
                                        value={numeroAdmin}
                                        onChange={e => setNumeroAdmin(e.target.value)}
                                        placeholder="+593982520824 o 0982520824"
                                        style={{ marginTop: '8px' }}
                                    />
                                    <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Se formateará automáticamente al código de país (593...).
                                    </small>
                                </div>

                                <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                                    <label className="label">Permiso / Rol</label>
                                    <select 
                                        className="input" 
                                        value={permisosAdmin} 
                                        onChange={e => setPermisosAdmin(e.target.value)}
                                        style={{ marginTop: '8px', height: '40px', background: '#0e1726', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0 10px' }}
                                    >
                                        <option value="admin_total">👑 Admin Total (Instalaciones, Caja, Reportes)</option>
                                        <option value="operador">🛠️ Operador (Solo Instalaciones)</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                className="btn btn-primary"
                                onClick={manejarGuardarAdministrador}
                                disabled={guardandoAdmin}
                                style={{ width: '100%', background: 'linear-gradient(90deg, #eab308, #ca8a04)', color: '#000', fontWeight: 'bold' }}
                            >
                                {guardandoAdmin ? '⏳ Guardando...' : '⭐ Registrar Número Autorizado'}
                            </button>
                        </div>

                        {/* LISTADO DE ADMINISTRADORES */}
                        <h4>📜 Administradores Registrados</h4>
                        {cargandoAdmins ? (
                            <p style={{ color: 'var(--text-muted)' }}>Cargando lista de administradores...</p>
                        ) : administradores.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                <p style={{ fontSize: '2rem', margin: 0 }}>📵</p>
                                <p style={{ marginTop: '8px' }}>No hay números administradores registrados. Agrega el primero arriba.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '12px' }}>Nombre / Alias</th>
                                            <th style={{ padding: '12px' }}>Número WhatsApp</th>
                                            <th style={{ padding: '12px' }}>Permisos</th>
                                            <th style={{ padding: '12px' }}>Estado</th>
                                            <th style={{ padding: '12px' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {administradores.map((admin) => (
                                            <tr key={admin.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px', fontWeight: 'bold' }}>
                                                    👑 {admin.nombre}
                                                </td>
                                                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#60a5fa' }}>
                                                    {admin.numero}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                                                    <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fef08a', padding: '4px 8px', borderRadius: '4px' }}>
                                                        {admin.permisos || 'admin_total'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 'bold',
                                                        background: admin.activo ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                        color: admin.activo ? '#86efac' : '#fca5a5'
                                                    }}>
                                                        {admin.activo ? '✅ Activo' : '❌ Inactivo'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        className="btn btn-secondary"
                                                        onClick={() => manejarAlternarEstadoAdmin(admin)}
                                                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                    >
                                                        {admin.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <button 
                                                        className="btn"
                                                        onClick={() => manejarEliminarAdmin(admin)}
                                                        style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#ef4444', color: '#fff' }}
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Animación de spin para el spinner de carga */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </motion.div>
    );
};

export default WhatsApp;
