import React, { useEffect, useState, useRef } from 'react';
import { ticketsService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

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
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchTickets(); }, []);

    const handleSave = async () => {
        if (!titulo || !contentRef.current.innerHTML) { alert("Complete todos los campos"); return; }
        setSubmitting(true);
        try {
            await ticketsService.crear({ titulo, contenido: contentRef.current.innerHTML });
            setShowModal(false); setTitulo(''); fetchTickets();
        } catch (err) { alert("Error"); } finally { setSubmitting(false); }
    };

    const toggleEstado = async (id, currentEstado) => {
        try {
            await ticketsService.actualizar(id, { estado: currentEstado === 'Pendiente' ? 'Finalizado' : 'Pendiente' });
            fetchTickets();
        } catch (err) { alert("Error"); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
            <div className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1>Tickets Dev</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reportes de errores y sugerencias.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Nuevo Ticket</button>
            </div>

            {loading ? <p>Cargando...</p> : (
                <div className="responsive-grid grid-2" style={{ gap: '20px' }}>
                    {tickets.map(t => (
                        <div key={t.id} className="glass" style={{ padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="flex-between">
                                <span 
                                    onClick={() => toggleEstado(t.id, t.estado)}
                                    style={{ 
                                        padding: '4px 10px', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
                                        background: t.estado === 'Finalizado' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                        color: t.estado === 'Finalizado' ? '#10b981' : '#f59e0b'
                                    }}
                                >
                                    {t.estado}
                                </span>
                                <small style={{ color: 'var(--text-muted)' }}>{new Date(t.fecha_creacion).toLocaleDateString()}</small>
                            </div>
                            <h3 style={{ margin: 0 }}>{t.titulo}</h3>
                            <div 
                                style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.85rem', opacity: 0.8, padding: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }} 
                                dangerouslySetInnerHTML={{ __html: t.contenido }} 
                            />
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ width: '100%', maxWidth: '600px', padding: '30px', borderRadius: '24px' }}>
                            <h2 style={{ marginBottom: '20px' }}>Nuevo Ticket</h2>
                            <div className="input-group">
                                <label className="label">Título</label>
                                <input className="input" value={titulo} onChange={e => setTitulo(e.target.value)} />
                            </div>
                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label className="label">Descripción</label>
                                <div 
                                    ref={contentRef} 
                                    contentEditable 
                                    style={{ minHeight: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', outline: 'none' }} 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>Publicar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Tickets;
