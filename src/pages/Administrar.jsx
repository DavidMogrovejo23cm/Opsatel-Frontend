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

  // Estados para fotos en edición
  const [fileFrontal, setFileFrontal] = useState(null);
  const [filePosterior, setFilePosterior] = useState(null);

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
    setEditData({ ...cliente });
    setFileFrontal(null);
    setFilePosterior(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editData.nombre?.trim() || !editData.cedula?.trim() || !editData.celular?.trim()) {
      return alert('Los campos Nombre, Cédula y Celular son obligatorios.');
    }

    try {
      await clienteService.actualizar(editingId, editData);
      
      // Subir fotos si se seleccionaron
      if (fileFrontal || filePosterior) {
        const uploadData = new FormData();
        if (fileFrontal) uploadData.append('frontal', fileFrontal);
        if (filePosterior) uploadData.append('posterior', filePosterior);
        await clienteService.uploadCedula(editingId, uploadData);
      }

      setEditingId(null);
      fetchData();
    } catch (error) {
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditChange = (field, value) => {
    if (field === 'tercera_edad') {
      setEditData(prev => ({ 
        ...prev, 
        tercera_edad: value,
        plan: value ? 'TERCERA EDAD' : prev.plan
      }));
    } else {
      setEditData(prev => ({ ...prev, [field]: value }));
    }
  };

  const filteredClientes = clientes.filter(c => {
    if (!c.fecha_firma) return false;
    const fechaFirma = new Date(c.fecha_firma);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    if (fechaFirma < hace7Dias) return false;

    return c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.id?.toString().includes(searchTerm) ||
           c.cedula?.includes(searchTerm);
  });

  const cellStyle = { padding: '10px 8px', fontSize: '0.8rem', whiteSpace: 'nowrap' };
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--primary)', borderRadius: '6px', color: 'white', padding: '6px 8px', fontSize: '0.8rem' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Administrar Recientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Clientes creados en los últimos 7 días.</p>
        </div>
        <input
          className="input"
          placeholder="Buscar..."
          style={{ maxWidth: '280px', marginBottom: 0 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? <p>Cargando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <th style={cellStyle}>ID</th>
                <th style={cellStyle}>Nombre / Cédula / Celular</th>
                <th style={cellStyle}>Ubicación / Plan</th>
                <th style={cellStyle}>Digitalizar Cédula (SI/NO)</th>
                <th style={cellStyle}>Fotos Cédula</th>
                <th style={cellStyle}>Estado</th>
                <th style={cellStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={cellStyle}>{c.id}</td>
                  {editingId === c.id ? (
                    <>
                      <td style={cellStyle}>
                        <input style={inputStyle} value={editData.nombre} onChange={(e) => handleEditChange('nombre', e.target.value)} placeholder="Nombre" />
                        <input style={{...inputStyle, marginTop: '5px'}} value={editData.cedula} onChange={(e) => handleEditChange('cedula', e.target.value)} placeholder="Cédula" />
                        <input style={{...inputStyle, marginTop: '5px'}} value={editData.celular} onChange={(e) => handleEditChange('celular', e.target.value)} placeholder="Celular" />
                      </td>
                      <td style={cellStyle}>
                        <select style={inputStyle} value={editData.plan} onChange={(e) => handleEditChange('plan', e.target.value)}>
                          {planesList.map(p => <option key={p.id} value={p.nombre} style={{background: '#1e1b4b'}}>{p.nombre}</option>)}
                        </select>
                        <select style={{...inputStyle, marginTop: '5px'}} value={editData.parroquia} onChange={(e) => handleEditChange('parroquia', e.target.value)}>
                          {parroquiasList.map(p => <option key={p.id} value={p.nombre} style={{background: '#1e1b4b'}}>{p.nombre}</option>)}
                        </select>
                      </td>
                      <td style={cellStyle}>
                        <select style={inputStyle} value={editData.cedula_tipo} onChange={(e) => handleEditChange('cedula_tipo', e.target.value)}>
                          <option value="No" style={{background: '#1e1b4b'}}>No</option>
                          <option value="Si" style={{background: '#1e1b4b'}}>Si</option>
                        </select>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <label style={{fontSize: '10px'}}>{fileFrontal ? '✅ Frontal' : '📁 Frontal'}<input type="file" style={{display: 'none'}} onChange={e => setFileFrontal(e.target.files[0])}/></label>
                          <label style={{fontSize: '10px'}}>{filePosterior ? '✅ Post.' : '📁 Post.'}<input type="file" style={{display: 'none'}} onChange={e => setFilePosterior(e.target.files[0])}/></label>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <select style={inputStyle} value={editData.estado} onChange={(e) => handleEditChange('estado', e.target.value)}>
                          <option value="Pendiente" style={{background: '#1e1b4b'}}>Pendiente</option>
                          <option value="En Activación" style={{background: '#1e1b4b'}}>En Activación</option>
                          <option value="Activo" style={{background: '#1e1b4b'}}>Activo</option>
                        </select>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={saveEdit}>✅</button>
                          <button onClick={cancelEdit}>❌</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={cellStyle}>
                        <div style={{fontWeight: 'bold'}}>{c.nombre}</div>
                        <div style={{fontSize: '0.7rem', opacity: 0.6}}>{c.cedula} | {c.celular}</div>
                      </td>
                      <td style={cellStyle}>
                        <div>{c.plan}</div>
                        <div style={{fontSize: '0.7rem', opacity: 0.6}}>{c.parroquia}</div>
                      </td>
                      <td style={cellStyle}>
                        <span style={{ color: c.cedula_tipo === 'Si' ? '#4ade80' : '#94a3b8' }}>{c.cedula_tipo || 'No'}</span>
                      </td>
                      <td style={cellStyle}>
                        {c.foto_cedula_frontal || c.foto_cedula_posterior ? '✅ Digitalizada' : '❌ Sin fotos'}
                      </td>
                      <td style={cellStyle}>
                        <span style={{ color: c.estado === 'Activo' ? '#10b981' : '#f59e0b' }}>{c.estado}</span>
                      </td>
                      <td style={cellStyle}>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => startEdit(c)}>✏️</button>
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
