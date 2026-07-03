import React, { useEffect, useState } from 'react';
import { clienteService, oltService } from '../services/api';
import { motion } from 'framer-motion';

// Página para flujo de activación: seleccionar cliente, elegir MAC reciente, confirmar y activar

const Activacion = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showMacModal, setShowMacModal] = useState(false);
  const [macList, setMacList] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [macSource, setMacSource] = useState(null);
  const [loadingMacs, setLoadingMacs] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await clienteService.listar();
      // Mostrar sólo 'Pendiente' o 'En Activación'
      const items = (res.data || []).filter(c => ['Pendiente', 'En Activación'].includes(c.estado));
      // Ordenar por id desc (más reciente primero)
      items.sort((a,b) => b.id - a.id);
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
    setMacList([]); // limpiar lista anterior
    setMacSource(null);
    setLoadingMacs(true);
    try {
      // El backend ejecuta 'display ont autofind all' en la OLT Huawei.
      // Si la OLT no responde, el backend hace fallback a la BD (solo clientes Pendiente/En Activación).
      // El frontend NO debe tener su propio fallback de búsqueda en clientes.
      const res = await oltService.getMacCandidates(cliente.id, cliente.nodo, cliente.puerto).catch(() => null);
      if (res && res.data) {
        const candidates = res.data.candidates || [];
        setMacList(candidates.map(c => ({
          mac: c.mac,
          gpon_port: c.gpon_port,
          ont_id: c.ont_id,
          status: c.status,
          date: c.instalation_date,
          cliente_nombre: c.cliente_nombre,
        })));
        // Determinar fuente de los datos
        if (res.data.source) {
          setMacSource(res.data.source);
        } else {
          const hasOltData = candidates.some(c => c.status && !c.status.includes('db-fallback') && !c.status.includes('cliente-mac'));
          setMacSource(hasOltData ? 'olt' : 'db');
        }
      } else {
        setMacList([]);
        setMacSource('error');
      }
    } catch (e) {
      console.error(e);
      setMacList([]);
      setMacSource('error');
    } finally {
      setLoadingMacs(false);
    }
  };

  const confirmActivate = async () => {
    if (!selectedCliente || !selectedCandidate) return;
    setCreatingTask(true);
    try {
      // Construir payload mínimamente requerido para 'add_ont'
      const payload = {
        mac: selectedCandidate.mac.replace(/[:\-]/g, '').toUpperCase(),
        gpon_port: selectedCandidate.gpon_port || `0/0/${selectedCliente.puerto || 1}`,
        ont_id: selectedCandidate.ont_id || selectedCliente.id_port || '1',
        description: `${selectedCliente.id} ${selectedCliente.nombre}`,
        profile_id: selectedCliente.plan || '100',
        srvprofile_id: selectedCliente.plan || '100'
      };

      const res = await oltService.createTask(selectedCliente.id, 'add_ont', payload);
      const id = res.data.id;
      setTaskId(id);
      setTaskStatus({ status: 'pending', message: 'Tarea encolada' });
      setShowMacModal(false);
      // Iniciar polling
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
        setTaskStatus({ status: t.status, message: t.error_message || '...' , response: t.response_json });
        if (['completed', 'failed', 'cancelled'].includes(t.status)) {
          clearInterval(interval);
          setPolling(false);
          // Actualizar lista de clientes
          fetchClientes();
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Activación de Clientes</h2>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de selección MAC */}
      {showMacModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '500px', maxWidth: '90%' }}>
            <h3>Seleccionar MAC para cliente {selectedCliente?.nombre}</h3>
            
            {/* Indicador de procedencia de los datos */}
            <div style={{ marginBottom: 12, padding: 8, borderRadius: 4, fontSize: 13, fontWeight: '500' }}>
              {loadingMacs ? (
                <div style={{ color: '#aaa' }}>Consultando OLT Huawei...</div>
              ) : macSource === 'olt' ? (
                <div style={{ color: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: '6px 10px', borderRadius: 4 }}>
                  🟢 Detectado en tiempo real desde la OLT (autofind activo)
                </div>
              ) : macSource === 'db' ? (
                <div style={{ color: '#e67e22', backgroundColor: 'rgba(230, 126, 34, 0.1)', padding: '6px 10px', borderRadius: 4 }}>
                  ⚠️ Fallback: Clientes pendientes en Base de Datos (OLT no disponible)
                </div>
              ) : macSource === 'error' ? (
                <div style={{ color: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: '6px 10px', borderRadius: 4 }}>
                  ❌ Error al consultar la OLT. Mostrando fallback local.
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
                        padding: 10, 
                        gap: 12, 
                        alignItems: 'center',
                        backgroundColor: isSelected ? 'rgba(46, 204, 113, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid #2ecc71' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 6,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: 15, color: isSelected ? '#2ecc71' : '#fff' }}>{m.mac || 'Sin MAC'}</strong>
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                          {m.gpon_port ? `GPON: ${m.gpon_port}` : ''} {m.ont_id ? ` • ONT ID: ${m.ont_id}` : ''}
                          {m.status ? ` • Estado: ${m.status}` : ''}
                        </div>
                        {m.cliente_nombre && (
                          <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 2 }}>
                            Asociado a: {m.cliente_nombre}
                          </div>
                        )}
                        {m.date && <div style={{ fontSize: 11, color: '#666' }}>Fecha inst: {m.date}</div>}
                      </div>
                      <div>
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
                  No se encontraron terminales ópticas detectadas ni pendientes.
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn" onClick={() => setShowMacModal(false)}>Cancelar</button>
              <button 
                className="btn primary" 
                onClick={confirmActivate} 
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
                {creatingTask ? 'Encolando...' : 'Confirmar y Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado de la tarea */}
      {taskStatus && (
        <div style={{ marginTop: 16 }}>
          <strong>Estado tarea:</strong> {taskStatus.status} — {taskStatus.message}
          {taskStatus.response && <pre style={{ background: '#111', color: '#0f0', padding: 8 }}>{JSON.stringify(taskStatus.response, null, 2)}</pre>}
        </div>
      )}

    </div>
  );
};

export default Activacion;
