import React, { useEffect, useState, useMemo } from 'react';
import { hojaRutaService, clienteService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const HojaRuta = () => {
    const [registros, setRegistros] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showObsModal, setShowObsModal] = useState(false);
    const [showAdminObsModal, setShowAdminObsModal] = useState(false);
    const [adminObsText, setAdminObsText] = useState('');
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

    // Bloquear scroll del fondo cuando el modal está abierto
    useEffect(() => {
        if (showModal || showObsModal || showAdminObsModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal, showObsModal, showAdminObsModal]);

    const activatedClients = useMemo(() => {
        if (!Array.isArray(clientes)) return [];
        const term = clientSearchTerm.toLowerCase();

        // Clientes que ya tienen instalación programada (ignorar el registro que se está editando)
        const clientesYaProgramados = new Set(
            registros
                .filter(r => r.cliente_id && r.id !== editingId)
                .map(r => r.cliente_id)
        );

        return clientes
            .filter(c => {
                if (modalSource === 'CLIENTE') {
                    const state = c.estado?.toLowerCase() || '';
                    const yaAgendado = clientesYaProgramados.has(c.id);
                    return (state === 'pendiente' || state === 'pendiente de activacion') && !yaAgendado;
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
    }, [clientes, clientSearchTerm, modalSource, registros, editingId]);

    const [dateFilter, setDateFilter] = useState('');

    const sortedRegistros = useMemo(() => {
        if (!Array.isArray(registros)) return [];
        const search = searchTerm.toLowerCase();

        let filtered = registros.filter(r => {
            const matchSearch = r.nombre_cliente?.toLowerCase().includes(search) ||
                r.tecnico?.toLowerCase().includes(search) ||
                r.parroquia?.toLowerCase().includes(search);

            if (!matchSearch) return false;

            if (dateFilter && r.fecha !== dateFilter) return false;

            return true;
        });

        // Ordenamiento: 1. Fecha Pedido (created_at desc), 2. Fecha Programacion (fecha), 3. Hora (hora)
        // Ordenamiento: 1. Fecha Programada (fecha), 2. Hora (hora), 3. Fecha Creación (created_at desc)
        return filtered.sort((a, b) => {
            // Primero por fecha programada
            if (a.fecha !== b.fecha) {
                // Asumiendo formato YYYY-MM-DD
                return a.fecha.localeCompare(b.fecha);
            }

            // Luego por hora
            if (a.hora !== b.hora) {
                return a.hora.localeCompare(b.hora);
            }

            // Luego por fecha de creación (pedido) - el más nuevo arriba si coinciden fecha y hora
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
    }, [registros, searchTerm, dateFilter]);

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
        
        // Limpiar cliente_id si es string vacío para evitar error de validación en backend
        const cleanData = { 
            ...formData,
            cliente_id: formData.cliente_id === '' ? null : formData.cliente_id 
        };

        try {
            if (editingId) {
                await hojaRutaService.actualizar(editingId, cleanData);
            } else {
                await hojaRutaService.crear(cleanData);
            }
            setShowModal(false);
            setShowObsModal(false);
            fetchData();
        } catch (err) {
            console.error("Error en handleSubmit:", err);
            let errorMsg = "Error al procesar";
            const detail = err.response?.data?.detail;
            
            if (typeof detail === 'string') {
                errorMsg = detail;
            } else if (Array.isArray(detail)) {
                errorMsg = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('\n');
            } else if (typeof detail === 'object' && detail !== null) {
                errorMsg = JSON.stringify(detail);
            }
            
            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleEstado = async (id, currentEstado) => {
        if (user.rol?.toLowerCase() !== 'administrador') {
            alert("Solo el administrador puede cambiar el estado de la hoja de ruta");
            return;
        }
        
        let nextEstado = 'Pendiente';
        if (currentEstado === 'Pendiente') nextEstado = 'En proceso';
        else if (currentEstado === 'En proceso') nextEstado = 'Realizado';
        else nextEstado = 'Pendiente';

        try {
            await hojaRutaService.actualizar(id, { estado: nextEstado });
            fetchData(true);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || err.message;
            alert("No se pudo cambiar el estado: " + msg);
        }
    };

    const handleSaveTechObs = async () => {
        if (!editingId) return;
        setSubmitting(true);
        try {
            // Enviamos SOLO la observación para evitar problemas de permisos con el estado
            await hojaRutaService.actualizar(editingId, { 
                observacion_tecnico: formData.observacion_tecnico 
            });
            setShowObsModal(false);
            fetchData(true);
            alert("Observación técnica guardada correctamente");
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || err.message;
            alert("Error al guardar observación: " + msg);
        } finally {
            setSubmitting(false);
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass hr-main-container">
                <div className="hr-header">
                    <div className="hr-header-info">
                        <h1 className="hr-title">
                            Hoja de Ruta
                        </h1>
                        <p className="hr-subtitle">
                            Gestión centralizada de instalaciones y actividades técnicas.
                        </p>
                    </div>
                    <div className="hr-actions">
                        <div className="hr-date-filter">
                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}> Fecha:</span>
                            <input
                                type="date"
                                className="input"
                                style={{ width: '150px', marginBottom: 0, padding: '5px', background: 'transparent', border: 'none', color: 'white' }}
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                            />
                            {dateFilter && (
                                <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                            )}
                        </div>
                        <input
                            className="input hr-search"
                            placeholder="Buscar técnico, cliente o zona..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {user.rol?.toLowerCase() === 'administrador' && (
                            <>
                                <button onClick={() => handleOpenModal('CLIENTE')} className="btn btn-primary hr-btn">
                                    + Programar Instalación
                                </button>
                                <button onClick={() => handleOpenModal('GENERAL')} className="btn btn-secondary hr-btn-secondary">
                                    + Nueva Actividad
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {loading ? <p>Cargando datos...</p> : (
                    <div className="hr-table-container">
                        <table className="hr-table">
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem', textAlign: 'left', opacity: 0.8 }}>
                                    <th style={{ padding: '15px', width: '40px' }}></th>
                                    <th style={{ padding: '10px' }}>F. Pedido</th>
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
                                        <td style={{ padding: '10px 0 10px 15px', borderRadius: '12px 0 0 12px', width: '40px' }}>
                                            <button 
                                                onClick={() => {
                                                    setAdminObsText(r.observacion || 'Sin observaciones');
                                                    setShowAdminObsModal(true);
                                                }}
                                                style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)', color: '#a78bfa', borderRadius: '8px', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}
                                                title="Ver Observaciones"
                                            >
                                                👁️
                                            </button>
                                        </td>
                                        <td style={{ padding: '15px' }}>
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
                                                className={`status-chip ${r.estado === 'Realizado' ? 'success' : (r.estado === 'En proceso' ? 'processing' : 'pending')}`}
                                                disabled={user.rol?.toLowerCase() !== 'administrador'}
                                                style={{ cursor: user.rol?.toLowerCase() === 'administrador' ? 'pointer' : 'default' }}
                                            >
                                                {r.estado}
                                            </button>
                                        </td>
                                        <td style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>{r.tecnico}</td>
                                        <td>
                                            <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{r.nombre_cliente}</div>
                                            {r.celular_cliente ? (
                                                <a
                                                    href={`https://wa.me/${r.celular_cliente.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '0.7rem', color: '#25d366', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    title="Abrir en WhatsApp"
                                                >
                                                    📱 {r.celular_cliente}
                                                </a>
                                            ) : (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.75rem' }}>{r.parroquia}</div>
                                            {r.ubicacion_cliente ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.ubicacion_cliente)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '0.65rem', color: '#60a5fa', textDecoration: 'none', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '3px' }}
                                                    title="Abrir en Google Maps"
                                                >
                                                    📍 {r.ubicacion_cliente}
                                                </a>
                                            ) : (
                                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>—</div>
                                            )}
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
                                                <div style={{ fontSize: '0.7rem', color: '#4ade80', marginTop: '4px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                    <strong>⚙️:</strong> {r.observacion_tecnico}
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
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {user.rol?.toLowerCase() === 'administrador' ? (
                                                    <>
                                                        <button onClick={() => handleEdit(r)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '1.1rem' }} title="Editar">✏️</button>
                                                        <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.2rem' }} title="Eliminar">&times;</button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenObs(r)}
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.7rem', padding: '5px 10px' }}
                                                    >
                                                        📝 Observación
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* MODAL PRINCIPAL RESTAURADO COMO ESTABA ANTES */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content glass" style={{ maxWidth: '1000px' }}>
                            <div className="modal-header" style={{ marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>{editingId ? '✏️ Editar Registro' : (modalSource === 'CLIENTE' ? '🚀 Programar Instalación' : '⚙️ Nueva Actividad')}</h2>
                                <button onClick={() => setShowModal(false)} className="close-btn" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <div className="hr-modal-grid">
                                {/* COLUMNA IZQUIERDA: BÚSQUEDA Y DATOS DEL CLIENTE */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {!editingId && (
                                        <div>
                                            <label className="label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {modalSource === 'CLIENTE' ? 'Buscar y Seleccionar Cliente' : 'Seleccionar Cliente (Opcional)'}
                                            </label>
                                            <div className="client-picker" style={{ position: 'relative' }}>
                                                <input
                                                    className="input"
                                                    placeholder="Escriba nombre o ID para buscar..."
                                                    value={clientSearchTerm}
                                                    onChange={e => {
                                                        setClientSearchTerm(e.target.value);
                                                        setShowClientList(true);
                                                    }}
                                                    onFocus={() => setShowClientList(true)}
                                                    style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }}
                                                />
                                                {showClientList && (
                                                    <div className="client-list glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '250px', overflowY: 'auto' }}>
                                                        {activatedClients.map(c => (
                                                            <div key={c.id} className="client-item" onClick={() => handleSelectClient(c)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div style={{ fontWeight: 'bold' }}>#{c.id} - {c.nombre}</div>
                                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.parroquia} | {c.celular}</div>
                                                                {c.comentarios && (
                                                                    <div style={{ fontSize: '0.65rem', color: '#fcd34d', fontStyle: 'italic', marginTop: '4px' }}>
                                                                        💬 {c.comentarios}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {activatedClients.length === 0 && (
                                                            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>Sin resultados</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* CUADRO DE INFORMACIÓN DEL CLIENTE (CONTRACT DATA) */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', flex: 1 }}>
                                        <h3 style={{ fontSize: '0.8rem', color: '#818cf8', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>Previsualización Contrato</h3>
                                        {selectedClient ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Cliente Seleccionado</label>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{selectedClient.nombre}</div>
                                                </div>
                                                {selectedClient.comentarios ? (
                                                    <div>
                                                        <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Comentarios Contrato</label>
                                                        <div style={{ fontSize: '1rem', color: '#fcd34d', fontStyle: 'italic', lineHeight: '1.6' }}>{selectedClient.comentarios}</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: '10px 0', opacity: 0.3 }}>
                                                        <p style={{ fontSize: '0.7rem' }}>Sin comentarios registrados</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : editingId ? (
                                            <div style={{ textAlign: 'center', opacity: 0.5 }}>
                                                <p style={{ fontSize: '0.75rem' }}>Editando registro existente</p>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '30px 0', textAlign: 'center', opacity: 0.3 }}>
                                                <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>👤</div>
                                                <p style={{ fontSize: '0.7rem' }}>{modalSource === 'GENERAL' ? 'Actividad para externo (Opcional elegir cliente)' : 'Seleccione un cliente para ver comentarios'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: FORMULARIO */}
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="input-group">
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fecha Programación</label>
                                            <input type="date" className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hora Programación</label>
                                            <input type="time" className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} required />
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nombre Cliente</label>
                                            <input className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.nombre_cliente} onChange={e => setFormData({ ...formData, nombre_cliente: e.target.value })} placeholder="Nombre completo" required />
                                        </div>
                                        <div>
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Técnico Responsable</label>
                                            <input className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.tecnico} onChange={e => setFormData({ ...formData, tecnico: e.target.value })} placeholder="Nombre del técnico" required />
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Actividad a Realizar</label>
                                            <select
                                                className="input"
                                                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', background: '#1e293b' }}
                                                value={['INSTALACION', 'VISITA TECNICA', 'FOCO ROJO', 'CAMBIO EQUIPO'].includes(formData.actividad) ? formData.actividad : 'OTRO'}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setFormData({ ...formData, actividad: val === 'OTRO' ? '' : val });
                                                }}
                                            >
                                                <option value="INSTALACION">INSTALACION</option>
                                                <option value="VISITA TECNICA">VISITA TECNICA</option>
                                                <option value="FOCO ROJO">FOCO ROJO</option>
                                                <option value="CAMBIO EQUIPO">CAMBIO EQUIPO</option>
                                                <option value="OTRO">OTRO (Manual)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Celular Contacto</label>
                                            <input className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.celular_cliente} onChange={e => setFormData({ ...formData, celular_cliente: e.target.value })} placeholder="Celular" />
                                        </div>
                                    </div>

                                    {!['INSTALACION', 'VISITA TECNICA', 'FOCO ROJO', 'CAMBIO EQUIPO'].includes(formData.actividad) && (
                                        <div className="input-group">
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Especificar Actividad (Otro)</label>
                                            <input className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.actividad} onChange={e => setFormData({ ...formData, actividad: e.target.value.toUpperCase() })} placeholder="Describa actividad..." required />
                                        </div>
                                    )}

                                    <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Parroquia / Sector</label>
                                            <input className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.parroquia} onChange={e => setFormData({ ...formData, parroquia: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Caja NAP / Referencia Lógica</label>
                                            <input className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.ubicacion_caja} onChange={e => setFormData({ ...formData, ubicacion_caja: e.target.value })} placeholder="Ej: CAJA 1804" />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dirección Física Exacta</label>
                                        <input className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.ubicacion_cliente} onChange={e => setFormData({ ...formData, ubicacion_cliente: e.target.value })} />
                                    </div>

                                    <div className="input-group">
                                        <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Problema Reportado / Razones Visita</label>
                                        <textarea className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }} rows="3" value={formData.observacion} onChange={e => setFormData({ ...formData, observacion: e.target.value })} placeholder="Detalle el requerimiento..."></textarea>
                                    </div>

                                    <div className="modal-actions" style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                        <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '10px 20px' }}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '10px 20px' }}>
                                            {submitting ? 'Guardando...' : (editingId ? 'Actualizar Registro' : 'Crear Registro')}
                                        </button>
                                    </div>
                                </form>
                            </div>
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
                                        onChange={e => setFormData({ ...formData, observacion_tecnico: e.target.value })}
                                        disabled={user.rol?.toLowerCase() !== 'tecnico' && user.rol?.toLowerCase() !== 'administrador'}
                                        placeholder="El técnico debe escribir aquí lo realizado..."
                                        style={{ height: '200px' }}
                                    ></textarea>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowObsModal(false)} className="btn btn-secondary">Cerrar</button>
                                    {(user.rol?.toLowerCase() === 'tecnico' || user.rol?.toLowerCase() === 'administrador') && (
                                        <button type="button" onClick={handleSaveTechObs} className="btn btn-primary" disabled={submitting}>
                                            {submitting ? 'Guardando...' : 'Guardar Observación'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL OBSERVACIÓN ADMIN */}
            <AnimatePresence>
                {showAdminObsModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content glass" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h2 style={{ margin: 0 }}>👁️ Observaciones de Actividad</h2>
                                <button onClick={() => setShowAdminObsModal(false)} className="close-btn" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <div style={{ padding: '20px 0' }}>
                                <div className="preserve-breaks" style={{ 
                                    background: 'rgba(255,255,255,0.02)', 
                                    padding: '20px', 
                                    borderRadius: '15px', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.6',
                                    color: '#e2e8f0',
                                    minHeight: '100px'
                                }}>
                                    {adminObsText}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAdminObsModal(false)} className="btn btn-primary" style={{ width: '100%' }}>Entendido</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .hr-main-container { width: 100%; padding: 24px; }
                .hr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .hr-title { font-size: 2.4rem; font-weight: 900; margin: 0; color: #a78bfa; }
                .hr-subtitle { color: var(--text-muted); font-size: 1rem; margin-top: 5px; }
                .hr-actions { display: flex; gap: 16px; align-items: center; }
                .hr-date-filter { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); }
                .hr-search { width: 250px; margin-bottom: 0; border-radius: 15px; }
                .hr-btn { padding: 12px 20px; }
                .hr-btn-secondary { padding: 12px 20px; border: 1px solid #7e22ce; color: #a78bfa; }
                .hr-table-container { overflow-x: auto; border-radius: 15px; }
                .hr-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }

                .status-chip { border: 1px solid; padding: 4px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; transition: 0.3s; }
                .status-chip.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
                .status-chip.processing { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
                .status-chip.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(10px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
                .modal-content { width: 100%; max-width: 900px; padding: 40px; border-radius: 20px; max-height: 90vh; overflow-y: auto; margin: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .hr-modal-grid { display: grid; grid-template-columns: 300px 1fr; gap: 30px; }
                .client-info { padding: 20px; font-size: 0.8rem; }
                .client-info h4 { margin-top: 0; margin-bottom: 15px; color: #a78bfa; }
                .client-info p { margin: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .client-picker { position: relative; }
                .client-list { position: absolute; top: 100%; left: 0; right: 0; background: #1e1b4b; border-radius: 10px; z-index: 100; max-height: 200px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); }
                .client-item { padding: 10px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; }
                .client-item:hover { background: rgba(255,255,255,0.1); }

                /* RESPONSIVE */
                @media (max-width: 1200px) {
                    .hr-header { flex-direction: column; align-items: flex-start; gap: 20px; }
                    .hr-actions { width: 100%; flex-wrap: wrap; }
                    .hr-search { flex: 1; min-width: 200px; }
                }

                @media (max-width: 768px) {
                    .hr-main-container { padding: 15px; }
                    .hr-title { font-size: 1.8rem; }
                    .hr-actions { flex-direction: column; align-items: stretch; }
                    .hr-search, .hr-date-filter, .hr-btn, .hr-btn-secondary { width: 100% !important; }
                    .hr-modal-grid { grid-template-columns: 1fr; }
                    .modal-content { padding: 20px; border-radius: 15px; }
                    .hr-table th, .hr-table td { font-size: 0.7rem; padding: 10px 5px; }
                }

                @media (max-width: 480px) {
                    .hr-title { font-size: 1.5rem; }
                    .modal-header h2 { font-size: 1.1rem; }
                    .modal-content { padding: 15px; }
                }
            `}</style>
        </>
    );
};

export default HojaRuta;
