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
            const respuesta = await whatsappService.enviarManual(numeroManual, mensajeManual);
            alert('✅ ' + respuesta.message);
            setNumeroManual('');
            setMensajeManual('');
            cargarHistorial();
        } catch (error) {
            alert('❌ Error: ' + (error.response?.data?.detail || error.message));
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
            const fechaParaEnviar = fecha ? fecha : (editandoConfig ? 'vaciar' : null);
            if (editandoConfig && configuracion?.id) {
                await whatsappService.actualizarConfiguracion(configuracion.id, hora, mensajeProgramado, fechaParaEnviar);
                alert('✅ Configuración actualizada');
            } else {
                await whatsappService.programar(hora, mensajeProgramado, true, fechaParaEnviar);
                let msg = '✅ Envío programado para las ' + hora;
                if (fecha) msg += ' el día ' + fecha;
                alert(msg);
            }
            setEditandoConfig(false);
            cargarConfiguracion();
        } catch (error) {
            alert('❌ Error: ' + (error.response?.data?.detail || error.message));
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
                                            <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>Fecha:</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#86efac', margin: 0 }}>
                                                {configuracion.fecha}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.85rem' }}>Tipo de Envío:</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#86efac', margin: 0 }}>
                                            {configuracion.fecha ? '📅 Único Programado' : '🔁 Recurrente Diario'}
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
                                        <label className="label">Fecha (Opcional)</label>
                                        <input 
                                            type="date"
                                            className="input" 
                                            value={fecha}
                                            onChange={e => setFecha(e.target.value)}
                                            style={{ marginTop: '8px' }}
                                        />
                                        <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
                                            Vacío = Se envía todos los días a esa hora
                                        </small>
                                    </div>
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historial.map((msg, idx) => (
                                            <tr 
                                                key={idx}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                                                    {msg.fecha}
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
                                                        background: msg.estado === 'enviado' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                        color: msg.estado === 'enviado' ? '#86efac' : '#fca5a5'
                                                    }}>
                                                        {msg.estado === 'enviado' ? '✅ Enviado' : '❌ Fallido'}
                                                    </span>
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
