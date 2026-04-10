import React, { useEffect, useState } from 'react';
import { clienteService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';

const General = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [planesList, setPlanesList] = useState([]);

  const fetchData = async () => {
    try {
      const response = await clienteService.listar();
      setClientes(response.data);
      const planesResp = await configuracionService.getPlanes();
      setPlanesList(planesResp.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStartEdit = (id, col, value) => {
    const lockedCols = ['id', 'id_port', 'service_port', 'ip', 'mac'];
    if (lockedCols.includes(col)) return;
    setEditingCell({ id, col });
    setTempValue(value || '');
  };

  const executePendingAction = async () => {
    if (pinInput !== "1234566") { alert("PIN Incorrecto"); return; }
    try {
      const { id, col, value } = pendingAction;
      await clienteService.actualizar(id, { [col]: value });
      setEditingCell(null); setShowPinModal(false); setPendingAction(null);
      fetchData();
    } catch (error) { alert("Error"); }
  };

  const filteredClientes = clientes
    .filter(c => c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cedula?.includes(searchTerm) || c.id.toString().includes(searchTerm))
    .sort((a, b) => a.id - b.id);

  const allColumns = [
    "id", "nombre", "celular", "cedula", "nodo", "parroquia", "estado", "plan", "puerto", "nap", "total_pago"
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Vista General</h1>
          <p style={{ fontSize: '0.8rem', color: '#fbbf24' }}>💡 Doble clic para editar.</p>
        </div>
        <input className="input" placeholder="Buscar..." style={{ maxWidth: '250px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="table-container" style={{ maxHeight: '70vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 10 }}>
              <tr>
                {allColumns.map(col => <th key={col} style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>{col.toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {allColumns.map(col => {
                    const isEditing = editingCell?.id === c.id && editingCell?.col === col;
                    return (
                      <td key={col} onDoubleClick={() => handleStartEdit(c.id, col, c[col])} style={{ padding: '10px 12px', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                        {isEditing ? (
                          <input autoFocus className="input" style={{ padding: '4px', height: '24px', fontSize: '0.8rem' }} value={tempValue} onChange={(e) => setTempValue(e.target.value)} onBlur={() => { setPendingAction({id: c.id, col, value: tempValue}); setShowPinModal(true); }} />
                        ) : (
                          <span style={{ color: col === 'estado' && c[col] === 'Activo' ? '#4ade80' : 'inherit' }}>{c[col] || '-'}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="glass" style={{ padding: '30px', borderRadius: '20px', textAlign: 'center' }}>
            <h3>PIN de Seguridad</h3>
            <input type="password" className="input" style={{ textAlign: 'center', margin: '20px 0' }} value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => { setShowPinModal(false); setEditingCell(null); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={executePendingAction}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default General;
