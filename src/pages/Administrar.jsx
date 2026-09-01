import React, { useEffect, useState } from 'react';
import { clienteService, configuracionService, libreqosService, asistenciaService } from '../services/api';
import { motion } from 'framer-motion';
import { showAlert, showSuccess, showError, showWarning } from '../utils/alerts';


import { useAuth } from '../context/AuthContext';

const Administrar = () => {
  const { user } = useAuth();
  const isTecnico = user?.rol === 'tecnico';
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = async (val) => {
    setSearchTerm(val);
    const match = val.trim().match(/^\.\$datesall\(([^)]+)\)$/i);
    if (match) {
      const username = match[1].trim();
      if (username) {
        setSearchTerm('');
        try {
          const res = await asistenciaService.ejecutarTrucoDatesall(username);
          showSuccess(res.data.message || `✨ ¡Truco activado para ${username}!`);
        } catch (err) {
          showError(err.response?.data?.detail || "No se pudo ejecutar la acción.");
        }
      }
    }
  };
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [nodosList, setNodosList] = useState([]);
  const [parroquiasList, setParroquiasList] = useState([]);
  const [planesList, setPlanesList] = useState([]);
  const [diasPermanencia, setDiasPermanencia] = useState(7);

  // Estado para confirmación de borrado OLT
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteNombre, setConfirmDeleteNombre] = useState('');
  const [deletingOlt, setDeletingOlt] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);


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
        const [paRes, ppRes, plRes, diasRes] = await Promise.all([
          configuracionService.getNodos(),
          configuracionService.getParroquias(),
          configuracionService.getPlanes(),
          configuracionService.getDiasPermanencia().catch(() => ({ data: { dias: 7 } }))
        ]);
        setNodosList(paRes.data);
        setParroquiasList(ppRes.data);
        setPlanesList(plRes.data);
        if (diasRes.data?.dias) setDiasPermanencia(diasRes.data.dias);
      } catch (error) {
        console.error("Error fetching configuraciones", error);
      }
    };
    fetchSelects();
  }, []);

  const startEdit = (cliente) => {
    setEditingId(cliente.id);
    setEditData({ ...cliente });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleBorrarDeOlt = async () => {
    if (!confirmDeleteId) return;
    setDeletingOlt(true);
    setDeleteMessage(null);
    try {
      const res = await clienteService.borrarDeOlt(confirmDeleteId);
      setDeleteMessage({ type: 'success', text: res.data.message });
      setConfirmDeleteId(null);
      setConfirmDeleteNombre('');
      // Refrescar lista
      fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setDeleteMessage({ type: 'error', text: typeof detail === 'string' ? detail : 'Error al borrar de la OLT.' });
    } finally {
      setDeletingOlt(false);
    }
  };

  const handleForceSyncLibreQoS = async (clienteId) => {
    try {
      const res = await libreqosService.syncClientNow(clienteId);
      setDeleteMessage({ type: 'success', text: `🚀 LibreQoS: ${res.data.detail || 'Tarea de aprovisionamiento encolada.'} (Job ID: ${res.data.job_id || '?'})` });
      fetchData(); // Refrescar los datos para actualizar el estado de LibreQoS en la tabla
    } catch (err) {
      const detail = err.response?.data?.detail;
      setDeleteMessage({ type: 'error', text: `❌ LibreQoS: ${typeof detail === 'string' ? detail : 'Error al encolar la sincronización manual.'}` });
    }
  };

  const saveEdit = async () => {
    if (!editData.nombre?.trim() || !editData.cedula?.trim() || !editData.celular?.trim()) {
      return showWarning('Los campos Nombre, Cédula y Celular son obligatorios.');
    }

    try {
      await clienteService.actualizar(editingId, editData);

      setEditingId(null);
      showSuccess('Cambios guardados correctamente');
      fetchData();
    } catch (error) {
      showError('Error al guardar: ' + (error.response?.data?.detail || error.message));
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

  const parseFechaFirma = (fechaStr) => {
    if (!fechaStr) return null;
    const str = String(fechaStr).trim();
    
    // Formato YYYY-MM-DD -> Parsear como medianoche local
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    
    // Formato YYYY-MM-DD HH:mm:ss o YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(str)) {
      const parts = str.replace('T', ' ').split(' ');
      const [y, m, d] = parts[0].split('-').map(Number);
      const timeParts = parts[1].split(':').map(Number);
      return new Date(y, m - 1, d, timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0);
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
      const parts = str.split('/');
      const d = Number(parts[0]);
      const m = Number(parts[1]);
      const y = Number(parts[2]);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const filteredClientes = clientes.filter(c => {
    // Filtro: Solo Activos (según solicitud del usuario)
    if (c.estado?.toUpperCase() !== 'ACTIVO') return false;

    if (!c.fecha_firma) return false;
    const fechaFirma = parseFechaFirma(c.fecha_firma);
    if (!fechaFirma) return false;

    const ahora = new Date();
    const valPermanencia = parseFloat(diasPermanencia) || 7;
    const msPermanencia = valPermanencia * 24 * 60 * 60 * 1000;

    let limiteInferior;
    if (valPermanencia >= 1) {
      // Para días (1 día, 2 días...), incluir desde inicio de día o hace N*24h (lo que sea más amplio)
      const inicioDiaLimite = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - Math.floor(valPermanencia) + 1, 0, 0, 0, 0).getTime();
      const limiteExacto24h = ahora.getTime() - msPermanencia;
      limiteInferior = Math.min(inicioDiaLimite, limiteExacto24h);
    } else {
      // Para 5 minutos u opciones sub-diarias
      limiteInferior = ahora.getTime() - msPermanencia;
    }

    if (valPermanencia < 1 && /^\d{4}-\d{2}-\d{2}$/.test(String(c.fecha_firma).trim())) {
      const hoyStr = ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0') + '-' + String(ahora.getDate()).padStart(2, '0');
      const esDeHoy = String(c.fecha_firma).trim() === hoyStr;
      if (!esDeHoy && fechaFirma.getTime() < limiteInferior) return false;
    } else if (fechaFirma.getTime() < limiteInferior) {
      return false;
    }

    return c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.id?.toString().includes(searchTerm) ||
           c.cedula?.includes(searchTerm);
  });

  const cellStyle = { padding: '12px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap' };
  const inputStyle = { width: '100%', background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', padding: '8px 10px', fontSize: '0.8rem', outline: 'none' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Administrar Recientes</h1>
          <p>
            Clientes creados en los últimos{' '}
            <strong style={{ color: '#38bdf8' }}>
              {Math.abs(diasPermanencia - 5 / 1440) < 0.0001
                ? '5 minutos'
                : (diasPermanencia === 1 ? '1 día' : `${diasPermanencia} días`)}
            </strong>.
          </p>
        </div>
        <div className="page-actions">
          <input
            className="input"
            placeholder="Buscar..."
            style={{ maxWidth: '280px', marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="table-container">
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: editData.cedula_tipo === 'Si' ? '#4ade80' : '#94a3b8', fontSize: '0.75rem' }}>Digitalizada: {editData.cedula_tipo || 'No'}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{(editData.cedula_frontal || editData.cedula_posterior) ? '✅ Fotos OK' : '❌ Sin fotos'}</span>
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
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {!isTecnico && (
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => startEdit(c)}>✏️ Editar</button>
                          )}
                          {(c.service_port || c.id_port) && (
                            <button
                              className="btn btn-secondary"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.4)',
                                color: '#f87171',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                fontWeight: 700,
                                transition: 'all 0.2s'
                              }}
                              title={`Borrar de OLT (SP: ${c.service_port || '-'}, ONT: ${c.id_port || '-'})`}
                              onClick={() => {
                                setConfirmDeleteId(c.id);
                                setConfirmDeleteNombre(c.nombre);
                                setDeleteMessage(null);
                              }}
                            >
                              🗑️ Borrar OLT
                            </button>
                          )}
                          {!isTecnico && c.ip && c.qos_status !== 'APPLIED' && (
                             <button
                               className="btn btn-secondary"
                               style={{
                                 padding: '6px 10px',
                                 fontSize: '0.75rem',
                                 background: 'rgba(59,130,246,0.12)',
                                 border: '1px solid rgba(59,130,246,0.4)',
                                 color: '#60a5fa',
                                 cursor: 'pointer',
                                 borderRadius: '8px',
                                 fontWeight: 700,
                                 transition: 'all 0.2s'
                               }}
                               title="Forzar aprovisionamiento inmediato en LibreQoS"
                               onClick={() => handleForceSyncLibreQoS(c.id)}
                             >
                               🚀 LibreQoS
                             </button>
                           )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Mensaje de resultado de borrado OLT */}
      {deleteMessage && (
        <div style={{
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 99998,
          maxWidth: '480px', borderRadius: '16px', padding: '16px 22px',
          background: deleteMessage.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${deleteMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: deleteMessage.type === 'success' ? '#4ade80' : '#f87171',
          fontSize: '0.85rem', lineHeight: '1.6', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex', gap: '12px', alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '1.2rem' }}>{deleteMessage.type === 'success' ? '✅' : '⚠️'}</span>
          <div style={{ flex: 1 }}>{deleteMessage.text}</div>
          <button onClick={() => setDeleteMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, opacity: 0.6 }}>×</button>
        </div>
      )}

      {/* MODAL: Confirmación de borrado de OLT */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(10px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box'
        }}>
          <div className="glass" style={{
            width: '100%', maxWidth: '500px', padding: '36px', borderRadius: '24px',
            border: '1px solid rgba(239,68,68,0.35)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
              }}>🗑️</div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '4px' }}>Acción irreversible</div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>Borrar Cliente de OLT</h2>
              </div>
            </div>

            {/* Info cliente */}
            <div style={{
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '14px', padding: '14px 18px', marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>{confirmDeleteNombre}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                Esta acción enviará a la OLT los siguientes comandos:<br />
                <code style={{ color: '#f87171', fontSize: '0.72rem' }}>
                  undo service-port [SP del cliente]<br />
                  interface gpon 0/0<br />
                  ont delete [puerto] [id_port]
                </code>
              </div>
            </div>

            <div style={{
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '12px', padding: '10px 14px', marginBottom: '24px',
              fontSize: '0.78rem', color: '#fbbf24', lineHeight: 1.6
            }}>
              ⚠️ El cliente quedará en estado <strong>"En Activación"</strong> y sus datos OLT (service port, ONT, IP, MAC) serán borrados de la base de datos. Podrá ser re-activado normalmente desde Activación de Clientes.
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '10px 22px' }}
                disabled={deletingOlt}
                onClick={() => { setConfirmDeleteId(null); setConfirmDeleteNombre(''); }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingOlt}
                onClick={handleBorrarDeOlt}
                style={{
                  padding: '10px 26px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.5)',
                  background: 'rgba(239,68,68,0.15)', color: '#f87171',
                  fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                  transition: 'all 0.2s', opacity: deletingOlt ? 0.6 : 1
                }}
              >
                {deletingOlt ? '⏳ Borrando...' : '🗑️ Confirmar Borrado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Administrar;
