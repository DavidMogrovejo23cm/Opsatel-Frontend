import React, { useEffect, useState, useMemo } from 'react';
import { extrasService } from '../services/api';

const ExtrasGeneral = () => {
    const [extras, setExtras] = useState([]);
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
    const [iptvBouquets, setIptvBouquets] = useState([1, 2, 5]);
    const [iptvOutputs, setIptvOutputs] = useState([1, 2]);

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

    const getIptvScript = () => {
        const useExp = formData.estado === '30 DÍAS';
        return `INSERT INTO lines (
  member_id, username, password, bouquet, allowed_outputs, max_connections,
  admin_enabled, enabled, ${useExp ? 'exp_date, ' : ''}is_restreamer, is_trial, is_mag, is_e2, is_stalker, is_isplock,
  allowed_ips, allowed_ua, created_at, force_server_id, bypass_ua
) VALUES (
  1, '${formData.usuario}', '${formData.contrasena}', '[${iptvBouquets}]', '[${iptvOutputs}]', ${formData.cuentas || 1},
  1, 1, ${useExp ? "UNIX_TIMESTAMP() + (30 * 86400), " : ""}0, 0, 0, 0, 0, 0, '[]', '[]', UNIX_TIMESTAMP(), 0, 0
);`;
    };

    const handleBouquetChange = (id) => {
        if (iptvBouquets.includes(id)) {
            setIptvBouquets(prev => prev.filter(b => b !== id));
        } else {
            setIptvBouquets(prev => [...prev, id]);
        }
    };

    const handleOutputChange = (id) => {
        if (iptvOutputs.includes(id)) {
            setIptvOutputs(prev => prev.filter(o => o !== id));
        } else {
            setIptvOutputs(prev => [...prev, id]);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await extrasService.listar();
            setExtras(res.data || []);
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
        const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const currentMonthIdx = new Date().getMonth();
        let totalDebe = 0;
        
        // Determinar mes de inicio basado en fecha_ingreso
        let startMonthIdx = 0;
        if (e.fecha_ingreso) {
            const mesIngreso = parseInt(e.fecha_ingreso.split('-')[1]);
            startMonthIdx = mesIngreso - 1;
        }

        for (let i = startMonthIdx; i <= currentMonthIdx; i++) {
            const m = listMonths[i];
            const saldoMes = (parseFloat(e[`${m}_pago`] || 0) === 0 && (parseFloat(e[`${m}_saldo`] || 0) === 0)) 
                ? parseFloat(e.valor || 0) 
                : parseFloat(e[`${m}_saldo`] || 0);
            totalDebe += saldoMes;
        }
        return totalDebe;
    };

    const stats = useMemo(() => {
        let pend = 0;
        extras.forEach(e => {
            months.forEach(m => {
                pend += parseFloat(e[`${m.toLowerCase()}_saldo`] || 0);
            });
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
                valor: parseFloat(formData.valor) || 0
            };
            
            // Asegurar que los pagos y saldos mensuales sean números
            ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"].forEach(m => {
                data[`${m}_pago`] = parseFloat(data[`${m}_pago`] || 0);
                data[`${m}_saldo`] = parseFloat(data[`${m}_saldo`] || 0);
            });

            if (isEditing) {
                await extrasService.actualizar(currentId, data);
            } else {
                await extrasService.crear(data);
            }

            setShowModal(false);
            fetchData();
        } catch (err) {
            alert("Error al procesar: " + (err.response?.data?.detail || "Error desconocido"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Deseas eliminar definitivamente este servicio?")) return;
        try {
            await extrasService.eliminar(id);
            fetchData();
        } catch (err) {
            alert("Error al eliminar el registro.");
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
            fetchData();
        } catch (err) {
            alert("Error al registrar pago: " + (err.response?.data?.detail || "Error desconocido"));
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
                                    {months.map(m => {
                                        const l = m.toLowerCase();
                                        const pagoMes = parseFloat(e[l + '_pago'] || 0);
                                        const saldoMes = parseFloat(e[l + '_saldo'] || 0);
                                        const valorBase = parseFloat(e.valor || 0);
                                        const saldoAMostrar = (pagoMes === 0 && saldoMes === 0) ? valorBase : saldoMes;
                                        const hasPaid = pagoMes > 0;

                                        return (
                                            <React.Fragment key={m}>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '8px', fontSize: '0.75rem' }}>{e[l + '_factura'] || '-'}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', fontSize: '0.7rem', opacity: 0.8 }}>{e[l + '_fecha_pago'] || '-'}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>{hasPaid ? `$${pagoMes.toFixed(2)}` : '-'}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', fontSize: '0.75rem' }}>{e[l + '_banco'] || '-'}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', fontSize: '0.7rem' }}>{e[l + '_cod'] || '-'}</td>
                                                <td style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', color: saldoAMostrar > 0 ? '#f43f5e' : '#94a3b8', fontWeight: 'bold', textAlign: 'center' }}>
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
                                        <input className="input" type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={e => setFormData({ ...formData, fecha_ingreso: e.target.value })} />
                                    </div>
                                    <div className="form-group grid-span-2">
                                        <label className="label">OBSERVACIONES</label>
                                        <textarea className="input" name="observaciones" value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} rows="3" style={{ resize: 'none' }}></textarea>
                                    </div>

                                    {/* GENERADOR DE SCRIPT IPTV */}
                                    <div className="grid-span-2" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '15px', border: '1px solid rgba(59, 130, 246, 0.2)', marginTop: '20px' }}>
                                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#60a5fa' }}>GENERADOR DE SCRIPT IPTV</h3>
                                        
                                        <div className="grid-responsive" style={{ marginBottom: '20px' }}>
                                            <div className="input-group">
                                                <label className="label">BOUQUETS</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                                    {[
                                                        { id: 1, label: 'TV VIVO' },
                                                        { id: 2, label: 'PELICULAS' },
                                                        { id: 5, label: 'SERIES' },
                                                        { id: 10, label: 'ADULTOS' }
                                                    ].map(b => (
                                                        <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>
                                                            <input type="checkbox" checked={iptvBouquets.includes(b.id)} onChange={() => handleBouquetChange(b.id)} />
                                                            {b.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label className="label">OUTPUTS</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                                    {[
                                                        { id: 1, label: 'HLS' },
                                                        { id: 2, label: 'MPEGTS' },
                                                        { id: 3, label: 'RTMP' }
                                                    ].map(o => (
                                                        <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>
                                                            <input type="checkbox" checked={iptvOutputs.includes(o.id)} onChange={() => handleOutputChange(o.id)} />
                                                            {o.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ position: 'relative' }}>
                                            <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                SCRIPT SQL
                                                <button 
                                                    type="button" 
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(getIptvScript());
                                                        alert("Script copiado!");
                                                    }}
                                                    style={{ padding: '2px 8px', fontSize: '0.6rem', minWidth: 'auto' }}
                                                >
                                                    COPIAR
                                                </button>
                                            </label>
                                            <pre style={{ 
                                                background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', 
                                                fontSize: '0.7rem', color: '#c7d2fe', border: '1px solid rgba(255,255,255,0.05)',
                                                whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: '4px 0 0 0'
                                            }}>
                                                {getIptvScript()}
                                            </pre>
                                        </div>
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
                    <div className="glass-card glass" style={{ width: '100%', maxWidth: '450px', padding: '24px' }}>
                        <h2 style={{ marginBottom: '8px', fontWeight: '900' }}>Registrar Pago</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '0.9rem' }}>Pagar servicio de <b>{selectedForPago?.nombre_cliente}</b></p>
                        
                        <div className="grid-responsive" style={{ gap: '16px' }}>
                            <div className="form-group">
                                <label className="label">Mes de inicio</label>
                                <select className="input" value={pagoData.mes} onChange={e => setPagoData({...pagoData, mes: e.target.value})} style={{ background: '#1e293b' }}>
                                    {months.map(m => <option key={m} value={m.toUpperCase()}>{m.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Monto a pagar ($)</label>
                                <input className="input" type="number" step="0.01" value={pagoData.monto} onChange={e => setPagoData({...pagoData, monto: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="label">Baco / Método</label>
                                <input className="input" value={pagoData.metodo} onChange={e => setPagoData({...pagoData, metodo: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="label">Factura #</label>
                                <input className="input" value={pagoData.factura} onChange={e => setPagoData({...pagoData, factura: e.target.value})} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>Cerrar</button>
                            <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={handleConfirmPago}>Confirmar Pago</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtrasGeneral;
