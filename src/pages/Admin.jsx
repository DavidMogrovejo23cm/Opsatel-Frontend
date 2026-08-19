import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clienteService, configuracionService, hojaRutaService } from '../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  const [clientes, setClientes] = useState([]);
  const [bancosList, setBancosList] = useState([]);
  const [planesList, setPlanesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hojaRutaList, setHojaRutaList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [efectivoRecibido, setEfectivoRecibido] = useState('');

  // Controlan la transaccionabilidad y UI del modal sobrepuesto de pagos
  const [pagoData, setPagoData] = useState({
    monto: '',
    metodo: 'EFECTIVO',
    facturas: '',
    internet_payment: '',
    app: '',
    payment_date: new Date().toISOString().split('T')[0],
    client_payment_date: '',
    cod: '',
    plus: '',
    bank_plus: '',
    adicional: '',
    comentarios: ''
  });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [clientesRes, bancosRes, planesRes, hrRes] = await Promise.all([
        clienteService.listar(),
        configuracionService.getBancos(),
        configuracionService.getPlanes(),
        hojaRutaService.listar()
      ]);
      setClientes(clientesRes.data);
      setBancosList(bancosRes.data);
      setPlanesList(planesRes.data);
      setHojaRutaList(hrRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Bloquea el scroll del cuerpo cuando el modal está abierto
  useEffect(() => {
    if (showPagoModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPagoModal]);

  const openPagoModal = (cliente) => {
    setSelectedCliente(cliente);

    // El internet sugerido es el total_pago del backend (saldo + plan + plus) menos el plus, o el internet_payment guardado
    const internetSugerido = (cliente.internet_payment && parseFloat(cliente.internet_payment) > 0)
      ? parseFloat(cliente.internet_payment).toFixed(2)
      : (parseFloat(cliente.total_pago || 0) - parseFloat(cliente.plus || 0)).toFixed(2);

    // El monto total consolidado para el campo "Monto" (lo que se va a pagar hoy)
    // Incluye el adicional que el backend mantiene separado del total_pago
    const montoTotalConsolidado = (parseFloat(cliente.total_pago || 0) + parseFloat(cliente.adicional || 0)).toFixed(2);

    setPagoData({
      monto: montoTotalConsolidado,
      metodo: bancosList.length > 0 ? bancosList[0].nombre : 'EFECTIVO',
      facturas: cliente.facturas || '',
      internet_payment: internetSugerido,
      app: cliente.app || '',
      payment_date: new Date().toISOString().split('T')[0],
      client_payment_date: cliente.client_payment_date || '',
      cod: cliente.cod || '',
      plus: cliente.plus || '',
      bank_plus: cliente.bank_plus || '',
      adicional: cliente.adicional || '',
      notas_pago: cliente.notas_pago || '',
      comentarios_edit: cliente.comentarios || '',
      cortesiaMode: 'NONE', // 'NONE', 'TOTAL', 'PARCIAL'
      cortesiaPct: '',
      original_internet: internetSugerido,
      original_plus: cliente.plus || '0',
      original_adicional: cliente.adicional || '0',
      descuentoValue: 0,
      iptvDescuentoValue: 0
    });
    setEfectivoRecibido('');
    setShowPagoModal(true);
  };

  const handleRegistrarPago = async () => {
    if (!pagoData.monto || isNaN(pagoData.monto)) return alert("Ingrese un monto válido");


    // Helper para marcar campos vacíos como "NONE"
    const noneIfEmpty = (val) => (val && String(val).trim()) ? String(val).trim() : "NONE";

    try {
      // Según v1.2, pagoData.monto es el efectivo total recibido. 
      // El backend desglosará el adicional independientemente.
      if (parseFloat(pagoData.plus || 0) > 0 && !pagoData.bank_plus) {
        return alert('Debe seleccionar el banco para el cobro de IPTV (Bank Plus).');
      }

      // LÓGICA DE LIQUIDACIÓN: Calculamos los descuentos (Cortesías) por separado del efectivo
      const descInternet = pagoData.cortesiaMode !== 'NONE' ? parseFloat(pagoData.descuentoValue || 0) : 0;
      const descPlus = pagoData.cortesiaMode === 'TOTAL' ? parseFloat(pagoData.iptvDescuentoValue || 0) : 0;
      const descAdicional = pagoData.cortesiaMode === 'TOTAL' ? parseFloat(pagoData.original_adicional || 0) : 0;

      await clienteService.pagar(selectedCliente.id, {
        monto: parseFloat(pagoData.monto),
        metodo_pago: pagoData.metodo,
        mes_correspondiente: new Date().toISOString().slice(0, 7),
        referencia: `Pago vía Admin - ${pagoData.metodo}${pagoData.cortesiaMode !== 'NONE' ? ' (CORTESÍA)' : ''}`,
        facturas: noneIfEmpty(pagoData.facturas),
        internet_payment: noneIfEmpty(pagoData.internet_payment),
        app: noneIfEmpty(pagoData.app),
        payment_date: pagoData.payment_date || new Date().toISOString().split('T')[0],
        client_payment_date: noneIfEmpty(pagoData.client_payment_date),
        bank: pagoData.metodo,
        cod: noneIfEmpty(pagoData.cod),
        plus: noneIfEmpty(pagoData.plus),
        bank_plus: noneIfEmpty(pagoData.bank_plus),
        adicional: noneIfEmpty(pagoData.adicional),
        descuento_internet: descInternet,
        descuento_plus: descPlus,
        descuento_adicional: descAdicional,
        notas_pago: (() => {
          let nota = (pagoData.notas_pago && String(pagoData.notas_pago).trim()) ? String(pagoData.notas_pago).trim() : '';
          if (pagoData.cortesiaMode === 'TOTAL') nota += ' [CORTESÍA TOTAL]';
          if (pagoData.cortesiaMode === 'PARCIAL') nota += ` [DESCUENTO ${pagoData.cortesiaPct || 0}% PLAN]`;
          return nota.trim() || null;
        })()
      });

      // Guardar comentarios del contrato si fueron modificados
      if (pagoData.comentarios_edit !== undefined) {
        await clienteService.updateAdmin(selectedCliente.id, {
          comentarios: pagoData.comentarios_edit
        });
      }

      setShowPagoModal(false);
      fetchData();
    } catch (error) {
      alert("Error al registrar pago: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleGuardarCambios = async () => {
    try {
      await clienteService.updateAdmin(selectedCliente.id, {
        plus: pagoData.plus,
        adicional: pagoData.adicional,
        notas_pago: pagoData.notas_pago,
        comentarios: pagoData.comentarios_edit,
        app: pagoData.app,
        cod: pagoData.cod,
        facturas: pagoData.facturas,
        internet_payment: pagoData.internet_payment,
        // Si se modifica internet_payment, dejar el total_pago en cero
        // para evitar que quede el saldo pendiente del mes anterior
        saldo: 0,
        total_pago: 0
      });
      alert("Valores guardados correctamente");
      fetchData();
      setShowPagoModal(false);
    } catch (error) {
      alert("Error al guardar valores: " + (error.response?.data?.detail || error.message));
    }
  };

  const handlePlanChange = async (clienteId, nuevoPlan) => {
    try {
      await clienteService.updateAdmin(clienteId, { plan: nuevoPlan });
      fetchData();
    } catch (error) {
      alert("Error al actualizar plan");
    }
  };

  const ejecutarFacturacion = async () => {
    if (!confirm("¿Desea ejecutar el cobro mensual para TODOS los clientes activos?\n(Asegúrese de haber generado el Reporte Mensual primero desde la sección de Reportes)")) return;
    try {
      const resp = await clienteService.facturacionGlobal();
      alert(resp.data.message);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || "Error en facturación");
    }
  };

  const safeClientes = Array.isArray(clientes) ? clientes : [];

  const [statusFilter, setStatusFilter] = useState('ACTIVO');

  const filteredClientes = safeClientes
    .filter(c => {
      // Filtro de estado para cobros: Solo Activos por defecto, o según búsqueda
      if (statusFilter === 'ACTIVO' && c.estado?.toUpperCase() !== 'ACTIVO') return false;
      if (statusFilter === 'INACTIVO' && c.estado?.toUpperCase() !== 'INACTIVO') return false;
      if (statusFilter === 'PENDIENTE' && c.estado?.toUpperCase() !== 'PENDIENTE') return false;

      return c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id?.toString().includes(searchTerm)
    })
    .sort((a, b) => a.id - b.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Pagos y Cobros</h1>
        </div>
        <div className="page-actions" style={{ gap: '12px', alignItems: 'center' }}>
          <select
            className="input"
            style={{ width: 'auto', marginBottom: 0, background: '#1e1b4b' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">Solo Activos</option>
            <option value="INACTIVO">Solo Inactivos</option>
            <option value="PENDIENTE">Solo Pendientes</option>
          </select>

          <input
            className="input"
            placeholder="Buscar por ID o Nombre..."
            style={{
              maxWidth: '250px',
              marginBottom: 0,
              flex: 1
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={ejecutarFacturacion}>⚙️ Facturación Mensual</button>
            </>
          )}
        </div>
      </div>

      {loading ? <p>Cargando clientes...</p> : (
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Plan Base</th>
                <th>Pantallas IPTV</th>
                <th>Pendiente</th>
                <th>Instalación / Últ. Visita</th>
                <th>Nota de Pago/Reparación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  opacity: c.estado?.toUpperCase() === 'PENDIENTE' ? 0.7 : 1
                }}>
                  <td style={{ padding: '12px' }}>{c.id}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      background: c.estado?.toUpperCase() === 'ACTIVO' ? 'rgba(16, 185, 129, 0.1)' : (c.estado?.toUpperCase() === 'INACTIVO' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                      color: c.estado?.toUpperCase() === 'ACTIVO' ? '#10b981' : (c.estado?.toUpperCase() === 'INACTIVO' ? '#ef4444' : '#f59e0b')
                    }}>
                      {c.estado}
                    </span>
                  </td>
                  <td>
                    <select
                      value={c.plan}
                      onChange={(e) => handlePlanChange(c.id, e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        outline: 'none',
                        width: '110px'
                      }}
                    >
                      {!planesList.some(p => p.nombre === c.plan) && (
                        <option value={c.plan}>{c.plan}</option>
                      )}
                      {planesList.map(p => (
                        <option key={p.id} value={p.nombre} style={{ background: '#1e1b4b' }}>{p.nombre} (${p.precio})</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={(() => {
                        const planData = planesList.find(p => p.nombre === c.plan);
                        const base = planData ? (planData.pantallas ?? 0) : 0;
                        return base + parseFloat(c.plus || 0) / 2;
                      })()}
                      onChange={async (e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 0) return;
                        const planData = planesList.find(p => p.nombre === c.plan);
                        const baseScreens = planData ? (planData.pantallas ?? 0) : 0;
                        try {
                          await clienteService.updateAdmin(c.id, {
                            iptv_max_conn: val,
                            plus: (Math.max(0, (val - baseScreens) * 2)).toString()
                          });
                          fetchData();
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      min="0"
                      style={{
                        width: '70px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    {parseFloat(c.total_pago) < 0 ? (
                      <span style={{ color: '#4ade80' }}>
                        Excedente (${Math.abs(parseFloat(c.total_pago)).toFixed(2)})
                      </span>
                    ) : (
                      <span style={{ color: parseFloat(c.total_pago) > 0 ? '#f87171' : 'var(--text-muted)' }}>
                        ${parseFloat(c.total_pago).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {(() => {
                      const clientHR = (hojaRutaList || []).filter(h => Number(h.cliente_id) === Number(c.id));
                      const instRecord = clientHR.find(h => h.actividad?.toUpperCase() === 'INSTALACION');
                      const fInstalacion = instRecord ? instRecord.fecha : (c.instalation_date || '-');

                      const visitRecords = clientHR
                        .filter(h => h.actividad?.toUpperCase() === 'VISITA TECNICA' && h.fecha)
                        .sort((a, b) => b.fecha.localeCompare(a.fecha));
                      const fVisita = visitRecords.length > 0 ? visitRecords[0].fecha : '-';

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div><span style={{ color: 'var(--text-muted)' }}>Inst:</span> {fInstalacion}</div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Visita:</span> {fVisita}</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#a78bfa', whiteSpace: 'pre-wrap', maxWidth: '180px' }}>
                    {c.notas_pago || '-'}
                  </td>

                  <td>
                    <button
                      className="btn btn-primary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        opacity: c.estado?.toUpperCase() === 'PENDIENTE' ? 0.5 : 1,
                        cursor: c.estado?.toUpperCase() === 'PENDIENTE' ? 'not-allowed' : 'pointer',
                        filter: c.estado?.toUpperCase() === 'PENDIENTE' ? 'grayscale(1)' : 'none'
                      }}
                      onClick={() => {
                        if (c.estado?.toUpperCase() !== 'PENDIENTE') openPagoModal(c);
                      }}
                      disabled={c.estado?.toUpperCase() === 'PENDIENTE'}
                    >
                      Pagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClientes.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No se encontraron clientes.</p>
          )}
        </div>
      )}

      {/* Portal/Modal: Intercepta la pantalla para ejecutar el pago sin cambiar de ruta */}
      {showPagoModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          zIndex: 9999, overflowY: 'auto', padding: '40px 20px'
        }}>
          <div className="tecnica-layout has-selected" style={{
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: '20px',
            maxWidth: '1600px',
            width: '95%',
            margin: 'auto'
          }}>
            {/* Panel de Observaciones Lateral */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="glass tecnica-list"
              style={{
                width: '100%',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                background: '#151030'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#60a5fa' }}>
                <span style={{ fontSize: '1.5rem' }}>📝</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Notas del Cliente</h3>
              </div>

              {/* Comentarios de Contrato Editables */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.85rem', color: '#60a5fa', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
                  Comentarios del Contrato
                </label>
                <textarea
                  value={pagoData.comentarios_edit ?? selectedCliente?.comentarios ?? ''}
                  onChange={(e) => setPagoData({ ...pagoData, comentarios_edit: e.target.value })}
                  placeholder="Escriba comentarios del contrato..."
                  style={{
                    flex: 1,
                    minHeight: '200px',
                    width: '100%',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '12px',
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px', marginTop: '16px' }}
                  onClick={async () => {
                    try {
                      await clienteService.updateAdmin(selectedCliente.id, {
                        comentarios: pagoData.comentarios_edit ?? selectedCliente?.comentarios ?? ''
                      });
                      alert('Comentarios del contrato guardados correctamente.');
                      fetchData();
                    } catch (err) {
                      alert('Error al guardar comentarios.');
                    }
                  }}
                >
                  💾 Guardar Comentarios
                </button>

                {/* Historial Técnico (Hoja de Ruta) - RESTAURADO */}
                {(() => {
                  const hrMatches = (hojaRutaList || [])
                    .filter(h => Number(h.cliente_id) === Number(selectedCliente?.id))
                    .sort((a, b) => new Date(b.created_at || b.id || 0) - new Date(a.created_at || a.id || 0));

                  const lastHR = hrMatches[0];

                  if (lastHR && (lastHR.observacion || lastHR.observacion_tecnico)) {
                    return (
                      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#60a5fa' }}>Última Actividad Técnica</h4>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{lastHR.fecha} - {lastHR.actividad}</span>
                        </div>

                        {lastHR.observacion && (
                          <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                            <label style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                              Problema Reportado
                            </label>
                            <div style={{ fontSize: '0.85rem', color: 'white', fontStyle: 'italic' }}>
                              {lastHR.observacion}
                            </div>
                          </div>
                        )}

                        {lastHR.observacion_tecnico && (
                          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <label style={{ fontSize: '0.7rem', color: '#10b981', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                              Observación Técnica
                            </label>
                            <div style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: '500' }}>
                              {lastHR.observacion_tecnico}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'rgba(16,185,129,0.5)', marginTop: '6px', textAlign: 'right' }}>
                              - {lastHR.tecnico} ({lastHR.fecha})
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No hay reportes técnicos recientes</span>
                    </div>
                  );
                })()}
              </div>
            </motion.div>

            {/* Modal de Pago Principal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="glass glass-card"
              style={{
                width: '100%',
                padding: '32px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                position: 'relative',
                background: '#151030'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Registrar Pago</h2>
                <button onClick={() => setShowPagoModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
              </div>

              <div style={{ padding: '4px 16px 16px 16px', marginTop: '-12px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cliente: </span>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>{selectedCliente?.nombre}</span>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--glass-border)' }}>
                {(parseFloat(selectedCliente.saldo || 0) > 0 && pagoData.cortesiaMode !== 'TOTAL') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Deuda Arrastrada (Saldo):</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                      ${parseFloat(selectedCliente.saldo).toFixed(2)}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monto Plan Base (Internet):</span>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                    ${(parseFloat(pagoData.internet_payment || 0)).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monto IPTV ({(() => {
                    const planData = planesList.find(p => p.nombre === selectedCliente?.plan);
                    const base = planData ? (planData.pantallas ?? 0) : 0;
                    return base + parseFloat(pagoData.plus || 0) / 2;
                  })()} Pantallas):</span>
                  <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                    ${(parseFloat(pagoData.plus || 0)).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monto Adicional:</span>
                  <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                    ${(parseFloat(pagoData.adicional || 0)).toFixed(2)}
                  </span>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold' }}>
                    <span>Total Pendiente (Consolidado):</span>
                    <span style={{ color: (parseFloat(pagoData.internet_payment || 0) + parseFloat(pagoData.plus || 0) + parseFloat(pagoData.adicional || 0)) > 0 ? '#f87171' : '#4ade80' }}>
                      ${(parseFloat(pagoData.internet_payment || 0) + parseFloat(pagoData.plus || 0) + parseFloat(pagoData.adicional || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* SECCIÓN DE CORTESÍA */}
                <div className="grid-responsive" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="cortesia_total"
                      checked={pagoData.cortesiaMode === 'TOTAL'}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const mode = isChecked ? 'TOTAL' : 'NONE';
                        if (isChecked) {
                          setPagoData({
                            ...pagoData,
                            cortesiaMode: mode,
                            internet_payment: "0",
                            plus: "0",
                            adicional: "0",
                            monto: "0",
                            descuentoValue: pagoData.original_internet,
                            iptvDescuentoValue: pagoData.original_plus
                          });
                        } else {
                          const originalTotal = (parseFloat(pagoData.original_internet) + parseFloat(pagoData.original_plus) + parseFloat(pagoData.original_adicional)).toFixed(2);
                          setPagoData({
                            ...pagoData,
                            cortesiaMode: mode,
                            internet_payment: pagoData.original_internet,
                            plus: pagoData.original_plus,
                            adicional: pagoData.original_adicional,
                            monto: originalTotal,
                            descuentoValue: 0,
                            iptvDescuentoValue: 0
                          });
                        }
                      }}
                      style={{ width: '18px', height: '18px', accentColor: '#var(--primary)' }}
                    />
                    <label htmlFor="cortesia_total" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#818cf8', cursor: 'pointer' }}>Cortesía Total</label>
                  </div>

                  {/* Se oculta visualmente la cortesía parcial pero se mantiene la lógica en el código */}
                  {/* 
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        id="cortesia_parcial"
                        checked={pagoData.cortesiaMode === 'PARCIAL'}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const mode = isChecked ? 'PARCIAL' : 'NONE';
                          if (isChecked) {
                            setPagoData({ ...pagoData, cortesiaMode: mode });
                          } else {
                            const originalTotal = (parseFloat(pagoData.original_internet) + parseFloat(pagoData.original_plus) + parseFloat(pagoData.original_adicional)).toFixed(2);
                            setPagoData({
                              ...pagoData,
                              cortesiaMode: mode,
                              internet_payment: pagoData.original_internet,
                              plus: pagoData.original_plus,
                              monto: originalTotal,
                              cortesiaPct: '',
                              descuentoValue: 0,
                              iptvDescuentoValue: 0
                            });
                          }
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#var(--primary)' }}
                      />
                      <label htmlFor="cortesia_parcial" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#818cf8', cursor: 'pointer' }}>Cortesía Parcial</label>
                    </div>
                    {pagoData.cortesiaMode === 'PARCIAL' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px' }}>
                        <input
                          type="number"
                          placeholder="%"
                          className="input"
                          style={{ width: '80px', marginBottom: 0, padding: '6px 10px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', color: '#818cf8', border: '1px solid #818cf8' }}
                          min="0" max="100"
                          value={pagoData.cortesiaPct}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            if (valStr === "") {
                              setPagoData({
                                ...pagoData,
                                cortesiaPct: "",
                                internet_payment: pagoData.original_internet,
                                monto: (parseFloat(pagoData.original_internet) + parseFloat(pagoData.plus) + parseFloat(pagoData.adicional)).toFixed(2),
                                descuentoValue: 0
                              });
                              return;
                            }
                            const pct = Math.min(100, Math.max(0, parseFloat(valStr) || 0));
                            const planPrice = parseFloat(planesList.find(p => p.nombre.toLowerCase() === selectedCliente?.plan?.toLowerCase())?.precio || 0);
                            const internetSugerido = parseFloat(pagoData.original_internet || 0);

                            const baseDescuento = (internetSugerido > 0 && planPrice > 0) ? Math.min(planPrice, internetSugerido) : (internetSugerido || 0);

                            const descuento = (baseDescuento * pct / 100);
                            const nuevoInternet = (internetSugerido - descuento).toFixed(2);

                            const total = (parseFloat(nuevoInternet) + parseFloat(pagoData.plus) + parseFloat(pagoData.adicional)).toFixed(2);

                            setPagoData({
                              ...pagoData,
                              cortesiaPct: pct,
                              internet_payment: nuevoInternet,
                              monto: total,
                              descuentoValue: descuento
                            });
                          }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: 'bold' }}>% Descuento</span>
                      </div>
                    )}
                  </div>
                  */}
                </div>
              </div>

              <div style={{
                marginTop: '-10px',
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '16px',
                border: '1px dashed rgba(99, 102, 241, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🧮</span> Calculadora de Vuelto
                  </span>
                  {efectivoRecibido && (
                    <button
                      onClick={() => setEfectivoRecibido('')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="grid-responsive">
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Efectivo Recibido</label>
                    <input
                      type="number"
                      className="input"
                      value={efectivoRecibido}
                      onChange={(e) => setEfectivoRecibido(e.target.value)}
                      placeholder="0.00"
                      style={{ marginBottom: 0, fontSize: '1rem', height: '42px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Vuelto a entregar</label>
                    <div style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      background: 'rgba(15, 23, 42, 0.5)',
                      borderRadius: '8px',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: (parseFloat(efectivoRecibido || 0) - (parseFloat(pagoData.monto) || 0)) >= 0 ? '#4ade80' : '#f87171',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <span>$</span>
                      <span>{(parseFloat(efectivoRecibido || 0) - (parseFloat(pagoData.monto) || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid-responsive" style={{ paddingRight: '10px', margin: '0 -8px' }}>
                {/* 1. INTERNET PAY (AZUL) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#60a5fa' }}>Internet Pay.</label>
                  <input type="number" step="0.01" className="input" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', borderRadius: '12px' }} value={pagoData.internet_payment} onChange={(e) => {
                    const val = e.target.value;
                    const newTotal = (parseFloat(val || 0) + parseFloat(pagoData.plus || 0) + parseFloat(pagoData.adicional || 0)).toFixed(2);
                    setPagoData({ ...pagoData, internet_payment: val, monto: newTotal });
                  }} autoFocus />
                </div>

                {/* 2. ADICIONAL (AZUL) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#60a5fa' }}>Adicional ($)</label>
                  <input type="number" step="0.01" className="input" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', borderRadius: '12px' }} value={pagoData.adicional} onChange={(e) => {
                    const val = (e.target.value);
                    const newTotal = (parseFloat(pagoData.internet_payment || 0) + parseFloat(pagoData.plus || 0) + parseFloat(val || 0)).toFixed(2);
                    setPagoData({ ...pagoData, adicional: val, monto: newTotal });
                  }} />
                </div>

                {/* 3. COMENTARIOS DE PAGO / REPARACIÓN (MORADO) - Se guarda en 'observaciones' */}
                <div className="form-group grid-span-2">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Nota de Pago / Reparación (Adicional)</label>
                  <textarea
                    className="input"
                    style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px', minHeight: '40px', resize: 'vertical', paddingTop: '8px' }}
                    value={pagoData.notas_pago}
                    onChange={(e) => setPagoData({ ...pagoData, notas_pago: e.target.value })}
                    placeholder="Escriba aquí si hay reparaciones..."
                  />
                </div>

                {/* 4. MÉTODO (MORADO) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Método</label>
                  <select className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px', background: '#1e1b4b', color: 'white' }} value={pagoData.metodo} onChange={(e) => setPagoData({ ...pagoData, metodo: e.target.value })}>
                    {bancosList.length === 0 && <option value="EFECTIVO" style={{ background: '#1e1b4b', color: 'white' }}>EFECTIVO</option>}
                    {bancosList.map(b => (
                      <option key={b.id} value={b.nombre} style={{ background: '#1e1b4b', color: 'white' }}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* 5. PLUS (MORADO) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Plus ($)</label>
                  <input type="number" step="0.01" className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px' }} value={pagoData.plus} onChange={(e) => {
                    const val = e.target.value;
                    const newTotal = (parseFloat(pagoData.internet_payment || 0) + parseFloat(val || 0) + parseFloat(pagoData.adicional || 0)).toFixed(2);
                    setPagoData({ ...pagoData, plus: val, monto: newTotal });
                  }} />
                </div>

                {/* 6. BANK PLUS (MORADO) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Bank Plus</label>
                  <select className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px', background: '#1e1b4b', color: 'white' }} value={pagoData.bank_plus} onChange={(e) => setPagoData({ ...pagoData, bank_plus: e.target.value })}>
                    <option value="" style={{ background: '#1e1b4b', color: 'white' }}>Ninguno</option>
                    {bancosList.map(b => (
                      <option key={b.id} value={b.nombre} style={{ background: '#1e1b4b', color: 'white' }}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* 7. COD (MORADO) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Cod</label>
                  <input className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px' }} value={pagoData.cod} onChange={(e) => setPagoData({ ...pagoData, cod: e.target.value })} />
                </div>

                {/* 8. FACTURA (MORADO) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Facturas</label>
                  <input className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px' }} value={pagoData.facturas} onChange={(e) => setPagoData({ ...pagoData, facturas: e.target.value })} />
                </div>

                {/* 9. FECHA PAGO (MORADO) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Fecha Pago</label>
                  <input type="date" className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px' }} value={pagoData.payment_date} onChange={(e) => setPagoData({ ...pagoData, payment_date: e.target.value })} />
                </div>

                {/* 10. MONTO TOTAL (AZUL) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#3b82f6' }}>Monto total ($)</label>
                  <input type="number" step="0.01" className="input" style={{ borderColor: '#3b82f6', borderRadius: '12px', boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' }} value={pagoData.monto} onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })} />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>Cancelar</button>
                <button className="btn btn-secondary" onClick={handleGuardarCambios} style={{ backgroundColor: '#4b5563', color: 'white' }}>
                  💾 Guardar Valores
                </button>
                <button className="btn btn-primary" onClick={handleRegistrarPago} style={{ padding: '12px 24px' }}>
                  De acuerdo (PAGAR)
                </button>
              </div>
            </motion.div>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};

export default Admin;
