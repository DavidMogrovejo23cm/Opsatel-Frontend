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

  // Autenticación de entrada: se pide PIN una sola vez al entrar
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEntryPinModal, setShowEntryPinModal] = useState(true);
  const [entryPinInput, setEntryPinInput] = useState('');

  // Estados para el PIN de seguridad (legacy, solo para delete si no autenticado)
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // Estados para el progreso de eliminación completa
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(null);


  const [planesList, setPlanesList] = useState([]);

  // Definición de las columnas del sistema
  const allColumns = [
    "id", "nombre", "celular", "cedula", "cedula_tipo", "fotos_cedula", "correo", "direccion", "nodo", "parroquia",
    "fecha_firma", "instalation_date", "estado", "comentarios", "observaciones", "iptv_cuenta", "puerto", "ont", "servicio", "breach", "id_port", "service_port",
    "ip", "dispositivo", "potencia", "nap", "ubicacion_cliente", "tecnico", "activador", "red", "clave", "mac",
    "tiempo", "arrienda", "facturas", "app", "payment_date", "bank", "cod", "plan", "plus", "bank_plus", "adicional", "internet_payment", "total_pago", "total", "notas_pago"
  ];

  // Estado para los anchos ajustables de cada columna
  const [colWidths, setColWidths] = useState(() => {
    const widths = {};
    allColumns.forEach(col => {
      if (col === 'id') widths[col] = 60;
      else if (col === 'nombre') widths[col] = 220;
      else if (col === 'celular') widths[col] = 130;
      else if (col === 'cedula') widths[col] = 110;
      else widths[col] = 150;
    });
    return widths;
  });

  const handleMouseDown = (e, colName) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colName] || 150;

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      setColWidths(prev => ({
        ...prev,
        [colName]: newWidth
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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

    // Si ya está autenticado, guardar directamente sin PIN
    if (isAuthenticated || col === 'facturas' || col === 'cod') {
      try {
        await clienteService.actualizar(id, { [col]: tempValue });
        setEditingCell(null);
        fetchData();
      } catch (error) {
        console.error(error);
        alert("Error al guardar cambio");
        setEditingCell(null);
      }
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

    // Si ya está autenticado, guardar directamente sin PIN
    if (isAuthenticated || col === 'facturas' || col === 'cod') {
      try {
        await clienteService.actualizar(id, { [col]: newValue });
        setEditingCell(null);
        fetchData();
      } catch (error) {
        console.error(error);
        alert("Error al guardar cambio");
        setEditingCell(null);
      }
      return;
    }

    setPendingAction({ type: 'dropdown', id, col, value: newValue });
    setShowPinModal(true);
    setPinInput('');
  };

  const handleDeleteClick = (cliente) => {
    setPendingAction({ type: 'delete', id: cliente.id, nombre: cliente.nombre });
    if (isAuthenticated) {
      // Ya autenticado, ejecutar directamente
      executePendingActionDirect({ type: 'delete', id: cliente.id, nombre: cliente.nombre });
    } else {
      setShowPinModal(true);
      setPinInput('');
    }
  };

  // Ejecutar acción directamente (sin PIN, ya autenticado)
  const executePendingActionDirect = async (action) => {
    const { type, id, col, value } = action;

    if (type === 'delete') {
      setShowProgressModal(true);
      setDeletionProgress({
        status: 'processing',
        olt: 'PENDIENTE',
        xui: 'PENDIENTE',
        libreqos: 'PENDIENTE',
        database: 'PENDIENTE',
        message: 'Iniciando proceso de eliminación completa...'
      });

      try {
        const response = await clienteService.eliminarCompletamente(id, { pin: '1234566' });
        
        setDeletionProgress({
          status: 'success',
          olt: response.data.olt,
          xui: response.data.xui,
          libreqos: response.data.libreqos,
          database: response.data.database,
          message: '¡El cliente ha sido eliminado exitosamente de todos los sistemas!'
        });
        
        setPendingAction(null);
        fetchData();
      } catch (error) {
        console.error(error);
        const errDetail = error.response?.data?.detail || {};
        const failedStage = errDetail.stage || 'database';
        const errMsg = errDetail.message || 'Error inesperado durante la eliminación';

        setDeletionProgress(prev => ({
          status: 'error',
          olt: failedStage === 'olt' ? 'ERROR' : (prev?.olt || 'PENDIENTE'),
          xui: failedStage === 'xui' ? 'ERROR' : (prev?.xui || 'PENDIENTE'),
          libreqos: failedStage === 'libreqos' ? 'ERROR' : (prev?.libreqos || 'PENDIENTE'),
          database: failedStage === 'database' ? 'ERROR' : (prev?.database || 'PENDIENTE'),
          message: `Fallo en etapa [${failedStage.toUpperCase()}]: ${errMsg}`
        }));
        
        setPendingAction(null);
      }
      return;
    }

    try {
      await clienteService.actualizar(id, { [col]: value });
      setEditingCell(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error al guardar cambio");
      setEditingCell(null);
    }
  };

  const executePendingAction = async () => {
    const originalPin = pinInput; // Keep the PIN for backend confirmation

    if (pinInput !== "1234566") {
      alert("PIN Incorrecto");
      setPinInput('');
      return;
    }

    const { type, id, col, value } = pendingAction;

    if (type === 'delete') {
      setShowPinModal(false);
      setShowProgressModal(true);
      setDeletionProgress({
        status: 'processing',
        olt: 'PENDIENTE',
        xui: 'PENDIENTE',
        libreqos: 'PENDIENTE',
        database: 'PENDIENTE',
        message: 'Iniciando proceso de eliminación completa...'
      });

      try {
        // Enviar borrado total al backend con validación del PIN
        const response = await clienteService.eliminarCompletamente(id, { pin: originalPin });
        
        setDeletionProgress({
          status: 'success',
          olt: response.data.olt,
          xui: response.data.xui,
          libreqos: response.data.libreqos,
          database: response.data.database,
          message: '¡El cliente ha sido eliminado exitosamente de todos los sistemas!'
        });
        
        setPendingAction(null);
        setPinInput('');
        fetchData();
      } catch (error) {
        console.error(error);
        const errDetail = error.response?.data?.detail || {};
        const failedStage = errDetail.stage || 'database';
        const errMsg = errDetail.message || 'Error inesperado durante la eliminación';

        // Mapear qué etapas fallaron en el progress display
        setDeletionProgress(prev => ({
          status: 'error',
          olt: failedStage === 'olt' ? 'ERROR' : (prev?.olt || 'PENDIENTE'),
          xui: failedStage === 'xui' ? 'ERROR' : (prev?.xui || 'PENDIENTE'),
          libreqos: failedStage === 'libreqos' ? 'ERROR' : (prev?.libreqos || 'PENDIENTE'),
          database: failedStage === 'database' ? 'ERROR' : (prev?.database || 'PENDIENTE'),
          message: `Fallo en etapa [${failedStage.toUpperCase()}]: ${errMsg}`
        }));
        
        setPendingAction(null);
        setPinInput('');
      }
      return;
    }

    try {
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
  const [selectedAction, setSelectedAction] = useState('VER'); // 'VER' o 'BORRAR'

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

  // Handler para el PIN de entrada
  const handleEntryPinSubmit = () => {
    if (entryPinInput === '1234566') {
      setIsAuthenticated(true);
      setShowEntryPinModal(false);
    } else {
      alert('PIN Incorrecto');
      setEntryPinInput('');
    }
  };

  // Si no está autenticado, mostrar modal de PIN de entrada
  if (showEntryPinModal && !isAuthenticated) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
      }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass"
          style={{ width: '100%', maxWidth: '360px', padding: '40px', borderRadius: '24px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔐</div>
          <h2 style={{ marginBottom: '8px' }}>Acceso a Vista General</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Ingrese el PIN para acceder y modificar datos.
          </p>

          <input
            autoFocus
            type="password"
            className="input"
            placeholder="••••••"
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', marginBottom: '24px' }}
            value={entryPinInput}
            onChange={(e) => setEntryPinInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEntryPinSubmit();
            }}
          />

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            onClick={handleEntryPinSubmit}
          >
            Ingresar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%', maxWidth: 'none' }}>
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
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="VER">Acción (Ver/Ninguna)</option>
            <option value="BORRAR">Habilitar Borrado</option>
          </select>
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
        <div className="table-container" style={{ maxHeight: '72vh', overflow: 'auto', width: '100%' }}>
          <table style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 20 }}>
              <tr>
                {allColumns.map(col => {
                  const isId = col === 'id';
                  const isNombre = col === 'nombre';

                  // Posiciones sticky para ID y Nombre
                  let stickyStyle = {};
                  if (isId) {
                    stickyStyle = {
                      position: 'sticky',
                      left: 0,
                      zIndex: 22,
                      background: '#131526'
                    };
                  } else if (isNombre) {
                    stickyStyle = {
                      position: 'sticky',
                      left: colWidths['id'] || 60,
                      zIndex: 22,
                      background: '#131526',
                      borderRight: '2px solid rgba(255, 255, 255, 0.15)'
                    };
                  }

                  return (
                    <th key={col} style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--glass-border)',
                      borderRight: '1px solid var(--glass-border)',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                      width: colWidths[col] || 150,
                      minWidth: colWidths[col] || 150,
                      maxWidth: colWidths[col] || 150,
                      position: 'relative',
                      overflow: 'hidden',
                      ...stickyStyle
                    }}>
                      {col === 'internet_payment' ? 'INTERNET PAY' : col === 'total_pago' ? 'PENDIENTE' : col === 'plus' ? 'IPTV' : col === 'observaciones' ? 'OBSERVACIONES' : col === 'notas_pago' ? 'Nota de Pago / Reparación' : col === 'comentarios' ? 'COMENTARIO CONTRATO' : col === 'iptv_cuenta' ? 'CUENTA IPTV' : col === 'ubicacion_cliente' ? 'UBICACIÓN' : col.replace('_', ' ')}

                      {/* Control para redimensionar la columna */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, col)}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          cursor: 'col-resize',
                          background: 'rgba(255,255,255,0.05)',
                          zIndex: 25
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.4)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      />
                    </th>
                  );
                })}
                {selectedAction === 'BORRAR' && (
                  <th key="acciones" style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--glass-border)',
                    borderRight: '1px solid var(--glass-border)',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    width: 100,
                    minWidth: 100,
                    maxWidth: 100,
                    position: 'sticky',
                    right: 0,
                    background: '#131526',
                    zIndex: 22,
                    borderLeft: '2px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    Acción
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {allColumns.map(col => {
                    const isEditing = editingCell?.id === c.id && editingCell?.col === col;
                    const isId = col === 'id';
                    const isNombre = col === 'nombre';

                    // Posiciones sticky para ID y Nombre
                    let stickyStyle = {};
                    if (isId) {
                      stickyStyle = {
                        position: 'sticky',
                        left: 0,
                        zIndex: 12,
                        background: isEditing ? 'rgba(99, 102, 241, 0.2)' : '#131526'
                      };
                    } else if (isNombre) {
                      stickyStyle = {
                        position: 'sticky',
                        left: colWidths['id'] || 60,
                        zIndex: 12,
                        background: isEditing ? 'rgba(99, 102, 241, 0.2)' : '#131526',
                        borderRight: '2px solid rgba(255, 255, 255, 0.15)'
                      };
                    }

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
                          width: colWidths[col] || 150,
                          minWidth: colWidths[col] || 150,
                          maxWidth: colWidths[col] || 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          background: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          cursor: col === 'id' ? 'default' : 'pointer',
                          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          ...stickyStyle
                        }}
                      >
                        {isEditing ? (
                          col === 'estado' ? (
                            <select
                              autoFocus
                              className="input"
                              style={{
                                width: '100%',
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
                                style={{ width: '100%', padding: '4px 8px', height: '28px', fontSize: '0.8rem', background: '#1e1b4b', border: '1px solid var(--primary)' }}
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
                                  width: '100%',
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
                  {selectedAction === 'BORRAR' && (
                    <td key="acciones" style={{
                      padding: '6px 12px',
                      whiteSpace: 'nowrap',
                      width: 100,
                      minWidth: 100,
                      maxWidth: 100,
                      textAlign: 'center',
                      position: 'sticky',
                      right: 0,
                      background: '#131526',
                      zIndex: 12,
                      borderLeft: '2px solid rgba(255, 255, 255, 0.15)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}>
                      <button
                        onClick={() => handleDeleteClick(c)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#ef4444';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                          e.target.style.color = '#f87171';
                        }}
                      >
                        Borrar
                      </button>
                    </td>
                  )}
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
      {showProgressModal && deletionProgress && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass"
            style={{ width: '100%', maxWidth: '420px', padding: '32px', borderRadius: '24px', textAlign: 'left' }}
          >
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🗑️</span> Eliminando Cliente
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>1. Creación de Respaldo</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.database === 'PENDIENTE' ? '#fbbf24' : '#4ade80' }}>
                  {deletionProgress.database === 'PENDIENTE' ? '⏳ Procesando' : '✅ OK'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>2. Configuración OLT</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.olt === 'PENDIENTE' ? '#fbbf24' : deletionProgress.olt === 'ERROR' ? '#f87171' : deletionProgress.olt === 'OMITIDO' ? '#94a3b8' : '#4ade80' }}>
                  {deletionProgress.olt === 'PENDIENTE' ? '⏳ Procesando' : deletionProgress.olt === 'ERROR' ? '❌ Falló' : deletionProgress.olt === 'OMITIDO' ? '⚪ Omitido' : '✅ Removido'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>3. Configuración IPTV (XUI)</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.xui === 'PENDIENTE' ? '#fbbf24' : deletionProgress.xui === 'ERROR' ? '#f87171' : deletionProgress.xui === 'OMITIDO' ? '#94a3b8' : '#4ade80' }}>
                  {deletionProgress.xui === 'PENDIENTE' ? '⏳ Procesando' : deletionProgress.xui === 'ERROR' ? '❌ Falló' : deletionProgress.xui === 'OMITIDO' ? '⚪ Omitido' : '✅ Removido'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>4. Cola de QoS (LibreQoS)</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.libreqos === 'PENDIENTE' ? '#fbbf24' : deletionProgress.libreqos === 'ERROR' ? '#f87171' : deletionProgress.libreqos === 'OMITIDO' ? '#94a3b8' : '#4ade80' }}>
                  {deletionProgress.libreqos === 'PENDIENTE' ? '⏳ Procesando' : deletionProgress.libreqos === 'ERROR' ? '❌ Falló' : deletionProgress.libreqos === 'OMITIDO' ? '⚪ Omitido' : '✅ Removido'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>5. Base de Datos Local</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.database === 'PENDIENTE' ? '#94a3b8' : deletionProgress.database === 'ERROR' ? '#f87171' : '#4ade80' }}>
                  {deletionProgress.database === 'PENDIENTE' ? '⏳ Esperando' : deletionProgress.database === 'ERROR' ? '❌ Falló' : '✅ Eliminado'}
                </span>
              </div>
            </div>

            <p style={{
              fontSize: '0.85rem',
              padding: '12px',
              borderRadius: '8px',
              background: deletionProgress.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              border: deletionProgress.status === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
              color: deletionProgress.status === 'error' ? '#f87171' : '#e2e8f0',
              marginBottom: '20px',
              wordBreak: 'break-word'
            }}>
              {deletionProgress.message}
            </p>

            {deletionProgress.status !== 'processing' && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
                onClick={() => {
                  setShowProgressModal(false);
                  setDeletionProgress(null);
                }}
              >
                Entendido
              </button>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default General;
