import React, { useEffect, useState } from 'react';
import { clienteService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';

const Administrar = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [fileFrontal, setFileFrontal] = useState(null);
  const [filePosterior, setFilePosterior] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [nodosList, setNodosList] = useState([]);
  const [parroquiasList, setParroquiasList] = useState([]);
  const [planesList, setPlanesList] = useState([]);


    // Estados para fotos en edición
  
    const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await clienteService.listar();
      const sorted = (response.data || []).sort((a, b) => a.id - b.id);
      setClientes(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    
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
    setFileFrontal(null);
    setFilePosterior(null);
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
      setFileFrontal(null);
      setFilePosterior(null);
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
    // Filtro: Solo Activos (según solicitud del usuario)
    if (c.estado?.toUpperCase() !== 'ACTIVO') return false;

    if (!c.fecha_firma) return false;
    const fechaFirma = new Date(c.fecha_firma);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    if (fechaFirma < hace7Dias) return false;

    return c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.id?.toString().includes(searchTerm) ||
           c.cedula?.includes(searchTerm);
  });

  const cellStyle = { padding: '12px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap' };
  const inputStyle = { width: '100%', background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', padding: '8px 10px', fontSize: '0.8rem', outline: 'none' };

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
                <th style={cellStyle}>Datos Cliente</th>
                <th style={cellStyle}>Técnico / Red</th>
                <th style={cellStyle}>Ubicación / Plan</th>
                <th style={cellStyle}>Potencia</th>
                <th style={cellStyle}>Documentación</th>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
                          <input style={inputStyle} value={editData.nombre} onChange={(e) => handleEditChange('nombre', e.target.value)} placeholder="Nombre" />
                          <input style={inputStyle} value={editData.cedula} onChange={(e) => handleEditChange('cedula', e.target.value)} placeholder="Cédula" />
                          <input style={inputStyle} value={editData.celular} onChange={(e) => handleEditChange('celular', e.target.value)} placeholder="Celular" />
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
                          <input style={inputStyle} value={editData.tecnico} onChange={(e) => handleEditChange('tecnico', e.target.value)} placeholder="Técnico" />
                          <input style={inputStyle} value={editData.red} onChange={(e) => handleEditChange('red', e.target.value)} placeholder="Red" />
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
                          <select style={inputStyle} value={editData.plan} onChange={(e) => handleEditChange('plan', e.target.value)}>
                            {planesList.map(p => <option key={p.id} value={p.nombre} style={{ background: '#1e1b4b' }}>{p.nombre}</option>)}
                          </select>
                          <select style={inputStyle} value={editData.parroquia} onChange={(e) => handleEditChange('parroquia', e.target.value)}>
                            {parroquiasList.map(p => <option key={p.id} value={p.nombre} style={{ background: '#1e1b4b' }}>{p.nombre}</option>)}
                          </select>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <input style={{ ...inputStyle, width: '80px' }} value={editData.potencia} onChange={(e) => handleEditChange('potencia', e.target.value)} placeholder="-22.5" />
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <select style={inputStyle} value={editData.cedula_tipo} onChange={(e) => handleEditChange('cedula_tipo', e.target.value)}>
                            <option value="No">¿Digitalizada? No</option>
                            <option value="Si">¿Digitalizada? Si</option>
                          </select>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <label className="btn btn-secondary" style={{ padding: '6px', fontSize: '10px', flex: 1, textAlign: 'center', cursor: 'pointer', background: fileFrontal ? '#4ade80' : 'rgba(255,255,255,0.05)' }}>
                              {fileFrontal ? '✅ Front.' : '📸 Front.'}
                              <input type="file" style={{ display: 'none' }} onChange={e => setFileFrontal(e.target.files[0])} />
                            </label>
                            <label className="btn btn-secondary" style={{ padding: '6px', fontSize: '10px', flex: 1, textAlign: 'center', cursor: 'pointer', background: filePosterior ? '#4ade80' : 'rgba(255,255,255,0.05)' }}>
                              {filePosterior ? '✅ Post.' : '📸 Post.'}
                              <input type="file" style={{ display: 'none' }} onChange={e => setFilePosterior(e.target.files[0])} />
                            </label>
                          </div>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <select style={{ ...inputStyle, minWidth: '120px' }} value={editData.estado} onChange={(e) => handleEditChange('estado', e.target.value)}>
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Activación">En Activación</option>
                          <option value="Activo">Activo</option>
                          <option value="Suspendido">Suspendido</option>
                          <option value="Retirado">Retirado</option>
                        </select>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={saveEdit} className="btn btn-primary" style={{ padding: '8px', fontSize: '1rem' }} title="Guardar">✅</button>
                          <button onClick={cancelEdit} className="btn btn-secondary" style={{ padding: '8px', fontSize: '1rem' }} title="Cancelar">❌</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 'bold' }}>{c.nombre}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{c.cedula} | {c.celular}</div>
                      </td>
                      <td style={cellStyle}>
                        <div>{c.tecnico}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{c.red}</div>
                      </td>
                      <td style={cellStyle}>
                        <div>{c.plan}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{c.parroquia}</div>
                      </td>
                      <td style={cellStyle}>
                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{c.potencia || '-'}</span>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: c.cedula_tipo === 'Si' ? '#4ade80' : '#94a3b8', fontSize: '0.75rem' }}>Digitalizada: {c.cedula_tipo || 'No'}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{(c.cedula_frontal || c.cedula_posterior) ? '✅ Fotos OK' : '❌ Sin fotos'}</span>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          background: c.estado === 'Activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: c.estado === 'Activo' ? '#10b981' : '#f59e0b'
                        }}>
                          {c.estado}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => startEdit(c)}>✏️ Editar</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showPhotoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(2, 6, 23, 0.9)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '400px', padding: '30px', borderRadius: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>📸 Subir Fotos de Cédula</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>FRONTAL</label>
              <input type="file" className="input" onChange={e => setFileFrontal(e.target.files[0])} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>POSTERIOR</label>
              <input type="file" className="input" onChange={e => setFilePosterior(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowPhotoModal(false)}
                disabled={!fileFrontal || !filePosterior}
              >
                Cargar Archivos
              </button>
              <button className="btn btn-secondary" onClick={() => { setFileFrontal(null); setFilePosterior(null); setShowPhotoModal(false); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Administrar;
