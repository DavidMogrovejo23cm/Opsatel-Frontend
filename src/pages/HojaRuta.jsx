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
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);

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

    const filteredClients = useMemo(() => {
        if (!clientSearch && !Array.isArray(clientes)) return [];
        // Si no hay búsqueda, mostramos un listado de los que están en 'Pendiente'
        if (!clientSearch) {
            return clientes
                .filter(c => c.estado?.toUpperCase() === 'PENDIENTE')
                .sort((a, b) => a.id - b.id)
                .slice(0, 10);
        }
        return clientes
            .filter(c => 
                (c.nombre?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                c.id?.toString().includes(clientSearch)) &&
                c.estado?.toUpperCase() !== 'ACTIVO'
            )
            .sort((a, b) => a.id - b.id)
            .slice(0, 5);
    }, [clientSearch, clientes]);

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
        setClientSearch('');
    };

    const handleEdit = (r) => {
        setEditingId(r.id);
        setFormData({ ...r });
        setSelectedClient({ nombre: r.nombre_cliente, id: r.cliente_id });
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
                        <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>Hoja de Ruta</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Programación de instalaciones y soporte técnico.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <input
                            className="input"
                            placeholder="Buscar por cliente o técnico..."
                            style={{ width: '300px', marginBottom: 0 }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button 
                            onClick={() => setShowModal(true)}
                            style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                        >
                            + Nueva Ruta
                        </button>
                    </div>
                </div>

                {loading ? <p>Cargando hoja de ruta...</p> : (
                    <div style={{ overflowX: 'auto', borderRadius: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem', textAlign: 'left', letterSpacing: '0.08em' }}>
                                    <th style={{ padding: '12px 15px', width: '110px' }}>Fecha Pedido</th>
                                    <th style={{ width: '90px' }}>Estado</th>
                                    <th style={{ width: '130px' }}>Programado</th>
                                    <th style={{ width: '120px' }}>Técnico</th>
                                    <th style={{ width: '220px' }}>Cliente</th>
                                    <th style={{ width: '180px' }}>Ubicación</th>
                                    <th style={{ width: '100px' }}>Caja NAP</th>
                                    <th style={{ width: '130px' }}>Actividad</th>
                                    <th style={{ minWidth: '150px' }}>Observación</th>
                                    <th style={{ textAlign: 'right', paddingRight: '20px', width: '80px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRegistros.map(r => (
                                    <tr key={r.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', transition: 'transform 0.2s' }}>
                                        <td style={{ padding: '12px 15px', borderRadius: '12px 0 0 12px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#818cf8', fontSize: '0.8rem' }}>
                                                {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                                            </div>
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
                                                    background: r.estado === 'Realizado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: r.estado === 'Realizado' ? '#10b981' : '#f59e0b',
                                                    border: `1px solid ${r.estado === 'Realizado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
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
                                        <td style={{ padding: '12px 5px', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass" style={{ width: '100%', maxWidth: '700px', padding: '40px', borderRadius: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{editingId ? '✏️ Editar Ruta' : '📝 Programar Nueva Ruta'}</h2>
                                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Buscar Cliente</label>
                                    <input 
                                        className="input" 
                                        placeholder="Escribe nombre o ID del cliente..." 
                                        value={clientSearch}
                                        onChange={e => setClientSearch(e.target.value)}
                                        onFocus={() => { if(!clientSearch) setClientSearch(''); }}
                                    />
                                    {filteredClients.length > 0 && (
                                        <div style={{ background: 'rgba(15, 23, 42, 0.98)', borderRadius: '10px', marginTop: '5px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                                            <div style={{ padding: '8px 15px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                                {clientSearch ? 'RESULTADOS DE BÚSQUEDA' : 'CLIENTES PENDIENTES DE ACTIVACIÓN'}
                                            </div>
                                            {filteredClients.map(c => (
                                                <div 
                                                    key={c.id} 
                                                    onClick={() => handleSelectClient(c)}
                                                    style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                    className="client-search-item"
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{c.nombre}</div>
                                                        <span style={{ 
                                                            fontSize: '0.6rem', 
                                                            padding: '2px 6px', 
                                                            borderRadius: '4px', 
                                                            background: 'rgba(245, 158, 11, 0.1)', 
                                                            color: '#f59e0b',
                                                            border: '1px solid rgba(245, 158, 11, 0.2)'
                                                        }}>
                                                            {c.estado}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>ID: {c.id} | {c.parroquia} | {c.celular}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                                        * Se muestran clientes en estado 'Pendiente' o 'En Activación' por defecto.
                                    </p>
                                    {selectedClient && (
                                        <div style={{ marginTop: '10px', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem' }}>
                                            ✅ Cliente seleccionado: <b>{selectedClient.nombre}</b>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="label">Fecha</label>
                                    <input className="input" type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label className="label">Hora</label>
                                    <input className="input" type="time" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label className="label">Técnico Responsable</label>
                                    <input className="input" placeholder="Nombre del técnico" value={formData.tecnico} onChange={e => setFormData({...formData, tecnico: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label className="label">Actividad</label>
                                    <select 
                                        className="input" 
                                        value={['INSTALACION', 'VISITA TECNICA', 'FOCO ROJO', 'CAMBIO EQUIPO'].includes(formData.actividad) ? formData.actividad : 'OTRO'} 
                                        onChange={e => setFormData({...formData, actividad: e.target.value === 'OTRO' ? '' : e.target.value})} 
                                        style={{ background: '#1e293b' }}
                                    >
                                        <option value="INSTALACION">INSTALACION</option>
                                        <option value="VISITA TECNICA">VISITA TECNICA</option>
                                        <option value="FOCO ROJO">FOCO ROJO</option>
                                        <option value="CAMBIO EQUIPO">CAMBIO EQUIPO</option>
                                        <option value="OTRO">OTRO (Manual)</option>
                                    </select>
                                </div>
                                {!['INSTALACION', 'VISITA TECNICA', 'FOCO ROJO', 'CAMBIO EQUIPO'].includes(formData.actividad) && (
                                    <div className="form-group">
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
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Ubicación de Caja (Referencia)</label>
                                    <input className="input" placeholder="Ej: CAJA 1804-A 2°55'..." value={formData.ubicacion_caja} onChange={e => setFormData({...formData, ubicacion_caja: e.target.value})} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Observaciones</label>
                                    <textarea className="input" rows="3" value={formData.observacion} onChange={e => setFormData({...formData, observacion: e.target.value})}></textarea>
                                </div>

                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                    <button type="button" onClick={closeModal} className="btn btn-secondary">Cancelar</button>
                                    <button type="submit" disabled={submitting || !formData.cliente_id} className="btn btn-primary">
                                        {submitting ? 'Guardando...' : (editingId ? 'Actualizar Registro' : 'Crear Registro')}
                                    </button>
                                </div>
                            </form>
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
