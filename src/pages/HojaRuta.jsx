import React, { useEffect, useState, useMemo } from 'react';
import { hojaRutaService, clienteService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const HojaRuta = () => {
    const [registros, setRegistros] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showObsModal, setShowObsModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientList, setShowClientList] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [modalSource, setModalSource] = useState('CLIENTE'); // 'CLIENTE' o 'GENERAL'
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    const initialForm = {
        fecha: new Date().toISOString().split('T')[0],
        tecnico: '',
        hora: '',
        cliente_id: '',
        nombre_cliente: '',
        ubicacion_cliente: '',
        celular_cliente: '',
        ubicacion_caja: '',
        actividad: 'INSTALACION',
        observacion: '',
        observacion_tecnico: '',
        parroquia: '',
        estado: 'Pendiente'
    };

    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [hrRes, clRes] = await Promise.all([
                hojaRutaService.listar(),
                clienteService.listar()
            ]);
            setRegistros(hrRes.data || []);
            setClientes(clRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Auto-refresh cada 30 segundos
    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const activatedClients = useMemo(() => {
        if (!Array.isArray(clientes)) return [];
        const term = clientSearchTerm.toLowerCase();
        return clientes
            .filter(c => {
                if (modalSource === 'CLIENTE') return c.estado?.toUpperCase() !== 'ACTIVO';
                return c.estado?.toUpperCase() === 'ACTIVO';
            })
            .filter(c =>
                !term ||
                c.nombre?.toLowerCase().includes(term) ||
                String(c.id).includes(term) ||
                c.parroquia?.toLowerCase().includes(term)
            )
            .sort((a, b) => a.id - b.id);
    }, [clientes, clientSearchTerm, modalSource]);

    const sortedRegistros = useMemo(() => {
        if (!Array.isArray(registros)) return [];
        const search = searchTerm.toLowerCase();
        
        let filtered = registros.filter(r =>
            r.nombre_cliente?.toLowerCase().includes(search) ||
            r.tecnico?.toLowerCase().includes(search) ||
            r.parroquia?.toLowerCase().includes(search)
        );

        // Ordenamiento: 1. Fecha Pedido (created_at desc), 2. Fecha Programacion (fecha), 3. Hora (hora)
        return filtered.sort((a, b) => {
            // Primero por fecha de creación (pedido)
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            if (dateA !== dateB) return dateB - dateA;

            // Luego por fecha programada
            if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);

            // Luego por hora
            return a.hora.localeCompare(b.hora);
        });
    }, [registros, searchTerm]);

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setFormData({
            ...formData,
            cliente_id: client.id,
            nombre_cliente: client.nombre,
            ubicacion_cliente: client.ubicacion || client.direccion || '',
            celular_cliente: client.celular || '',
            parroquia: client.parroquia || '',
            actividad: modalSource === 'CLIENTE' ? 'INSTALACION' : 'ACTIVIDAD'
        });
        setShowClientList(false);
        setClientSearchTerm('');
    };

    const handleOpenModal = (source) => {
        setModalSource(source);
        setFormData({ 
            ...initialForm, 
            actividad: source === 'CLIENTE' ? 'INSTALACION' : 'ACTIVIDAD' 
        });
        setEditingId(null);
        setSelectedClient(null);
        setShowModal(true);
    };

    const handleEdit = (r) => {
        setEditingId(r.id);
        setFormData({ ...r });
        const fullClient = clientes.find(c => c.id === r.cliente_id);
        setSelectedClient(fullClient || { nombre: r.nombre_cliente, id: r.cliente_id });
        setModalSource(r.cliente_id ? 'CLIENTE' : 'GENERAL');
        setShowModal(true);
    };

    const handleOpenObs = (r) => {
        setEditingId(r.id);
        setFormData({ ...r });
        setShowObsModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await hojaRutaService.actualizar(editingId, formData);
            } else {
                await hojaRutaService.crear(formData);
            }
            setShowModal(false);
            setShowObsModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || "Error al procesar");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleEstado = async (id, currentEstado) => {
        if (user.rol?.toLowerCase() !== 'administrador') {
            alert("Solo el administrador puede cambiar el estado de la hoja de ruta");
            return;
        }
        const nextEstado = currentEstado === 'Pendiente' ? 'Realizado' : 'Pendiente';
        try {
            await hojaRutaService.actualizar(id, { estado: nextEstado });
            fetchData(true);
        } catch (err) {
            alert("Error al actualizar estado");
        }
    };

    const handleDelete = async (id) => {
        if (user.rol?.toLowerCase() !== 'administrador') {
            alert("Solo el administrador puede eliminar registros");
            return;
        }
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            await hojaRutaService.eliminar(id);
            fetchData();
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: '900', margin: 0, color: '#a78bfa' }}>
                            📋 Hoja de Ruta Unificada
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '5px' }}>
                            Gestión centralizada de instalaciones y actividades técnicas.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <input
                            className="input"
                            placeholder="Buscar técnico, cliente o zona..."
                            style={{ width: '300px', marginBottom: 0, borderRadius: '15px' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button onClick={() => handleOpenModal('CLIENTE')} className="btn btn-primary" style={{ padding: '12px 20px' }}>
                            + Programar Instalación
                        </button>
                        <button onClick={() => handleOpenModal('GENERAL')} className="btn btn-secondary" style={{ padding: '12px 20px', border: '1px solid #7e22ce', color: '#a78bfa' }}>
                            + Nueva Actividad
                        </button>
                    </div>
                </div>

                {loading ? <p>Cargando datos...</p> : (
                    <div style={{ overflowX: 'auto', borderRadius: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem', textAlign: 'left', opacity: 0.8 }}>
                                    <th style={{ padding: '15px' }}>F. Pedido</th>
                                    <th>Programación</th>
                                    <th>Estado / Acciones</th>
                                    <th>Técnico</th>
                                    <th>Cliente / Descripción</th>
                                    <th>Ubicación</th>
                                    <th>Actividad</th>
                                    <th>Observaciones</th>
                                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRegistros.map(r => (
                                    <tr key={r.id} className="glass-row" style={{ background: 'rgba(255,255,255,0.02)', transition: '0.2s' }}>
                                        <td style={{ padding: '15px', borderRadius: '12px 0 0 12px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '0.8rem' }}>
                                                {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{r.fecha}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.hora}</div>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => toggleEstado(r.id, r.estado)}
                                                className={`status-chip ${r.estado === 'Realizado' ? 'success' : 'pending'}`}
                                                disabled={user.rol?.toLowerCase() !== 'administrador'}
                                                style={{ cursor: user.rol?.toLowerCase() === 'administrador' ? 'pointer' : 'default' }}
                                            >
                                                {r.estado}
                                            </button>
                                        </td>
                                        <td style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>{r.tecnico}</td>
                                        <td>
                                            <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{r.nombre_cliente}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.celular_cliente}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.75rem' }}>{r.parroquia}</div>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{r.ubicacion_cliente}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                {r.actividad}
                                            </span>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '10px' }}>
                                            <div className="preserve-breaks" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '250px' }}>
                                                {r.observacion || 'Sin observación'}
                                            </div>
                                            {r.observacion_tecnico && (
                                                <div className="preserve-breaks" style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '5px', padding: '5px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px' }}>
                                                    <strong>⚙️ Técnico:</strong> {r.observacion_tecnico}
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => handleOpenObs(r)}
                                                style={{ fontSize: '0.65rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' }}
                                            >
                                                {user.rol?.toLowerCase() === 'tecnico' ? '✎ Editar Obs. Técnica' : '👁 Ver Obs. Técnica'}
                                            </button>
                                        </td>
                                        <td style={{ borderRadius: '0 12px 12px 0', textAlign: 'right', paddingRight: '20px' }}>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleEdit(r)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '1.1rem' }} title="Editar">✏️</button>
                                                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.2rem' }} title="Eliminar">&times;</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* MODAL PRINCIPAL */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content glass">
                            <div className="modal-header">
                                <h2>{editingId ? '✏️ Editar Registro' : (modalSource === 'CLIENTE' ? '🚀 Programar Instalación' : '⚙️ Nueva Actividad')}</h2>
                                <button onClick={() => setShowModal(false)} className="close-btn">&times;</button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-grid">
                                <div className="modal-side">
                                    {!editingId && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <label className="label">Seleccionar Cliente ({modalSource})</label>
                                            <button type="button" onClick={() => setShowClientList(!showClientList)} className="input" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                                                {selectedClient ? selectedClient.nombre : '🔍 Buscar...'}
                                                <span>{showClientList ? '▲' : '▼'}</span>
                                            </button>
                                            {showClientList && (
                                                <div className="client-picker glass">
                                                    <input className="input" placeholder="Nombre o ID..." value={clientSearchTerm} onChange={e => setClientSearchTerm(e.target.value)} />
                                                    <div className="client-list">
                                                        {activatedClients.map(c => (
                                                            <div key={c.id} className="client-item" onClick={() => handleSelectClient(c)}>
                                                                #{c.id} - {c.nombre}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="client-info glass">
                                        <h4>Datos seleccionados</h4>
                                        <p><strong>Nombre:</strong> {formData.nombre_cliente || '-'}</p>
                                        <p><strong>Parroquia:</strong> {formData.parroquia || '-'}</p>
                                        <p><strong>Ubicación:</strong> {formData.ubicacion_cliente || '-'}</p>
                                        <p><strong>Celular:</strong> {formData.celular_cliente || '-'}</p>
                                    </div>
                                </div>
                                <div className="modal-form-fields">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="input-group">
                                            <label className="label">Fecha</label>
                                            <input type="date" className="input" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="label">Hora</label>
                                            <input type="time" className="input" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} required />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Técnico Responsable</label>
                                        <input className="input" value={formData.tecnico} onChange={e => setFormData({...formData, tecnico: e.target.value})} placeholder="Nombre del técnico" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Actividad</label>
                                        <input className="input" value={formData.actividad} onChange={e => setFormData({...formData, actividad: e.target.value.toUpperCase()})} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Observaciones Generales</label>
                                        <textarea className="input" rows="4" value={formData.observacion} onChange={e => setFormData({...formData, observacion: e.target.value})} placeholder="Detalles del pedido..."></textarea>
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                                            {submitting ? 'Guardando...' : 'Confirmar'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL OBSERVACIÓN TÉCNICA */}
            <AnimatePresence>
                {showObsModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content glass" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h2>⚙️ Observación Técnica</h2>
                                <button onClick={() => setShowObsModal(false)} className="close-btn">&times;</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <label className="label">Actividades Realizadas por el Técnico</label>
                                    <textarea 
                                        className="input" 
                                        rows="10" 
                                        value={formData.observacion_tecnico} 
                                        onChange={e => setFormData({...formData, observacion_tecnico: e.target.value})}
                                        disabled={user.rol?.toLowerCase() !== 'tecnico' && user.rol?.toLowerCase() !== 'administrador'}
                                        placeholder="El técnico debe escribir aquí lo realizado..."
                                        style={{ height: '200px' }}
                                    ></textarea>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowObsModal(false)} className="btn btn-secondary">Cerrar</button>
                                    {(user.rol?.toLowerCase() === 'tecnico' || user.rol?.toLowerCase() === 'administrador') && (
                                        <button type="submit" className="btn btn-primary" disabled={submitting}>Guardar</button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .status-chip { border: 1px solid; padding: 4px 12px; borderRadius: 20px; font-size: 0.65rem; font-weight: 800; transition: 0.3s; }
                .status-chip.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
                .status-chip.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justifyContent: center; padding: 20px; }
                .modal-content { width: 100%; maxWidth: 900px; padding: 40px; border-radius: 20px; maxHeight: 90vh; overflowY: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .modal-grid { display: grid; grid-template-columns: 300px 1fr; gap: 30px; }
                .client-info { padding: 20px; font-size: 0.8rem; }
                .client-info h4 { margin-top: 0; margin-bottom: 15px; color: #a78bfa; }
                .client-info p { margin: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .client-picker { position: relative; }
                .client-list { position: absolute; top: 100%; left: 0; right: 0; background: #1e1b4b; border-radius: 10px; z-index: 100; max-height: 200px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); }
                .client-item { padding: 10px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; }
                .client-item:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </>
    );
};

export default HojaRuta;
