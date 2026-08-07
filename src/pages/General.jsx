import React, { useEffect, useState } from 'react';
import { clienteService, configuracionService } from '../services/api';
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

  const [planesList, setPlanesList] = useState([]);

  const fetchData = async () => {
    try {
      const response = await clienteService.listar();
      setClientes(response.data);
      if (response.data.length > 0) {
        console.log("DEBUG PRIMER CLIENTE:", response.data[0]);
      }
      const planesResp = await configuracionService.getPlanes();
      setPlanesList(planesResp.data);
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
    // Reglas maestras de bloqueo: No permite editar campos que el sistema genera automáticamente.
    const lockedCols = ['id', 'id_port', 'service_port', 'ip', 'mac'];
    if (lockedCols.includes(col)) return;

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

  const [statusFilter, setStatusFilter] = useState('TODOS');

  const filteredClientes = clientes
    .filter(c => {
      // Filtro por término de búsqueda
      const matchSearch = c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cedula?.includes(searchTerm) ||
        c.id.toString().includes(searchTerm) ||
        c.parroquia?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Filtro por estado
      if (statusFilter === 'ACTIVO') return c.estado?.toUpperCase() === 'ACTIVO';
      if (statusFilter === 'INACTIVO') return c.estado?.toUpperCase() === 'INACTIVO';
      if (statusFilter === 'PENDIENTE') return c.estado?.toUpperCase() === 'PENDIENTE';

      return true;
    })
    .sort((a, b) => a.id - b.id);

  const allColumns = [
    "id", "nombre", "celular", "cedula", "cedula_tipo", "fotos_cedula", "correo", "direccion", "nodo", "parroquia",
    "fecha_firma", "instalation_date", "estado", "comentarios", "observaciones", "iptv_cuenta", "puerto", "ont", "servicio", "breach", "id_port", "service_port",
    "ip", "dispositivo", "potencia", "nap", "ubicacion_cliente", "tecnico", "activador", "red", "clave", "mac",
    "tiempo", "arrienda", "cuenta", "facturas", "app", "payment_date",
    "client_payment_date", "bank", "cod", "plan", "plus", "bank_plus", "adicional", "internet_payment", "total_pago", "total", "notas_pago"
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Vista General de Clientes</h1>
          <p>
            💡 Haz doble clic en cualquier celda para editar el valor.
          </p>
        </div>
        <div className="page-actions">
          <select
            className="input"
            style={{ marginBottom: 0, background: '#1e1b4b' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="PENDIENTE">Pendientes</option>
          </select>
          <input
            className="input"
            placeholder="Buscar por ID, Nombre o Cédula..."
            style={{ marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? <p>Cargando datos...</p> : (
        <div className="table-container" style={{ maxHeight: '72vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <tr>
                {allColumns.map(col => (
                  <th key={col} style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--glass-border)',
                    borderRight: '1px solid var(--glass-border)',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    textAlign: 'left'
                  }}>
                    {col === 'internet_payment' ? 'INTERNET PAY' : col === 'total_pago' ? 'PENDIENTE' : col === 'plus' ? 'IPTV' : col === 'observaciones' ? 'OBSERVACIONES' : col === 'notas_pago' ? 'Nota de Pago / Reparación' : col === 'comentarios' ? 'COMENTARIO CONTRATO' : col === 'iptv_cuenta' ? 'CUENTA IPTV' : col === 'ubicacion_cliente' ? 'UBICACIÓN' : col.replace('_', ' ')}
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
                          cursor: col === 'id' ? 'default' : 'pointer',
                          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
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
                            col === 'plan' ? (
                              <select
                                className="input"
                                style={{ padding: '4px 8px', height: '28px', fontSize: '0.8rem', background: '#1e1b4b', border: '1px solid var(--primary)' }}
                                value={tempValue}
                                onChange={(e) => {
                                  setTempValue(e.target.value);
                                  handleSaveDropdown(c.id, col, e.target.value);
                                }}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                              >
                                <option value="">- Seleccionar -</option>
                                {planesList.map(p => (
                                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                ))}
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
                            {(() => {
                              if (col === 'total') {
                                const totalCobrado = parseFloat(c.pago_mensual || 0);
                                return <span style={{ color: totalCobrado > 0 ? '#4ade80' : 'var(--text-muted)', fontWeight: 'bold' }}>${totalCobrado.toFixed(2)}</span>;
                              }
                              if (col === 'internet_payment' || col === 'plus' || col === 'adicional') {
                                const valPagado = col === 'plus' ? c.plus_pagado : col === 'adicional' ? c.adicional_pagado : c.internet_payment;
                                const hasValue = valPagado && parseFloat(valPagado) > 0;
                                return <span style={{ fontWeight: '500', color: hasValue ? '#4ade80' : 'inherit' }}>{hasValue ? `$${parseFloat(valPagado).toFixed(2)}` : '-'}</span>;
                              }
                              if (col === 'total_pago') {
                                return <span style={{ color: parseFloat(c.total_pago || 0) <= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>${parseFloat(c.total_pago || 0).toFixed(2)}</span>;
                              }
                              if (col === 'plan') {
                                let precio = 0; let isSpecial = false;
                                if (c.tercera_edad && c.precio_plan_especial) { precio = c.precio_plan_especial; isSpecial = true; }
                                else { const plan = planesList.find(p => p.nombre.toLowerCase() === (c.plan || '').toLowerCase()); if (plan) precio = plan.precio; }
                                return <span style={{ color: precio > 0 ? (isSpecial ? '#f59e0b' : '#fbbf24') : 'var(--text-muted)', fontWeight: '600' }}>{precio > 0 ? `$${parseFloat(precio).toFixed(2)}` : '-'}{isSpecial && <small style={{ display: 'block', fontSize: '0.65rem' }}>TERCERA EDAD</small>}</span>;
                              }
                              if (col === 'fotos_cedula') {
                                return <div style={{ display: 'flex', gap: '8px' }}>
                                  {c.cedula_frontal && <a href={c.cedula_frontal} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>Front.</a>}
                                  {c.cedula_posterior && <a href={c.cedula_posterior} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>Post.</a>}
                                  {!c.cedula_frontal && !c.cedula_posterior && '-'}
                                </div>;
                              }
                              if (col === 'observaciones') {
                                return (
                                  <div style={{ fontStyle: 'italic', opacity: 0.8, color: '#a78bfa', whiteSpace: 'pre-line' }}>
                                    {c.observaciones ? c.observaciones.split('/').join('\n') : '-'}
                                  </div>
                                );
                              }
                              if (col === 'iptv_cuenta') {
                                // Mostrar credenciales IPTV si el cliente tiene IPTV activo
                                if (c.tv_tipo === 'IPTV' && c.iptv_user) {
                                  return (
                                    <div style={{ padding: '3px 6px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: '6px', fontSize: '0.7rem', color: '#a5b4fc', whiteSpace: 'nowrap' }}>
                                      <div><strong>👤</strong> {c.iptv_user}</div>
                                      <div><strong>🔑</strong> {c.iptv_pass}</div>
                                      {c.iptv_max_conn ? <div style={{ color: '#6ee7b7', fontSize: '0.65rem' }}>📺 {c.iptv_max_conn} pantallas</div> : null}
                                    </div>
                                  );
                                } else if (c.tv_tipo === 'CATV') {
                                  return <span style={{ color: '#fcd34d', fontSize: '0.7rem' }}>🔌 CATV</span>;
                                }
                                return <span style={{ color: 'var(--text-muted)' }}>-</span>;
                              }
                              if (col === 'ubicacion_cliente') {
                                // Mostrar ubicacion: primero del contrato, sino la dirección
                                const ubicacion = c.ubicacion || c.direccion || null;
                                if (!ubicacion) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
                                return (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.7rem', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    title={ubicacion}
                                  >
                                    📍 {ubicacion.length > 30 ? ubicacion.substring(0, 30) + '...' : ubicacion}
                                  </a>
                                );
                              }
                              if (col === 'comentarios') {
                                return (
                                  <div style={{ color: '#60a5fa', whiteSpace: 'pre-line', fontSize: '0.75rem' }}>
                                    {c.comentarios ? c.comentarios.split('/').join('\n') : '-'}
                                  </div>
                                );
                              }
                              if (col === 'notas_pago') {
                                return (
                                  <div style={{ color: '#fcd34d', whiteSpace: 'pre-line', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                    {c.notas_pago ? c.notas_pago.split('/').join('\n') : '-'}
                                  </div>
                                );
                              }

                              return c[col] !== undefined ? String(c[col] || '-') : '-';
                            })()}
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
