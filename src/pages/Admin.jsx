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

  const openPagoModal = (cliente) => {
    setSelectedCliente(cliente);

    const saldoPendiente = parseFloat(cliente.saldo || 0);
    const montoInicial = saldoPendiente > 0 ? saldoPendiente.toFixed(2) : '0.00';

    const planInfo = planesList.find(p => p.nombre.toLowerCase() === (cliente.plan || '').toLowerCase());
    const precioPlan = planInfo ? parseFloat(planInfo.precio).toFixed(2) : '20.00';

    setPagoData({
      monto: montoInicial,
      metodo: bancosList.length > 0 ? bancosList[0].nombre : 'EFECTIVO',
      facturas: cliente.facturas || '',
      internet_payment: precioPlan,
      app: cliente.app || '',
      payment_date: new Date().toISOString().split('T')[0],
      client_payment_date: cliente.client_payment_date || '',
      cod: cliente.cod || '',
      plus: cliente.plus || '',
      bank_plus: cliente.bank_plus || '',
      adicional: cliente.adicional || '',
      comentarios: cliente.comentarios || ''
    });
    setShowPagoModal(true);
  };

  const handleRegistrarPago = async () => {
    if (!pagoData.monto || isNaN(pagoData.monto)) return alert("Ingrese un monto válido");

    // Helper para marcar campos vacíos como "NONE"
    const noneIfEmpty = (val) => (val && String(val).trim()) ? String(val).trim() : "NONE";

    try {
      const totalPagado = parseFloat(pagoData.monto) + (parseFloat(pagoData.adicional) || 0);
      await clienteService.pagar(selectedCliente.id, {
        monto: totalPagado,
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

      setShowPagoModal(false);
      fetchData();
    } catch (error) {
      alert("Error al registrar pago");
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

  const filteredClientes = safeClientes.filter(c =>
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.toString().includes(searchTerm)
  );

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
              <button className="btn btn-primary" style={{ backgroundColor: '#f59e0b', width: window.innerWidth <= 480 ? '100%' : 'auto' }} onClick={liquidarTest}>💰 Liquidar Test</button>
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
                <th>IP TV</th>
                <th>Comentarios</th>
                <th>Pendiente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
                      step="0.01"
                      value={c.plus || 0}
                      onChange={(e) => handlePlusChange(c.id, e.target.value)}
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
                    {parseFloat(c.saldo) < 0 ? (
                      <span style={{ color: '#4ade80' }}>
                        Excedente (${Math.abs(parseFloat(c.saldo)).toFixed(2)})
                      </span>
                    ) : (
                      <span style={{ color: parseFloat(c.saldo) > 0 ? '#f87171' : 'var(--text-muted)' }}>
                        ${parseFloat(c.saldo).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openPagoModal(c)}>
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
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass"
            style={{ width: '50%', minWidth: '420px', maxWidth: '850px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative', margin: 'auto' }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Plan Actual + Plus:</span>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>${parseFloat(selectedCliente.total_pago || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '8px' }}>
                <span>Total a registrar:</span>
                <span style={{ color: '#4ade80' }}>
                  ${((parseFloat(pagoData.monto) || 0) + (parseFloat(pagoData.adicional) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', overflowY: 'auto', maxHeight: '400px', paddingRight: '8px', margin: '0 -8px' }} className="custom-scrollbar">
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Monto total ($)</label>
                <input type="number" step="0.01" className="input" value={pagoData.monto} onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })} autoFocus />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Método</label>
                <select className="input" value={pagoData.metodo} onChange={(e) => setPagoData({ ...pagoData, metodo: e.target.value })} style={{ background: '#1e1b4b' }}>
                  {bancosList.length === 0 && <option value="EFECTIVO">EFECTIVO</option>}
                  {bancosList.map(b => (
                    <option key={b.id} value={b.nombre} style={{ background: '#1e1b4b' }}>{b.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Adicional ($)</label>
                <input type="number" step="0.01" className="input" value={pagoData.adicional} onChange={(e) => setPagoData({ ...pagoData, adicional: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>App</label>
                <input className="input" value={pagoData.app} onChange={(e) => setPagoData({ ...pagoData, app: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Facturas</label>
                <input className="input" value={pagoData.facturas} onChange={(e) => setPagoData({ ...pagoData, facturas: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Internet Pay.</label>
                <input className="input" value={pagoData.internet_payment} onChange={(e) => setPagoData({ ...pagoData, internet_payment: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Cod</label>
                <input className="input" value={pagoData.cod} onChange={(e) => setPagoData({ ...pagoData, cod: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Fecha Pago</label>
                <input type="date" className="input" value={pagoData.payment_date} onChange={(e) => setPagoData({ ...pagoData, payment_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Fecha P. Cliente</label>
                <input className="input" value={pagoData.client_payment_date} onChange={(e) => setPagoData({ ...pagoData, client_payment_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Bank Plus</label>
                <select className="input" value={pagoData.bank_plus} onChange={(e) => setPagoData({ ...pagoData, bank_plus: e.target.value })} style={{ background: '#1e1b4b' }}>
                  <option value="" style={{ background: '#1e1b4b' }}>Ninguno</option>
                  {bancosList.map(b => (
                    <option key={b.id} value={b.nombre} style={{ background: '#1e1b4b' }}>{b.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem' }}>Comentarios</label>
                <input className="input" value={pagoData.comentarios} onChange={(e) => setPagoData({ ...pagoData, comentarios: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleRegistrarPago} style={{ padding: '12px 24px' }}>
                De acuerdo
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};

export default Admin;
