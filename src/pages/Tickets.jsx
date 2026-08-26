import React, { useEffect, useState, useRef } from 'react';
import { ticketsService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatToDMY } from '../services/dateUtils';
import { showAlert, showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [titulo, setTitulo] = useState('');
    const contentRef = useRef(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await ticketsService.listar();
            setTickets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleSave = async () => {
        if (!titulo || !contentRef.current.innerHTML) {
            showWarning("Por favor ingrese título y contenido");
            return;
        }
        setSubmitting(true);
        try {
            await ticketsService.crear({
                titulo,
                contenido: contentRef.current.innerHTML
            });
            setShowModal(false);
            setTitulo('');
            if (contentRef.current) contentRef.current.innerHTML = '';
            showSuccess("Ticket guardado exitosamente");
            fetchTickets();
        } catch (err) {
            showError("Error al guardar ticket");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleEstado = async (id, currentEstado) => {
        const nextEstado = currentEstado === 'Pendiente' ? 'Finalizado' : 'Pendiente';
        try {
            await ticketsService.actualizar(id, { estado: nextEstado });
            fetchTickets();
        } catch (err) {
            showError("Error al actualizar estado");
        }
    };

    const handleDelete = async (id) => {
        const confirmado = await showConfirm("¿Eliminar ticket?", "¿Eliminar este ticket permanentemente?", "Sí, eliminar", "Cancelar");
        if (!confirmado) return;
        try {
            await ticketsService.eliminar(id);
            showSuccess("Ticket eliminado correctamente");
            fetchTickets();
        } catch (err) {
            showError("Error al eliminar ticket");
        }
    };

    return (
        <div className="glass-card glass" style={{ width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>Tickets de Desarrollo</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reportes de errores y sugerencias para el equipo de desarrollo.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold' }}
                >
                    + Nuevo Ticket
                </button>
            </div>

            {loading ? <p>Cargando tickets...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {tickets.map(t => (
                        <motion.div 
                            key={t.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass"
                            style={{ 
                                padding: '20px', 
                                borderRadius: '20px', 
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div 
                                    style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 'bold',
                                        background: t.estado === 'Finalizado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: t.estado === 'Finalizado' ? '#10b981' : '#f59e0b',
                                        border: `1px solid ${t.estado === 'Finalizado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => toggleEstado(t.id, t.estado)}
                                >
                                    {t.estado}
                                </div>
                                <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.6 }}>&times;</button>
                            </div>

                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{t.titulo}</h3>
                            
                            <div 
                                style={{ 
                                    fontSize: '0.9rem', 
                                    color: 'rgba(255,255,255,0.8)', 
                                    maxHeight: '200px', 
                                    overflowY: 'auto',
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '10px'
                                }}
                                className="ticket-content-preview"
                                dangerouslySetInnerHTML={{ __html: t.contenido }}
                            />

                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✍️ {t.autor}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatToDMY(t.fecha_creacion)}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(2, 6, 23, 0.95)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass" style={{ width: '100%', maxWidth: '800px', padding: '40px', borderRadius: '30px' }}>
                            <h2 style={{ marginBottom: '24px' }}>📝 Nuevo Ticket de Desarrollo</h2>
                            
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="label">Título del asunto</label>
                                <input 
                                    className="input" 
                                    placeholder="Ej: Error en el cálculo de IPTV..." 
                                    value={titulo}
                                    onChange={e => setTitulo(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Descripción Detallada del ticket (Permite Pegar Fotos Ctrl+V)</label>
                                <div 
                                    ref={contentRef}
                                    contentEditable
                                    style={{ 
                                        width: '100%', 
                                        minHeight: '300px', 
                                        maxHeight: '450px', 
                                        overflowY: 'auto',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '15px',
                                        padding: '15px',
                                        outline: 'none',
                                        color: 'white',
                                        textAlign: 'left'
                                    }}
                                    className="rich-editor"
                                    onPaste={(e) => {
                                        // Filtro opcional para asegurar que solo pegue texto e imágenes
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                                <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button onClick={handleSave} disabled={submitting} className="btn btn-primary">
                                    {submitting ? 'Guardando...' : 'Publicar Ticket'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .rich-editor img { max-width: 100%; border-radius: 10px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.1); }
                .ticket-content-preview img { max-width: 100%; height: auto; border-radius: 8px; }
                .ticket-content-preview { scrollbar-width: thin; }
            `}</style>
        </div>
    );
};

export default Tickets;
