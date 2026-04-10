import React, { useEffect, useState, useMemo } from 'react';
import { hojaRutaService, clienteService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const HojaRuta = () => {
    const [registros, setRegistros] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientList, setShowClientList] = useState(false);
    const [activeTab, setActiveTab] = useState('clientes'); 
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [showTecnicoSuggestions, setShowTecnicoSuggestions] = useState(false);
    const [tecnicoSearch, setTecnicoSearch] = useState('');

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
        parroquia: '',
        estado: 'Pendiente'
    };

    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [hrRes, clRes] = await Promise.all([
                hojaRutaService.listar(),
                clienteService.listar()
            ]);
            setRegistros(hrRes.data || []);
            setClientes(clRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const activatedClients = useMemo(() => {
        if (!Array.isArray(clientes)) return [];
        const term = clientSearchTerm.toLowerCase();
        return clientes
            .filter(c => {
                if (activeTab === 'clientes') {
                    return c.estado?.toUpperCase() === 'PENDIENTE' || c.estado?.toUpperCase() === 'EN ACTIVACIÓN';
                }
                return c.estado?.toUpperCase() === 'ACTIVO';
            })
            .filter(c =>
                !term ||
                c.nombre?.toLowerCase().includes(term) ||
                String(c.id).includes(term) ||
                c.parroquia?.toLowerCase().includes(term)
            )
            .sort((a, b) => a.id - b.id);
    }, [clientes, clientSearchTerm, activeTab]);

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setFormData({
            ...formData,
            cliente_id: client.id,
            nombre_cliente: client.nombre,
            ubicacion_cliente: client.ubicacion || '',
            celular_cliente: client.celular || '',
            parroquia: client.parroquia || ''
        });
        setShowClientList(false);
        setClientSearchTerm('');
    };

    const handleEdit = (r) => {
        setEditingId(r.id);
        setFormData({ ...r });
        const fullClient = clientes.find(c => c.id === r.cliente_id);
        setSelectedClient(fullClient || { nombre: r.nombre_cliente, id: r.cliente_id });
        setShowModal(true);
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
            setFormData(initialForm);
            setEditingId(null);
            setSelectedClient(null);
            fetchData();
        } catch (err) {
            alert("Error al guardar: " + (err.response?.data?.detail || "Error desconocido"));
        } finally {
            setSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData(initialForm);
        setEditingId(null);
        setSelectedClient(null);
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            await hojaRutaService.eliminar(id);
            fetchData();
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    const filteredRegistros = useMemo(() => {
        if (!Array.isArray(registros)) return [];
        const search = searchTerm.toLowerCase();
        const bySearch = registros.filter(r =>
            r.nombre_cliente?.toLowerCase().includes(search) ||
            r.tecnico?.toLowerCase().includes(search)
        );
        if (activeTab === 'clientes') {
            return bySearch.filter(r => r.cliente_id && Number(r.cliente_id) > 0);
        } else {
            return bySearch.filter(r => !r.cliente_id || Number(r.cliente_id) <= 0);
        }
    }, [registros, searchTerm, activeTab]);

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
                <div className="flex-between" style={{ marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0 }}>
                            {activeTab === 'clientes' ? '👥 Hoja de Ruta: Clientes' : '🏢 Hoja de Ruta: General'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>
                            {activeTab === 'clientes' ? 'Programación de instalaciones.' : 'Actividades técnicas generales.'}
                        </p>

                        <div className="flex-between" style={{ justifyContent: 'flex-start', marginTop: '20px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '15px', width: 'fit-content' }}>
                            <button
                                onClick={() => setActiveTab('clientes')}
                                className="btn"
                                style={{
                                    padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem',
                                    background: activeTab === 'clientes' ? 'var(--primary)' : 'transparent',
                                    color: 'white'
                                }}
                            >
                                SECCIÓN CLIENTES
                            </button>
                            <button
                                onClick={() => setActiveTab('general')}
                                className="btn"
                                style={{
                                    padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem',
                                    background: activeTab === 'general' ? 'var(--primary)' : 'transparent',
                                    color: 'white'
                                }}
                            >
                                SECCIÓN GENERAL
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-between" style={{ gap: '12px' }}>
                        <input
                            className="input"
                            placeholder="Buscar..."
                            style={{ width: '200px' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button
                            onClick={() => {
                                setFormData({ ...initialForm, cliente_id: activeTab === 'clientes' ? '' : null });
                                setShowModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            {activeTab === 'clientes' ? '+ Programar' : '+ Nueva Actividad'}
                        </button>
                    </div>
                </div>

                {loading ? <p>Cargando...</p> : (
                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '12px' }}>Fecha</th>
                                    <th>Cale/ID</th>
                                    <th>Estado</th>
                                    <th>Programación</th>
                                    <th>Técnico</th>
                                    <th>Cliente</th>
                                    <th>Ubicación</th>
                                    <th>Actividad</th>
                                    <th style={{ textAlign: 'right', paddingRight: '12px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRegistros.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                                        <td>{r.cliente_id || '-'}</td>
                                        <td>
                                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                {r.estado}
                                            </span>
                                        </td>
                                        <td>{r.fecha} <br/> <small>{r.hora}</small></td>
                                        <td>{r.tecnico}</td>
                                        <td style={{ fontWeight: 'bold' }}>{r.nombre_cliente}</td>
                                        <td style={{ fontSize: '0.7rem', opacity: 0.7 }}>{r.parroquia} <br/> {r.ubicacion_caja}</td>
                                        <td><span style={{ fontSize: '0.65rem' }}>{r.actividad}</span></td>
                                        <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                                            <button onClick={() => handleEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                                            <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ width: '100%', maxWidth: '1000px', padding: '30px', borderRadius: '24px' }}>
                            <div className="flex-between" style={{ marginBottom: '24px' }}>
                                <h2 style={{ margin: 0 }}>Ruta: {selectedClient?.nombre || 'Nueva'}</h2>
                                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <div className="modal-content-wrapper">
                                <div style={{ flex: '1', minWidth: '280px' }}>
                                    {!editingId && (
                                        <div className="input-group">
                                            <label className="label">Seleccionar Cliente</label>
                                            <button type="button" onClick={() => setShowClientList(!showClientList)} className="input" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{selectedClient ? `#${selectedClient.id} ${selectedClient.nombre}` : 'Buscar...'}</span>
                                                <span>{showClientList ? '▲' : '▼'}</span>
                                            </button>
                                            {showClientList && (
                                                <div style={{ background: '#1e1b4b', borderRadius: '8px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '300px', overflowY: 'auto' }}>
                                                    <input className="input" placeholder="Filtrar..." value={clientSearchTerm} onChange={e => setClientSearchTerm(e.target.value)} />
                                                    {activatedClients.map(c => (
                                                        <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                                            {c.id} - {c.nombre} <br/> <small>{c.parroquia}</small>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', fontSize: '0.85rem' }}>
                                        <h4 style={{ marginBottom: '12px', color: 'var(--primary)' }}>Detalles del Contrato</h4>
                                        {selectedClient ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <p><strong>Persona:</strong> {selectedClient.nombre}</p>
                                                <p><strong>Ubicación:</strong> {selectedClient.ubicacion}</p>
                                                <p><strong>Referencia:</strong> {selectedClient.direccion}</p>
                                                <p><strong>Plan:</strong> {selectedClient.plan}</p>
                                            </div>
                                        ) : <p style={{ opacity: 0.5 }}>Sin cliente seleccionado</p>}
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="responsive-grid grid-2" style={{ flex: '2' }}>
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Nombre de Referencia</label>
                                        <input className="input" value={formData.nombre_cliente} onChange={e => setFormData({ ...formData, nombre_cliente: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Fecha</label>
                                        <input className="input" type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Hora</label>
                                        <input className="input" type="time" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Técnico</label>
                                        <input className="input" value={formData.tecnico} onChange={e => setFormData({ ...formData, tecnico: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Celular</label>
                                        <input className="input" value={formData.celular_cliente} onChange={e => setFormData({ ...formData, celular_cliente: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Actividad</label>
                                        <select className="input" value={formData.actividad} onChange={e => setFormData({ ...formData, actividad: e.target.value })}>
                                            <option value="INSTALACION">INSTALACION</option>
                                            <option value="VISITA TECNICA">VISITA TECNICA</option>
                                            <option value="FOCO ROJO">FOCO ROJO</option>
                                            <option value="CAMBIO EQUIPO">CAMBIO EQUIPO</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Caja NAP</label>
                                        <input className="input" value={formData.ubicacion_caja} onChange={e => setFormData({ ...formData, ubicacion_caja: e.target.value })} />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Observaciones</label>
                                        <textarea className="input" rows="3" value={formData.observacion} onChange={e => setFormData({ ...formData, observacion: e.target.value })} />
                                    </div>
                                    
                                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
                                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                                            {submitting ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HojaRuta;
