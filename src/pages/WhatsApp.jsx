import React, { useState, useEffect } from 'react';
import { whatsappService } from '../services/whatsappService';
import { motion } from 'framer-motion';

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
    
    // Historial
    const [historial, setHistorial] = useState([]);

    useEffect(() => {
        cargarConfiguracion();
        cargarHistorial();
        // Recargar historial cada 30 segundos
        const intervalo = setInterval(cargarHistorial, 30000);
        return () => clearInterval(intervalo);
    }, []);

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
            alert('⚠️ Ingresa número y mensaje');
            return;
        }

        setEnviando(true);
        try {
            // Limpiar y formatear número para el enlace directo de WhatsApp Web
            let numero_limpio = numeroManual.replace(/[^0-9]/g, '');
            if (numero_limpio.length > 0) {
                if (numero_limpio.startsWith('0')) {
                    numero_limpio = '593' + numero_limpio.substring(1);
                } else if (!numero_limpio.startsWith('593') && numero_limpio.length === 9) {
                    numero_limpio = '593' + numero_limpio;
                }
                
                // Abrir pestaña en el navegador del usuario para enviar el mensaje real
                window.open(`https://web.whatsapp.com/send?phone=${numero_limpio}&text=${encodeURIComponent(mensajeManual)}`, '_blank');
            }

            // Registrar en historial del servidor
            const respuesta = await whatsappService.enviarManual(numeroManual, mensajeManual);
            alert('✅ Mensaje registrado e intentando enviar por WhatsApp Web');
            setNumeroManual('');
            setMensajeManual('');
            cargarHistorial();
        } catch (error) {
            alert('❌ Error al registrar en servidor: ' + (error.response?.data?.detail || error.message));
        } finally {
            setEnviando(false);
        }
    };

    const manejarProgramacion = async () => {
        if (!hora || !mensajeProgramado.trim()) {
            alert('⚠️ Ingresa hora y mensaje');
            return;
        }

        try {
            const fechaParaEnviar = (recurrencia === 'unico' || recurrencia === 'mensual') ? fecha : (editandoConfig ? 'vaciar' : null);
            if (editandoConfig && configuracion?.id) {
                await whatsappService.actualizarConfiguracion(configuracion.id, hora, mensajeProgramado, fechaParaEnviar, recurrencia);
                alert('✅ Configuración actualizada');
            } else {
                await whatsappService.programar(hora, mensajeProgramado, true, fechaParaEnviar, recurrencia);
                let msg = '✅ Envío programado para las ' + hora;
                if (recurrencia === 'unico' && fecha) msg += ' el día ' + fecha;
                if (recurrencia === 'mensual' && fecha) msg += ' el día ' + new Date(fecha + 'T00:00:00').getDate() + ' de cada mes';
                alert(msg);
            }
            setEditandoConfig(false);
            cargarConfiguracion();
        } catch (error) {
            alert('❌ Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const manejarEnviarMensajePendiente = async (msg) => {
        let numero_limpio = msg.numero.replace(/[^0-9]/g, '');
        if (numero_limpio.startsWith('0')) {
            numero_limpio = '593' + numero_limpio.substring(1);
        } else if (!numero_limpio.startsWith('593') && numero_limpio.length === 9) {
            numero_limpio = '593' + numero_limpio;
        }
        
        // Abrir pestaña en el navegador
        window.open(`https://web.whatsapp.com/send?phone=${numero_limpio}&text=${encodeURIComponent(msg.mensaje)}`, '_blank');
        
        try {
            await whatsappService.marcarEnviado(msg.id);
            alert('✅ Mensaje marcado como enviado en el historial');
            cargarHistorial();
        } catch (error) {
            console.error("Error al marcar mensaje como enviado:", error);
        }
    };

    const manejarEliminarConfiguracion = async () => {
        if (!window.confirm('¿Estás seguro de eliminar la programación?')) return;

        try {
            if (configuracion?.id) {
                await whatsappService.eliminarConfiguracion(configuracion.id);
                alert('✅ Programación eliminada');
                setConfiguracion(null);
                setHora('');
                setFecha('');
                setMensajeProgramado('');
            }
        } catch (error) {
            alert('❌ Error: ' + (error.response?.data?.detail || error.message));
        }
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
                    <h1 style={{ background: 'linear-gradient(90deg, #06b6d4, #06d4af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        📱 Centro de WhatsApp
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        Envía mensajes automáticos y programados a todos tus clientes
                    </p>
                </div>
            </div>

            <div className="page-actions" style={{ gap: '10px', marginBottom: '20px' }}>
                {['Envío Manual', 'Envío Programado', 'Historial'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ padding: '8px 16px' }}
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
                            Envía un mensaje de WhatsApp a un número específico. Se abrirá Chrome automáticamente.
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
                                    placeholder="+593999999999 o 999999999"
                                    style={{ marginTop: '8px' }}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                    Incluye código de país (+593) o solo el número sin 0
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
                                disabled={enviando}
                                style={{ marginTop: '15px', width: '100%', opacity: enviando ? 0.6 : 1 }}
                            >
                                {enviando ? '⏳ Enviando...' : '✉️ Enviar Mensaje'}
                            </button>
                        </div>

                        <div style={{ 
                            background: 'rgba(59, 130, 246, 0.05)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            padding: '15px',
                            borderRadius: '8px'
                        }}>
                            <p style={{ color: '#93c5fd', margin: 0, fontSize: '0.9rem' }}>
                                <strong>ℹ️ Importante:</strong> Se abrirá Chrome automáticamente. Debes tener WhatsApp Web abierto y escaneado en el navegador.
                            </p>
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
                                <h4 style={{ color: '#86efac', margin: '0 0 15px 0' }}>✅ Envío Programado</h4>
                                
                                <div style={{ display: 'flex', gap: '30px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>Hora:</p>
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
                                    <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>Mensaje:</p>
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
                                            Hora en zona horaria de Ecuador (GMT-5)
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
                                            ¿Cada cuánto se enviará este mensaje?
                                        </small>
                                    </div>

                                    {(recurrencia === 'unico' || recurrencia === 'mensual') && (
                                        <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                                            <label className="label">
                                                {recurrencia === 'mensual' ? 'Día base para mes (Elige fecha)' : 'Fecha de envío'}
                                            </label>
                                            <input 
                                                type="date"
                                                className="input" 
                                                value={fecha}
                                                onChange={e => setFecha(e.target.value)}
                                                style={{ marginTop: '8px' }}
                                            />
                                            <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                                {recurrencia === 'mensual' ? 'El día de la fecha elegida se repetirá todos los meses (ej: el 15)' : 'Fecha exacta del envío.'}
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
                                        Se enviará a todos los clientes con celular registrado. Caracteres: {mensajeProgramado.length}
                                    </small>
                                </div>

                                <button 
                                    className="btn btn-primary"
                                    onClick={manejarProgramacion}
                                    style={{ marginTop: '15px', width: '100%' }}
                                >
                                    {editandoConfig ? '💾 Actualizar' : '⏰ Programar Envío'}
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
                                        ❌ Cancelar
                                    </button>
                                )}
                            </div>
                        )}

                        <div style={{ 
                            background: 'rgba(251, 146, 60, 0.05)',
                            border: '1px solid rgba(251, 146, 60, 0.3)',
                            padding: '15px',
                            borderRadius: '8px'
                        }}>
                            <p style={{ color: '#fed7aa', margin: 0, fontSize: '0.9rem' }}>
                                <strong>⚠️ Nota:</strong> El sistema verificará la hora cada minuto. Chrome debe estar abierto con WhatsApp Web sincronizado.
                            </p>
                        </div>
                    </div>
                )}

                {/* HISTORIAL */}
                {activeTab === 'Historial' && (
                    <div>
                        <h3>📋 Historial de Mensajes</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                            Últimos {historial.length} mensajes enviados
                        </p>

                        {historial.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '40px',
                                color: 'var(--text-muted)'
                            }}>
                                <p style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>📭</p>
                                <p>No hay mensajes en el historial</p>
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
                                            <th style={{ padding: '12px' }}>Acciones</th>
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
                                                    {msg.tipo === 'automatico' ? '⏰ Automático' : '📤 Manual'}
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
                                                    {msg.estado === 'pendiente' && (
                                                        <button 
                                                            className="btn btn-primary"
                                                            onClick={() => manejarEnviarMensajePendiente(msg)}
                                                            style={{ 
                                                                padding: '6px 12px', 
                                                                fontSize: '0.8rem', 
                                                                background: 'linear-gradient(90deg, #eab308, #ca8a04)',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold',
                                                                color: '#000'
                                                            }}
                                                        >
                                                            ⚡ Enviar
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
            </div>
        </motion.div>
    );
};

export default WhatsApp;
