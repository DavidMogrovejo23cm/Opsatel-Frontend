import React, { useEffect, useState, useMemo } from 'react';
import { extrasService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ExtrasGeneral = () => {
    const [extras, setExtras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [activeTab, setActiveTab] = useState('general');

    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const initialForm = {
        cod: '', nombre_cliente: '', contacto: '', proveedor: 'OPSATEL', usuario: '', contrasena: '', cuentas: '1',
        mac_smart_one: '', observaciones: '', estado: 'FIJO', valor: 0, activo: 'SI',
        ...Object.fromEntries(months.flatMap(m => {
            const l = m.toLowerCase();
            return [[`${l}_factura`, ''], [`${l}_fecha_pago`, ''], [`${l}_pago`, 0], [`${l}_banco`, ''], [`${l}_cod`, ''], [`${l}_saldo`, 0]];
        }))
    };

    const [formData, setFormData] = useState(initialForm);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await extrasService.listar();
            setExtras(res.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing) await extrasService.actualizar(currentId, formData);
            else await extrasService.crear(formData);
            setShowModal(false); fetchData();
        } catch (err) { alert("Error"); } finally { setSubmitting(false); }
    };

    const filtered = extras.filter(e => e.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) || e.cod?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
                <div>
                    <h1>Extras General</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gestión de servicios adicionales.</p>
                </div>
                <div className="flex-between" style={{ gap: '12px' }}>
                    <input className="input" placeholder="Buscar..." style={{ width: '200px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <button onClick={() => { setIsEditing(false); setFormData(initialForm); setShowModal(true); }} className="btn btn-primary">+ Nuevo</button>
                </div>
            </div>

            {loading ? <p>Cargando...</p> : (
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '12px' }}>COD</th>
                                <th>CLIENTE</th>
                                <th>VALOR</th>
                                <th>ESTADO</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(e => (
                                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>{e.cod}</td>
                                    <td style={{ fontWeight: 'bold' }}>{e.nombre_cliente}</td>
                                    <td>${parseFloat(e.valor || 0).toFixed(2)}</td>
                                    <td>{e.activo === 'SI' ? '✅' : '❌'}</td>
                                    <td>
                                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => { setIsEditing(true); setCurrentId(e.id); setFormData(e); setShowModal(true); }}>Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', borderRadius: '24px' }}>
                            <div className="flex-between" style={{ marginBottom: '20px' }}>
                                <h2>{isEditing ? 'Editar' : 'Nuevo'} Extra</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <button className={`btn ${activeTab === 'general' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('general')} style={{ borderRadius: '0', background: activeTab === 'general' ? 'var(--primary)' : 'transparent' }}>GENERAL</button>
                                <button className={`btn ${activeTab === 'pagos' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('pagos')} style={{ borderRadius: '0', background: activeTab === 'pagos' ? 'var(--primary)' : 'transparent' }}>MESES</button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {activeTab === 'general' ? (
                                    <div className="responsive-grid grid-2">
                                        <div className="input-group"><label className="label">COD</label><input className="input" value={formData.cod} onChange={e => setFormData({...formData, cod: e.target.value})} /></div>
                                        <div className="input-group"><label className="label">Cliente</label><input className="input" value={formData.nombre_cliente} onChange={e => setFormData({...formData, nombre_cliente: e.target.value})} required /></div>
                                        <div className="input-group"><label className="label">Valor</label><input type="number" step="0.01" className="input" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} /></div>
                                        <div className="input-group"><label className="label">Usuario</label><input className="input" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} /></div>
                                        <div className="input-group" style={{ gridColumn: 'span 2' }}><label className="label">Observaciones</label><textarea className="input" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} /></div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {months.map(m => (
                                            <div key={m} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px' }}>
                                                <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>{m}</h4>
                                                <div className="responsive-grid grid-3">
                                                    <div className="input-group"><label className="label">Pago</label><input type="number" className="input" value={formData[`${m.toLowerCase()}_pago`]} onChange={e => setFormData({...formData, [`${m.toLowerCase()}_pago`]: e.target.value})} /></div>
                                                    <div className="input-group"><label className="label">Fecha</label><input className="input" value={formData[`${m.toLowerCase()}_fecha_pago`]} onChange={e => setFormData({...formData, [`${m.toLowerCase()}_fecha_pago`]: e.target.value})} /></div>
                                                    <div className="input-group"><label className="label">Banco</label><input className="input" value={formData[`${m.toLowerCase()}_banco`]} onChange={e => setFormData({...formData, [`${m.toLowerCase()}_banco`]: e.target.value})} /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '...' : 'Guardar'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ExtrasGeneral;
