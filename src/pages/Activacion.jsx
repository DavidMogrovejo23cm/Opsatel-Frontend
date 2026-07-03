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
    try {
      // Intentar endpoint dedicado en backend
      const res = await oltService.getMacCandidates(cliente.id, cliente.nodo, cliente.puerto).catch(() => null);
      if (res && res.data && Array.isArray(res.data.candidates) && res.data.candidates.length) {
        setMacList(res.data.candidates.map(c => ({ mac: c.mac, gpon_port: c.gpon_port, ont_id: c.ont_id, status: c.status, date: c.instalation_date }))); 
        return;
      }

      // Fallback: compilar lista desde clientes
      const r2 = await clienteService.listar();
      const others = r2.data || [];
      const macsMap = new Map();
      others.sort((a, b) => b.id - a.id);
      for (const o of others) {
        if (o.mac) {
          const clean = String(o.mac).trim().toUpperCase();
          if (!macsMap.has(clean)) {
            macsMap.set(clean, { mac: clean, date: o.instalation_date || null });
          }
        }
      }
      if (cliente.mac) {
        const m = String(cliente.mac).trim().toUpperCase();
        macsMap.delete(m);
        macsMap.set(m, { mac: m, date: cliente.instalation_date || null });
      }
      const macs = Array.from(macsMap.values());
      setMacList(macs);
    } catch (e) {
      console.error(e);
      setMacList([]);
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
          <div className="modal">
            <h3>Seleccionar MAC para cliente {selectedCliente?.nombre}</h3>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {macList.length ? macList.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, gap: 12, alignItems: 'center' }}>
                  <div>
                    <strong>{m.mac || 'Sin MAC'}</strong>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {m.gpon_port ? `GPON: ${m.gpon_port}` : ''} {m.ont_id ? `ONT: ${m.ont_id}` : ''}
                      {m.status ? ` • ${m.status}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>{m.date || ''}</div>
                  </div>
                  <div>
                    <button className="btn" onClick={() => setSelectedCandidate(m)}>Seleccionar</button>
                  </div>
                </div>
              )) : <div>No hay MACs recientes</div>}
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={confirmActivate} disabled={!selectedCandidate || creatingTask}>Activar</button>
              <button className="btn" onClick={() => setShowMacModal(false)}>Cancelar</button>
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
