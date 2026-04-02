import React, { useEffect, useState, useMemo } from 'react';
import { extrasService } from '../services/api';

const ExtrasGeneral = () => {
    const [extras, setExtras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' o 'pagos'

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
        contrasena: '',
        cuentas: '1',
        mac_smart_one: '',
        observaciones: '',
        estado: 'FIJO',
        valor: 0,
        activo: 'SI',
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

    const filteredMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div style={{ color: 'white', padding: '10px' }}>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>Extras General</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Control administrativo de servicios y cobranzas.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <input
                        style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', width: '250px' }}
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button
                        onClick={handleOpenModal}
                        style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                    >
                        + Nuevo Servicio
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                    { label: 'Saldo Pendiente', val: `$${stats.pend.toLocaleString()}`, color: '#f87171' },
                    { label: 'Servicios Activos', val: stats.activos, color: '#34d399' },
                    { label: 'Total Clientes', val: stats.total, color: '#3b82f6' }
                ].map((s, i) => (
                    <div key={i} className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* TABLE */}
            <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: '65vh' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ width: '100px', zIndex: 10, position: 'sticky', left: 0, background: '#1e293b', padding: '15px' }}>COD</th>
                                <th style={{ width: '250px', zIndex: 10, position: 'sticky', left: '100px', background: '#1e293b', padding: '15px' }}>NOMBRE CLIENTE</th>
                                <th style={{ width: '150px', padding: '15px' }}>CONTACTO</th>
                                <th style={{ width: '150px', padding: '15px' }}>PROVEEDOR</th>
                                <th style={{ width: '150px', padding: '15px' }}>USUARIO</th>
                                <th style={{ width: '150px', padding: '15px' }}>CONTRASEÑA</th>
                                <th style={{ width: '100px', padding: '15px' }}>CUENTAS</th>
                                <th style={{ width: '180px', padding: '15px' }}>MAC SMART ONE</th>
                                <th style={{ width: '200px', padding: '15px' }}>OBSERVACIONES</th>
                                <th style={{ width: '120px', padding: '15px' }}>ESTADO</th>
                                <th style={{ width: '120px', padding: '15px' }}>VALOR</th>
                                <th style={{ width: '100px', padding: '15px' }}>ACTIVO</th>
                                <th style={{ width: '120px', padding: '15px', textAlign: 'center' }}>ACCIONES</th>
                                {months.map(m => <th key={m} style={{ width: '600px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '15px' }} colSpan="6">{m.toUpperCase()}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(e => (
                                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ position: 'sticky', left: 0, background: '#0f172a', padding: '14px', color: '#a855f7', fontWeight: 'bold' }}>{e.cod}</td>
                                    <td style={{ position: 'sticky', left: '100px', background: '#0f172a', padding: '14px', fontWeight: 'bold' }}>{e.nombre_cliente}</td>
                                    <td style={{ padding: '14px' }}>{e.contacto}</td>
                                    <td style={{ padding: '14px' }}>{e.proveedor}</td>
                                    <td style={{ padding: '14px' }}>{e.usuario}</td>
                                    <td style={{ padding: '14px', fontFamily: 'monospace', color: '#fbbf24' }}>{e.contrasena || '-'}</td>
                                    <td style={{ padding: '14px' }}>{e.cuentas}</td>
                                    <td style={{ padding: '14px' }}>{e.mac_smart_one || '-'}</td>
                                    <td style={{ padding: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.observaciones || '-'}</td>
                                    <td style={{ padding: '14px' }}>{e.estado}</td>
                                    <td style={{ padding: '14px' }}>${parseFloat(e.valor || 0).toFixed(2)}</td>
                                    <td style={{ padding: '14px' }}>{e.activo}</td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button onClick={() => handleEdit(e)} title="Editar todos los datos (incluyendo meses)" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button onClick={() => handleDelete(e.id)} title="Eliminar" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
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
                                                <td style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '8px', fontSize: '0.75rem' }}>{e[l + '_factura'] || '-'}</td>
                                                <td style={{ padding: '8px', fontSize: '0.7rem', opacity: 0.8 }}>{e[l + '_fecha_pago'] || '-'}</td>
                                                <td style={{ padding: '8px', color: '#10b981', fontWeight: 'bold' }}>{hasPaid ? `$${pagoMes.toFixed(2)}` : '-'}</td>
                                                <td style={{ padding: '8px', fontSize: '0.75rem' }}>{e[l + '_banco'] || '-'}</td>
                                                <td style={{ padding: '8px', fontSize: '0.7rem' }}>{e[l + '_cod'] || '-'}</td>
                                                <td style={{ padding: '8px', color: saldoAMostrar > 0 ? '#f43f5e' : '#94a3b8', fontWeight: 'bold' }}>
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
                    <div className="glass" style={{ width: '100%', maxWidth: '900px', padding: '40px', borderRadius: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0 }}>{isEditing ? 'Editar' : 'Registrar'} Servicio</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        {/* TABS SELECTOR */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <button 
                                onClick={() => setActiveTab('general')}
                                style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'general' ? '2px solid #3b82f6' : 'none', color: activeTab === 'general' ? '#3b82f6' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                DATOS GENERALES
                            </button>
                            <button 
                                onClick={() => setActiveTab('pagos')}
                                style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'pagos' ? '2px solid #3b82f6' : 'none', color: activeTab === 'pagos' ? '#3b82f6' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                PAGOS MENSUALES
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {activeTab === 'general' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label className="label">CÓDIGO (COD)</label>
                                        <input className="input" name="cod" value={formData.cod} disabled style={{ background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed' }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">PROVEEDOR</label>
                                        <input className="input" name="proveedor" value={formData.proveedor} onChange={e => setFormData({ ...formData, proveedor: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
                                        <label className="label">ESTADO (FIJO/SEMIFIJO/INFINITO)</label>
                                        <select className="input" name="estado" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} style={{ background: '#1e293b' }}>
                                            <option value="FIJO">FIJO</option>
                                            <option value="SEMIFIJO">SEMIFIJO</option>
                                            <option value="INFINITO">INFINITO</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">ACTIVO (SI/NO)</label>
                                        <select className="input" name="activo" value={formData.activo} onChange={e => setFormData({ ...formData, activo: e.target.value })} style={{ background: '#1e293b' }}>
                                            <option value="SI">SÍ</option>
                                            <option value="NO">NO</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="label">OBSERVACIONES</label>
                                        <textarea className="input" name="observaciones" value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} rows="3" style={{ resize: 'none' }}></textarea>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                    {filteredMonths.map(m => {
                                        const l = m.toLowerCase();
                                        return (
                                            <div key={m} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <h4 style={{ margin: '0 0 15px 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '0.9rem' }}>{m}</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
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
                                                        <input className="input" type="number" step="0.01" value={formData[`${l}_pago`]} onChange={e => setFormData({...formData, [`${l}_pago`]: e.target.value})} />
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
                                                        <input className="input" type="number" step="0.01" value={formData[`${l}_saldo`]} onChange={e => setFormData({...formData, [`${l}_saldo`]: e.target.value})} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '16px', marginTop: '40px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>Cerrar</button>
                                <button type="submit" disabled={submitting} style={{ padding: '12px 48px', background: '#3b82f6', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                                    {submitting ? 'Registrando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Servicio')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .glass { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); }
                .label { display: block; font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em; }
                .input { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px; border-radius: 10px; outline: none; transition: border 0.3s; font-size: 0.85rem; }
                .input:focus { border-color: #3b82f6; }
                th { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; text-align: left; }
            `}</style>
        </div>
    );
};

export default ExtrasGeneral;
