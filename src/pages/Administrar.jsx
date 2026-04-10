import React, { useEffect, useState } from 'react';
import { clienteService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';

const Administrar = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [nodosList, setNodosList] = useState([]);
  const [parroquiasList, setParroquiasList] = useState([]);
  const [planesList, setPlanesList] = useState([]);

  const fetchData = async () => {
    try {
      const response = await clienteService.listar();
      setClientes(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const fetchSelects = async () => {
      try {
        const [paRes, ppRes, plRes] = await Promise.all([
          configuracionService.getNodos(),
          configuracionService.getParroquias(),
          configuracionService.getPlanes()
        ]);
        setNodosList(paRes.data);
        setParroquiasList(ppRes.data);
        setPlanesList(plRes.data);
      } catch (error) {
        console.error("Error fetching configuraciones", error);
      }
    };
    fetchSelects();
  }, []);

  const handleEditChange = (field, value) => {
    if (field === 'tercera_edad') {
      setEditData(prev => ({ ...prev, tercera_edad: value, plan: value ? 'TERCERA EDAD' : '' }));
    } else {
      setEditData(prev => ({ ...prev, [field]: value }));
    }
  };

  const saveEdit = async () => {
    try {
      await clienteService.actualizar(editingId, editData);
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const filteredClientes = clientes.filter(c => {
    if (!c.fecha_firma) return false;
    const fechaFirma = new Date(c.fecha_firma);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    if (fechaFirma < hace7Dias) return false;
    return c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.id?.toString().includes(searchTerm) || c.cedula?.includes(searchTerm);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Administrar Recientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Últimos 7 días.</p>
        </div>
        <div className="flex-between" style={{ gap: '12px' }}>
            <input
                className="input"
                placeholder="Buscar..."
                style={{ width: '200px', marginBottom: 0 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{filteredClientes.length}</span>
        </div>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Celular</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px' }}>{c.id}</td>
                  {editingId === c.id ? (
                      <>
                        <td><input className="input" value={editData.nombre} onChange={(e) => handleEditChange('nombre', e.target.value)} style={{ padding: '4px', height: '30px' }} /></td>
                        <td><input className="input" value={editData.cedula} onChange={(e) => handleEditChange('cedula', e.target.value)} style={{ padding: '4px', height: '30px' }} /></td>
                        <td><input className="input" value={editData.celular} onChange={(e) => handleEditChange('celular', e.target.value)} style={{ padding: '4px', height: '30px' }} /></td>
                        <td>
                            <select className="input" value={editData.plan} onChange={(e) => handleEditChange('plan', e.target.value)} style={{ padding: '4px', height: '30px' }}>
                                {planesList.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                            </select>
                        </td>
                        <td>
                            <select className="input" value={editData.estado} onChange={(e) => handleEditChange('estado', e.target.value)} style={{ padding: '4px', height: '30px' }}>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Activación">En Activación</option>
                                <option value="Activo">Activo</option>
                            </select>
                        </td>
                        <td>
                            <button className="btn btn-primary" onClick={saveEdit} style={{ padding: '4px 8px' }}>✓</button>
                            <button className="btn btn-secondary" onClick={() => setEditingId(null)} style={{ padding: '4px 8px' }}>✗</button>
                        </td>
                      </>
                  ) : (
                    <>
                        <td style={{ fontWeight: 'bold' }}>{c.nombre}</td>
                        <td>{c.cedula}</td>
                        <td>{c.celular}</td>
                        <td>{c.plan}</td>
                        <td>
                            <span style={{ fontSize: '0.7rem', color: c.estado === 'Activo' ? '#10b981' : '#f59e0b' }}>{c.estado}</span>
                        </td>
                        <td>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => { setEditingId(c.id); setEditData({...c}); }}>✏️ Editar</button>
                        </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default Administrar;
