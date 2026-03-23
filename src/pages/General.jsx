import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const General = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Actúa como el motor de edición "en vivo" (Inline Editing)
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');

  // Estados para el PIN de seguridad
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

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
  }, []);

  const handleStartEdit = (id, col, value) => {
    // Reglas maestras de bloqueo: No permite editar ID ni activar clientes pendientes desde aquí.
    if (col === 'id') return;
    if (col === 'estado' && value?.toLowerCase() === 'pendiente') return;

    setEditingCell({ id, col });
    setTempValue(value || '');
  };

  const handleSaveEdit = async (id, col) => {
    if (!editingCell) return;

    const original = clientes.find(c => c.id === id)[col];
    if (tempValue === original) {
      setEditingCell(null);
      return;
    }

    setPendingAction({ type: 'edit', id, col, value: tempValue });
    setShowPinModal(true);
    setPinInput('');
  };

  const handleSaveDropdown = async (id, col, newValue) => {
    if (newValue === clientes.find(c => c.id === id)[col]) {
      setEditingCell(null);
      return;
    }

    setPendingAction({ type: 'dropdown', id, col, value: newValue });
    setShowPinModal(true);
    setPinInput('');
  };

  const executePendingAction = async () => {
    if (pinInput !== "1234566") {
      alert("PIN Incorrecto");
      setPinInput('');
      return;
    }

    try {
      const { type, id, col, value } = pendingAction;
      await clienteService.actualizar(id, { [col]: value });
      setEditingCell(null);
      setShowPinModal(false);
      setPendingAction(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error al guardar cambio");
      setShowPinModal(false);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e, id, col) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id, col);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cedula?.includes(searchTerm) ||
    c.id.toString().includes(searchTerm)
  );

  const allColumns = [
    "id", "nombre", "celular", "cedula", "cedula_tipo", "fotos_cedula", "correo", "direccion", "parroquia", "plan",
    "fecha_firma", "instalation_date", "estado", "observaciones", "puerto", "ont", "servicio", "breach", "id_port", "service_port",
    "ip", "dispositivo", "potencia", "nap", "ubicacion", "tecnico", "activador", "red", "clave",
    "tiempo", "arrienda", "cuenta", "facturas", "internet_payment", "app", "payment_date", 
    "client_payment_date", "bank", "cod", "plus", "bank_plus", "adicional", "saldo", "comentarios", "total"
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Vista General de Clientes</h1>
          <p style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '4px' }}>
            💡 Haz doble clic en cualquier celda (o un clic en Estado) para editar el valor.
          </p>
        </div>
        <input 
          className="input" 
          placeholder="Buscar por ID, Nombre o Cédula..." 
          style={{ maxWidth: '300px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? <p>Cargando datos...</p> : (
        <div style={{ overflowX: 'auto', maxHeight: '72vh', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <tr>
                {allColumns.map(col => (
                  <th key={col} style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {col.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {allColumns.map(col => {
                    const isEditing = editingCell?.id === c.id && editingCell?.col === col;
                    
                    return (
                      <td 
                        key={col} 
                        onClick={() => {
                          if (col === 'estado') handleStartEdit(c.id, col, c[col]);
                        }}
                        onDoubleClick={() => {
                          if (col !== 'estado') handleStartEdit(c.id, col, c[col]);
                        }}
                        style={{ 
                          padding: '6px 12px', 
                          whiteSpace: 'nowrap', 
                          minWidth: '100px',
                          background: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          cursor: col === 'id' ? 'default' : 'pointer'
                        }}
                      >
                        {isEditing ? (
                          col === 'estado' ? (
                            <select
                              autoFocus
                              className="input"
                              style={{ 
                                padding: '4px 8px', 
                                height: '28px', 
                                fontSize: '0.8rem',
                                background: '#1e1b4b',
                                border: '1px solid var(--primary)',
                                outline: 'none',
                                appearance: 'none'
                              }}
                              value={tempValue}
                              onChange={(e) => handleSaveDropdown(c.id, col, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                            >
                              {!['Activo', 'ACTIVO', 'Inactivo', 'INACTIVO'].includes(tempValue) && (
                                <option value={tempValue}>{tempValue}</option>
                              )}
                              <option value="Activo">Activo</option>
                              <option value="Inactivo">Inactivo</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Juridico">Juridico</option>
                            </select>
                          ) : (
                            <input 
                              autoFocus
                              className="input"
                              style={{ 
                                padding: '4px 8px', 
                                height: '28px', 
                                fontSize: '0.8rem',
                                background: '#1e1b4b',
                                border: '1px solid var(--primary)'
                              }}
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => handleSaveEdit(c.id, col)}
                              onKeyDown={(e) => handleKeyDown(e, c.id, col)}
                            />
                          )
                        ) : (
                          <span style={{ 
                            color: col === 'estado' ? (
                              c[col]?.toUpperCase() === 'ACTIVO' ? '#4ade80' : 
                              c[col]?.toUpperCase() === 'INACTIVO' ? '#f87171' :
                              c[col]?.toUpperCase() === 'EN PROCESO' ? '#fbbf24' :
                              c[col]?.toUpperCase() === 'JURIDICO' ? '#ec4899' : '#94a3b8'
                            ) : 'inherit',
                            fontWeight: col === 'id' ? '600' : 'normal'
                          }}>
                            {col === 'total' ? (
                              `$${(parseFloat(c.total_pago) || 0).toFixed(2)}`
                            ) : col === 'saldo' ? (
                              parseFloat(c.pago_mensual || 0) <= 0 ? (
                                <span style={{ color: '#f87171' }}>Pendiente</span>
                              ) : (
                                <span style={{ color: '#4ade80' }}>Pagado (${parseFloat(c.pago_mensual).toFixed(2)})</span>
                              )
                            ) : col === 'plus' ? (
                                c.plus || (parseFloat(c.plus_pagado) > 0 ? c.plus_pagado.toFixed(2) : '-')
                            ) : col === 'fotos_cedula' ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {c.cedula_frontal && <a href={`http://127.0.0.1:8000${c.cedula_frontal}`} target="_blank" rel="noreferrer">Frontal</a>}
                                    {c.cedula_posterior && <a href={`http://127.0.0.1:8000${c.cedula_posterior}`} target="_blank" rel="noreferrer">Posterior</a>}
                                    {!c.cedula_frontal && !c.cedula_posterior && '-'}
                                </div>
                            ) : (
                                c[col] || '-'
                            )}
                          </span>
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
      <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Total: {filteredClientes.length} clientes encontrados.</span>
        <span>Presiona Enter para guardar / Esc para cancelar</span>
      </div>

      {showPinModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass" 
            style={{ width: '100%', maxWidth: '320px', padding: '32px', borderRadius: '24px', textAlign: 'center' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔐</div>
            <h2 style={{ marginBottom: '8px' }}>PIN de Seguridad</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Confirmación requerida para modificar datos.
            </p>
            
            <input 
              autoFocus
              type="password"
              className="input"
              placeholder="••••••"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', marginBottom: '24px' }}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') executePendingAction();
                if (e.key === 'Escape') setShowPinModal(false);
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setShowPinModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={executePendingAction}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default General;
