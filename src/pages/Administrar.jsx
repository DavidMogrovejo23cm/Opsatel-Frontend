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

  const startEdit = (cliente) => {
    setEditingId(cliente.id);
    setEditData({
      nombre: cliente.nombre || '',
      cedula: cliente.cedula || '',
      celular: cliente.celular || '',
      correo: cliente.correo || '',
      direccion: cliente.direccion || '',
      nodo: cliente.nodo || '',
      parroquia: cliente.parroquia || '',
      plan: cliente.plan || '',
      plus: cliente.plus || '0',
      estado: cliente.estado || '',
      arrienda: cliente.arrienda || '',
      cuenta: cliente.cuenta || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    // Validación básica: Nombre, Cédula y Celular son requeridos
    if (!editData.nombre?.trim() || !editData.cedula?.trim() || !editData.celular?.trim()) {
      return alert('Los campos Nombre, Cédula y Celular son obligatorios.');
    }

    try {
      await clienteService.actualizar(editingId, editData);
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert('Error al guardar cambios');
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEstadoChange = async (clienteId, nuevoEstado) => {
    try {
      await clienteService.actualizar(clienteId, { estado: nuevoEstado });
      fetchData();
    } catch (error) {
      alert('Error al cambiar estado');
    }
  };

  const filteredClientes = clientes.filter(c => {
    // Algoritmo de caducidad: Solo muestra clientes ingresados en los últimos 7 días.
    if (!c.fecha_firma) return false;
    
    const fechaFirma = new Date(c.fecha_firma);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    
    if (fechaFirma < hace7Dias) {
      return false; // Forzamos ocultamiento si pasó más de una semana.
    }

    return c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.id?.toString().includes(searchTerm) ||
           c.cedula?.includes(searchTerm);
  });

  const cellStyle = {
    padding: '10px 8px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap'
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid var(--primary)',
    borderRadius: '6px',
    color: 'white',
    padding: '6px 8px',
    fontSize: '0.8rem',
    outline: 'none'
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Administrar Recientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Únicamente clientes creados en los últimos 7 días.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Buscar por ID, Nombre o Cédula..."
            style={{ maxWidth: '280px', marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {filteredClientes.length} recientes
          </span>
        </div>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <th style={cellStyle}>ID</th>
                <th style={cellStyle}>Nombre</th>
                <th style={cellStyle}>Cédula</th>
                <th style={cellStyle}>Celular</th>
                <th style={cellStyle}>Correo</th>
                <th style={cellStyle}>Dirección</th>
                 <th style={cellStyle}>Nodo</th>
                <th style={cellStyle}>Parroquia</th>
                <th style={cellStyle}>Plan</th>
                <th style={cellStyle}>Plus</th>
                <th style={cellStyle}>Estado</th>
                <th style={cellStyle}>Arrienda</th>
                <th style={cellStyle}>Cuenta</th>
                <th style={cellStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={cellStyle}>{c.id}</td>

                  {editingId === c.id ? (
                    <>
                      <td style={cellStyle}><input style={inputStyle} value={editData.nombre} onChange={(e) => handleEditChange('nombre', e.target.value)} /></td>
                      <td style={cellStyle}><input style={inputStyle} value={editData.cedula} onChange={(e) => handleEditChange('cedula', e.target.value)} /></td>
                      <td style={cellStyle}><input style={inputStyle} value={editData.celular} onChange={(e) => handleEditChange('celular', e.target.value)} /></td>
                      <td style={cellStyle}><input style={{...inputStyle, width: '140px'}} value={editData.correo} onChange={(e) => handleEditChange('correo', e.target.value)} /></td>
                      <td style={cellStyle}><input style={{...inputStyle, width: '140px'}} value={editData.direccion} onChange={(e) => handleEditChange('direccion', e.target.value)} /></td>
                      <td style={cellStyle}>
                        <select style={inputStyle} value={editData.nodo} onChange={(e) => handleEditChange('nodo', e.target.value)}>
                          <option value="" style={{ background: '#1e1b4b' }}>Seleccione</option>
                          {nodosList.map(p => (
                            <option key={p.id} value={p.nombre} style={{ background: '#1e1b4b' }}>{p.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td style={cellStyle}>
                        <select style={inputStyle} value={editData.parroquia} onChange={(e) => handleEditChange('parroquia', e.target.value)}>
                          <option value="" style={{ background: '#1e1b4b' }}>Seleccione</option>
                          {parroquiasList.map(p => (
                            <option key={p.id} value={p.nombre} style={{ background: '#1e1b4b' }}>{p.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td style={cellStyle}>
                        <select style={inputStyle} value={editData.plan} onChange={(e) => handleEditChange('plan', e.target.value)}>
                          <option value="" style={{ background: '#1e1b4b' }}>Seleccione</option>
                          {planesList.map(p => (
                            <option key={p.id} value={p.nombre} style={{ background: '#1e1b4b' }}>{p.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td style={cellStyle}><input style={{...inputStyle, width: '60px'}} type="number" step="0.01" value={editData.plus} onChange={(e) => handleEditChange('plus', e.target.value)} /></td>
                      <td style={cellStyle}>
                        <select style={inputStyle} value={editData.estado} onChange={(e) => handleEditChange('estado', e.target.value)}>
                          <option value="Pendiente" style={{ background: '#1e1b4b' }}>Pendiente</option>
                          <option value="En Activación" style={{ background: '#1e1b4b' }}>En Activación</option>
                          <option value="Activo" style={{ background: '#1e1b4b' }}>Activo</option>
                          <option value="ACTIVO" style={{ background: '#1e1b4b' }}>ACTIVO</option>
                          <option value="Inactivo" style={{ background: '#1e1b4b' }}>Inactivo</option>
                        </select>
                      </td>
                      <td style={cellStyle}><input style={{...inputStyle, width: '70px'}} value={editData.arrienda} onChange={(e) => handleEditChange('arrienda', e.target.value)} /></td>
                      <td style={cellStyle}><input style={{...inputStyle, width: '80px'}} value={editData.cuenta} onChange={(e) => handleEditChange('cuenta', e.target.value)} /></td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={saveEdit}>✓</button>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={cancelEdit}>✗</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{...cellStyle, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.nombre}</td>
                      <td style={cellStyle}>{c.cedula}</td>
                      <td style={cellStyle}>{c.celular}</td>
                      <td style={{...cellStyle, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.correo || '-'}</td>
                      <td style={{...cellStyle, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.direccion || '-'}</td>
                       <td style={cellStyle}>{c.nodo || '-'}</td>
                      <td style={cellStyle}>{c.parroquia || '-'}</td>
                      <td style={cellStyle}>{c.plan}</td>
                      <td style={cellStyle}>{c.plus || '0'}</td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem',
                          background: c.estado?.toUpperCase() === 'ACTIVO' ? 'rgba(16,185,129,0.1)' : (c.estado?.toUpperCase() === 'INACTIVO' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'),
                          color: c.estado?.toUpperCase() === 'ACTIVO' ? '#10b981' : (c.estado?.toUpperCase() === 'INACTIVO' ? '#ef4444' : '#f59e0b')
                        }}>
                          {c.estado}
                        </span>
                      </td>
                      <td style={cellStyle}>{c.arrienda || '-'}</td>
                      <td style={cellStyle}>{c.cuenta || '-'}</td>
                      <td style={cellStyle}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => startEdit(c)}
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClientes.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No se encontraron clientes.</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Administrar;
