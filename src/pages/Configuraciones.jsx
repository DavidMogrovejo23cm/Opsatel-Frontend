import React, { useState, useEffect } from 'react';
import { configuracionService } from '../services/api';
import { motion } from 'framer-motion';

const Configuraciones = () => {
    const [activeTab, setActiveTab] = useState('Nodos');
    const [nodos, setNodos] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [puertos, setPuertos] = useState([]);
    const [parroquias, setParroquias] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [finanzasBase, setFinanzasBase] = useState({ caja_chica: '0.00', pichincha: '0.00', jep: '0.00' });

    const [newNodo, setNewNodo] = useState({ nombre: '', base_ip: '' });
    const [newPlan, setNewPlan] = useState({ nombre: '', megas: '', precio: '' });
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
            const [paRes, plRes, baRes, puRes, ppRes, finRes] = await Promise.all([
                configuracionService.getNodos().catch(() => ({ data: [] })),
                configuracionService.getPlanes().catch(() => ({ data: [] })),
                configuracionService.getBancos().catch(() => ({ data: [] })),
                configuracionService.getPuertos().catch(() => ({ data: [] })),
                configuracionService.getParroquias().catch(() => ({ data: [] })),
                configuracionService.getFinanzasBase().catch(() => ({ data: { caja_chica: 0, pichincha: 0, jep: 0 } }))
            ]);
            setNodos(paRes.data);
            setPlanes(plRes.data);
            setBancos(baRes.data);
            setPuertos(puRes.data);
            setParroquias(ppRes.data);
            if (finRes.data) setFinanzasBase({ caja_chica: String(finRes.data.caja_chica), pichincha: String(finRes.data.pichincha), jep: String(finRes.data.jep) });
            if (isAdmin) {
                const usRes = await configuracionService.getUsuarios().catch(() => ({ data: [] }));
                setUsuarios(usRes.data);
            }
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (type) => {
        try {
            if (type === 'Nodos') {
                if (isEditingNodo) await configuracionService.actualizarNodo(isEditingNodo, newNodo);
                else await configuracionService.crearNodo(newNodo);
                setNewNodo({ nombre: '', base_ip: '' }); setIsEditingNodo(null);
            } else if (type === 'Planes') {
                const planData = { ...newPlan, megas: parseInt(newPlan.megas) || 0, precio: parseFloat(newPlan.precio) };
                if (isEditingPlan) await configuracionService.actualizarPlan(isEditingPlan, planData);
                else await configuracionService.crearPlan(planData);
                setNewPlan({ nombre: '', megas: '', precio: '' }); setIsEditingPlan(null);
            } else if (type === 'Parroquias') {
                if (isEditingParroquia) await configuracionService.actualizarParroquia(isEditingParroquia, newParroquia);
                else await configuracionService.crearParroquia(newParroquia);
                setNewParroquia({ nombre: '' }); setIsEditingParroquia(null);
            } else if (type === 'Bancos') {
                if (isEditingBanco) await configuracionService.actualizarBanco(isEditingBanco, newBanco);
                else await configuracionService.crearBanco(newBanco);
                setNewBanco({ nombre: '' }); setIsEditingBanco(null);
            } else if (type === 'Puertos') {
                const portData = { nombre: 'Puerto ' + newPuerto.numero, nodo_id: parseInt(newPuerto.nodo_id), limite_ip: newPuerto.limite_ip, limite_device: newPuerto.limite_device, limite_service_port: newPuerto.limite_service_port };
                if (isEditingPuerto) await configuracionService.actualizarPuerto(isEditingPuerto, portData);
                else await configuracionService.crearPuerto(portData);
                setNewPuerto({ numero: '', nodo_id: '', limite_ip: '', limite_device: '', limite_service_port: '' }); setIsEditingPuerto(null);
            } else if (type === 'Usuarios') {
                if (isEditingUser) await configuracionService.actualizarUsuario(isEditingUser, newUsuario);
                else await configuracionService.crearUsuario(newUsuario);
                setNewUsuario({ username: '', password: '', rol: 'tecnico' }); setIsEditingUser(null);
            } else if (type === 'Finanzas Base') {
                await configuracionService.actualizarFinanzasBase({ caja_chica: parseFloat(finanzasBase.caja_chica), pichincha: parseFloat(finanzasBase.pichincha), jep: parseFloat(finanzasBase.jep) });
            }
            fetchData();
            alert('Operación exitosa');
        } catch (error) { alert('Error: ' + (error.response?.data?.detail || error.message)); }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('¿Eliminar registro?')) return;
        try {
            if (type === 'Nodos') await configuracionService.eliminarNodo(id);
            if (type === 'Planes') await configuracionService.eliminarPlan(id);
            if (type === 'Bancos') await configuracionService.eliminarBanco(id);
            if (type === 'Puertos') await configuracionService.eliminarPuerto(id);
            if (type === 'Usuarios') await configuracionService.eliminarUsuario(id);
            if (type === 'Parroquias') await configuracionService.eliminarParroquia(id);
            fetchData();
        } catch (error) { alert('Error al eliminar'); }
    };

    const renderTable = (data, columns, type) => (
        <div className="table-container" style={{ marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        {columns.map(col => <th key={col} style={{ padding: '12px' }}>{col.toUpperCase()}</th>)}
                        <th style={{ padding: '12px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {columns.map(col => (
                                <td key={col} style={{ padding: '12px' }}>
                                    {col === 'nodo_id' ? (nodos.find(p => p.id === row[col])?.nombre || 'N/A') : row[col]}
                                </td>
                            ))}
                            <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#3b82f633' }} onClick={() => {
                                    if(type === 'Nodos') { setIsEditingNodo(row.id); setNewNodo({ nombre: row.nombre, base_ip: row.base_ip }); }
                                    if(type === 'Planes') { setIsEditingPlan(row.id); setNewPlan({ nombre: row.nombre, megas: row.megas, precio: row.precio }); }
                                    if(type === 'Puertos') { setIsEditingPuerto(row.id); setNewPuerto({ numero: row.nombre.match(/\d+/)?.[0] || '', nodo_id: row.nodo_id, limite_ip: row.limite_ip, limite_device: row.limite_device, limite_service_port: row.limite_service_port }); }
                                    if(type === 'Usuarios') { setIsEditingUser(row.id); setNewUsuario({ username: row.username, password: '', rol: row.rol }); }
                                    if(type === 'Parroquias') { setIsEditingParroquia(row.id); setNewParroquia({ nombre: row.nombre }); }
                                    if(type === 'Bancos') { setIsEditingBanco(row.id); setNewBanco({ nombre: row.nombre }); }
                                }}>Editar</button>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#ef444433' }} onClick={() => handleDelete(type, row.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
            <h1 style={{ marginBottom: '24px', fontSize: '1.8rem' }}>Configuraciones del Sistema</h1>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {['Nodos', 'Parroquias', 'Planes', 'Bancos', 'Puertos', 'Usuarios', 'Finanzas Base'].map(tab => (
                    <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(tab)} style={{ whiteSpace: 'nowrap' }}>{tab}</button>
                ))}
            </div>

            <div className="glass" style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px' }}>
                {activeTab === 'Nodos' && (
                    <div className="responsive-grid grid-2">
                        <div className="input-group"><label className="label">Nombre</label><input className="input" value={newNodo.nombre} onChange={e => setNewNodo({...newNodo, nombre: e.target.value.toUpperCase()})} /></div>
                        <div className="input-group"><label className="label">Base IP</label><input className="input" value={newNodo.base_ip} onChange={e => setNewNodo({...newNodo, base_ip: e.target.value})} /></div>
                        <div style={{gridColumn: 'span 2'}}><button className="btn btn-primary" onClick={() => handleCreate('Nodos')}>{isEditingNodo ? 'Actualizar' : 'Guardar'}</button></div>
                        <div style={{gridColumn: 'span 2'}}>{renderTable(nodos, ['id', 'nombre', 'base_ip'], 'Nodos')}</div>
                    </div>
                )}

                {activeTab === 'Parroquias' && (
                    <div className="responsive-grid grid-2">
                        <div className="input-group" style={{gridColumn: 'span 2'}}><label className="label">Nombre</label><input className="input" value={newParroquia.nombre} onChange={e => setNewParroquia({nombre: e.target.value.toUpperCase()})} /></div>
                        <button className="btn btn-primary" onClick={() => handleCreate('Parroquias')}>{isEditingParroquia ? 'Actualizar' : 'Guardar'}</button>
                        <div style={{gridColumn: 'span 2'}}>{renderTable(parroquias, ['id', 'nombre'], 'Parroquias')}</div>
                    </div>
                )}

                {activeTab === 'Planes' && (
                    <div className="responsive-grid grid-3">
                        <div className="input-group"><label className="label">Nombre</label><input className="input" value={newPlan.nombre} onChange={e => setNewPlan({...newPlan, nombre: e.target.value})}/></div>
                        <div className="input-group"><label className="label">Megas</label><input type="number" className="input" value={newPlan.megas} onChange={e => setNewPlan({...newPlan, megas: e.target.value})}/></div>
                        <div className="input-group"><label className="label">Precio</label><input type="number" className="input" value={newPlan.precio} onChange={e => setNewPlan({...newPlan, precio: e.target.value})}/></div>
                        <button className="btn btn-primary" onClick={() => handleCreate('Planes')}>{isEditingPlan ? 'Actualizar' : 'Guardar'}</button>
                        <div style={{gridColumn: 'span 3'}}>{renderTable(planes, ['id', 'nombre', 'megas', 'precio'], 'Planes')}</div>
                    </div>
                )}

                {activeTab === 'Puertos' && (
                    <div className="responsive-grid grid-2">
                        <div className="input-group">
                            <label className="label">Nodo</label>
                            <select className="input" value={newPuerto.nodo_id} onChange={e => setNewPuerto({...newPuerto, nodo_id: e.target.value})}>
                                <option value="">Seleccione...</option>
                                {nodos.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group"><label className="label">Número Puerto</label><input type="number" className="input" value={newPuerto.numero} onChange={e => setNewPuerto({...newPuerto, numero: e.target.value})} /></div>
                        <button className="btn btn-primary" onClick={() => handleCreate('Puertos')}>{isEditingPuerto ? 'Actualizar' : 'Guardar'}</button>
                        <div style={{gridColumn: 'span 2'}}>{renderTable(puertos, ['id', 'nombre', 'nodo_id'], 'Puertos')}</div>
                    </div>
                )}

                {activeTab === 'Usuarios' && (
                    <div className="responsive-grid grid-3">
                        <div className="input-group"><label className="label">Usuario</label><input className="input" value={newUsuario.username} onChange={e => setNewUsuario({...newUsuario, username: e.target.value})} /></div>
                        <div className="input-group"><label className="label">Password</label><input type="password" className="input" value={newUsuario.password} onChange={e => setNewUsuario({...newUsuario, password: e.target.value})} /></div>
                        <div className="input-group"><label className="label">Rol</label>
                            <select className="input" value={newUsuario.rol} onChange={e => setNewUsuario({...newUsuario, rol: e.target.value})}>
                                <option value="tecnico">Técnico</option>
                                <option value="administrador">Administrador</option>
                                <option value="secretario">Secretario</option>
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleCreate('Usuarios')}>{isEditingUser ? 'Actualizar' : 'Guardar'}</button>
                        <div style={{gridColumn: 'span 3'}}>{renderTable(usuarios, ['id', 'username', 'rol'], 'Usuarios')}</div>
                    </div>
                )}

                {activeTab === 'Finanzas Base' && (
                    <div className="responsive-grid grid-3">
                        <div className="input-group"><label className="label">Caja Chica</label><input type="number" className="input" value={finanzasBase.caja_chica} onChange={e => setFinanzasBase({...finanzasBase, caja_chica: e.target.value})} /></div>
                        <div className="input-group"><label className="label">Pichincha</label><input type="number" className="input" value={finanzasBase.pichincha} onChange={e => setFinanzasBase({...finanzasBase, pichincha: e.target.value})} /></div>
                        <div className="input-group"><label className="label">JEP</label><input type="number" className="input" value={finanzasBase.jep} onChange={e => setFinanzasBase({...finanzasBase, jep: e.target.value})} /></div>
                        <button className="btn btn-primary" onClick={() => handleCreate('Finanzas Base')}>Guardar</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Configuraciones;
