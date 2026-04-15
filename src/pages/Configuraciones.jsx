import React, { useState, useEffect } from 'react';
import { configuracionService } from '../services/api';
import { motion } from 'framer-motion';

const Configuraciones = () => {
    const [activeTab, setActiveTab] = useState('Nodos');

    // States for data
    const [nodos, setNodos] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [puertos, setPuertos] = useState([]);
    const [parroquias, setParroquias] = useState([]);
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

    const fetchData = async () => {
        const user = configuracionService.getCurrentUser();
        const isAdmin = user && (user.rol === 'administrador' || user.rol === 'admin');

        try {
            // Reemplazo Promise.all por peticiones con manejo de error individual para que no se rompa todo si falla una (ej: 401/403 de usuarios)
            const [paRes, plRes, baRes, puRes, ppRes, finRes] = await Promise.all([
                configuracionService.getNodos().catch(e => ({ data: [] })),
                configuracionService.getPlanes().catch(e => ({ data: [] })),
                configuracionService.getBancos().catch(e => ({ data: [] })),
                configuracionService.getPuertos().catch(e => ({ data: [] })),
                configuracionService.getParroquias().catch(e => ({ data: [] })),
                configuracionService.getFinanzasBase().catch(e => ({ data: { caja_chica: 0, pichincha: 0, jep: 0 } }))
            ]);
            
            setNodos(paRes.data);
            setPlanes(plRes.data);
            setBancos(baRes.data);
            setPuertos(puRes.data);
            setParroquias(ppRes.data);
            
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
                    pantallas: parseInt(newPlan.pantallas) || 1
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
        setNewPlan({ 
            nombre: plan.nombre, 
            megas: plan.megas || '', 
            precio: plan.precio,
            pantallas: plan.pantallas || 1
        });
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

    const tabs = ['Nodos', 'Parroquias', 'Planes', 'Bancos', 'Puertos', 'Usuarios', 'Finanzas Base'];

    const renderTable = (data, columns, type) => (
        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
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
            <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Configuraciones del Sistema
            </h1>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
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

                {activeTab === 'Planes' && (
                    <div>
                        <h3>Añadir Plan</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end' }}>
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
                                <label className="label">Pantallas</label>
                                <input type="number" className="input" style={{ margin: 0 }} value={newPlan.pantallas} onChange={e => setNewPlan({ ...newPlan, pantallas: e.target.value })} placeholder="1" />
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
            </div>
        </motion.div>
    );
};

export default Configuraciones;
