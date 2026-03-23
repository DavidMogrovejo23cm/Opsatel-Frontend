import React, { useState, useEffect } from 'react';
import { configuracionService } from '../services/api';
import { motion } from 'framer-motion';

const Configuraciones = () => {
    const [activeTab, setActiveTab] = useState('Parroquias');

    // States for data
    const [parroquias, setParroquias] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [puertos, setPuertos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // Form states
    const [newParroquia, setNewParroquia] = useState({ nombre: '', base_ip: '' });
    const [newPlan, setNewPlan] = useState({ nombre: '', megas: '', precio: '' });
    const [newBanco, setNewBanco] = useState({ nombre: '' });
    const [newPuerto, setNewPuerto] = useState({ numero: '', parroquia_id: '' });
    const [searchPuerto, setSearchPuerto] = useState('');
    const [newUsuario, setNewUsuario] = useState({ username: '', password: '', rol: 'tecnico' });
    const [isEditingUser, setIsEditingUser] = useState(null);
    const [isEditingParroquia, setIsEditingParroquia] = useState(null);
    const [isEditingPlan, setIsEditingPlan] = useState(null);
    const [isEditingBanco, setIsEditingBanco] = useState(null);
    const [isEditingPuerto, setIsEditingPuerto] = useState(null);

    const fetchData = async () => {
        const user = configuracionService.getCurrentUser();
        const isAdmin = user && (user.rol === 'administrador' || user.rol === 'admin');

        try {
            // Reemplazo Promise.all por peticiones con manejo de error individual para que no se rompa todo si falla una (ej: 401/403 de usuarios)
            const [paRes, plRes, baRes, puRes] = await Promise.all([
                configuracionService.getParroquias().catch(e => ({ data: [] })),
                configuracionService.getPlanes().catch(e => ({ data: [] })),
                configuracionService.getBancos().catch(e => ({ data: [] })),
                configuracionService.getPuertos().catch(e => ({ data: [] })),
            ]);
            
            setParroquias(paRes.data);
            setPlanes(plRes.data);
            setBancos(baRes.data);
            setPuertos(puRes.data);

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
    }, []);

    const handleCreate = async (type) => {
        try {
            if (type === 'Parroquias') {
                if (isEditingParroquia) {
                    await configuracionService.actualizarParroquia(isEditingParroquia, newParroquia);
                    alert('Parroquia actualizada');
                } else {
                    await configuracionService.crearParroquia(newParroquia);
                    alert('Parroquia creada');
                }
                setNewParroquia({ nombre: '', base_ip: '' });
                setIsEditingParroquia(null);
            } else if (type === 'Planes') {
                const planData = { 
                    nombre: newPlan.nombre, 
                    megas: parseInt(newPlan.megas) || 0,
                    precio: parseFloat(newPlan.precio) 
                };
                if (isEditingPlan) {
                    await configuracionService.actualizarPlan(isEditingPlan, planData);
                    alert('Plan actualizado');
                } else {
                    await configuracionService.crearPlan(planData);
                    alert('Plan creado');
                }
                setNewPlan({ nombre: '', megas: '', precio: '' });
                setIsEditingPlan(null);
            } else if (type === 'Bancos') {
                if (isEditingBanco) {
                    await configuracionService.actualizarBanco(isEditingBanco, newBanco);
                    alert('Banco actualizado');
                } else {
                    await configuracionService.crearBanco(newBanco);
                    alert('Banco creado');
                }
                setNewBanco({ nombre: '' });
                setIsEditingBanco(null);
            } else if (type === 'Puertos') {
                if (!newPuerto.numero || !newPuerto.parroquia_id) return alert('Llene todos los campos');

                const nombreEsperado = 'Puerto ' + newPuerto.numero;
                const parroquiaId = parseInt(newPuerto.parroquia_id);

                if (isEditingPuerto) {
                    await configuracionService.actualizarPuerto(isEditingPuerto, { nombre: nombreEsperado, parroquia_id: parroquiaId });
                    alert('Puerto actualizado');
                } else {
                    // Verificar si ya existe un puerto con ese número en esa parroquia
                    const existePuerto = puertos.some(p => p.nombre.toLowerCase() === nombreEsperado.toLowerCase() && p.parroquia_id === parroquiaId);
                    if (existePuerto) {
                        return alert(`¡Error! El ${nombreEsperado} ya se encuentra registrado en esa zona.`);
                    }
                    await configuracionService.crearPuerto({ nombre: nombreEsperado, parroquia_id: parroquiaId });
                    alert('Puerto creado');
                }
                setNewPuerto({ numero: '', parroquia_id: '' });
                setIsEditingPuerto(null);
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
            }
            fetchData();
        } catch (error) {
            alert('Error al procesar: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
        try {
            if (type === 'Parroquias') await configuracionService.eliminarParroquia(id);
            if (type === 'Planes') await configuracionService.eliminarPlan(id);
            if (type === 'Bancos') await configuracionService.eliminarBanco(id);
            if (type === 'Puertos') await configuracionService.eliminarPuerto(id);
            if (type === 'Usuarios') await configuracionService.eliminarUsuario(id);
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

    const handleEditParroquia = (parr) => {
        setIsEditingParroquia(parr.id);
        setNewParroquia({ nombre: parr.nombre, base_ip: parr.base_ip });
        setActiveTab('Parroquias');
    };

    const handleEditPlan = (plan) => {
        setIsEditingPlan(plan.id);
        setNewPlan({ nombre: plan.nombre, megas: plan.megas || '', precio: plan.precio });
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
        setNewPuerto({ numero: numeroMatch ? numeroMatch[0] : '', parroquia_id: puerto.parroquia_id });
        setActiveTab('Puertos');
    };

    const tabs = ['Parroquias', 'Planes', 'Bancos', 'Puertos', 'Usuarios'];

    const renderTable = (data, columns, type) => (
        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        {columns.map(col => <th key={col} style={{ padding: '12px' }}>{col}</th>)}
                        <th style={{ padding: '12px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {columns.map(col => (
                                <td key={col} style={{ padding: '12px' }}>
                                    {col === 'parroquia_id' ? parroquias.find(p => p.id === row[col])?.nombre : row[col]}
                                </td>
                            ))}
                            <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                {type === 'Usuarios' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditUser(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
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
                {activeTab === 'Parroquias' && (
                    <div>
                        <h3>Añadir Parroquia</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre</label>
                                <input className="input" style={{ margin: 0 }} value={newParroquia.nombre} onChange={e => setNewParroquia({ ...newParroquia, nombre: e.target.value.toUpperCase() })} placeholder="Ej. SAYAUSÍ" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Base IP</label>
                                <input className="input" style={{ margin: 0 }} value={newParroquia.base_ip} onChange={e => setNewParroquia({ ...newParroquia, base_ip: e.target.value })} placeholder="Ej. 172.16" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Parroquias')}>{isEditingParroquia ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingParroquia && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingParroquia(null); setNewParroquia({ nombre: '', base_ip: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(parroquias, ['id', 'nombre', 'base_ip'], 'Parroquias')}
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
                            <button className="btn btn-primary" onClick={() => handleCreate('Planes')}>{isEditingPlan ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingPlan && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingPlan(null); setNewPlan({ nombre: '', megas: '', precio: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(planes, ['id', 'nombre', 'megas', 'precio'], 'Planes')}
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
                        <h3>Añadir Puerto por Parroquia</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Parroquia</label>
                                <select className="input" style={{ margin: 0 }} value={newPuerto.parroquia_id} onChange={e => setNewPuerto({ ...newPuerto, parroquia_id: e.target.value })}>
                                    <option value="">Seleccione...</option>
                                    {parroquias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Número</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '8px', color: 'var(--text-muted)' }}>Puerto</span>
                                    <input type="number" min="1" className="input" style={{ margin: 0, width: '100px' }} value={newPuerto.numero} onChange={e => setNewPuerto({ ...newPuerto, numero: e.target.value })} placeholder="Ej. 1" />
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Puertos')}>{isEditingPuerto ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingPuerto && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingPuerto(null); setNewPuerto({ numero: '', parroquia_id: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <input
                                className="input"
                                placeholder="🔍 Buscar por nombre, ID o Parroquia..."
                                value={searchPuerto}
                                onChange={(e) => setSearchPuerto(e.target.value)}
                                style={{ width: '100%', maxWidth: '350px' }}
                            />
                        </div>
                        {renderTable(
                            puertos.filter(p => {
                                const parroquiaName = parroquias.find(parq => parq.id === p.parroquia_id)?.nombre || '';
                                const search = searchPuerto.toLowerCase();
                                return (
                                    p.id.toString().includes(search) ||
                                    p.nombre.toLowerCase().includes(search) ||
                                    parroquiaName.toLowerCase().includes(search)
                                );
                            }),
                            ['id', 'nombre', 'parroquia_id'], 'Puertos'
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
            </div>
        </motion.div>
    );
};

export default Configuraciones;
