import React, { useEffect, useState, useMemo } from 'react';
import { extrasService, configuracionService } from '../services/api';
import { formatToDMY, normalizeDateInput, toISODate } from '../services/dateUtils';
import { showAlert, showSuccess, showError, showConfirm, showToast } from '../utils/alerts';


const ExtrasGeneral = () => {
    const [extras, setExtras] = useState([]);
    const [bancosList, setBancosList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' o 'pagos'
    const [selectedForPago, setSelectedForPago] = useState(null);
    const [pagoData, setPagoData] = useState({ monto: 0, mes: 'ENERO', metodo: 'EFECTIVO', factura: '', referencia: '' });

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const initialForm = {
        cod: '',
        nombre_cliente: '',
        contacto: '',
        proveedor: 'OPSATEL',
        usuario: '',
        contrasena: 'TV2026.@',
        cuentas: '1',
        mac_smart_one: '',
        observaciones: '',
        estado: '30 DÍAS',
        valor: 0,
        activo: 'SI',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        // Inicializar campos mensuales en el form
        ...Object.fromEntries(
            ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"].flatMap(m => [
                [`${m}_factura`, ''],
                [`${m}_fecha_pago`, ''],
                [`${m}_pago`, 0],
                [`${m}_banco`, ''],
                [`${m}_cod`, ''],
                [`${m}_saldo`, 0]
            ])
        )
    };

    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        if (!isEditing && formData.nombre_cliente && formData.cod) {
            const nameParts = formData.nombre_cliente.trim().split(' ').filter(p => p.length > 0);
            
            if (nameParts.length > 0) {
                const apellido = nameParts[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
                const nombreLetra = nameParts[1] ? nameParts[1][0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '') : '';
                
                setFormData(prev => ({
                    ...prev,
                    usuario: `${formData.cod}${apellido}${nombreLetra}`
                }));
            }
        }
    }, [formData.nombre_cliente, formData.cod, isEditing]);

    const getStartMonthIdx = (fechaIngreso) => {
        if (!fechaIngreso) return 0;
        try {
            const str = String(fechaIngreso).trim();
            if (str.includes('-')) {
                const parts = str.split('-');
                const m = parseInt(parts[0].length === 4 ? parts[1] : parts[1], 10);
                if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
            } else if (str.includes('/')) {
                const parts = str.split('/');
                const m = parseInt(parts[1], 10);
                if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
            }
        } catch (e) {
            console.error("Error parsing fecha_ingreso:", e);
        }
        return 0;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await extrasService.listar();
            const banksResp = await configuracionService.getBancos();
            setExtras(res.data || []);
            setBancosList(banksResp.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getNextCod = () => {
        if (!extras || extras.length === 0) return '1C';
        const numbers = extras
            .map(e => parseInt(e.cod?.replace('C', '') || '0'))
            .filter(n => !isNaN(n));
        const max = Math.max(0, ...numbers);
        return `${max + 1}C`;
    };

    const calculateDebe = (e) => {
        if (!e) return 0;
        const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const currentMonthIdx = new Date().getMonth();
        let totalDebe = 0;
        
        const startMonthIdx = getStartMonthIdx(e.fecha_ingreso);

        for (let i = startMonthIdx; i <= currentMonthIdx; i++) {
            const m = listMonths[i];
            const pagoMes = parseFloat(e[`${m}_pago`] || 0);
            const saldoField = e[`${m}_saldo`];
            const valorBase = parseFloat(e.valor || 0);

            let saldoMes = 0;
            if (pagoMes > 0) {
                saldoMes = parseFloat(saldoField || 0);
            } else {
                if (saldoField !== undefined && saldoField !== null && saldoField !== '' && parseFloat(saldoField) >= 0) {
                    saldoMes = parseFloat(saldoField);
                } else {
                    saldoMes = valorBase;
                }
            }
            totalDebe += Math.max(0, saldoMes);
        }
        return totalDebe;
    };

    const stats = useMemo(() => {
        let pend = 0;
        extras.forEach(e => {
            pend += calculateDebe(e);
        });
        return { pend, total: extras.length, activos: extras.filter(x => x.activo === 'SI').length };
    }, [extras]);

    const handleOpenModal = () => {
        setIsEditing(false);
        setActiveTab('general');
        setFormData({
            ...initialForm,
            cod: getNextCod()
        });
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setActiveTab('general');
        setCurrentId(item.id);
        
        // Mapear item a formData asegurando que los nulos sean strings vacios
        const mapped = { ...item };
        Object.keys(item).forEach(key => {
            if (item[key] === null) mapped[key] = '';
        });
        
        setFormData(mapped);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = {
                ...formData,
                valor: parseFloat(formData.valor) || 0,
                fecha_ingreso: normalizeDateInput(formData.fecha_ingreso)
            };
            
            // Asegurar que los pagos y saldos mensuales sean números
            ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"].forEach(m => {
                data[`${m}_pago`] = parseFloat(data[`${m}_pago`] || 0);
                data[`${m}_saldo`] = parseFloat(data[`${m}_saldo`] || 0);
                if (data[`${m}_fecha_pago`]) {
                    data[`${m}_fecha_pago`] = normalizeDateInput(data[`${m}_fecha_pago`]);
                }
            });

            if (isEditing) {
                await extrasService.actualizar(currentId, data);
            } else {
                await extrasService.crear(data);
            }

            setShowModal(false);
            showSuccess("Procesado correctamente");
            fetchData();
        } catch (err) {
            showError("Error al procesar: " + (err.response?.data?.detail || "Error desconocido"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmado = await showConfirm("¿Eliminar servicio?", "¿Deseas eliminar definitivamente este servicio?", "Sí, eliminar", "Cancelar");
        if (!confirmado) return;
        try {
            await extrasService.eliminar(id);
            showSuccess("Servicio eliminado correctamente");
            fetchData();
        } catch (err) {
            showError("Error al eliminar el registro.");
        }
    };

    const filtered = extras.filter(e =>
        e.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cod?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenPago = (extra) => {
        const currentMonthIdx = new Date().getMonth();
        setSelectedForPago(extra);
        setPagoData({
            monto: extra.valor || 0,
            mes: months[currentMonthIdx].toUpperCase(),
            metodo: 'EFECTIVO',
            factura: '',
            referencia: ''
        });
        setShowPagoModal(true);
    };

    const handleConfirmPago = async () => {
        try {
            await extrasService.pagar(selectedForPago.id, {
                monto: parseFloat(pagoData.monto),
                metodo_pago: pagoData.metodo,
                mes_correspondiente: pagoData.mes,
                referencia: pagoData.referencia || `Pago EXTRA - ${pagoData.mes}`,
                factura: pagoData.factura
            });
            setShowPagoModal(false);
            showSuccess("Pago registrado correctamente");
            fetchData();
        } catch (err) {
            showError("Error al registrar pago: " + (err.response?.data?.detail || "Error desconocido"));
        }
    };

    const filteredMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div style={{ color: 'white', padding: '10px' }}>

            {/* HEADER */}
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div className="page-header-info">
                    <h1 style={{ fontWeight: '900', margin: 0 }}>Extras General</h1>
                    <p style={{ marginTop: '4px' }}>Control administrativo de servicios y cobranzas.</p>
                </div>
                <div className="page-actions">
                    <input
                        className="input"
                        style={{ width: '100%', maxWidth: '250px', marginBottom: 0 }}
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleOpenModal}
                        style={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}
                    >
                        + Nuevo Servicio
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div className="grid-responsive" style={{ marginBottom: '32px' }}>
                {[
                    { label: 'Saldo Pendiente', val: `$${stats.pend.toLocaleString()}`, color: '#f87171' },
                    { label: 'Servicios Activos', val: stats.activos, color: '#34d399' },
                    { label: 'Total Clientes', val: stats.total, color: '#3b82f6' }
                ].map((s, i) => (
                    <div key={i} className="glass-card glass" style={{ padding: '24px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* TABLE */}
            <div className="table-container">
                <div style={{ maxHeight: '65vh' }}>
                    <table style={{ tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th rowSpan="2" style={{ width: '80px', zIndex: 11, position: 'sticky', left: 0, background: '#1e293b', padding: '15px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>COD</th>
                                <th rowSpan="2" style={{ width: '220px', zIndex: 11, position: 'sticky', left: '80px', background: '#1e293b', padding: '15px', borderRight: '2px solid #3b82f6' }}>NOMBRE CLIENTE</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>CONTACTO</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>PROVEEDOR</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>USUARIO</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>CONTRASEÑA</th>
                                <th rowSpan="2" style={{ width: '80px', padding: '15px' }}>CUENTAS</th>
                                <th rowSpan="2" style={{ width: '160px', padding: '15px' }}>MAC SMART ONE</th>
                                <th rowSpan="2" style={{ width: '180px', padding: '15px' }}>OBSERVACIONES</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>VALOR</th>
                                <th rowSpan="2" style={{ width: '120px', padding: '15px' }}>ESTADO</th>
                                <th rowSpan="2" style={{ width: '120px', padding: '15px' }}>SALDO</th>
                                <th rowSpan="2" style={{ width: '100px', padding: '15px' }}>ACTIVO</th>
                                <th rowSpan="2" style={{ width: '120px', padding: '15px', textAlign: 'center' }}>ACCIONES</th>
                                {months.map(m => (
                                    <th key={m} style={{ width: '600px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '10px', background: '#1e1b4b' }} colSpan="6">
                                        {m.toUpperCase()}
                                    </th>
                                ))}
                            </tr>
                            <tr style={{ background: '#0f172a', fontSize: '0.7rem' }}>
                                {months.map(m => (
                                    <React.Fragment key={m + '_sub'}>
                                        <th style={{ width: '100px', padding: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>Factura</th>
                                        <th style={{ width: '100px', padding: '8px' }}>Fecha</th>
                                        <th style={{ width: '100px', padding: '8px', color: '#34d399' }}>Pago</th>
                                        <th style={{ width: '100px', padding: '8px' }}>Banco</th>
                                        <th style={{ width: '100px', padding: '8px' }}>Ref</th>
                                        <th style={{ width: '100px', padding: '8px', color: '#f87171' }}>Saldo</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(e => (
                                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ position: 'sticky', left: 0, zIndex: 5, width: '80px', background: '#0f172a', padding: '14px', color: '#a855f7', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.cod}</td>
                                    <td style={{ position: 'sticky', left: '80px', zIndex: 5, width: '220px', background: '#0f172a', padding: '14px', fontWeight: 'bold', borderRight: '2px solid #3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre_cliente}</td>
                                    <td style={{ width: '130px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.contacto}</td>
                                    <td style={{ width: '130px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.proveedor}</td>
                                    <td style={{ width: '130px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.usuario}</td>
                                    <td style={{ width: '130px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.contrasena || '-'}</td>
                                    <td style={{ width: '80px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>{e.cuentas}</td>
                                    <td style={{ width: '160px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.mac_smart_one || '-'}</td>
                                    <td style={{ width: '180px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.observaciones}>{e.observaciones || '-'}</td>
                                    <td style={{ width: '130px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold' }}>${parseFloat(e.valor || 0).toFixed(2)}</td>
                                    <td style={{ width: '120px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.estado}</td>
                                    <td style={{ 
                                        width: '120px',
                                        padding: '14px', 
                                        borderRight: '1px solid rgba(255,255,255,0.05)',
                                        color: calculateDebe(e) > 0 ? '#f87171' : (calculateDebe(e) < 0 ? '#34d399' : '#94a3b8'),
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}>
                                        ${calculateDebe(e).toFixed(2)}
                                    </td>
                                    <td style={{ width: '100px', padding: '14px', borderRight: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>{e.activo}</td>
                                    <td style={{ width: '120px', padding: '14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button className="btn" onClick={() => handleEdit(e)} title="Editar" style={{ padding: '6px', minWidth: 'auto', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button className="btn" onClick={() => handleOpenPago(e)} title="Cobrar" style={{ padding: '6px', minWidth: 'auto', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a4.5 4.5 0 1 0 0 9h5a4.5 4.5 0 1 1 0 9H6"></path></svg>
                                            </button>
                                            <button className="btn" onClick={() => handleDelete(e.id)} title="Eliminar" style={{ padding: '6px', minWidth: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                    </td>
                                    {months.map((m, mIdx) => {
                                        const l = m.toLowerCase();
                                        const startMonthIdx = getStartMonthIdx(e.fecha_ingreso);
                                        const isPriorToIngreso = mIdx < startMonthIdx;

                                        const pagoMes = parseFloat(e[l + '_pago'] || 0);
                                        const saldoMes = parseFloat(e[l + '_saldo'] || 0);
                                        const valorBase = parseFloat(e.valor || 0);
                                        
                                        let saldoAMostrar = 0;
                                        if (isPriorToIngreso) {
                                            saldoAMostrar = 0;
                                        } else {
                                            if (pagoMes > 0) {
                                                saldoAMostrar = saldoMes;
                                            } else {
                                                if (e[l + '_saldo'] !== undefined && e[l + '_saldo'] !== null && e[l + '_saldo'] !== '') {
                                                    saldoAMostrar = saldoMes;
                                                } else {
                                                    saldoAMostrar = valorBase;
                                                }
                                            }
                                        }
                                        const hasPaid = pagoMes > 0;

                                        return (
                                            <React.Fragment key={m}>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '8px', fontSize: '0.75rem', opacity: isPriorToIngreso ? 0.35 : 1 }}>{isPriorToIngreso ? '-' : (e[l + '_factura'] || '-')}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', fontSize: '0.7rem', opacity: isPriorToIngreso ? 0.35 : 0.8 }}>{isPriorToIngreso ? '-' : (e[l + '_fecha_pago'] ? formatToDMY(e[l + '_fecha_pago']) : '-')}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', color: '#10b981', fontWeight: 'bold', textAlign: 'center', opacity: isPriorToIngreso ? 0.35 : 1 }}>{hasPaid ? `$${pagoMes.toFixed(2)}` : '-'}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', fontSize: '0.75rem', opacity: isPriorToIngreso ? 0.35 : 1 }}>{isPriorToIngreso ? '-' : (e[l + '_banco'] || '-')}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', fontSize: '0.7rem', opacity: isPriorToIngreso ? 0.35 : 1 }}>{isPriorToIngreso ? '-' : (e[l + '_cod'] || '-')}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', color: isPriorToIngreso ? '#64748b' : (saldoAMostrar > 0 ? '#f43f5e' : '#94a3b8'), fontWeight: 'bold', textAlign: 'center' }}>
                                                    ${saldoAMostrar.toFixed(2)}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL TABS */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(2, 6, 23, 0.95)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card glass" style={{ width: '100%', maxWidth: '900px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="page-header" style={{ marginBottom: '24px' }}>
                            <div className="page-header-info">
                                <h2 style={{ fontWeight: '900', margin: 0 }}>{isEditing ? 'Editar' : 'Registrar'} Servicio</h2>
                            </div>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ minWidth: 'auto', padding: '4px 12px', fontSize: '1.5rem' }}>&times;</button>
                        </div>

                        {/* TABS SELECTOR */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto', paddingBottom: '4px' }}>
                            <button 
                                onClick={() => setActiveTab('general')}
                                style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'general' ? '2px solid #3b82f6' : 'none', color: activeTab === 'general' ? '#3b82f6' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                DATOS GENERALES
                            </button>
                            <button 
                                onClick={() => setActiveTab('pagos')}
                                style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'pagos' ? '2px solid #3b82f6' : 'none', color: activeTab === 'pagos' ? '#3b82f6' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                PAGOS MENSUALES
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {activeTab === 'general' ? (
                                <div className="grid-responsive">
                                    <div className="form-group">
                                        <label className="label">CÓDIGO (COD)</label>
                                        <input className="input" name="cod" value={formData.cod} disabled style={{ background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed' }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">PROVEEDOR</label>
                                        <input className="input" name="proveedor" value={formData.proveedor} onChange={e => setFormData({ ...formData, proveedor: e.target.value })} />
                                    </div>
                                    <div className="form-group grid-span-2">
                                        <label className="label">NOMBRE DEL CLIENTE</label>
                                        <input className="input" name="nombre_cliente" value={formData.nombre_cliente} onChange={e => setFormData({ ...formData, nombre_cliente: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">CONTACTO / CELULAR</label>
                                        <input className="input" name="contacto" value={formData.contacto} onChange={e => setFormData({ ...formData, contacto: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">USUARIO</label>
                                        <input className="input" name="usuario" value={formData.usuario} onChange={e => setFormData({ ...formData, usuario: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">CONTRASEÑA</label>
                                        <input className="input" type="text" name="contrasena" value={formData.contrasena} onChange={e => setFormData({ ...formData, contrasena: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">CUENTAS</label>
                                        <input className="input" name="cuentas" value={formData.cuentas} onChange={e => setFormData({ ...formData, cuentas: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">MAC SMART ONE</label>
                                        <input className="input" name="mac_smart_one" value={formData.mac_smart_one} onChange={e => setFormData({ ...formData, mac_smart_one: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">VALOR MENSUAL ($)</label>
                                        <input className="input" type="number" step="0.01" name="valor" value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">ESTADO</label>
                                        <select className="input" name="estado" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} style={{ background: '#1e293b' }}>
                                            <option value="30 DÍAS">30 DÍAS</option>
                                            <option value="INFINITO">INFINITO</option>
                                            <option value="FIJO">FIJO</option>
                                            <option value="SEMIFIJO">SEMIFIJO</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">ACTIVO (SI/NO)</label>
                                        <select className="input" name="activo" value={formData.activo} onChange={e => setFormData({ ...formData, activo: e.target.value })} style={{ background: '#1e293b' }}>
                                            <option value="SI">SÍ</option>
                                            <option value="NO">NO</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">FECHA DE INGRESO</label>
                                        <input className="input" type="date" name="fecha_ingreso" value={toISODate(formData.fecha_ingreso)} onChange={e => setFormData({ ...formData, fecha_ingreso: e.target.value })} />
                                    </div>
                                    <div className="form-group grid-span-2">
                                        <label className="label">OBSERVACIONES</label>
                                        <textarea className="input" name="observaciones" value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} rows="3" style={{ resize: 'none' }}></textarea>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {filteredMonths.map(m => {
                                        const l = m.toLowerCase();
                                        return (
                                            <div key={m} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <h4 style={{ margin: '0 0 15px 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '0.9rem' }}>{m}</h4>
                                                <div className="grid-responsive" style={{ gap: '15px' }}>
                                                    <div>
                                                        <label className="label">Factura</label>
                                                        <input className="input" value={formData[`${l}_factura`]} onChange={e => setFormData({...formData, [`${l}_factura`]: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <label className="label">Fecha Pago</label>
                                                        <input className="input" value={formData[`${l}_fecha_pago`]} onChange={e => setFormData({...formData, [`${l}_fecha_pago`]: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <label className="label">Monto Pago ($)</label>
                                                        <input 
                                                            className="input" 
                                                            type="number" 
                                                            step="0.01" 
                                                            value={formData[`${l}_pago`]} 
                                                            onChange={e => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                const base = parseFloat(formData.valor) || 0;
                                                                setFormData({
                                                                    ...formData, 
                                                                    [`${l}_pago`]: e.target.value,
                                                                    [`${l}_saldo`]: Math.max(0, base - val).toFixed(2)
                                                                });
                                                            }} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="label">Banco/Método</label>
                                                        <input className="input" value={formData[`${l}_banco`]} onChange={e => setFormData({...formData, [`${l}_banco`]: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <label className="label">COD Referencia</label>
                                                        <input className="input" value={formData[`${l}_cod`]} onChange={e => setFormData({...formData, [`${l}_cod`]: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <label className="label">Saldo Restante ($)</label>
                                                        <input 
                                                            className="input" 
                                                            type="number" 
                                                            step="0.01" 
                                                            value={formData[`${l}_saldo`]} 
                                                            onChange={e => {
                                                                setFormData({...formData, [`${l}_saldo`]: e.target.value});
                                                            }} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '30px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Registrando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Servicio')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PAGO RÁPIDO */}
            {showPagoModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(2, 6, 23, 0.95)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card glass" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
                        <h2 style={{ marginBottom: '4px', fontWeight: '900', color: '#34d399' }}>💳 Registrar Pago Extra</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '0.9rem' }}>
                            Cliente: <b>{selectedForPago?.nombre_cliente}</b> ({selectedForPago?.cod})
                        </p>

                        <div style={{ 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            border: '1px solid rgba(59, 130, 246, 0.2)', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            marginBottom: '20px',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>VALOR MENSUAL</span>
                                <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>${parseFloat(selectedForPago?.valor || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>DEUDA ACUMULADA</span>
                                <span style={{ fontWeight: 'bold', color: calculateDebe(selectedForPago) > 0 ? '#f87171' : '#34d399' }}>
                                    ${calculateDebe(selectedForPago).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="grid-responsive" style={{ gap: '16px' }}>
                            <div className="form-group">
                                <label className="label">Mes de inicio del pago</label>
                                <select className="input" value={pagoData.mes} onChange={e => setPagoData({...pagoData, mes: e.target.value})} style={{ background: '#1e293b' }}>
                                    {months.map(m => <option key={m} value={m.toUpperCase()}>{m.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Monto a pagar ($)</label>
                                <input className="input" type="number" step="0.01" value={pagoData.monto} onChange={e => setPagoData({...pagoData, monto: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="label">Banco / Método</label>
                                <select className="input" value={pagoData.metodo} onChange={e => setPagoData({...pagoData, metodo: e.target.value})} style={{ background: '#1e293b' }}>
                                    <option value="EFECTIVO">EFECTIVO</option>
                                    {bancosList.map(b => (
                                        <option key={b.id} value={b.nombre}>{b.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Factura #</label>
                                <input className="input" placeholder="Ej: 001-001-0001" value={pagoData.factura} onChange={e => setPagoData({...pagoData, factura: e.target.value})} />
                            </div>
                            <div className="form-group grid-span-2">
                                <label className="label">Referencia / Comprobante (Opcional)</label>
                                <input className="input" placeholder="Referencia bancaria" value={pagoData.referencia} onChange={e => setPagoData({...pagoData, referencia: e.target.value})} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={handleConfirmPago}>Confirmar Pago</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtrasGeneral;
