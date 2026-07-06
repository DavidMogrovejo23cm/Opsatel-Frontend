import React, { useState, useEffect } from 'react';
import { configuracionService, oltService } from '../services/api';
import { motion } from 'framer-motion';

const Configuraciones = () => {
    const [activeTab, setActiveTab] = useState('Nodos');

    // OLT States
    const [oltConfigs, setOltConfigs] = useState([]);
    const [newOlt, setNewOlt] = useState({ nombre: '', host: '', port: 22, username: 'root', password: 'admin', nodo_asociado: '', device_type: 'huawei' });
    const [isEditingOlt, setIsEditingOlt] = useState(null);
    const [oltSaving, setOltSaving] = useState(false);
    const [oltTestingId, setOltTestingId] = useState(null);
    const [oltTestingRaw, setOltTestingRaw] = useState(false);

    // States for data
    const [nodos, setNodos] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [puertos, setPuertos] = useState([]);
    const [parroquias, setParroquias] = useState([]);
    const [cajasNap, setCajasNap] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [finanzasBase, setFinanzasBase] = useState({ caja_chica: '0.00', pichincha: '0.00', jep: '0.00' });

    // Form states
    const [newNodo, setNewNodo] = useState({ nombre: '', base_ip: '' });
    const [newPlan, setNewPlan] = useState({ nombre: '', megas: '', precio: '', pantallas: 1 });
    const [newBanco, setNewBanco] = useState({ nombre: '' });
    const [newPuerto, setNewPuerto] = useState({ numero: '', nodo_id: '', limite_ip: '', limite_device: '', limite_service_port: '' });
    const [searchPuerto, setSearchPuerto] = useState('');
    const [newUsuario, setNewUsuario] = useState({ username: '', password: '', rol: 'tecnico' });
    const [isEditingUser, setIsEditingUser] = useState(null);
    const [isEditingNodo, setIsEditingNodo] = useState(null);
    const [isEditingPlan, setIsEditingPlan] = useState(null);
    const [isEditingBanco, setIsEditingBanco] = useState(null);
    const [isEditingPuerto, setIsEditingPuerto] = useState(null);
    const [newParroquia, setNewParroquia] = useState({ nombre: '' });
    const [isEditingParroquia, setIsEditingParroquia] = useState(null);
    const [newCajaNap, setNewCajaNap] = useState({ nombre: '' });
    const [isEditingCajaNap, setIsEditingCajaNap] = useState(null);
    const [passwordDeleteClientes, setPasswordDeleteClientes] = useState('');

    const fetchData = async () => {
        const user = configuracionService.getCurrentUser();
        const isAdmin = user && (user.rol === 'administrador' || user.rol === 'admin');

        try {
            const [paRes, plRes, baRes, puRes, ppRes, finRes, cnRes] = await Promise.all([
                configuracionService.getNodos().catch(e => ({ data: [] })),
                configuracionService.getPlanes().catch(e => ({ data: [] })),
                configuracionService.getBancos().catch(e => ({ data: [] })),
                configuracionService.getPuertos().catch(e => ({ data: [] })),
                configuracionService.getParroquias().catch(e => ({ data: [] })),
                configuracionService.getFinanzasBase().catch(e => ({ data: { caja_chica: 0, pichincha: 0, jep: 0 } })),
                configuracionService.getCajasNap().catch(e => ({ data: [] }))
            ]);
            
            setNodos(paRes.data);
            setPlanes(plRes.data);
            setBancos(baRes.data);
            setPuertos(puRes.data);
            setParroquias(ppRes.data);
            setCajasNap(cnRes.data);

            // OLT configs (admin only)
            if (isAdmin) {
                try {
                    const oltRes = await oltService.listConfigs();
                    setOltConfigs(oltRes.data?.configs || []);
                } catch (e) {
                    console.warn('No se pudieron cargar las OLTs', e);
                }
            }
            
            if (finRes.data) {
                setFinanzasBase({
                    caja_chica: String(finRes.data.caja_chica),
                    pichincha: String(finRes.data.pichincha),
                    jep: String(finRes.data.jep)
                });
            }

            // Solo intentar traer usuarios si el rol es administrador
            if (isAdmin) {
                try {
                    const usRes = await configuracionService.getUsuarios();
                    setUsuarios(usRes.data);
                } catch (error) {
                    console.warn("No se pudieron cargar los usuarios (posible falta de permisos o sesión expirada)", error);
                }
            } else {
                setUsuarios([]); // Limpiar usuarios si no es admin
            }
        } catch (error) {
            console.error("Error fetching configuraciones generales", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto-refresh cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (type) => {
        try {
            if (type === 'Nodos') {
                if (!newNodo.nombre?.trim() || !newNodo.base_ip?.trim()) return alert('Todos los campos son obligatorios');
                if (isEditingNodo) {
                    await configuracionService.actualizarNodo(isEditingNodo, newNodo);
                    alert('Nodo actualizado');
                } else {
                    await configuracionService.crearNodo(newNodo);
                    alert('Nodo creado');
                }
                setNewNodo({ nombre: '', base_ip: '' });
                setIsEditingNodo(null);
                fetchData();
            } else if (type === 'Planes') {
                if (!newPlan.nombre?.trim() || !newPlan.megas || !newPlan.precio) return alert('Todos los campos son obligatorios');
                const planData = { 
                    nombre: newPlan.nombre, 
                    megas: parseInt(newPlan.megas) || 0,
                    precio: parseFloat(newPlan.precio),
                    pantallas: parseInt(newPlan.pantallas) === 0 ? 0 : (parseInt(newPlan.pantallas) || 1)
                };
                if (isEditingPlan) {
                    await configuracionService.actualizarPlan(isEditingPlan, planData);
                    alert('Plan actualizado');
                } else {
                    await configuracionService.crearPlan(planData);
                    alert('Plan creado');
                }
                setNewPlan({ nombre: '', megas: '', precio: '', pantallas: 1 });
                setIsEditingPlan(null);
                fetchData();
            } else if (type === 'Bancos') {
                if (!newBanco.nombre?.trim()) return alert('El nombre es obligatorio');
                if (isEditingBanco) {
                    await configuracionService.actualizarBanco(isEditingBanco, newBanco);
                    alert('Banco actualizado');
                } else {
                    await configuracionService.crearBanco(newBanco);
                    alert('Banco creado');
                }
                setNewBanco({ nombre: '' });
                setIsEditingBanco(null);
                fetchData();
            } else if (type === 'Puertos') {
                if (!newPuerto.numero || !newPuerto.nodo_id) return alert('Llene todos los campos');

                const nombreEsperado = 'Puerto ' + newPuerto.numero;
                const nodoId = parseInt(newPuerto.nodo_id);

                if (isEditingPuerto) {
                    await configuracionService.actualizarPuerto(isEditingPuerto, { nombre: nombreEsperado, nodo_id: nodoId, limite_ip: newPuerto.limite_ip, limite_device: newPuerto.limite_device, limite_service_port: newPuerto.limite_service_port });
                    alert('Puerto actualizado');
                } else {
                    // Verificar si ya existe un puerto con ese número en esa zona
                    const existePuerto = puertos.some(p => p.nombre.toLowerCase() === nombreEsperado.toLowerCase() && p.nodo_id === nodoId);
                    if (existePuerto) {
                        return alert(`¡Error! El ${nombreEsperado} ya se encuentra registrado en esa zona.`);
                    }
                    await configuracionService.crearPuerto({ nombre: nombreEsperado, nodo_id: nodoId, limite_ip: newPuerto.limite_ip, limite_device: newPuerto.limite_device, limite_service_port: newPuerto.limite_service_port });
                    alert('Puerto creado');
                }
                setNewPuerto({ numero: '', nodo_id: '', limite_ip: '', limite_device: '', limite_service_port: '' });
                setIsEditingPuerto(null);
                fetchData();
            } else if (type === 'Usuarios') {
                if (!newUsuario.username || (!isEditingUser && !newUsuario.password)) return alert('Llene todos los campos');
                
                if (isEditingUser) {
                    await configuracionService.actualizarUsuario(isEditingUser, newUsuario);
                    alert('Usuario actualizado');
                } else {
                    await configuracionService.crearUsuario(newUsuario);
                    alert('Usuario creado');
                }
                setNewUsuario({ username: '', password: '', rol: 'tecnico' });
                setIsEditingUser(null);
                fetchData();
            } else if (type === 'Finanzas Base') {
                const fData = {
                    caja_chica: parseFloat(finanzasBase.caja_chica) || 0,
                    pichincha: parseFloat(finanzasBase.pichincha) || 0,
                    jep: parseFloat(finanzasBase.jep) || 0,
                };
                await configuracionService.actualizarFinanzasBase(fData);
                alert('Finanzas base actualizadas correctamente');
            } else if (type === 'Parroquias') {
                if (!newParroquia.nombre?.trim()) return alert('El nombre es obligatorio');
                if (isEditingParroquia) {
                    await configuracionService.actualizarParroquia(isEditingParroquia, newParroquia);
                    alert('Parroquia actualizada');
                } else {
                    await configuracionService.crearParroquia(newParroquia);
                    alert('Parroquia creada');
                }
                setNewParroquia({ nombre: '' });
                setIsEditingParroquia(null);
            } else if (type === 'Cajas NAP') {
                if (!newCajaNap.nombre?.trim()) return alert('El nombre es obligatorio');
                if (isEditingCajaNap) {
                    await configuracionService.actualizarCajaNap(isEditingCajaNap, newCajaNap);
                    alert('Caja NAP actualizada');
                } else {
                    await configuracionService.crearCajaNap(newCajaNap);
                    alert('Caja NAP creada');
                }
                setNewCajaNap({ nombre: '' });
                setIsEditingCajaNap(null);
            }
            fetchData();
        } catch (error) {
            alert('Error al procesar: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
        try {
            if (type === 'Nodos') await configuracionService.eliminarNodo(id);
            if (type === 'Planes') await configuracionService.eliminarPlan(id);
            if (type === 'Bancos') await configuracionService.eliminarBanco(id);
            if (type === 'Puertos') await configuracionService.eliminarPuerto(id);
            if (type === 'Usuarios') await configuracionService.eliminarUsuario(id);
            if (type === 'Parroquias') await configuracionService.eliminarParroquia(id);
            if (type === 'Cajas NAP') await configuracionService.eliminarCajaNap(id);
            fetchData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handleEditUser = (user) => {
        setIsEditingUser(user.id);
        setNewUsuario({ username: user.username, password: '', rol: user.rol });
        setActiveTab('Usuarios');
    };

    const handleEditNodo = (nod) => {
        setIsEditingNodo(nod.id);
        setNewNodo({ nombre: nod.nombre, base_ip: nod.base_ip });
        setActiveTab('Nodos');
    };

    const handleEditPlan = (plan) => {
        setIsEditingPlan(plan.id);
        setNewPlan({ nombre: plan.nombre, megas: plan.megas || '', precio: plan.precio, pantallas: plan.pantallas ?? 1 });
        setActiveTab('Planes');
    };

    const handleEditBanco = (banco) => {
        setIsEditingBanco(banco.id);
        setNewBanco({ nombre: banco.nombre });
        setActiveTab('Bancos');
    };

    const handleEditPuerto = (puerto) => {
        setIsEditingPuerto(puerto.id);
        const numeroMatch = puerto.nombre.match(/\d+/);
        setNewPuerto({ 
            numero: numeroMatch ? numeroMatch[0] : '', 
            nodo_id: puerto.nodo_id,
            limite_ip: puerto.limite_ip || '',
            limite_device: puerto.limite_device || '',
            limite_service_port: puerto.limite_service_port || ''
        });
        setActiveTab('Puertos');
    };

    const handleEditParroquia = (parr) => {
        setIsEditingParroquia(parr.id);
        setNewParroquia({ nombre: parr.nombre });
        setActiveTab('Parroquias');
    };

    const handleEditCajaNap = (caja) => {
        setIsEditingCajaNap(caja.id);
        setNewCajaNap({ nombre: caja.nombre, nodo_id: caja.nodo_id || null });
        setActiveTab('Cajas NAP');
    };

    // =========== OLT HANDLERS ===========
    const handleOltSave = async () => {
        if (!newOlt.nombre?.trim() || !newOlt.host?.trim()) return alert('Nombre y Host son obligatorios');
        setOltSaving(true);
        try {
            const params = {
                nombre: newOlt.nombre,
                host: newOlt.host,
                port: parseInt(newOlt.port) || 22,
                username: newOlt.username || 'root',
                password: newOlt.password || 'admin',
                nodo_asociado: newOlt.nodo_asociado || null,
                device_type: newOlt.device_type || 'huawei',
            };
            if (isEditingOlt) {
                await oltService.updateConfig(isEditingOlt, params);
                alert('OLT actualizada correctamente');
            } else {
                await oltService.createConfig(params);
                alert('OLT registrada correctamente');
            }
            setNewOlt({ nombre: '', host: '', port: 22, username: 'root', password: 'admin', nodo_asociado: '', device_type: 'huawei' });
            setIsEditingOlt(null);
            const oltRes = await oltService.listConfigs();
            setOltConfigs(oltRes.data?.configs || []);
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message));
        } finally {
            setOltSaving(false);
        }
    };

    const handleOltDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta OLT? Las tareas asociadas quedarán sin OLT.')) return;
        try {
            await oltService.deleteConfig(id);
            const oltRes = await oltService.listConfigs();
            setOltConfigs(oltRes.data?.configs || []);
        } catch (e) {
            alert('Error eliminando OLT: ' + (e.response?.data?.detail || e.message));
        }
    };

    const handleOltToggle = async (olt) => {
        try {
            await oltService.updateConfig(olt.id, { active: !olt.active });
            const oltRes = await oltService.listConfigs();
            setOltConfigs(oltRes.data?.configs || []);
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message));
        }
    };

    const handleOltEdit = (olt) => {
        setIsEditingOlt(olt.id);
        setNewOlt({
            nombre: olt.nombre,
            host: olt.host,
            port: olt.port,
            username: olt.username || 'root',
            password: '',
            nodo_asociado: olt.nodo_asociado || '',
            device_type: olt.device_type || 'huawei',
        });
        setActiveTab('OLTs Huawei');
    };

    const handleOltTestRaw = async () => {
        if (!newOlt.host?.trim()) return alert('El Host es obligatorio para probar la conexión');
        setOltTestingRaw(true);
        try {
            const res = await oltService.testRawConfig({
                host: newOlt.host,
                port: parseInt(newOlt.port) || 22,
                username: newOlt.username || 'root',
                password: newOlt.password || 'admin',
                device_type: newOlt.device_type || 'huawei'
            });
            if (res.data?.success) {
                alert(res.data.message);
            } else {
                alert('Fallo de conexión: ' + res.data?.message);
            }
        } catch (e) {
            alert('Error al probar conexión: ' + (e.response?.data?.detail || e.message));
        } finally {
            setOltTestingRaw(false);
        }
    };

    const handleOltTestExisting = async (id) => {
        setOltTestingId(id);
        try {
            const res = await oltService.testConfig(id);
            if (res.data?.success) {
                alert(res.data.message);
            } else {
                alert('Fallo de conexión: ' + res.data?.message);
            }
        } catch (e) {
            alert('Error al probar conexión: ' + (e.response?.data?.detail || e.message));
        } finally {
            setOltTestingId(null);
        }
    };
    // ======================================

    const tabs = ['Nodos', 'Parroquias', 'Cajas NAP', 'Planes', 'Bancos', 'Puertos', 'Usuarios', 'OLTs Huawei', 'Finanzas Base', 'Eliminar Clientes'];

    const renderTable = (data, columns, type) => (
        <div className="table-container" style={{ marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        {columns.map(col => (
                            <th key={col} style={{ padding: '12px' }}>
                                {col === 'nodo_id' ? 'Nodo / Zona' : col.toUpperCase()}
                            </th>
                        ))}
                        <th style={{ padding: '12px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {columns.map(col => (
                                <td key={col} style={{ padding: '12px' }}>
                                    {col === 'nodo_id' 
                                        ? (nodos.find(p => p.id === row[col])?.nombre || <span style={{ color: '#ef4444' }}>⚠️ SIN ASIGNAR</span>) 
                                        : row[col]}
                                </td>
                            ))}
                            <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                {type === 'Usuarios' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditUser(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Nodos' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditNodo(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Parroquias' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditParroquia(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Cajas NAP' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditCajaNap(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Planes' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditPlan(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Bancos' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditBanco(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Puertos' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditPuerto(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                <button className="btn btn-secondary" onClick={() => handleDelete(type, row.id)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#ef444455', color: '#fca5a5', border: 'none' }}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan={columns.length + 1} style={{ padding: '12px', textAlign: 'center' }}>No hay registros</td></tr>}
                </tbody>
            </table>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card glass" style={{ minHeight: '80vh' }}>
            <div className="page-header">
                <div className="page-header-info">
                    <h1 style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Configuraciones del Sistema
                    </h1>
                </div>
            </div>

            <div className="page-actions" style={{ gap: '10px', marginBottom: '20px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ padding: '8px 16px' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
                {activeTab === 'Nodos' && (
                    <div>
                        <h3>Añadir Nodo</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre</label>
                                <input className="input" style={{ margin: 0 }} value={newNodo.nombre} onChange={e => setNewNodo({ ...newNodo, nombre: e.target.value.toUpperCase() })} placeholder="Ej. SAYAUSÍ" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Base IP</label>
                                <input className="input" style={{ margin: 0 }} value={newNodo.base_ip} onChange={e => setNewNodo({ ...newNodo, base_ip: e.target.value })} placeholder="Ej. 172.16" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Nodos')}>{isEditingNodo ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingNodo && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingNodo(null); setNewNodo({ nombre: '', base_ip: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(nodos, ['id', 'nombre', 'base_ip'], 'Nodos')}
                    </div>
                )}

                {activeTab === 'Parroquias' && (
                    <div>
                        <h3>Añadir Parroquia</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre de la Parroquia</label>
                                <input className="input" style={{ margin: 0 }} value={newParroquia.nombre} onChange={e => setNewParroquia({ nombre: e.target.value.toUpperCase() })} placeholder="Ej. BAÑOS" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Parroquias')}>{isEditingParroquia ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingParroquia && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingParroquia(null); setNewParroquia({ nombre: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(parroquias, ['id', 'nombre'], 'Parroquias')}
                    </div>
                )}

                {activeTab === 'Cajas NAP' && (
                    <div>
                        <h3>Añadir Caja NAP</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre de la Caja NAP</label>
                                <input className="input" style={{ margin: 0 }} value={newCajaNap.nombre} onChange={e => setNewCajaNap({ ...newCajaNap, nombre: e.target.value.toUpperCase() })} placeholder="Ej. CAJA 1804" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nodo / Zona</label>
                                <select
                                    className="input"
                                    style={{ margin: 0, background: 'rgba(255,255,255,0.03)', color: 'var(--text-main)' }}
                                    value={newCajaNap.nodo_id || ''}
                                    onChange={e => setNewCajaNap({ ...newCajaNap, nodo_id: e.target.value ? parseInt(e.target.value) : null })}
                                >
                                    <option value="">Sin nodo asignado</option>
                                    {nodos.map(n => (
                                        <option key={n.id} value={n.id}>{n.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Cajas NAP')}>{isEditingCajaNap ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingCajaNap && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingCajaNap(null); setNewCajaNap({ nombre: '', nodo_id: null }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(cajasNap, ['id', 'nombre', 'nodo_nombre'], 'Cajas NAP')}
                    </div>
                )}

                {activeTab === 'Planes' && (
                    <div>
                        <h3>Añadir Plan</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre del Plan</label>
                                <input className="input" style={{ margin: 0 }} value={newPlan.nombre} onChange={e => setNewPlan({ ...newPlan, nombre: e.target.value })} placeholder="Ej. 1GB" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Megas</label>
                                <input type="number" className="input" style={{ margin: 0 }} value={newPlan.megas} onChange={e => setNewPlan({ ...newPlan, megas: e.target.value })} placeholder="Ej. 100" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Precio ($)</label>
                                <input type="number" step="0.01" className="input" style={{ margin: 0 }} value={newPlan.precio} onChange={e => setNewPlan({ ...newPlan, precio: e.target.value })} placeholder="0.00" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Pantallas IPTV</label>
                                <input type="number" className="input" style={{ margin: 0 }} value={newPlan.pantallas} onChange={e => setNewPlan({ ...newPlan, pantallas: e.target.value })} min="0" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Planes')}>{isEditingPlan ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingPlan && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingPlan(null); setNewPlan({ nombre: '', megas: '', precio: '', pantallas: 1 }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable([...planes].sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio)), ['id', 'nombre', 'megas', 'precio', 'pantallas'], 'Planes')}
                    </div>
                )}

                {activeTab === 'Bancos' && (
                    <div>
                        <h3>Añadir Banco</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre</label>
                                <input className="input" style={{ margin: 0 }} value={newBanco.nombre} onChange={e => setNewBanco({ nombre: e.target.value })} placeholder="Ej. PICHINCHA" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Bancos')}>{isEditingBanco ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingBanco && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingBanco(null); setNewBanco({ nombre: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(bancos, ['id', 'nombre'], 'Bancos')}
                    </div>
                )}

                {activeTab === 'Puertos' && (
                    <div>
                        <h3>Añadir Puerto por Nodo</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nodo</label>
                                <select className="input" style={{ margin: 0 }} value={newPuerto.nodo_id} onChange={e => setNewPuerto({ ...newPuerto, nodo_id: e.target.value })}>
                                    <option value="">Seleccione...</option>
                                    {nodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Número</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '8px', color: 'var(--text-muted)' }}>Puerto</span>
                                    <input type="number" min="0" className="input" style={{ margin: 0, width: '100px' }} value={newPuerto.numero} onChange={e => {
                                        const val = e.target.value;
                                        const num = parseInt(val);
                                        let lim = '';
                                        if (!isNaN(num)) {
                                            const start = num * 128;
                                            const end = start + 127;
                                            lim = `${start} al ${end}`;
                                        }
                                        setNewPuerto({ ...newPuerto, numero: val, limite_ip: lim, limite_device: lim, limite_service_port: lim });
                                    }} placeholder="Ej. 1" />
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Puertos')}>{isEditingPuerto ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingPuerto && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingPuerto(null); setNewPuerto({ numero: '', nodo_id: '', limite_ip: '', limite_device: '', limite_service_port: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <input
                                className="input"
                                placeholder="🔍 Buscar por nombre, ID o Nodo..."
                                value={searchPuerto}
                                onChange={(e) => setSearchPuerto(e.target.value)}
                                style={{ width: '100%', maxWidth: '350px' }}
                            />
                        </div>
                        {renderTable(
                            puertos.filter(p => {
                                const nodoName = nodos.find(nod => nod.id === p.nodo_id)?.nombre || '';
                                const search = searchPuerto.toLowerCase();
                                return (
                                    p.id.toString().includes(search) ||
                                    p.nombre.toLowerCase().includes(search) ||
                                    nodoName.toLowerCase().includes(search)
                                );
                            }),
                            ['id', 'nombre', 'nodo_id', 'limite_ip', 'limite_device', 'limite_service_port'], 'Puertos'
                        )}
                    </div>
                )}

                {activeTab === 'Usuarios' && (
                    <div>
                        <h3>{isEditingUser ? 'Editar Usuario' : 'Añadir Usuario'}</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Username</label>
                                <input className="input" style={{ margin: 0 }} value={newUsuario.username} onChange={e => setNewUsuario({ ...newUsuario, username: e.target.value })} placeholder="Ej. juanperez" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">{isEditingUser ? 'Nueva Password (opcional)' : 'Password'}</label>
                                <input type="password" className="input" style={{ margin: 0 }} value={newUsuario.password} onChange={e => setNewUsuario({ ...newUsuario, password: e.target.value })} />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Rol</label>
                                <select className="input" style={{ margin: 0 }} value={newUsuario.rol} onChange={e => setNewUsuario({ ...newUsuario, rol: e.target.value })}>
                                    <option value="administrador">Administrador</option>
                                    <option value="secretario">Secretario</option>
                                    <option value="tecnico">Técnico</option>
                                    <option value="instalador">Instalador</option>
                                </select>

                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Usuarios')}>{isEditingUser ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingUser && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingUser(null); setNewUsuario({ username: '', password: '', rol: 'tecnico' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(usuarios, ['id', 'username', 'rol'], 'Usuarios')}
                    </div>
                )}

                {activeTab === 'Finanzas Base' && (
                    <div>
                        <h3>Configurar Montos Establecidos de Cuentas</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                            Estos valores se utilizarán como base para sumar y reflejar en las estadísticas del Dashboard global de finanzas.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Caja Chica (Efectivo)</label>
                                <input type="number" step="0.01" className="input" style={{ margin: 0 }} value={finanzasBase.caja_chica} onChange={e => setFinanzasBase({ ...finanzasBase, caja_chica: e.target.value })} placeholder="Ej. 100.00" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Pichincha</label>
                                <input type="number" step="0.01" className="input" style={{ margin: 0 }} value={finanzasBase.pichincha} onChange={e => setFinanzasBase({ ...finanzasBase, pichincha: e.target.value })} placeholder="Ej. 50.00" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">JEP</label>
                                <input type="number" step="0.01" className="input" style={{ margin: 0 }} value={finanzasBase.jep} onChange={e => setFinanzasBase({ ...finanzasBase, jep: e.target.value })} placeholder="Ej. 50.00" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Finanzas Base')}>Guardar Valores Base</button>
                        </div>
                    </div>
                )}

                {activeTab === 'Eliminar Clientes' && (
                    <div>
                        <h3 style={{ color: '#ef4444', marginBottom: '20px' }}>⚠️ Eliminar Todos los Clientes</h3>
                        <p style={{ color: '#fca5a5', marginBottom: '20px', fontSize: '0.95rem' }}>
                            Esta acción es <strong>IRREVERSIBLE</strong>. Se eliminarán TODOS los clientes de la base de datos.
                            Se requiere contraseña de administrador para confirmar.
                        </p>
                        <div style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '20px',
                            borderRadius: '8px',
                            maxWidth: '400px'
                        }}>
                            <div className="input-group">
                                <label className="label" style={{ color: '#fca5a5' }}>Contraseña de Administrador</label>
                                <input 
                                    type="password" 
                                    className="input" 
                                    value={passwordDeleteClientes} 
                                    onChange={e => setPasswordDeleteClientes(e.target.value)}
                                    placeholder="Ingrese la contraseña"
                                    style={{ marginTop: '8px' }}
                                />
                            </div>
                            <button 
                                className="btn" 
                                onClick={async () => {
                                    if (passwordDeleteClientes !== 'admin1.@') {
                                        alert('❌ Contraseña incorrecta');
                                        return;
                                    }
                                    if (!window.confirm('⚠️ ¿ESTÁS SEGURO? Esta acción eliminará TODOS los clientes del sistema.\n\nEsta acción NO se puede deshacer.')) {
                                        return;
                                    }
                                    if (!window.confirm('CONFIRMACIÓN FINAL: ¿Eliminar TODOS los clientes?')) {
                                        return;
                                    }
                                    try {
                                        await configuracionService.deleteAllClientes();
                                        alert('✅ Todos los clientes han sido eliminados exitosamente.');
                                        setPasswordDeleteClientes('');
                                        fetchData();
                                    } catch (error) {
                                        alert('❌ Error: ' + (error.response?.data?.detail || error.message));
                                    }
                                }}
                                style={{
                                    marginTop: '15px',
                                    background: passwordDeleteClientes === 'admin1.@' ? '#ef4444' : '#9ca3af',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: passwordDeleteClientes === 'admin1.@' ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold',
                                    width: '100%',
                                    opacity: passwordDeleteClientes === 'admin1.@' ? 1 : 0.6
                                }}
                                disabled={passwordDeleteClientes !== 'admin1.@'}
                            >
                                🗑️ Eliminar Todos los Clientes
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'OLTs Huawei' && (
                    <div>
                        <h3 style={{ marginBottom: 4 }}>🌐 OLTs Huawei Registradas</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                            Registra aquí las OLTs con sus credenciales SSH. El sistema usará estas credenciales para ejecutar <code>display ont autofind all</code> y activar terminales ópticas.
                        </p>

                        {/* Formulario */}
                        <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                            <h4 style={{ marginBottom: 12, color: '#38bdf8' }}>{isEditingOlt ? '✏️ Editar OLT' : '➕ Nueva OLT'}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Nombre</label>
                                    <input className="input" style={{ margin: 0 }} value={newOlt.nombre} onChange={e => setNewOlt({ ...newOlt, nombre: e.target.value.toUpperCase() })} placeholder="Ej. OLT-BAÑOS" />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Host / IP</label>
                                    <input className="input" style={{ margin: 0 }} value={newOlt.host} onChange={e => setNewOlt({ ...newOlt, host: e.target.value })} placeholder="172.25.0.2" />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Puerto SSH</label>
                                    <input type="number" className="input" style={{ margin: 0 }} value={newOlt.port} onChange={e => setNewOlt({ ...newOlt, port: e.target.value })} placeholder="22" />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Usuario</label>
                                    <input className="input" style={{ margin: 0 }} value={newOlt.username} onChange={e => setNewOlt({ ...newOlt, username: e.target.value })} placeholder="root" />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Password</label>
                                    <input type="password" className="input" style={{ margin: 0 }} value={newOlt.password} onChange={e => setNewOlt({ ...newOlt, password: e.target.value })} placeholder={isEditingOlt ? '(sin cambio)' : 'admin'} />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Nodo Asociado</label>
                                    <select className="input" style={{ margin: 0 }} value={newOlt.nodo_asociado} onChange={e => setNewOlt({ ...newOlt, nodo_asociado: e.target.value })}>
                                        <option value="">— Todas las zonas —</option>
                                        {nodos.map(n => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                                <button className="btn btn-primary" onClick={handleOltSave} disabled={oltSaving}>
                                    {oltSaving ? 'Guardando...' : isEditingOlt ? 'Actualizar OLT' : 'Registrar OLT'}
                                </button>
                                <button className="btn btn-secondary" onClick={handleOltTestRaw} disabled={oltTestingRaw} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    {oltTestingRaw ? 'Probando...' : '⚡ Probar Conexión'}
                                </button>
                                {isEditingOlt && (
                                    <button className="btn btn-secondary" onClick={() => { setIsEditingOlt(null); setNewOlt({ nombre: '', host: '', port: 22, username: 'root', password: 'admin', nodo_asociado: '', device_type: 'huawei' }); }}>Cancelar</button>
                                )}
                            </div>
                        </div>

                        {/* Tabla de OLTs */}
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                        {['ID', 'Nombre', 'Host', 'Puerto', 'Usuario', 'Nodo', 'Estado', 'Acciones'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {oltConfigs.length === 0 && (
                                        <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#ef4444' }}>
                                            ⚠️ No hay OLTs registradas. Registra la OLT para poder detectar terminales ópticas.
                                        </td></tr>
                                    )}
                                    {oltConfigs.map(olt => (
                                        <tr key={olt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '10px 12px' }}>{olt.id}</td>
                                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{olt.nombre}</td>
                                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8' }}>{olt.host}</td>
                                            <td style={{ padding: '10px 12px' }}>{olt.port}</td>
                                            <td style={{ padding: '10px 12px' }}>{olt.username}</td>
                                            <td style={{ padding: '10px 12px', color: olt.nodo_asociado ? '#a78bfa' : '#6b7280' }}>{olt.nodo_asociado || 'Todas'}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.8rem', background: olt.active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: olt.active ? '#4ade80' : '#f87171' }}>
                                                    {olt.active ? '● Activa' : '○ Inactiva'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <button className="btn btn-secondary" onClick={() => handleOltEdit(olt)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                                <button className="btn btn-secondary" onClick={() => handleOltToggle(olt)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: olt.active ? '#92400e55' : '#14532d55', color: olt.active ? '#fbbf24' : '#4ade80', border: 'none' }}>
                                                    {olt.active ? 'Desactivar' : 'Activar'}
                                                </button>
                                                <button className="btn btn-secondary" onClick={() => handleOltTestExisting(olt.id)} disabled={oltTestingId === olt.id} style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'none' }}>
                                                    {oltTestingId === olt.id ? 'Probando...' : '⚡ Ping'}
                                                </button>
                                                <button className="btn btn-secondary" onClick={() => handleOltDelete(olt.id)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#ef444455', color: '#fca5a5', border: 'none' }}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: 8, fontSize: '0.82rem', color: '#6b7280' }}>
                            💡 <strong style={{ color: '#38bdf8' }}>Credenciales para tu OLT:</strong> Host <code style={{ color: '#f472b6' }}>172.25.0.2</code> · Puerto <code style={{ color: '#f472b6' }}>22</code> · Usuario <code style={{ color: '#f472b6' }}>root</code> · Password <code style={{ color: '#f472b6' }}>admin</code>
                        </div>
                    </div>
                )}

            </div>
        </motion.div>
    );
};

export default Configuraciones;
