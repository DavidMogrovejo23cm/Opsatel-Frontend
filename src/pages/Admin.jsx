import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clienteService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';
  const [clientes, setClientes] = useState([]);
  const [bancosList, setBancosList] = useState([]);
  const [planesList, setPlanesList] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchData = async () => {
    try {
      const [clientesRes, bancosRes, planesRes] = await Promise.all([
        clienteService.listar(),
        configuracionService.getBancos(),
        configuracionService.getPlanes()
      ]);
      setClientes(clientesRes.data);
      setBancosList(bancosRes.data);
      setPlanesList(planesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

    // El internet sugerido es el total_pago del backend (saldo + plan + plus) menos el plus
    const internetSugerido = (parseFloat(cliente.total_pago || 0) - parseFloat(cliente.plus || 0)).toFixed(2);

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
      comentarios: cliente.comentarios || ''
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
      await clienteService.pagar(selectedCliente.id, {
        monto: parseFloat(pagoData.monto),
        metodo_pago: pagoData.metodo,
        mes_correspondiente: new Date().toISOString().slice(0, 7),
        referencia: `Pago vía Admin - ${pagoData.metodo}`,
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
        comentarios: (pagoData.comentarios && String(pagoData.comentarios).trim()) ? String(pagoData.comentarios).trim() : null
      });

      // Guardar observaciones si fueron modificadas
      if (pagoData.observaciones_edit !== undefined) {
        await clienteService.updateAdmin(selectedCliente.id, {
          observaciones: pagoData.observaciones_edit
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
        comentarios: pagoData.comentarios,
        app: pagoData.app,
        cod: pagoData.cod,
        facturas: pagoData.facturas,
        internet_payment: pagoData.internet_payment
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

  const handlePlusChange = async (clienteId, nuevoPlus) => {
    try {
      await clienteService.updateAdmin(clienteId, { plus: nuevoPlus });
      fetchData();
    } catch (error) {
      alert("Error al actualizar plus");
    }
  };

  const handleAdicionalChange = async (clienteId, nuevoAdicional) => {
    try {
      await clienteService.updateAdmin(clienteId, { adicional: nuevoAdicional });
      fetchData();
    } catch (error) {
      alert("Error al actualizar adicional");
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



  const liquidarTest = async () => {
    if (!confirm("¿Deseas liquidar TODAS las deudas de todos los clientes (Solo para PRUEBAS)?")) return;
    try {
      const resp = await clienteService.pagoGlobalTest();
      alert(resp.data.message);
      fetchData();
    } catch (err) {
      alert("Error al ejecutar liquidación test");
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
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: window.innerWidth <= 768 ? 'stretch' : 'flex-start',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <h1>Pagos y Cobros</h1>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
          gap: '12px',
          alignItems: 'center',
          width: window.innerWidth <= 768 ? '100%' : 'auto'
        }}>
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
              maxWidth: window.innerWidth <= 768 ? '100%' : '250px',
              marginBottom: 0,
              flex: 1
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {isAdmin && (
            <>

              <button className="btn btn-secondary" style={{ width: window.innerWidth <= 480 ? '100%' : 'auto' }} onClick={ejecutarFacturacion}>⚙️ Facturación Mensual</button>
            </>
          )}
        </div>
      </div>

      {loading ? <p>Cargando clientes...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Plan Base</th>
                <th>Pantallas IPTV</th>
                <th>Comentarios</th>
                <th>Pendiente</th>
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
                      value={(parseFloat(c.plus || 0) / 2 + 1)}
                      onChange={async (e) => {
                        const val = parseInt(e.target.value) || 1;
                        try {
                          await clienteService.updateAdmin(c.id, {
                            iptv_max_conn: val,
                            plus: (Math.max(0, (val - 1) * 2)).toString()
                          });
                          fetchData();
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      min="1"
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
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {c.comentarios || '-'}
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
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth <= 1100 ? 'column' : 'row',
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
              className="glass"
              style={{
                width: window.innerWidth <= 1100 ? '100%' : '300px',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#60a5fa' }}>
                <span style={{ fontSize: '1.5rem' }}>📝</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Notas del Cliente</h3>
              </div>

              {/* Comentarios de Contrato */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
                  Comentario de Contrato
                </label>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  color: 'rgba(255,255,255,0.7)',
                  minHeight: '80px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedCliente?.comentarios || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Sin comentarios...</span>}
                </div>
              </div>

              {/* Observaciones Generales/Técnicas */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
                  Observaciones
                </label>
                <textarea
                  value={pagoData.observaciones_edit ?? selectedCliente?.observaciones ?? ''}
                  onChange={(e) => setPagoData({ ...pagoData, observaciones_edit: e.target.value })}
                  placeholder="Escriba observaciones del cliente..."
                  style={{
                    flex: 1,
                    minHeight: '120px',
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(96, 165, 250, 0.2)',
                    borderRadius: '12px',
                    color: 'var(--text-muted)',
                    padding: '12px',
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '8px', marginBottom: '12px' }}>
                  Use "/" para separar párrafos en la Vista General.
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
                  onClick={async () => {
                    try {
                      await clienteService.updateAdmin(selectedCliente.id, {
                        observaciones: pagoData.observaciones_edit ?? selectedCliente?.observaciones ?? ''
                      });
                      alert('Observaciones guardadas correctamente.');
                      fetchData();
                    } catch (err) {
                      alert('Error al guardar observaciones.');
                    }
                  }}
                >
                  💾 Guardar Observaciones
                </button>
              </div>
            </motion.div>

            {/* Modal de Pago Principal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="glass"
              style={{ width: window.innerWidth <= 1100 ? '100%' : '900px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative' }}
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
                {parseFloat(selectedCliente.saldo || 0) > 0 && (
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

                {selectedCliente?.instalation_date &&
                  selectedCliente.instalation_date.startsWith(new Date().toISOString().slice(0, 7)) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', padding: '4px 8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)', marginTop: '4px' }}>
                      <span style={{ color: '#818cf8' }}>Monto Primer Mes:</span>
                      <span style={{ color: '#818cf8', fontWeight: 'bold' }}>
                        ${(parseFloat(selectedCliente.total_pago || 0) - parseFloat(selectedCliente.plus || 0)).toFixed(2)}
                      </span>
                    </div>
                  )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monto IPTV ({(parseFloat(pagoData.plus || 0) / 2 + 1) || 1} Pantallas):</span>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', paddingRight: '10px', margin: '0 -8px' }}>
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

                {/* 3. COMENTARIOS (MORADO) */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Comentarios</label>
                  <input className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px' }} value={pagoData.comentarios} onChange={(e) => setPagoData({ ...pagoData, comentarios: e.target.value })} />
                </div>

                {/* 4. MÉTODO (MORADO) */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a78bfa' }}>Método</label>
                  <select className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px', background: '#1e1b4b' }} value={pagoData.metodo} onChange={(e) => setPagoData({ ...pagoData, metodo: e.target.value })}>
                    {bancosList.length === 0 && <option value="EFECTIVO">EFECTIVO</option>}
                    {bancosList.map(b => (
                      <option key={b.id} value={b.nombre} style={{ background: '#1e1b4b' }}>{b.nombre}</option>
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
                  <select className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '12px', background: '#1e1b4b' }} value={pagoData.bank_plus} onChange={(e) => setPagoData({ ...pagoData, bank_plus: e.target.value })}>
                    <option value="" style={{ background: '#1e1b4b' }}>Ninguno</option>
                    {bancosList.map(b => (
                      <option key={b.id} value={b.nombre} style={{ background: '#1e1b4b' }}>{b.nombre}</option>
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
                  De acuerdo
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
