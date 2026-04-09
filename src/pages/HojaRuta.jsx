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
    const [activeTab, setActiveTab] = useState('clientes'); // 'clientes' o 'general'

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

    const filteredRegistros = useMemo(() => {
        if (!Array.isArray(registros)) return [];
        
        const search = searchTerm.toLowerCase();
        let filtered = registros.filter(r => 
            (r.nombre_cliente?.toLowerCase().includes(search) ||
            r.tecnico?.toLowerCase().includes(search))
        );

        if (activeTab === 'clientes') {
            // Un registro es de 'cliente' si tiene un ID válido mayor a 0
            return filtered.filter(r => r.cliente_id && Number(r.cliente_id) > 0);
        } else {
            // Un registro es 'general' si no tiene cliente_id, o es 0/null/vacío
            return filtered.filter(r => !r.cliente_id || Number(r.cliente_id) <= 0);
        }
    }, [registros, searchTerm, activeTab]);

    const pendingClients = useMemo(() => {
        if (!Array.isArray(clientes)) return [];
        return clientes
            .filter(c => c.estado?.toUpperCase() === 'PENDIENTE' || c.estado?.toUpperCase() === 'EN ACTIVACIÓN')
            .sort((a, b) => a.id - b.id);
    }, [clientes]);

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

    const toggleEstado = async (id, currentEstado) => {
        const nextEstado = currentEstado === 'Pendiente' ? 'Realizado' : 'Pendiente';
        try {
            await hojaRutaService.actualizar(id, { estado: nextEstado });
            fetchData();
        } catch (err) {
            alert("Error al actualizar estado");
        }
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

    const filteredRegistros = Array.isArray(registros) 
        ? registros.filter(r => 
            r.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.tecnico?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: '900', margin: 0, color: activeTab === 'clientes' ? '#a78bfa' : '#c084fc' }}>
                            {activeTab === 'clientes' ? '👥 Hoja de Ruta: Clientes' : '🏢 Hoja de Ruta: General'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '5px' }}>
                            {activeTab === 'clientes' 
                                ? 'Gestión y programación de instalaciones para clientes registrados en el sistema.' 
                                : 'Actividades técnicas generales y soporte para terceros o registros externos.'}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '5px', marginTop: '20px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '15px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button 
                                onClick={() => setActiveTab('clientes')}
                                style={{ 
                                    padding: '10px 24px', 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    fontWeight: '900',
                                    fontSize: '0.75rem',
                                    background: activeTab === 'clientes' ? '#7e22ce' : 'transparent',
                                    color: activeTab === 'clientes' ? 'white' : '#94a3b8',
                                    transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                SECCIÓN CLIENTES
                            </button>
                            <button 
                                onClick={() => setActiveTab('general')}
                                style={{ 
                                    padding: '10px 24px', 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    fontWeight: '900',
                                    fontSize: '0.75rem',
                                    background: activeTab === 'general' ? '#7e22ce' : 'transparent',
                                    color: activeTab === 'general' ? 'white' : '#94a3b8',
                                    transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                SECCIÓN GENERAL
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <input
                            className="input"
                            placeholder="Buscar en esta sección..."
                            style={{ width: '300px', marginBottom: 0, borderRadius: '15px', background: 'rgba(255,255,255,0.02)' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button 
                            onClick={() => {
                                setFormData({
                                    ...initialForm,
                                    cliente_id: activeTab === 'clientes' ? '' : null
                                });
                                setShowModal(true);
                            }}
                            style={{ 
                                padding: '12px 28px', 
                                borderRadius: '15px', 
                                background: '#7e22ce', 
                                color: 'white', 
                                border: 'none', 
                                fontWeight: '900', 
                                cursor: 'pointer', 
                                boxShadow: '0 8px 30px rgba(126, 34, 206, 0.25)',
                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {activeTab === 'clientes' ? '+ Programar Instalación' : '+ Nueva Actividad General'}
                        </button>
                    </div>
                </div>

                {loading ? <p>Cargando hoja de ruta...</p> : (
                    <div style={{ overflowX: 'auto', borderRadius: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem', textAlign: 'left', letterSpacing: '0.1em', opacity: 0.8 }}>
                                    <th style={{ padding: '15px', width: '110px' }}>Fecha Pedido</th>
                                    <th style={{ width: '80px' }}>{activeTab === 'clientes' ? 'ID Cliente' : 'Ref #'}</th>
                                    <th style={{ width: '100px' }}>Estado</th>
                                    <th style={{ width: '140px' }}>Programación</th>
                                    <th style={{ width: '130px' }}>Técnico</th>
                                    <th style={{ width: '240px' }}>{activeTab === 'clientes' ? 'Cliente' : 'Personal / Externo'}</th>
                                    <th style={{ width: '180px' }}>Ubicación / Zona</th>
                                    <th style={{ width: '110px' }}>Caja / Nap</th>
                                    <th style={{ width: '140px' }}>Tipo Actividad</th>
                                    <th style={{ minWidth: '220px' }}>Detalle / Observación</th>
                                    <th style={{ textAlign: 'right', paddingRight: '20px', width: '80px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRegistros.map(r => (
                                    <tr key={r.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', transition: 'transform 0.2s' }}>
                                        <td style={{ padding: '12px 15px', borderRadius: '12px 0 0 12px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '0.8rem' }}>
                                                {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {r.cliente_id}
                                        </td>
                                        <td style={{ padding: '12px 5px' }}>
                                            <div 
                                                style={{ 
                                                    padding: '3px 10px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.6rem', 
                                                    fontWeight: 'bold', 
                                                    cursor: 'default',
                                                    display: 'inline-block',
                                                    whiteSpace: 'nowrap',
                                                    background: r.estado === 'Realizado' ? 'rgba(167, 139, 250, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                                    color: r.estado === 'Realizado' ? '#c084fc' : '#94a3b8',
                                                    border: `1px solid ${r.estado === 'Realizado' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
                                                }}
                                            >
                                                {r.estado}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 5px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{r.fecha}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.hora}</div>
                                        </td>
                                        <td style={{ padding: '12px 5px', fontWeight: 'bold', color: '#fff', fontSize: '0.8rem' }}>
                                            {r.tecnico || '-'}
                                        </td>
                                        <td style={{ padding: '12px 5px' }}>
                                            <div style={{ fontWeight: '800', fontSize: '0.8rem', color: '#fff', maxWidth: '210px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre_cliente}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.celular_cliente}</div>
                                        </td>
                                        <td style={{ padding: '12px 5px' }}>
                                            <div style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>{r.parroquia}</div>
                                            <div style={{ opacity: 0.6, fontSize: '0.65rem', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.ubicacion_cliente}</div>
                                        </td>
                                        <td style={{ padding: '12px 5px', fontSize: '0.8rem', color: '#60a5fa', fontWeight: 'bold' }}>{r.ubicacion_caja || '-'}</td>
                                        <td style={{ padding: '12px 5px' }}>
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
                                                {r.actividad}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 5px', fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '200px', whiteSpace: 'pre-wrap' }}>
                                            {r.observacion || '-'}
                                        </td>
                                        <td style={{ borderRadius: '0 12px 12px 0', textAlign: 'right', paddingRight: '20px' }}>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleEdit(r)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '1rem', opacity: 0.8 }} title="Editar">✏️</button>
                                                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1rem', opacity: 0.8 }} title="Eliminar">&times;</button>
                                            </div>
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
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(2, 6, 23, 0.9)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass" style={{ width: '100%', maxWidth: '1000px', padding: '40px', borderRadius: '30px', maxHeight: '95vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {editingId ? '✏️ Editar Ruta' : (activeTab === 'clientes' ? '📝 Nueva Ruta (Cliente)' : '🏢 Nueva Ruta General')}
                                </h2>
                                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
                                {/* PANEL IZQUIERDO: SELECCIÓN E INFO */}
                                <div>
                                    {!editingId && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <label className="label">Seleccionar Cliente</label>
                                            <button 
                                                type="button"
                                                onClick={() => setShowClientList(!showClientList)}
                                                className="btn btn-secondary"
                                                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}
                                            >
                                                <span>{selectedClient ? selectedClient.nombre : '🔍 Buscar Cliente...'}</span>
                                                <span>{showClientList ? '▲' : '▼'}</span>
                                            </button>

                                            {showClientList && (
                                                <div style={{ background: 'rgba(15, 23, 42, 0.98)', borderRadius: '10px', marginTop: '10px', border: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: '300px' }}>
                                                     <div style={{ padding: '8px 15px', background: '#1e293b', fontSize: '0.7rem', color: '#818cf8', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                        🚩 PENDIENTES DE ACTIVACIÓN
                                                    </div>
                                                    {pendingClients.map(c => (
                                                        <div 
                                                            key={c.id} 
                                                            onClick={() => handleSelectClient(c)}
                                                            style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                            className="client-search-item"
                                                        >
                                                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{c.nombre}</div>
                                                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>ID: {c.id} | {c.parroquia}</div>
                                                        </div>
                                                    ))}
                                                    {pendingClients.length === 0 && <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>No hay pendientes</div>}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* CUADRO DE INFORMACIÓN DEL CLIENTE (CONTRACT DATA) */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px' }}>
                                        <h3 style={{ fontSize: '0.8rem', color: '#818cf8', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>Datos del Contrato</h3>
                                        {selectedClient ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Nombre</label>
                                                    <div style={{ fontSize: '0.85rem' }}>{selectedClient.nombre}</div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>ID Cliente</label>
                                                        <div style={{ fontSize: '0.85rem' }}>{selectedClient.id}</div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Celular</label>
                                                        <div style={{ fontSize: '0.85rem' }}>{selectedClient.celular}</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Plan</label>
                                                    <div style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 'bold' }}>{selectedClient.plan}</div>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ubicación</label>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{selectedClient.ubicacion}</div>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Dirección</label>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{selectedClient.direccion}</div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Nodo</label>
                                                        <div style={{ fontSize: '0.85rem' }}>{selectedClient.nodo}</div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Contrato</label>
                                                        <div style={{ fontSize: '0.85rem' }}>{selectedClient.tiempo} meses</div>
                                                    </div>
                                                </div>
                                                {selectedClient.comentarios && (
                                                    <div>
                                                        <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Comentarios Contrato</label>
                                                        <div style={{ fontSize: '0.75rem', color: '#fcd34d', fontStyle: 'italic' }}>{selectedClient.comentarios}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.3 }}>
                                                <div style={{ fontSize: '2rem' }}>👤</div>
                                                <p style={{ fontSize: '0.7rem' }}>Seleccione un cliente para ver sus detalles</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* FORMULARIO DE PROGRAMACIÓN */}
                                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Nombre de la Persona / Cliente</label>
                                        <input 
                                            className="input" 
                                            placeholder="Ingrese nombre completo..." 
                                            value={formData.nombre_cliente} 
                                            onChange={e => setFormData({...formData, nombre_cliente: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Fecha Programación</label>
                                        <input className="input" type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Hora Programación</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input className="input" type="time" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} required />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Técnico Responsable</label>
                                        <input className="input" placeholder="Nombre del técnico" value={formData.tecnico} onChange={e => setFormData({...formData, tecnico: e.target.value})} required />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Actividad Celular de Contacto</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <select 
                                                className="input" 
                                                value={['INSTALACION', 'VISITA TECNICA', 'FOCO ROJO', 'CAMBIO EQUIPO'].includes(formData.actividad) ? formData.actividad : 'OTRO'} 
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setFormData({...formData, actividad: val === 'OTRO' ? '' : val});
                                                }} 
                                                style={{ background: '#1e293b' }}
                                            >
                                                <option value="INSTALACION">INSTALACION</option>
                                                <option value="VISITA TECNICA">VISITA TECNICA</option>
                                                <option value="FOCO ROJO">FOCO ROJO</option>
                                                <option value="CAMBIO EQUIPO">CAMBIO EQUIPO</option>
                                                <option value="OTRO">OTRO (Manual)</option>
                                            </select>
                                            <input className="input" placeholder="Celular" value={formData.celular_cliente} onChange={e => setFormData({...formData, celular_cliente: e.target.value})} />
                                        </div>
                                    </div>
                                    {!['INSTALACION', 'VISITA TECNICA', 'FOCO ROJO', 'CAMBIO EQUIPO'].includes(formData.actividad) && (
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="label">Especificar Actividad</label>
                                            <input 
                                                className="input" 
                                                placeholder="Describa la actividad..." 
                                                value={formData.actividad} 
                                                onChange={e => setFormData({...formData, actividad: e.target.value.toUpperCase()})} 
                                                required 
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="label">Parroquia / Zona</label>
                                        <input className="input" value={formData.parroquia} onChange={e => setFormData({...formData, parroquia: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Ubicación de Caja (NAP / Referencia)</label>
                                        <input className="input" placeholder="Ej: CAJA 1804-A" value={formData.ubicacion_caja} onChange={e => setFormData({...formData, ubicacion_caja: e.target.value})} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Dirección / Referencia de Ubicación</label>
                                        <input className="input" value={formData.ubicacion_cliente} onChange={e => setFormData({...formData, ubicacion_cliente: e.target.value})} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Observaciones de la Visita</label>
                                        <textarea className="input" rows="4" value={formData.observacion} onChange={e => setFormData({...formData, observacion: e.target.value})} placeholder="Detalle lo encontrado o lo que se requiere hacer..."></textarea>
                                    </div>

                                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                        <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
                                        <button type="submit" disabled={submitting || (!formData.cliente_id && !formData.nombre_cliente)} className="btn btn-primary">
                                            {submitting ? 'Guardando...' : (editingId ? 'Actualizar Registro' : 'Crear Registro')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .client-search-item:hover { background: rgba(99, 102, 241, 0.1); }
                .label { display: block; font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em; }
                .input { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 12px; border-radius: 12px; outline: none; transition: border 0.3s; font-size: 0.85rem; }
                .input:focus { border-color: var(--primary); }
                th { border-bottom: 1px solid var(--glass-border); padding-bottom: 12px; }
            `}</style>
        </>
    );
};

export default HojaRuta;
