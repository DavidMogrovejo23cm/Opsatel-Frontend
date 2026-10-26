/**
 * @file HojaRuta.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React, { useEffect, useState, useMemo } from 'react';
import { hojaRutaService, clienteService, configuracionService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatToDMY, normalizeDateInput, toISODate } from '../services/dateUtils';
/**
 * Helper para extraer únicamente el primer número telefónico y normalizarlo
 * tanto para llamadas directas (tel:) como para WhatsApp (wa.me),
 * admitiendo prefijos internacionales (+593, 593, +1, etc.), fijos locales y móviles (09...).
 */
const getPhoneInfo = (rawPhone) => {
    if (!rawPhone) return { callPhone: '', waPhone: '', firstPhone: '' };

    // 1. Separar por delimitadores comunes: /, ;, ,, |, \, saltos de línea, o " y ", " o ", o " - "
    const parts = String(rawPhone)
        .split(/[/,;|\\\n\r]|\s+(?:y|o|-)\s+/i)
        .map(p => p.trim())
        .filter(Boolean);

    if (parts.length === 0) return { callPhone: '', waPhone: '', firstPhone: '' };

    let candidate = parts[0];

    // 2. Si la primera parte contiene múltiples números separados por espacio(s):
    // Ej: "0994089449 0963182639" o "0986347428 0967759439 0985702275"
    const spaceTokens = candidate.split(/\s+/).filter(Boolean);
    let firstPart = candidate;

    if (spaceTokens.length > 1) {
        const firstTokenDigits = spaceTokens[0].replace(/\D/g, '');
        // Si el primer token ya tiene 9 o más dígitos (ej: "0994089449", "593994089449", "994089449"),
        // es un número completo independiente.
        if (firstTokenDigits.length >= 9) {
            firstPart = spaceTokens[0];
        } else if (firstTokenDigits.length >= 7 && spaceTokens[1].replace(/\D/g, '').length >= 7) {
            // Caso de números fijos separados por espacio: "4092792 2893644"
            firstPart = spaceTokens[0];
        } else {
            // El número contiene espacios en su formato (ej: "+593 99 408 9449" o "099 408 9449" o "+1 609 9030762")
            // Reconstruimos únicamente el primer número
            let acc = '';
            for (let i = 0; i < spaceTokens.length; i++) {
                acc += (acc ? ' ' : '') + spaceTokens[i];
                const accDigits = acc.replace(/\D/g, '');
                if (accDigits.startsWith('09') && accDigits.length === 10) break;
                if (accDigits.startsWith('593') && accDigits.length === 12) break;
                if (acc.startsWith('+') && accDigits.length >= 11) break;
                if (!acc.startsWith('+') && accDigits.length >= 10) break;
            }
            firstPart = acc || spaceTokens[0];
        }
    }

    const hasPlus = firstPart.trim().startsWith('+');
    const cleanDigits = firstPart.replace(/\D/g, '');

    if (!cleanDigits) return { callPhone: '', waPhone: '', firstPhone: '' };

    // Formatear para WhatsApp (wa.me): código de país sin '+'
    let wa = '';
    if (cleanDigits.startsWith('593')) {
        wa = cleanDigits;
    } else if (cleanDigits.startsWith('09') && cleanDigits.length === 10) {
        wa = '593' + cleanDigits.slice(1);
    } else if (cleanDigits.startsWith('9') && cleanDigits.length === 9) {
        wa = '593' + cleanDigits;
    } else {
        wa = cleanDigits;
    }

    // Formatear para Llamar (tel:):
    // Solo debe marcar el PRIMER número
    // Si viene con 593 (ej: 593994089449) o tiene '+' explícito, se le antepone '+' para que el marcador
    // del celular lo reconozca como marcación internacional válida (+593994089449 / +1...)
    // Si empieza con 9 de 9 dígitos, se le antepone el 0 para Ecuador (09...)
    // Si empieza con 09 o cualquier otro fijo local, se envía tal cual
    let call = '';
    if (hasPlus) {
        call = '+' + cleanDigits;
    } else if (cleanDigits.startsWith('593')) {
        call = '+' + cleanDigits;
    } else if (cleanDigits.startsWith('9') && cleanDigits.length === 9) {
        call = '0' + cleanDigits;
    } else {
        call = cleanDigits;
    }

    return {
        callPhone: call,
        waPhone: wa,
        firstPhone: firstPart
    };
};


const HojaRuta = () => {
    const [registros, setRegistros] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cajasNap, setCajasNap] = useState([]);
    const [planesList, setPlanesList] = useState([]);
    const [tecnicosList, setTecnicosList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showObsModal, setShowObsModal] = useState(false);
    const [showAdminObsModal, setShowAdminObsModal] = useState(false);
    const [adminObsText, setAdminObsText] = useState('');
    const [previewFoto, setPreviewFoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientList, setShowClientList] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [modalSource, setModalSource] = useState('CLIENTE'); // 'CLIENTE' o 'GENERAL'
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [copiedId, setCopiedId] = useState(null);
    const [collapsedSections, setCollapsedSections] = useState({});

    const toggleSection = (id, section) => {
        const key = `${id}_${section}`;
        setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

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
            const [hrRes, clRes, cnRes, plRes, usrRes] = await Promise.all([
                hojaRutaService.listar(),
                clienteService.listar(),
                configuracionService.getCajasNap().catch(e => ({ data: [] })),
                configuracionService.getPlanes().catch(e => ({ data: [] })),
                configuracionService.getUsuarios().catch(e => ({ data: [] }))
            ]);
            setRegistros(hrRes.data || []);
            setClientes(clRes.data || []);
            setCajasNap(cnRes.data || []);
            setPlanesList(plRes.data || []);

            const allUsers = usrRes.data || [];
            const tecs = allUsers.filter(u => u.rol?.toLowerCase() === 'tecnico');
            setTecnicosList(tecs.length > 0 ? tecs : allUsers);
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
        if (showModal || showObsModal || showAdminObsModal || previewFoto) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal, showObsModal, showAdminObsModal, previewFoto]);

    // Cerrar modal de foto con Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && previewFoto) {
                setPreviewFoto(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewFoto]);

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
                    return (['pendiente', 'pendiente de activacion', 'en activación', 'en activacion'].includes(state)) && !yaAgendado;
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
    const [statusFilter, setStatusFilter] = useState('TODOS');

    const statusCounts = useMemo(() => {
        const counts = { TODOS: 0, PENDIENTE: 0, 'EN PROCESO': 0, REALIZADO: 0, 'NO COMPLETADO': 0, CANCELADO: 0 };
        if (!Array.isArray(registros)) return counts;
        counts.TODOS = registros.length;
        registros.forEach(r => {
            const isNoCompletado = (r.estado === 'No completado') || (
                (r.estado === 'Pendiente' || r.estado === 'En proceso') &&
                r.created_at &&
                (Date.now() - new Date(r.created_at).getTime() > 24 * 60 * 60 * 1000)
            );
            const est = (isNoCompletado ? 'NO COMPLETADO' : (r.estado || 'PENDIENTE')).toUpperCase();
            if (counts[est] !== undefined) {
                counts[est]++;
            }
        });
        return counts;
    }, [registros]);

    const sortedRegistros = useMemo(() => {
        if (!Array.isArray(registros)) return [];
        const search = searchTerm.toLowerCase();

        let filtered = registros.filter(r => {
            const matchSearch = r.nombre_cliente?.toLowerCase().includes(search) ||
                r.tecnico?.toLowerCase().includes(search) ||
                r.parroquia?.toLowerCase().includes(search);

            if (!matchSearch) return false;

            if (dateFilter && toISODate(r.fecha) !== dateFilter) return false;

            const isNoCompletado = (r.estado === 'No completado') || (
                (r.estado === 'Pendiente' || r.estado === 'En proceso') &&
                r.created_at &&
                (Date.now() - new Date(r.created_at).getTime() > 24 * 60 * 60 * 1000)
            );
            const estadoActual = isNoCompletado ? 'No completado' : (r.estado || 'Pendiente');

            if (statusFilter !== 'TODOS' && estadoActual.toUpperCase() !== statusFilter) return false;

            return true;
        });

        // Ordenamiento: 1. Fecha Programada ascendente, 2. Hora ascendente, 3. F. Pedido (created_at) descendente como desempate
        return filtered.sort((a, b) => {
            // Primero por fecha programada ascendente (cronológico)
            if (a.fecha !== b.fecha) return toISODate(a.fecha).localeCompare(toISODate(b.fecha));

            // Luego por hora ascendente (08:00 → 11:15 → 14:00)
            if (a.hora !== b.hora) return (a.hora || '').localeCompare(b.hora || '');

            // Como desempate, por fecha de creación descendente (el más reciente arriba)
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
    }, [registros, searchTerm, dateFilter, statusFilter]);

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setFormData({
            ...formData,
            cliente_id: client.id,
            nombre_cliente: client.nombre,
            ubicacion_cliente: client.ubicacion || client.direccion || '',
            celular_cliente: client.celular || '',
            parroquia: client.parroquia || '',
            ubicacion_caja: client.nap || client.caja_nap || client.ubicacion_caja || formData.ubicacion_caja || '',
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
        const fullClient = (r.cliente_id ? clientes.find(c => c.id === r.cliente_id) : null) ||
            (r.nombre_cliente ? clientes.find(c => c.nombre && c.nombre.trim().toLowerCase() === r.nombre_cliente.trim().toLowerCase()) : null);
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
            cliente_id: formData.cliente_id === '' ? null : formData.cliente_id,
            fecha: normalizeDateInput(formData.fecha)
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
            
            showError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleEstado = async (id, currentEstado) => {
        if (user.rol?.toLowerCase() !== 'administrador') {
            showWarning("Solo el administrador puede cambiar el estado de la hoja de ruta");
            return;
        }
        
        let nextEstado = 'Pendiente';
        if (currentEstado === 'Pendiente') nextEstado = 'En proceso';
        else if (currentEstado === 'En proceso') nextEstado = 'Realizado';
        else if (currentEstado === 'Realizado') nextEstado = 'No completado';
        else if (currentEstado === 'No completado') nextEstado = 'Pendiente';
        else nextEstado = 'Pendiente';

        try {
            await hojaRutaService.actualizar(id, { estado: nextEstado });
            fetchData(true);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || err.message;
            showError("No se pudo cambiar el estado: " + msg);
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
            showSuccess("Observación técnica guardada correctamente");
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || err.message;
            showError("Error al guardar observación: " + msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (user.rol?.toLowerCase() !== 'administrador') {
            showWarning("Solo el administrador puede eliminar registros");
            return;
        }
        const confirmado = await showConfirm("¿Eliminar registro?", "¿Eliminar este registro?", "Sí, eliminar", "Cancelar");
        if (!confirmado) return;
        try {
            await hojaRutaService.eliminar(id);
            showSuccess("Registro eliminado correctamente");
            fetchData();
        } catch (err) {
            showError("Error al eliminar");
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
                        {user.rol?.toLowerCase() === 'administrador' && (
                            <select
                                className="input"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                style={{
                                    width: 'auto',
                                    marginBottom: 0,
                                    background: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(139, 92, 246, 0.4)',
                                    borderRadius: '10px',
                                    padding: '7px 12px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                                title="Filtro de estados (Visible solo para Administradores)"
                            >
                                <option value="TODOS">📋 Todos los estados ({statusCounts.TODOS})</option>
                                <option value="PENDIENTE">⏳ Pendiente ({statusCounts.PENDIENTE})</option>
                                <option value="EN PROCESO">🔄 En proceso ({statusCounts['EN PROCESO']})</option>
                                <option value="REALIZADO">✅ Realizado ({statusCounts.REALIZADO})</option>
                                <option value="NO COMPLETADO">❌ No completado ({statusCounts['NO COMPLETADO']})</option>
                                <option value="CANCELADO">🚫 Cancelado ({statusCounts.CANCELADO})</option>
                            </select>
                        )}
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
                    <>
                        <div className="hr-table-container hr-desktop-view">
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
                                                {r.created_at ? formatToDMY(r.created_at) : '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{formatToDMY(r.fecha)}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.hora}</div>
                                        </td>
                                        <td>
                                            {(() => {
                                                const isOver24h = (r.estado === 'Pendiente' || r.estado === 'En proceso') &&
                                                    r.created_at &&
                                                    (Date.now() - new Date(r.created_at).getTime() > 24 * 60 * 60 * 1000);
                                                const estadoDisplay = (r.estado === 'No completado' || isOver24h) ? 'No completado' : (r.estado || 'Pendiente');
                                                const chipClass = estadoDisplay === 'Realizado' ? 'success' :
                                                                  estadoDisplay === 'En proceso' ? 'processing' :
                                                                  estadoDisplay === 'No completado' ? 'failed' : 'pending';
                                                return (
                                                    <button
                                                        onClick={() => toggleEstado(r.id, estadoDisplay)}
                                                        className={`status-chip ${chipClass}`}
                                                        disabled={user.rol?.toLowerCase() !== 'administrador'}
                                                        style={{ cursor: user.rol?.toLowerCase() === 'administrador' ? 'pointer' : 'default' }}
                                                        title={isOver24h ? 'Venció el plazo de 24 horas sin completarse' : ''}
                                                    >
                                                        {estadoDisplay}
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>{r.tecnico}</td>
                                        <td>
                                            <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{r.nombre_cliente}</div>
                                            {r.celular_cliente ? (() => {
                                                const { waPhone } = getPhoneInfo(r.celular_cliente);
                                                return waPhone ? (
                                                    <a
                                                        href={`https://wa.me/${waPhone}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ fontSize: '0.7rem', color: '#25d366', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        title="Abrir en WhatsApp"
                                                    >
                                                        📱 {r.celular_cliente}
                                                    </a>
                                                ) : (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📱 {r.celular_cliente}</div>
                                                );
                                            })() : (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</div>
                                            )}
                                            {(() => {
                                                const clientObj = clientes.find(c => c.id === r.cliente_id);
                                                if (clientObj) {
                                                    if (clientObj.tv_tipo === 'IPTV' && clientObj.iptv_user) {
                                                        return (
                                                            <div style={{ marginTop: '4px', padding: '4px 8px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.2)', borderRadius: '6px', fontSize: '0.7rem', color: '#a5b4fc', display: 'inline-block' }}>
                                                                📺 <strong>IPTV:</strong> {clientObj.iptv_user} / {clientObj.iptv_pass}
                                                            </div>
                                                        );
                                                    } else if (clientObj.tv_tipo === 'CATV') {
                                                        return (
                                                            <div style={{ marginTop: '4px', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', fontSize: '0.7rem', color: '#fcd34d', display: 'inline-block' }}>
                                                                🔌 <strong>Televisión:</strong> CATV (Coaxial)
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{r.parroquia}</div>
                                            {r.ubicacion_cliente ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.ubicacion_cliente)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '0.65rem', color: '#60a5fa', textDecoration: 'none', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                                                    title="Abrir en Google Maps"
                                                >
                                                    📍 {r.ubicacion_cliente}
                                                </a>
                                            ) : (
                                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>—</div>
                                            )}
                                            {(() => {
                                                const napName = r.ubicacion_caja || clientes.find(c => c.id === r.cliente_id)?.nap || clientes.find(c => c.id === r.cliente_id)?.caja_nap;
                                                if (!napName) return null;
                                                const cajaObj = cajasNap.find(c => c.nombre?.trim().toUpperCase() === napName?.trim().toUpperCase());
                                                const ubiCaja = cajaObj?.ubicacion;
                                                return (
                                                    <div style={{
                                                        marginTop: '6px',
                                                        padding: '4px 8px',
                                                        background: 'rgba(56, 189, 248, 0.08)',
                                                        border: '1px solid rgba(56, 189, 248, 0.25)',
                                                        borderRadius: '6px',
                                                        fontSize: '0.68rem',
                                                        color: '#38bdf8',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '2px',
                                                        maxWidth: '260px'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                                            <span>📦</span>
                                                            <span>{napName}</span>
                                                        </div>
                                                        {ubiCaja && (
                                                            <a
                                                                href={/^https?:\/\//i.test(ubiCaja.trim()) ? ubiCaja.trim() : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubiCaja)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Abrir ubicación de la caja en Google Maps"
                                                                style={{ 
                                                                    fontSize: '0.64rem', 
                                                                    color: '#60a5fa', 
                                                                    textDecoration: 'none',
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    gap: '3px',
                                                                    wordBreak: 'break-word',
                                                                    lineHeight: '1.2'
                                                                }}
                                                            >
                                                                <span style={{ color: '#38bdf8' }}>📍</span>
                                                                <span>{ubiCaja}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* FOTO DE LA FACHADA (SOLO SI TIENE EL CLIENTE) */}
                                            {(() => {
                                                const clientObj = (r.cliente_id ? clientes.find(c => c.id === r.cliente_id) : null) ||
                                                    (r.nombre_cliente ? clientes.find(c => c.nombre && c.nombre.trim().toLowerCase() === r.nombre_cliente.trim().toLowerCase()) : null);
                                                const rawFoto = (r.foto_fachada && String(r.foto_fachada).trim() !== '')
                                                    ? r.foto_fachada
                                                    : (clientObj?.foto_fachada && String(clientObj.foto_fachada).trim() !== '' ? clientObj.foto_fachada : null);

                                                if (!rawFoto) return null;
                                                const fotoUrl = rawFoto.startsWith('http') || rawFoto.startsWith('data:') || rawFoto.startsWith('/') ? rawFoto : `/${rawFoto}`;

                                                return (
                                                    <div style={{ marginTop: '6px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewFoto({
                                                                url: fotoUrl,
                                                                cliente: r.nombre_cliente || clientObj?.nombre || 'Cliente',
                                                                direccion: r.ubicacion_cliente || clientObj?.ubicacion || r.parroquia || ''
                                                            })}
                                                            className="btn-fachada-chip"
                                                            title="Clic para ver foto de fachada ampliada"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '4px 8px',
                                                                background: 'rgba(56, 189, 248, 0.12)',
                                                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                                                borderRadius: '8px',
                                                                color: '#38bdf8',
                                                                cursor: 'pointer',
                                                                fontSize: '0.68rem',
                                                                fontWeight: 700,
                                                                transition: 'all 0.2s ease',
                                                                textDecoration: 'none',
                                                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                                            }}
                                                        >
                                                            <img 
                                                                src={fotoUrl} 
                                                                alt="Fachada" 
                                                                style={{ 
                                                                    width: '28px', 
                                                                    height: '28px', 
                                                                    borderRadius: '4px', 
                                                                    objectFit: 'cover',
                                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                                    flexShrink: 0
                                                                }} 
                                                            />
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                                                                <span>🏠 Foto Fachada</span>
                                                                <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 400 }}>Clic para ampliar</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                {r.actividad}
                                            </span>
                                        </td>
                                        <td style={{ verticalAlign: 'middle', padding: '12px 10px' }}>
                                            <div className="preserve-breaks" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', maxHeight: '70px', overflowY: 'auto', paddingRight: '4px' }}>
                                                {r.observacion || 'Sin observación'}
                                            </div>
                                            {r.observacion_tecnico && (
                                                <div style={{ fontSize: '0.7rem', color: '#4ade80', marginTop: '4px', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                                    <strong>⚙️:</strong> {r.observacion_tecnico}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleOpenObs(r)}
                                                style={{ fontSize: '0.7rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}
                                            >
                                                {user.rol?.toLowerCase() === 'tecnico' ? '✎ Editar Obs. Técnica' : '👁 Ver Obs. Técnica'}
                                            </button>
                                        </td>
                                        <td style={{ borderRadius: '0 12px 12px 0', textAlign: 'right', paddingRight: '20px', verticalAlign: 'middle' }}>
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

                    {/* VISTA MÓVIL: Tarjetas adaptadas al diseño de celular solicitado */}
                    <div className="hr-mobile-view">
                        {sortedRegistros.length === 0 ? (
                            <div className="hr-mobile-empty">
                                <span>📋</span>
                                <p>No se encontraron actividades con los filtros actuales</p>
                            </div>
                        ) : (
                            sortedRegistros.map(r => {
                                const clientObj = (r.cliente_id ? clientes.find(c => c.id === r.cliente_id) : null) ||
                                    (r.nombre_cliente ? clientes.find(c => c.nombre && c.nombre.trim().toLowerCase() === r.nombre_cliente.trim().toLowerCase()) : null);

                                const isOver24h = (r.estado === 'Pendiente' || r.estado === 'En proceso') &&
                                    r.created_at &&
                                    (Date.now() - new Date(r.created_at).getTime() > 24 * 60 * 60 * 1000);
                                const estadoDisplay = (r.estado === 'No completado' || isOver24h) ? 'No completado' : (r.estado || 'Pendiente');
                                const chipClass = estadoDisplay === 'Realizado' ? 'success' :
                                                  estadoDisplay === 'En proceso' ? 'processing' :
                                                  estadoDisplay === 'No completado' ? 'failed' : 'pending';

                                const rawFoto = (r.foto_fachada && String(r.foto_fachada).trim() !== '')
                                    ? r.foto_fachada
                                    : (clientObj?.foto_fachada && String(clientObj.foto_fachada).trim() !== '' ? clientObj.foto_fachada : null);
                                const fotoUrl = rawFoto ? (rawFoto.startsWith('http') || rawFoto.startsWith('data:') || rawFoto.startsWith('/') ? rawFoto : `/${rawFoto}`) : null;

                                const rawPhone = r.celular_cliente || clientObj?.celular || '';
                                const { callPhone, waPhone } = getPhoneInfo(rawPhone);

                                let actIcon = '🛠️';
                                const actLower = (r.actividad || '').toLowerCase();
                                if (actLower.includes('instalac')) actIcon = '🛠️';
                                else if (actLower.includes('migrac')) actIcon = '🔄';
                                else if (actLower.includes('reparac') || actLower.includes('revision')) actIcon = '🔧';
                                else if (actLower.includes('retir')) actIcon = '📦';

                                const sectorDisplay = r.parroquia 
                                    ? (r.parroquia.toLowerCase().includes('sector') ? r.parroquia : `Sector ${r.parroquia}`) 
                                    : (clientObj?.parroquia ? `Sector ${clientObj.parroquia}` : 'Sector Sin Asignar');

                                const planPrecio = clientObj?.pago_mensual ? `$${clientObj.pago_mensual}` : (clientObj?.plan ? clientObj.plan : '$25');
                                const planDetalle = clientObj?.tv_tipo === 'IPTV' 
                                    ? 'IPTV incluido' 
                                    : clientObj?.tv_tipo === 'CATV' 
                                    ? 'CATV incluido' 
                                    : (clientObj?.plan ? clientObj.plan : 'Internet fibra');

                                const numClienteDisplay = rawPhone || (r.cliente_id ? `#${r.cliente_id}` : `ID-${r.id}`);

                                const ubicacionTitle = r.parroquia ? (r.parroquia.includes('Ecuador') ? r.parroquia : `${r.parroquia}, Ecuador`) : (r.ubicacion_cliente || 'Ubicación registrada');
                                const ubicacionSubtitle = r.ubicacion_cliente || '';

                                const napName = r.ubicacion_caja || clientObj?.nap || clientObj?.caja_nap;
                                const cajaObj = napName ? cajasNap.find(c => c.nombre?.trim().toUpperCase() === napName?.trim().toUpperCase()) : null;
                                const ubiCaja = cajaObj?.ubicacion;

                                return (
                                    <div key={r.id} className="hr-mobile-card">
                                        {/* HEADER */}
                                        <div className="hr-mc-header">
                                            <div className="hr-mc-avatar-info">
                                                <div className="hr-mc-avatar">
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                </div>
                                                <div className="hr-mc-title-group">
                                                    <h3 className="hr-mc-name">{r.nombre_cliente || 'SIN NOMBRE'}</h3>
                                                    <div className="hr-mc-subtitle">
                                                        <span>{actIcon} {r.actividad || 'Actividad'}</span>
                                                        <span>•</span>
                                                        <span>{sectorDisplay}</span>
                                                        {r.tecnico && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="hr-mc-tech">{r.tecnico}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleEstado(r.id, estadoDisplay)}
                                                className={`status-chip ${chipClass} hr-mc-status-chip`}
                                                disabled={user.rol?.toLowerCase() !== 'administrador'}
                                                style={{ cursor: user.rol?.toLowerCase() === 'administrador' ? 'pointer' : 'default' }}
                                                title={user.rol?.toLowerCase() === 'administrador' ? 'Clic para cambiar estado' : estadoDisplay}
                                            >
                                                <span className="hr-mc-dot" />
                                                {estadoDisplay}
                                            </button>
                                        </div>

                                        {/* 3-COLUMN METRICS */}
                                        <div className="hr-mc-grid-3">
                                            <div className="hr-mc-box">
                                                <div className="hr-mc-box-label">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                                    </svg>
                                                    <span>Fecha</span>
                                                </div>
                                                <div className="hr-mc-box-val">{formatToDMY(r.fecha)}</div>
                                                <div className="hr-mc-box-sub">{r.hora || '08:00'}</div>
                                            </div>

                                            <div className="hr-mc-box">
                                                <div className="hr-mc-box-label">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="9"/>
                                                        <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-5 0 3 3 0 0 0 2 3 3.5 3.5 0 0 1-2 5"/>
                                                    </svg>
                                                    <span>Plan</span>
                                                </div>
                                                <div className="hr-mc-box-val">{planPrecio}</div>
                                                <div className="hr-mc-box-sub" title={planDetalle}>{planDetalle}</div>
                                            </div>

                                            <div className="hr-mc-box">
                                                <div className="hr-mc-box-label">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                                                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                                                    </svg>
                                                    <span>N° Cliente</span>
                                                </div>
                                                <div className="hr-mc-box-val hr-mc-val-copy">
                                                    <span className="hr-mc-phone-text" title={numClienteDisplay}>{numClienteDisplay}</span>
                                                    <button
                                                        type="button"
                                                        className="hr-mc-copy-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard?.writeText(String(numClienteDisplay));
                                                            setCopiedId(r.id);
                                                            setTimeout(() => setCopiedId(null), 1800);
                                                        }}
                                                        title="Copiar número"
                                                    >
                                                        {copiedId === r.id ? (
                                                            <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
                                                        ) : (
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ROW TELÉFONO / LLAMAR */}
                                        <div className="hr-mc-action-row">
                                            <div className="hr-mc-row-left">
                                                <div className="hr-mc-row-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                                    </svg>
                                                </div>
                                                <div className="hr-mc-row-text">
                                                    <span className="hr-mc-row-label">Teléfono</span>
                                                    <span className="hr-mc-row-value">{rawPhone || 'Sin número'}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {callPhone ? (
                                                    <>
                                                        {waPhone && (
                                                            <a
                                                                href={`https://wa.me/${waPhone}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hr-mc-btn-wa"
                                                                title="WhatsApp"
                                                            >
                                                                💬
                                                            </a>
                                                        )}
                                                        <a
                                                            href={`tel:${callPhone}`}
                                                            className="hr-mc-btn-call"
                                                        >
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.053 15.053 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
                                                            </svg>
                                                            Llamar
                                                        </a>
                                                    </>
                                                ) : (
                                                    <span className="hr-mc-btn-disabled">Sin teléfono</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ROW UBICACIÓN / VER EN MAPS */}
                                        <div className="hr-mc-action-row">
                                            <div className="hr-mc-row-left">
                                                <div className="hr-mc-row-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                        <circle cx="12" cy="10" r="3"/>
                                                    </svg>
                                                </div>
                                                <div className="hr-mc-row-text">
                                                    <span className="hr-mc-row-label">Ubicación</span>
                                                    <span className="hr-mc-row-value">{ubicacionTitle}</span>
                                                    {ubicacionSubtitle && (
                                                        <span className="hr-mc-row-sub">{ubicacionSubtitle}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.ubicacion_cliente || r.parroquia || '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hr-mc-btn-maps"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                                                    <line x1="8" y1="2" x2="8" y2="18"/>
                                                    <line x1="16" y1="6" x2="16" y2="22"/>
                                                </svg>
                                                Ver en Maps
                                                <span style={{ fontSize: '1rem', marginLeft: '2px', lineHeight: 1 }}>›</span>
                                            </a>
                                        </div>

                                        {/* NAP / CAJA INFO IF PRESENT */}
                                        {napName && (
                                            <div className="hr-mc-nap-badge">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span>📦</span>
                                                    <strong>Caja NAP:</strong>
                                                    <span>{napName}</span>
                                                </div>
                                                {ubiCaja && (
                                                    <a
                                                        href={/^https?:\/\//i.test(ubiCaja.trim()) ? ubiCaja.trim() : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubiCaja)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hr-mc-nap-link"
                                                    >
                                                        📍 Ver Ubicación de Caja
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* IPTV CREDENTIALS IF PRESENT */}
                                        {clientObj && clientObj.tv_tipo === 'IPTV' && clientObj.iptv_user && (
                                            <div className="hr-mc-iptv-badge">
                                                <span>📺</span>
                                                <span><strong>IPTV:</strong> {clientObj.iptv_user} / {clientObj.iptv_pass}</span>
                                            </div>
                                        )}

                                        {/* OBSERVACIONES GENERALES */}
                                        <div className="hr-mc-section-card">
                                            <div
                                                className="hr-mc-sec-header"
                                                onClick={() => toggleSection(r.id, 'obs')}
                                            >
                                                <div className="hr-mc-sec-left">
                                                    <div className="hr-mc-row-icon sm">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                            <polyline points="14 2 14 8 20 8"/>
                                                            <line x1="16" y1="13" x2="8" y2="13"/>
                                                            <line x1="16" y1="17" x2="8" y2="17"/>
                                                        </svg>
                                                    </div>
                                                    <span className="hr-mc-sec-title">Observaciones</span>
                                                </div>
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#94a3b8"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    style={{
                                                        transform: collapsedSections[`${r.id}_obs`] ? 'rotate(-90deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s ease'
                                                    }}
                                                >
                                                    <polyline points="6 9 12 15 18 9"/>
                                                </svg>
                                            </div>
                                            {!collapsedSections[`${r.id}_obs`] && (
                                                <div className="hr-mc-sec-body">
                                                    {r.observacion || 'Sin observaciones registradas.'}
                                                </div>
                                            )}
                                        </div>

                                        {/* OBSERVACIONES DEL TÉCNICO */}
                                        <div className="hr-mc-section-card">
                                            <div
                                                className="hr-mc-sec-header"
                                                onClick={() => toggleSection(r.id, 'obs_tec')}
                                            >
                                                <div className="hr-mc-sec-left">
                                                    <div className="hr-mc-row-icon sm">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                            <circle cx="12" cy="7" r="4" />
                                                        </svg>
                                                    </div>
                                                    <span className="hr-mc-sec-title">Observaciones del técnico</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        className="hr-mc-edit-obs-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenObs(r);
                                                        }}
                                                        title="Editar observación del técnico"
                                                    >
                                                        ✎ {user.rol?.toLowerCase() === 'tecnico' ? 'Editar' : 'Gestionar'}
                                                    </button>
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="#94a3b8"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        style={{
                                                            transform: collapsedSections[`${r.id}_obs_tec`] ? 'rotate(-90deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s ease'
                                                        }}
                                                    >
                                                        <polyline points="6 9 12 15 18 9"/>
                                                    </svg>
                                                </div>
                                            </div>
                                            {!collapsedSections[`${r.id}_obs_tec`] && (
                                                <div className="hr-mc-sec-body tech">
                                                    {r.observacion_tecnico || 'Sin observaciones técnicas registradas.'}
                                                </div>
                                            )}
                                        </div>

                                        {/* FOTO FACHADA */}
                                        {fotoUrl && (
                                            <div
                                                className="hr-mc-photo-card"
                                                onClick={() => setPreviewFoto({
                                                    url: fotoUrl,
                                                    cliente: r.nombre_cliente || clientObj?.nombre || 'Cliente',
                                                    direccion: r.ubicacion_cliente || clientObj?.ubicacion || r.parroquia || ''
                                                })}
                                            >
                                                <img src={fotoUrl} alt="Fachada" className="hr-mc-photo-img" />
                                                <div className="hr-mc-photo-badge">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                                        <polyline points="21 15 16 10 5 21"/>
                                                    </svg>
                                                    <span>Ver fachada</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="hr-mc-photo-expand"
                                                    title="Ampliar foto"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewFoto({
                                                            url: fotoUrl,
                                                            cliente: r.nombre_cliente || clientObj?.nombre || 'Cliente',
                                                            direccion: r.ubicacion_cliente || clientObj?.ubicacion || r.parroquia || ''
                                                        });
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="15 3 21 3 21 9"/>
                                                        <polyline points="9 21 3 21 3 15"/>
                                                        <line x1="21" y1="3" x2="14" y2="10"/>
                                                        <line x1="3" y1="21" x2="10" y2="14"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}

                                        {/* ACCIONES DE ADMINISTRADOR */}
                                        {user.rol?.toLowerCase() === 'administrador' && (
                                            <div className="hr-mc-admin-footer">
                                                <button
                                                    onClick={() => handleEdit(r)}
                                                    className="hr-mc-admin-btn edit"
                                                >
                                                    ✏️ Editar Registro
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(r.id)}
                                                    className="hr-mc-admin-btn delete"
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    </>
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
                                        {selectedClient ? (() => {
                                            const planInfo = planesList.find(p => p.nombre === selectedClient.plan);
                                            const baseScreens = planInfo?.pantallas ?? 0;
                                            const totalScreens = selectedClient.iptv_max_conn ?? 0;
                                            const additionalScreens = Math.max(0, totalScreens - baseScreens);
                                            return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Cliente Seleccionado</label>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{selectedClient.nombre}</div>
                                                </div>
                                                {/* CAMPO DE PANTALLAS IPTV - Solo visible en modo INSTALACIÓN */}
                                                {modalSource === 'CLIENTE' && (
                                                    <div>
                                                        <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Pantallas IPTV Contratadas</label>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            marginTop: '6px',
                                                            background: 'rgba(129, 140, 248, 0.08)',
                                                            border: '1px solid rgba(129, 140, 248, 0.3)',
                                                            borderRadius: '10px',
                                                            padding: '10px 14px'
                                                        }}>
                                                            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>{totalScreens}</span>
                                                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                                                                <span>📺 {baseScreens} del plan</span>
                                                                <span>➕ {additionalScreens} adicional{additionalScreens !== 1 ? 'es' : ''}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
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
                                                {selectedClient.foto_fachada && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Foto de la Fachada</label>
                                                        <div style={{ marginTop: '4px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const fUrl = selectedClient.foto_fachada.startsWith('http') || selectedClient.foto_fachada.startsWith('/') ? selectedClient.foto_fachada : `/${selectedClient.foto_fachada}`;
                                                                    setPreviewFoto({
                                                                        url: fUrl,
                                                                        cliente: selectedClient.nombre,
                                                                        direccion: selectedClient.ubicacion || selectedClient.direccion || ''
                                                                    });
                                                                }}
                                                                style={{
                                                                    background: 'rgba(56, 189, 248, 0.08)',
                                                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                                                    borderRadius: '8px',
                                                                    padding: '6px 10px',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    color: '#38bdf8'
                                                                }}
                                                                title="Clic para ampliar foto de fachada"
                                                            >
                                                                <img 
                                                                    src={selectedClient.foto_fachada.startsWith('http') || selectedClient.foto_fachada.startsWith('/') ? selectedClient.foto_fachada : `/${selectedClient.foto_fachada}`}
                                                                    alt="Fachada"
                                                                    style={{ width: '40px', height: '40px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)', objectFit: 'cover' }}
                                                                />
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>🏠 Ver Fachada</span>
                                                                    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Clic para ampliar</span>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            );
                                        })() : editingId ? (
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
                                            <input type="date" className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={toISODate(formData.fecha)} onChange={e => setFormData({ ...formData, fecha: e.target.value })} required />
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
                                            <select
                                                className="input"
                                                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', background: '#1e293b', color: '#ffffff' }}
                                                value={formData.tecnico}
                                                onChange={e => setFormData({ ...formData, tecnico: e.target.value })}
                                                required
                                            >
                                                <option value="" style={{ background: '#1e293b', color: '#94a3b8' }}>-- Seleccionar Técnico --</option>
                                                {tecnicosList.map(t => (
                                                    <option key={t.id || t.username} value={t.username} style={{ background: '#1e293b', color: '#ffffff' }}>
                                                        👨‍🔧 {t.username} {t.rol ? `(${t.rol})` : ''}
                                                    </option>
                                                ))}
                                                {formData.tecnico && !tecnicosList.some(t => t.username === formData.tecnico) && (
                                                    <option value={formData.tecnico} style={{ background: '#1e293b', color: '#ffffff' }}>
                                                        👨‍🔧 {formData.tecnico}
                                                    </option>
                                                )}
                                            </select>
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
                                            <select
                                                className="input"
                                                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', background: '#1e293b', color: 'white' }}
                                                value={formData.ubicacion_caja || ''}
                                                onChange={e => setFormData({ ...formData, ubicacion_caja: e.target.value })}
                                            >
                                                <option value="">Seleccione una Caja NAP...</option>
                                                {cajasNap.map(c => (
                                                    <option key={c.id} value={c.nombre}>{c.nombre}{c.ubicacion ? ` (${c.ubicacion})` : ''}</option>
                                                ))}
                                                {formData.ubicacion_caja && !cajasNap.some(c => c.nombre === formData.ubicacion_caja) && (
                                                    <option value={formData.ubicacion_caja}>{formData.ubicacion_caja}</option>
                                                )}
                                            </select>
                                            {(() => {
                                                if (!formData.ubicacion_caja) return null;
                                                const selCaja = cajasNap.find(c => c.nombre?.trim().toUpperCase() === formData.ubicacion_caja?.trim().toUpperCase());
                                                if (selCaja?.ubicacion) {
                                                    return (
                                                        <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            📍 <strong>Ubicación NAP:</strong> {selCaja.ubicacion}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dirección Física Exacta</label>
                                        <input className="input" style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }} value={formData.ubicacion_cliente} onChange={e => setFormData({ ...formData, ubicacion_cliente: e.target.value })} />
                                        {selectedClient?.foto_fachada && (
                                            <div style={{ marginTop: '6px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const fUrl = selectedClient.foto_fachada.startsWith('http') || selectedClient.foto_fachada.startsWith('/') ? selectedClient.foto_fachada : `/${selectedClient.foto_fachada}`;
                                                        setPreviewFoto({
                                                            url: fUrl,
                                                            cliente: formData.nombre_cliente || selectedClient.nombre,
                                                            direccion: formData.ubicacion_cliente || selectedClient.ubicacion || ''
                                                        });
                                                    }}
                                                    className="btn-fachada-chip"
                                                    style={{
                                                        background: 'rgba(56, 189, 248, 0.12)',
                                                        border: '1px solid rgba(56, 189, 248, 0.35)',
                                                        borderRadius: '6px',
                                                        padding: '4px 10px',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700,
                                                        color: '#38bdf8',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <span>🏠 Ver Foto de Fachada del Cliente</span>
                                                </button>
                                            </div>
                                        )}
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

            {/* MODAL PREVISUALIZACIÓN FOTO DE FACHADA */}
            <AnimatePresence>
                {previewFoto && (
                    <div 
                        className="modal-overlay" 
                        onClick={() => setPreviewFoto(null)}
                        style={{ zIndex: 10000, background: 'rgba(2, 6, 23, 0.92)', backdropFilter: 'blur(10px)', padding: '20px' }}
                    >
                        <motion.div 
                            initial={{ scale: 0.92, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.92, opacity: 0 }} 
                            onClick={(e) => e.stopPropagation()} 
                            className="modal-content glass" 
                            style={{ 
                                maxWidth: '850px', 
                                width: '100%', 
                                padding: '24px', 
                                borderRadius: '20px', 
                                maxHeight: '92vh', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '16px',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.15)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>🏠</span> Foto de la Fachada
                                    </h2>
                                    {previewFoto.cliente && (
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                                            {previewFoto.cliente}
                                        </div>
                                    )}
                                    {previewFoto.direccion && (
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            <span>📍</span> {previewFoto.direccion}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setPreviewFoto(null)} 
                                    className="close-btn" 
                                    style={{ 
                                        background: 'rgba(255,255,255,0.06)', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        color: 'white', 
                                        fontSize: '1.4rem', 
                                        cursor: 'pointer',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: 1
                                    }}
                                >
                                    &times;
                                </button>
                            </div>

                            <div style={{ 
                                flex: 1, 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                background: 'rgba(0, 0, 0, 0.4)', 
                                borderRadius: '14px', 
                                padding: '12px',
                                minHeight: '260px',
                                maxHeight: '65vh',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <img 
                                    src={previewFoto.url} 
                                    alt={`Fachada de ${previewFoto.cliente || 'cliente'}`} 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '62vh', 
                                        objectFit: 'contain', 
                                        borderRadius: '10px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                    }} 
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
                                <a 
                                    href={previewFoto.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ 
                                        fontSize: '0.8rem', 
                                        color: '#38bdf8', 
                                        textDecoration: 'none', 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '6px',
                                        fontWeight: 600,
                                        padding: '6px 12px',
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(56, 189, 248, 0.25)'
                                    }}
                                >
                                    <span>↗️</span> Abrir imagen completa / Descargar
                                </a>
                                <button 
                                    type="button" 
                                    onClick={() => setPreviewFoto(null)} 
                                    className="btn btn-primary" 
                                    style={{ padding: '8px 24px', fontSize: '0.85rem' }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .btn-fachada-chip {
                    transition: all 0.2s ease;
                }
                .btn-fachada-chip:hover {
                    background: rgba(56, 189, 248, 0.22) !important;
                    border-color: rgba(56, 189, 248, 0.6) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25) !important;
                }
                .hr-main-container { width: 100%; padding: 24px; box-sizing: border-box; }
                .hr-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 20px; flex-wrap: wrap; }
                .hr-header-info { flex: 0 0 auto; min-width: 240px; }
                .hr-title { font-size: 2.2rem; font-weight: 800; margin: 0; color: #a78bfa; white-space: nowrap; }
                .hr-subtitle { color: var(--text-muted); font-size: 0.88rem; margin-top: 4px; }
                .hr-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: flex-end; flex: 1; }
                .hr-date-filter { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); height: 40px; }
                .hr-search { width: 230px; margin-bottom: 0; border-radius: 12px; height: 40px; }
                .hr-btn { padding: 8px 16px; height: 40px; border-radius: 12px; font-weight: 600; white-space: nowrap; }
                .hr-btn-secondary { padding: 8px 16px; height: 40px; border-radius: 12px; font-weight: 600; border: 1px solid #7e22ce; color: #a78bfa; white-space: nowrap; }
                .hr-table-container { overflow-x: auto; border-radius: 15px; width: 100%; }
                .hr-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; min-width: 1100px; }
                .hr-table td { vertical-align: middle; padding: 12px 10px; }

                .hr-desktop-view { display: block; width: 100%; }
                .hr-mobile-view { display: none; }

                @media (max-width: 768px) {
                    .hr-desktop-view { display: none !important; }
                    .hr-mobile-view { display: flex !important; flex-direction: column !important; gap: 16px !important; width: 100% !important; padding-bottom: 24px; }
                }

                /* ===================================================
                   HOJA DE RUTA - TARJETAS MÓVILES (CELULAR)
                =================================================== */
                .hr-mobile-card {
                    background: #0d121f;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 16px;
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    box-sizing: border-box;
                    width: 100%;
                    transition: transform 0.2s ease, border-color 0.2s ease;
                }

                .hr-mc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                }

                .hr-mc-avatar-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }

                .hr-mc-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(37, 99, 235, 0.16);
                    border: 1px solid rgba(59, 130, 246, 0.32);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .hr-mc-title-group {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .hr-mc-name {
                    margin: 0;
                    font-size: 1.02rem;
                    font-weight: 800;
                    color: #ffffff;
                    text-transform: uppercase;
                    letter-spacing: 0.01em;
                    line-height: 1.25;
                    word-break: break-word;
                }

                .hr-mc-subtitle {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 6px;
                    font-size: 0.78rem;
                    color: #94a3b8;
                    margin-top: 3px;
                    font-weight: 500;
                }

                .hr-mc-tech {
                    color: #60a5fa;
                    font-weight: 600;
                }

                .hr-mc-status-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px !important;
                    border-radius: 9999px !important;
                    font-size: 0.75rem !important;
                    font-weight: 700 !important;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .hr-mc-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: currentColor;
                    box-shadow: 0 0 8px currentColor;
                    display: inline-block;
                }

                .hr-mc-grid-3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-top: 4px;
                }

                .hr-mc-box {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    padding: 10px 8px;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .hr-mc-box-label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.7rem;
                    color: #94a3b8;
                    font-weight: 500;
                }

                .hr-mc-box-val {
                    font-size: 0.88rem;
                    font-weight: 800;
                    color: #ffffff;
                    margin-top: 4px;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .hr-mc-box-sub {
                    font-size: 0.72rem;
                    color: #94a3b8;
                    margin-top: 2px;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .hr-mc-val-copy {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 4px;
                }

                .hr-mc-phone-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.82rem;
                }

                .hr-mc-copy-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    color: #94a3b8;
                    transition: transform 0.15s ease;
                }

                .hr-mc-copy-btn:active {
                    transform: scale(0.85);
                }

                .hr-mc-action-row {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    padding: 10px 14px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                }

                .hr-mc-row-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }

                .hr-mc-row-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: rgba(37, 99, 235, 0.18);
                    border: 1px solid rgba(59, 130, 246, 0.28);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    color: #60a5fa;
                }

                .hr-mc-row-icon.sm {
                    width: 30px;
                    height: 30px;
                }

                .hr-mc-row-text {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .hr-mc-row-label {
                    font-size: 0.68rem;
                    color: #94a3b8;
                    font-weight: 500;
                }

                .hr-mc-row-value {
                    font-size: 0.92rem;
                    font-weight: 700;
                    color: #ffffff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.25;
                }

                .hr-mc-row-sub {
                    font-size: 0.72rem;
                    color: #94a3b8;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-top: 1px;
                }

                .hr-mc-btn-call {
                    background: #2563eb;
                    color: #ffffff !important;
                    font-weight: 700;
                    font-size: 0.85rem;
                    border-radius: 9999px;
                    padding: 8px 18px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    text-decoration: none;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
                    border: none;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: transform 0.15s ease, background 0.15s ease;
                }

                .hr-mc-btn-call:active {
                    transform: scale(0.96);
                    background: #1d4ed8;
                }

                .hr-mc-btn-wa {
                    background: rgba(37, 211, 102, 0.15);
                    border: 1px solid rgba(37, 211, 102, 0.35);
                    color: #25d366 !important;
                    font-size: 0.95rem;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    flex-shrink: 0;
                }

                .hr-mc-btn-disabled {
                    font-size: 0.75rem;
                    color: #64748b;
                    padding: 6px 12px;
                }

                .hr-mc-btn-maps {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #e2e8f0 !important;
                    font-size: 0.8rem;
                    font-weight: 600;
                    border-radius: 9999px;
                    padding: 7px 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    text-decoration: none;
                    flex-shrink: 0;
                    transition: background 0.15s ease;
                }

                .hr-mc-btn-maps:active {
                    background: rgba(255, 255, 255, 0.1);
                }

                .hr-mc-nap-badge {
                    background: rgba(56, 189, 248, 0.08);
                    border: 1px solid rgba(56, 189, 248, 0.22);
                    border-radius: 12px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 0.74rem;
                    color: #38bdf8;
                }

                .hr-mc-nap-link {
                    color: #60a5fa !important;
                    text-decoration: none;
                    font-weight: 600;
                }

                .hr-mc-iptv-badge {
                    background: rgba(129, 140, 248, 0.08);
                    border: 1px solid rgba(129, 140, 248, 0.22);
                    border-radius: 12px;
                    padding: 8px 12px;
                    font-size: 0.74rem;
                    color: #a5b4fc;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .hr-mc-section-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    padding: 12px 14px;
                    display: flex;
                    flex-direction: column;
                }

                .hr-mc-sec-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    user-select: none;
                }

                .hr-mc-sec-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .hr-mc-sec-title {
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: #ffffff;
                }

                .hr-mc-sec-body {
                    margin-top: 10px;
                    font-size: 0.82rem;
                    color: #cbd5e1;
                    line-height: 1.45;
                    white-space: pre-line;
                    padding-left: 40px;
                    word-break: break-word;
                }

                .hr-mc-sec-body.tech {
                    color: #a7f3d0;
                }

                .hr-mc-edit-obs-btn {
                    background: rgba(129, 140, 248, 0.15);
                    border: 1px solid rgba(129, 140, 248, 0.35);
                    color: #c7d2fe;
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 3px 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .hr-mc-edit-obs-btn:active {
                    background: rgba(129, 140, 248, 0.3);
                }

                .hr-mc-photo-card {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    height: 200px;
                    width: 100%;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: #090d16;
                    cursor: pointer;
                }

                .hr-mc-photo-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.3s ease;
                }

                .hr-mc-photo-card:hover .hr-mc-photo-img {
                    transform: scale(1.03);
                }

                .hr-mc-photo-badge {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 9999px;
                    padding: 5px 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.74rem;
                    font-weight: 700;
                    color: #ffffff;
                }

                .hr-mc-photo-expand {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 34px;
                    height: 34px;
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    cursor: pointer;
                    border: none;
                    transition: background 0.15s ease;
                }

                .hr-mc-photo-expand:active {
                    background: rgba(30, 41, 59, 0.9);
                }

                .hr-mc-admin-footer {
                    display: flex;
                    gap: 8px;
                    padding-top: 4px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .hr-mc-admin-btn {
                    flex: 1;
                    padding: 8px 12px;
                    border-radius: 10px;
                    font-size: 0.78rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid;
                    transition: all 0.2s ease;
                }

                .hr-mc-admin-btn.edit {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.3);
                    color: #93c5fd;
                }

                .hr-mc-admin-btn.delete {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #fca5a5;
                }

                .hr-mobile-empty {
                    text-align: center;
                    padding: 40px 20px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    color: #94a3b8;
                    font-size: 0.9rem;
                }

                .hr-mobile-empty span {
                    font-size: 2rem;
                    display: block;
                    margin-bottom: 8px;
                }

                .status-chip { border: 1px solid; padding: 4px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; transition: 0.3s; }
                .status-chip.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
                .status-chip.processing { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
                .status-chip.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
                .status-chip.failed { background: rgba(220, 38, 38, 0.28); color: #ff1f1f; border-color: #ef4444; box-shadow: 0 0 14px rgba(239, 68, 68, 0.65); text-shadow: 0 0 6px rgba(255, 30, 30, 0.7); font-weight: 900; }
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
