import React, { useEffect, useState } from 'react';
import { clienteService, oltService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Página para flujo de activación: individual, masiva, verificación técnica y deshacer.
const Activacion = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Modals individuales
  const [showMacModal, setShowMacModal] = useState(false);
  const [macList, setMacList] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [macSource, setMacSource] = useState(null);
  const [loadingMacs, setLoadingMacs] = useState(false);
  const [oltInfo, setOltInfo] = useState(null);   
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionType, setProvisionType] = useState(''); 

  // Verificación Técnica (Modal Post-Activación)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTaskData, setConfirmTaskData] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // Activación Masiva (Bulk)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProvisionType, setBulkProvisionType] = useState('ont');
  const [bulkStatus, setBulkStatus] = useState(null);
  const [bulkPolling, setBulkPolling] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  // Deshacer Última Activación
  const [undoing, setUndoing] = useState(false);

  // Ver Potencia
  const [showPotenciaModal, setShowPotenciaModal] = useState(false);
  const [potenciaCliente, setPotenciaCliente] = useState(null);
  const [potenciaData, setPotenciaData] = useState(null);
  const [loadingPotencia, setLoadingPotencia] = useState(false);
  const [potenciaError, setPotenciaError] = useState(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await clienteService.listar();
      const items = (res.data || []).filter(c => ['Pendiente', 'En Activación'].includes(c.estado));
      items.sort((a, b) => b.id - a.id);
      setClientes(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openMacModal = async (cliente) => {
    setSelectedCliente(cliente);
    setShowMacModal(true);
    setSelectedCandidate(null);
    setMacList([]);
    setMacSource(null);
    setOltInfo(null);
    setLoadingMacs(true);
    try {
      const res = await oltService.getMacCandidates(cliente.id, cliente.nodo, cliente.puerto).catch(() => null);
      if (res && res.data) {
        const data = res.data;
        setOltInfo({
          nombre: data.olt_nombre,
          host: data.olt_host,
          error: data.error || null,
        });
        setMacSource(data.source || 'error');
        setMacList((data.candidates || []).map(c => ({
          mac: c.mac,
          sn: c.sn,
          sn_raw: c.sn_raw,
          gpon_port: c.gpon_port,
          ont_id: c.ont_id,
          status: c.status,
          loid: c.loid,
          vendor: c.vendor,
          equip_id: c.equip_id,
          autofind_time: c.autofind_time,
          raw: c.raw,
        })));
      } else {
        setMacList([]);
        setMacSource('error');
        setOltInfo({ nombre: null, host: null, error: 'Sin respuesta del servidor' });
      }
    } catch (e) {
      console.error(e);
      setMacList([]);
      setMacSource('error');
      setOltInfo({ nombre: null, host: null, error: e.message });
    } finally {
      setLoadingMacs(false);
    }
  };

  const confirmActivate = async (type) => {
    if (!selectedCliente || !selectedCandidate || !type) return;
    setCreatingTask(true);
    try {
      const gponPort = selectedCandidate.gpon_port || `0/0/${selectedCliente.puerto || 1}`;
      const puerto = Number(gponPort.split('/').pop()) || 0;
      const profile = String(100 + puerto);

      const payload = {
        mac: selectedCandidate.mac.replace(/[:\-]/g, '').toUpperCase(),
        gpon_port: gponPort,
        ont_id: selectedCandidate.ont_id || selectedCliente.id_port || '1',
        description: `${selectedCliente.id} ${selectedCliente.nombre}`,
        profile_id: profile,
        srvprofile_id: profile,
        provision_type: type
      };

      const res = await oltService.createTask(selectedCliente.id, 'add_ont', payload);
      const id = res.data.id;
      setTaskId(id);
      setTaskStatus({ status: 'pending', message: 'Tarea encolada' });
      setShowProvisionModal(false);
      startPolling(id);
    } catch (e) {
      console.error(e);
      setTaskStatus({ status: 'failed', message: 'No se pudo crear la tarea' });
    } finally {
      setCreatingTask(false);
    }
  };

  const startPolling = (id) => {
    setPolling(true);
    setTaskStatus({ status: 'processing', message: 'Procesando...' });
    const interval = setInterval(async () => {
      try {
        const res = await oltService.getTask(id);
        const t = res.data;
        setTaskStatus({ status: t.status, message: t.error_message || '...', response: t.response_json });
        if (['completed', 'failed', 'cancelled'].includes(t.status)) {
          clearInterval(interval);
          setPolling(false);
          fetchClientes();
          
          if (t.status === 'completed') {
            // Mostrar modal de verificación técnica
            setConfirmTaskData({
              id: t.id,
              cliente_id: t.cliente_id,
              gpon_port: t.payload_json?.gpon_port || t.response_json?.gpon_port || '—',
              ont_id: t.payload_json?.ont_id || t.response_json?.ont_id || '—',
              service_port: t.response_json?.service_port || '—',
              ip: t.response_json?.ip || t.response_json?.target_ip || '—',
              ip_dhcp: t.response_json?.dhcp_ip || t.response_json?.lease_ip || '—',
              comentario: `${String(t.cliente_id).padStart(6, '0')} - ${t.cliente_nombre || 'Cliente'}`,
              potencia: t.response_json?.rx_power || '—',
              log: t.response_json?.mikrotik_log || '—'
            });
            setShowConfirmModal(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  };

  // Confirmar Activación (Aceptar)
  const handleConfirmAceptar = async () => {
    if (!confirmTaskData) return;
    setConfirming(true);
    try {
      await oltService.confirmTask(confirmTaskData.id);
      setShowConfirmModal(false);
      setConfirmTaskData(null);
      alert('Activación completada y confirmada con éxito.');
    } catch (e) {
      console.error(e);
      alert('Error al confirmar activación.');
    } finally {
      setConfirming(false);
    }
  };

  // Reactivar (Borrar y re-activar)
  const handleConfirmReactivar = async () => {
    if (!confirmTaskData) return;
    setConfirming(true);
    try {
      const res = await oltService.retryActivation(confirmTaskData.id);
      setShowConfirmModal(false);
      const removeTaskId = res.data.remove_task_id;
      
      // Polling de la tarea de borrado
      setTaskStatus({ status: 'processing', message: 'Reactivando: Eliminando configuración previa...' });
      const interval = setInterval(async () => {
        try {
          const rRes = await oltService.getTask(removeTaskId);
          const t = rRes.data;
          if (t.status === 'completed') {
            clearInterval(interval);
            // El borrado terminó con éxito, ahora relanzar add_ont automáticamente
            alert('Configuración anterior borrada con éxito. Iniciando nueva activación...');
            
            // Recrear la tarea de activación (add_ont) con la MAC y parámetros previos
            const gponPort = confirmTaskData.gpon_port;
            const puerto = Number(gponPort.split('/').pop()) || 0;
            const profile = String(100 + puerto);

            const payload = {
              mac: confirmTaskData.log.match(/MAC ([A-F0-9:]{17})/i)?.[1]?.replace(/[:\-]/g, '') || '',
              gpon_port: gponPort,
              ont_id: confirmTaskData.ont_id,
              description: confirmTaskData.comentario,
              profile_id: profile,
              srvprofile_id: profile,
              provision_type: 'ont'
            };

            const aRes = await oltService.createTask(confirmTaskData.cliente_id, 'add_ont', payload);
            startPolling(aRes.data.id);
          } else if (t.status === 'failed') {
            clearInterval(interval);
            setTaskStatus({ status: 'failed', message: 'Reactivación falló en la eliminación previa.' });
            alert('Error al eliminar la ONT/MikroTik antigua.');
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);

    } catch (e) {
      console.error(e);
      alert('Error al iniciar reactivación.');
    } finally {
      setConfirming(false);
    }
  };

  // Deshacer última activación
  const handleDeshacerUltima = async () => {
    if (!window.confirm('¿Está seguro de que desea deshacer la última activación exitosa? Esto eliminará la ONT de la OLT y la IP del MikroTik.')) return;
    setUndoing(true);
    try {
      const res = await oltService.undoLastActivation();
      const removeTaskId = res.data.remove_task_id;
      
      setTaskStatus({ status: 'processing', message: 'Deshaciendo última activación...' });
      const interval = setInterval(async () => {
        try {
          const tRes = await oltService.getTask(removeTaskId);
          const t = tRes.data;
          if (t.status === 'completed') {
            clearInterval(interval);
            setTaskStatus(null);
            fetchClientes();
            alert('Última activación deshecha correctamente.');
          } else if (t.status === 'failed') {
            clearInterval(interval);
            setTaskStatus({ status: 'failed', message: 'Falló al deshacer la última activación.' });
            alert('Error al deshacer la activación en la OLT.');
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);

    } catch (e) {
      console.error(e);
      alert(e.response?.data?.detail || 'No se encontró activación completada reciente para deshacer.');
    } finally {
      setUndoing(false);
    }
  };

  // Iniciar Activación Masiva (todos los candidatos)
  const handleBulkActivate = async () => {
    if (!macList || macList.length === 0) return;
    setShowMacModal(false);
    setShowBulkModal(true);
    setBulkStatus(null);
    setBulkError(null);
  };

  const confirmBulkActivate = async () => {
    setBulkPolling(true);
    setBulkError(null);

    // Mapear clientes pendientes a las MACs descubiertas para formar el lote
    const items = [];
    clientes.forEach((cli) => {
      // Intentar hacer match por el puerto GPON
      const candidate = macList.find(m => {
        const macPortNum = m.gpon_port?.split('/').pop();
        return String(macPortNum) === String(cli.puerto);
      });
      if (candidate) {
        items.push({
          cliente_id: cli.id,
          mac: candidate.mac,
          gpon_port: candidate.gpon_port,
          ont_id: candidate.ont_id,
          provision_type: bulkProvisionType
        });
      }
    });

    if (items.length === 0) {
      setBulkError('No se encontraron coincidencias automáticas de puerto entre clientes pendientes y ONTs descubiertas.');
      setBulkPolling(false);
      return;
    }

    try {
      const res = await oltService.bulkActivate(items, bulkProvisionType);
      const bulkId = res.data.bulk_id;
      
      // Iniciar polling del lote masivo
      const interval = setInterval(async () => {
        try {
          const sRes = await oltService.getBulkStatus(bulkId);
          const status = sRes.data;
          setBulkStatus(status);

          if (status.pending === 0) {
            clearInterval(interval);
            setBulkPolling(false);
            fetchClientes();
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);

    } catch (e) {
      console.error(e);
      setBulkError(e.response?.data?.detail || 'Error al iniciar la activación masiva.');
      setBulkPolling(false);
    }
  };

  const handleVerPotencia = async (cliente) => {
    setPotenciaCliente(cliente);
    setPotenciaData(null);
    setPotenciaError(null);
    setLoadingPotencia(true);
    setShowPotenciaModal(true);
    try {
      const res = await oltService.getOntPotencia(cliente.id);
      setPotenciaData(res.data);
    } catch (e) {
      setPotenciaError(e.response?.data?.detail || e.message || 'Error al consultar potencia');
    } finally {
      setLoadingPotencia(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Activación de Clientes</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn"
            onClick={handleDeshacerUltima}
            disabled={undoing || polling}
            style={{
              backgroundColor: 'rgba(239,68,68,0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {undoing ? 'Deshaciendo...' : '↩️ Deshacer Última Activación'}
          </button>
        </div>
      </div>

      {loading ? <div>Cargando...</div> : (
        <div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Puerto</th>
                <th>MAC</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.estado}</td>
                  <td>{c.puerto}</td>
                  <td>{c.mac || '—'}</td>
                  <td>
                    <button className="btn" onClick={() => openMacModal(c)}>Activar</button>
                    {' '}
                    <button
                      className="btn"
                      title="Ver potencia óptica ONT"
                      onClick={() => handleVerPotencia(c)}
                      style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '4px 10px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}
                    >
                      📡 Potencia
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Estado de la tarea en curso */}
      {taskStatus && (
        <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <strong>Estado tarea:</strong> <span style={{ color: taskStatus.status === 'completed' ? '#2ecc71' : taskStatus.status === 'failed' ? '#ef4444' : '#38bdf8' }}>{taskStatus.status}</span> — {taskStatus.message}
          {taskStatus.response && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: '#aaa' }}>Ver detalles técnicos</summary>
              <pre style={{ background: '#111', color: '#0f0', padding: 12, borderRadius: 6, marginTop: 8, overflowX: 'auto', maxHeight: 200 }}>
                {JSON.stringify(taskStatus.response, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Modal de selección MAC */}
      {showMacModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '550px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Seleccionar MAC para cliente {selectedCliente?.nombre}</h3>
              {macList.length > 1 && (
                <button
                  className="btn"
                  onClick={handleBulkActivate}
                  style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12 }}
                >
                  ⚡ Activar Todas ({macList.length})
                </button>
              )}
            </div>

            <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 6, fontSize: 13, fontWeight: '500' }}>
              {loadingMacs ? (
                <div style={{ color: '#aaa', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #555', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Ejecutando <code>display ont autofind all</code> en la OLT...
                </div>
              ) : macSource === 'olt' && macList.length > 0 ? (
                <div style={{ color: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.08)', padding: '6px 10px', borderRadius: 4, border: '1px solid rgba(46,204,113,0.2)' }}>
                  🟢 {macList.length} terminal{macList.length !== 1 ? 'es' : ''} detectada{macList.length !== 1 ? 's' : ''} en tiempo real
                  {oltInfo?.nombre && <span style={{ color: '#6b7280', marginLeft: 8, fontWeight: 400 }}>— OLT: {oltInfo.nombre} ({oltInfo.host})</span>}
                </div>
              ) : macSource === 'olt' && macList.length === 0 ? (
                <div style={{ color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: 4, border: '1px solid rgba(245,158,11,0.2)' }}>
                  🟡 OLT conectada pero sin terminales nuevas detectadas
                  {oltInfo?.nombre && <span style={{ color: '#6b7280', marginLeft: 8, fontWeight: 400 }}>— {oltInfo.nombre} ({oltInfo.host})</span>}
                </div>
              ) : macSource === 'error' ? (
                <div style={{ color: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.08)', padding: '6px 10px', borderRadius: 4, border: '1px solid rgba(231,76,60,0.2)' }}>
                  ❌ No se pudo contactar la OLT
                  {oltInfo?.error && <div style={{ color: '#9ca3af', fontWeight: 400, marginTop: 4, fontSize: 11, fontFamily: 'monospace' }}>{oltInfo.error}</div>}
                </div>
              ) : null}
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loadingMacs ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                  Buscando terminales ópticas detectadas...
                </div>
              ) : macList.length ? (
                macList.map((m, idx) => {
                  const isSelected = selectedCandidate && selectedCandidate.mac === m.mac;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: 12,
                        gap: 12,
                        alignItems: 'flex-start',
                        backgroundColor: isSelected ? 'rgba(46, 204, 113, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid #2ecc71' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 6,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: 15, color: isSelected ? '#2ecc71' : '#38bdf8', fontFamily: 'monospace' }}>
                          {m.sn || m.mac || 'Sin identificador'}
                        </strong>
                        <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                          {m.gpon_port && <span>📡 Puerto: <strong style={{ color: '#e2e8f0' }}>{m.gpon_port}</strong></span>}
                          {m.vendor && <span>🏭 Vendor: <strong style={{ color: '#e2e8f0' }}>{m.vendor}</strong></span>}
                          {m.equip_id && <span>🔧 Equipo: <strong style={{ color: '#e2e8f0' }}>{m.equip_id}</strong></span>}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <button
                          className="btn"
                          onClick={() => setSelectedCandidate(m)}
                          style={{
                            backgroundColor: isSelected ? '#2ecc71' : '#34495e',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                  La OLT no reporta terminales sin activar en este momento.
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn" onClick={() => setShowMacModal(false)}>Cancelar</button>
              <button
                className="btn primary"
                onClick={() => {
                  setShowMacModal(false);
                  setShowProvisionModal(true);
                  setProvisionType(''); 
                }}
                disabled={!selectedCandidate || creatingTask}
                style={{
                  backgroundColor: '#2ecc71',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  fontWeight: 'bold',
                  opacity: (!selectedCandidate || creatingTask) ? 0.5 : 1,
                  cursor: (!selectedCandidate || creatingTask) ? 'not-allowed' : 'pointer'
                }}
              >
                Confirmar y Activar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tipo de Aprovisionamiento */}
      {showProvisionModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: 12 }}>Tipo de Aprovisionamiento</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 8,
                border: provisionType === 'ont' ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                background: provisionType === 'ont' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="provisionType"
                  value="ont"
                  checked={provisionType === 'ont'}
                  onChange={(e) => setProvisionType(e.target.value)}
                  style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                />
                <div>
                  <strong style={{ display: 'block', color: '#f8fafc', fontSize: '15px' }}>ONT</strong>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Activación Router (2 comandos)</span>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 8,
                border: provisionType === 'bridge' ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                background: provisionType === 'bridge' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="provisionType"
                  value="bridge"
                  checked={provisionType === 'bridge'}
                  onChange={(e) => setProvisionType(e.target.value)}
                  style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                />
                <div>
                  <strong style={{ display: 'block', color: '#f8fafc', fontSize: '15px' }}>Bridge</strong>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Activación Bridge (3 comandos)</span>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn" onClick={() => {
                setShowProvisionModal(false);
                setShowMacModal(true);
              }}>
                Cancelar
              </button>
              <button
                className="btn primary"
                onClick={() => confirmActivate(provisionType)}
                disabled={!provisionType || creatingTask}
                style={{
                  backgroundColor: '#2ecc71',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  fontWeight: 'bold'
                }}
              >
                {creatingTask ? 'Activando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Técnica (Post-Activación) */}
      {showConfirmModal && confirmTaskData && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '650px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#38bdf8' }}>🔍 Verificación Técnica de Activación</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Cliente</span>
                <div style={{ fontWeight: 600, color: '#fff' }}>{confirmTaskData.comentario}</div>
              </div>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>GPON Port / ONT ID</span>
                <div style={{ fontWeight: 600, color: '#fff' }}>{confirmTaskData.gpon_port} — ID {confirmTaskData.ont_id}</div>
              </div>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Service Port OLT</span>
                <div style={{ fontWeight: 600, color: '#fff' }}>{confirmTaskData.service_port}</div>
              </div>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Potencia Óptica</span>
                <div style={{ fontWeight: 600, color: '#2ecc71' }}>{confirmTaskData.potencia} dBm</div>
              </div>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>IP Estática Asignada</span>
                <div style={{ fontWeight: 600, color: '#38bdf8' }}>{confirmTaskData.ip}</div>
              </div>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>IP DHCP Inicial</span>
                <div style={{ fontWeight: 600, color: '#f59e0b' }}>{confirmTaskData.ip_dhcp}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Log de Aprovisionamiento MikroTik</span>
              <pre style={{ background: '#111', color: '#0f0', padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto', maxHeight: 150, margin: 0 }}>
                {confirmTaskData.log}
              </pre>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, marginBottom: 24 }}>
              <strong style={{ color: '#f59e0b', display: 'block', marginBottom: 4 }}>⚠️ Verifique en la WAN del equipo o en el MikroTik:</strong>
              <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>
                1. La IP del lease ha quedado estática.<br />
                2. El comentario coincide con el código de cliente.<br />
                3. La IP del equipo es la IP asignada por Opsatel ({confirmTaskData.ip}).
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                className="btn"
                onClick={handleConfirmReactivar}
                disabled={confirming}
                style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 20px', borderRadius: 6 }}
              >
                🔄 REACTIVAR
              </button>
              <button
                className="btn primary"
                onClick={handleConfirmAceptar}
                disabled={confirming}
                style={{ backgroundColor: '#2ecc71', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 'bold' }}
              >
                ✅ ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Activación Masiva (Bulk Status) */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '500px', maxWidth: '90%' }}>
            <h3>⚡ Activación Masiva de ONTs</h3>

            {!bulkStatus && !bulkError && (
              <div>
                <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
                  Se activarán secuencialmente todas las terminales detectadas en autofind que tengan coincidencia de puerto con clientes en estado Pendiente.
                </p>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Tipo de aprovisionamiento para el lote:</label>
                  <select
                    value={bulkProvisionType}
                    onChange={(e) => setBulkProvisionType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff' }}
                  >
                    <option value="ont">ONT (Router)</option>
                    <option value="bridge">Bridge</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn" onClick={() => setShowBulkModal(false)}>Cancelar</button>
                  <button className="btn primary" onClick={confirmBulkActivate} style={{ backgroundColor: '#6366f1' }}>Comenzar Activación</button>
                </div>
              </div>
            )}

            {bulkError && (
              <div>
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: 12, borderRadius: 6, marginBottom: 20 }}>
                  ❌ {bulkError}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => setShowBulkModal(false)}>Cerrar</button>
                </div>
              </div>
            )}

            {bulkStatus && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span>Progreso:</span>
                  <strong>{bulkStatus.completed + bulkStatus.failed} de {bulkStatus.total}</strong>
                </div>
                
                {/* Barra de progreso */}
                <div style={{ width: '100%', height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden', marginBottom: 20 }}>
                  <div
                    style={{
                      width: `${((bulkStatus.completed + bulkStatus.failed) / bulkStatus.total) * 100}%`,
                      height: '100%',
                      background: '#6366f1',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                  {bulkStatus.tasks.map((t) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                      <span>Cliente ID: {t.cliente_id}</span>
                      <strong style={{ color: t.status === 'completed' ? '#2ecc71' : t.status === 'failed' ? '#ef4444' : '#38bdf8' }}>
                        {t.status === 'completed' ? '✓ Completado' : t.status === 'failed' ? '✗ Fallido' : '⚡ En cola'}
                      </strong>
                    </div>
                  ))}
                </div>

                {!bulkPolling && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#2ecc71' }}>¡Proceso terminado!</span>
                    <button className="btn primary" onClick={() => { setShowBulkModal(false); fetchClientes(); }}>Finalizar</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Ver Potencia ONT */}
      {showPotenciaModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 480, maxWidth: '94%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#38bdf8' }}>📡 Potencia ONT</h3>
              <button onClick={() => setShowPotenciaModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            {potenciaCliente && (
              <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: 13 }}>
                Cliente: <strong style={{ color: '#f8fafc' }}>{potenciaCliente.nombre}</strong>
                {' — '} Puerto: <code style={{ color: '#38bdf8' }}>{potenciaCliente.puerto}</code>
                {' '} ONT ID: <code style={{ color: '#38bdf8' }}>{potenciaCliente.id_port}</code>
              </p>
            )}
            {loadingPotencia && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', padding: '20px 0' }}>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Consultando OLT en tiempo real...
              </div>
            )}
            {potenciaError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 6 }}>
                ⚠️ {potenciaError}
              </div>
            )}
            {potenciaData && potenciaData.potencia && (() => {
              const p = potenciaData.potencia;
              const rx = parseFloat(p.rx_power);
              const rxOk = !isNaN(rx) && rx >= -27 && rx <= -10;
              const rxWarn = !isNaN(rx) && rx < -27;
              const rxColor = rxOk ? '#2ecc71' : rxWarn ? '#f59e0b' : '#94a3b8';
              const rows = [
                ['RX Power (ONT)', p.rx_power ? `${p.rx_power} dBm` : '—', rxColor],
                ['TX Power (ONT)', p.tx_power ? `${p.tx_power} dBm` : '—', '#94a3b8'],
                ['OLT RX', p.olt_rx_power ? `${p.olt_rx_power} dBm` : '—', '#94a3b8'],
                ['OLT TX', p.olt_tx_power ? `${p.olt_tx_power} dBm` : '—', '#94a3b8'],
                ['Temperatura', p.temperature ? `${p.temperature} °C` : '—', '#94a3b8'],
                ['Voltaje', p.voltage ? `${p.voltage} V` : '—', '#94a3b8'],
                ['Corriente Bias', p.bias_current ? `${p.bias_current} mA` : '—', '#94a3b8'],
                ['Estado', p.status || '—', p.status === 'online' ? '#2ecc71' : '#f59e0b'],
                ['Tiempo Online', p.uptime || '—', '#94a3b8'],
              ];
              return (
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
                  {rows.map(([label, val, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                      <span style={{ color: '#94a3b8' }}>{label}</span>
                      <span style={{ color, fontWeight: 600, fontFamily: 'monospace' }}>{val}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <button
                className="btn"
                onClick={() => handleVerPotencia(potenciaCliente)}
                disabled={loadingPotencia}
                style={{ fontSize: 13 }}
              >
                🔄 Refrescar
              </button>
              <button className="btn" onClick={() => setShowPotenciaModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activacion;
