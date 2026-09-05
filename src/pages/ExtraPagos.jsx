import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { extrasService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';
import { showSuccess, showError } from '../utils/alerts';

const ExtraPagos = () => {
  const [extras, setExtras] = useState([]);
  const [bancosList, setBancosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState(null);

  const [pagoData, setPagoData] = useState({
    monto: 0,
    metodo: 'EFECTIVO',
    mes: 'ENERO',
    referencia: '',
    factura: ''
  });

  const months = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];

  const getStartMonthIdx = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    try {
      const str = String(fechaIngreso).trim();
      if (str.includes('-')) {
        const parts = str.split('-');
        const m = parseInt(parts[0].length === 4 ? parts[1] : parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
      } else if (str.includes('/')) {
        const parts = str.split('/');
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
      }
    } catch (e) {
      console.error("Error parsing fecha_ingreso:", e);
    }
    return 0;
  };

  const calculateDebe = (e) => {
    if (!e) return 0;
    const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const currentMonthIdx = new Date().getMonth();
    let totalDebe = 0;
    
    const startMonthIdx = getStartMonthIdx(e.fecha_ingreso);

    for (let i = startMonthIdx; i <= currentMonthIdx; i++) {
      const m = listMonths[i];
      const pagoMes = parseFloat(e[`${m}_pago`] || 0);
      const saldoField = e[`${m}_saldo`];
      const valorBase = parseFloat(e.valor || 0);

      let saldoMes = 0;
      if (pagoMes > 0) {
        saldoMes = parseFloat(saldoField || 0);
      } else {
        if (saldoField !== undefined && saldoField !== null && saldoField !== '' && parseFloat(saldoField) >= 0) {
          saldoMes = parseFloat(saldoField);
        } else {
          saldoMes = valorBase;
        }
      }
      totalDebe += Math.max(0, saldoMes);
    }
    return totalDebe;
  };

  const getPagoMesActual = (e) => {
    const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const currentMonth = listMonths[new Date().getMonth()];
    return parseFloat(e[`${currentMonth}_pago`] || 0);
  };

  const fetchData = async () => {
    try {
      const resp = await extrasService.listar();
      const banksResp = await configuracionService.getBancos();
      setExtras(resp.data);
      setBancosList(banksResp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totals = React.useMemo(() => {
    let globalDebe = 0;
    let recaudadoMes = 0;
    extras.forEach(e => {
        globalDebe += calculateDebe(e);
        recaudadoMes += getPagoMesActual(e);
    });
    return { globalDebe, recaudadoMes, totalClientes: extras.length };
  }, [extras]);

  useEffect(() => {
    fetchData();
  }, []);

  const openPagoModal = (extra) => {
    const debt = calculateDebe(extra);
    setSelectedExtra(extra);
    setPagoData({
      monto: debt > 0 ? debt : extra.valor || 0,
      metodo: bancosList.length > 0 ? bancosList[0].nombre : 'EFECTIVO',
      mes: months[new Date().getMonth()],
      referencia: '',
      factura: ''
    });
    setShowPagoModal(true);
  };

  const handlePagar = async () => {
    try {
      await extrasService.pagar(selectedExtra.id, {
        monto: parseFloat(pagoData.monto),
        metodo_pago: pagoData.metodo,
        mes_correspondiente: pagoData.mes,
        referencia: pagoData.referencia || `Pago EXTRA - ${pagoData.mes}`,
        factura: pagoData.factura
      });
      setShowPagoModal(false);
      showSuccess("Pago extra registrado correctamente");
      fetchData();
    } catch (err) {
      showError("Error al registrar pago extra: " + (err.response?.data?.detail || err.message));
    }
  };

  const filteredExtras = extras.filter(e =>
    e.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
      
      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-info">
           <h1 style={{ fontWeight: '900', margin: 0 }}>Gestión de Cobranzas <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '400' }}>(Extras)</span></h1>
           <p>Panel profesional de control de cartera y recaudación.</p>
        </div>
        <div className="page-actions">
          <input
            className="input"
            placeholder="🔍 Buscar por COD o Nombre..."
            style={{ width: '100%', maxWidth: '300px', marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* METRICAS PROFESIONALES */}
      <div className="grid-responsive" style={{ marginBottom: '32px' }}>
        <div className="glass-card glass" style={{ padding: '20px', borderLeft: '4px solid #f87171' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>CARTERA PENDIENTE (TOTAL)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f87171' }}>${totals.globalDebe.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass-card glass" style={{ padding: '20px', borderLeft: '4px solid #34d399' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>RECAUDADO ESTE MES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#34d399' }}>${totals.recaudadoMes.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass-card glass" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>TOTAL SERVICIOS ADM.</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#6366f1' }}>{totals.totalClientes}</div>
        </div>
      </div>

      {loading ? <p>Cargando clientes extras...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>COD</th>
                <th>NOMBRE CLIENTE</th>
                <th>USUARIO</th>
                <th>VALOR BASE</th>
                <th>PAGADO (MES)</th>
                <th>DEBE (SALDO)</th>
                <th>ACTIVO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredExtras.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontSize: '0.8rem' }}>{e.cod}</td>
                  <td style={{ fontSize: '0.85rem' }}>{e.nombre_cliente}</td>
                   <td style={{ fontSize: '0.8rem' }}>{e.usuario}</td>
                   <td style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fbbf24' }}>${parseFloat(e.valor || 0).toFixed(2)}</td>
                  <td style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 'bold' }}>${getPagoMesActual(e).toFixed(2)}</td>
                  <td style={{ 
                    fontSize: '0.85rem', 
                    color: calculateDebe(e) > 0 ? '#f87171' : (calculateDebe(e) < 0 ? '#34d399' : '#94a3b8'),
                    fontWeight: 'bold'
                  }}>
                    {calculateDebe(e) > 0 ? `Debe $${calculateDebe(e).toFixed(2)}` : (calculateDebe(e) < 0 ? `A favor $${Math.abs(calculateDebe(e)).toFixed(2)}` : '$0.00')}
                  </td>
                   <td style={{ fontSize: '0.8rem' }}>{e.activo}</td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => openPagoModal(e)}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        border: 'none',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      💰 Cobrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExtras.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Sin resultados.</p>}
        </div>
      )}

      {showPagoModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-card glass" style={{ width: '100%', maxWidth: '450px', padding: '24px' }}>
            <h2 style={{ marginBottom: '4px', fontWeight: '900', color: '#34d399' }}>💳 Registrar Pago Extra</h2>
            <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '0.9rem' }}>
              Cliente: <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedExtra?.nombre_cliente}</span> ({selectedExtra?.cod})
            </p>

            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.2)', 
              borderRadius: '8px', 
              padding: '12px 16px', 
              marginBottom: '20px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>VALOR MENSUAL</span>
                <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>${parseFloat(selectedExtra?.valor || 0).toFixed(2)}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>DEUDA ACUMULADA</span>
                <span style={{ fontWeight: 'bold', color: calculateDebe(selectedExtra) > 0 ? '#f87171' : '#34d399' }}>
                  ${calculateDebe(selectedExtra).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid-responsive" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="label">Mes de Pago</label>
                <select className="input" value={pagoData.mes} onChange={(e) => setPagoData({ ...pagoData, mes: e.target.value })} style={{ background: '#1e1b4b' }}>
                  {months.map(m => (
                    <option key={m} value={m} style={{ background: '#1e1b4b' }}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Monto a Cobrar ($)</label>
                <input className="input" type="number" step="0.01" value={pagoData.monto} onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="label">Método de Pago</label>
                <select className="input" value={pagoData.metodo} onChange={(e) => setPagoData({ ...pagoData, metodo: e.target.value })} style={{ background: '#1e1b4b' }}>
                  <option value="EFECTIVO" style={{ background: '#1e1b4b' }}>EFECTIVO</option>
                  {bancosList.map(b => (
                    <option key={b.id} value={b.nombre} style={{ background: '#1e1b4b' }}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Número de Factura</label>
                <input className="input" placeholder="Ej: 001-001-0001" value={pagoData.factura} onChange={(e) => setPagoData({ ...pagoData, factura: e.target.value })} />
              </div>

              <div className="form-group grid-span-2">
                <label className="label">Referencia (Opcional)</label>
                <input className="input" value={pagoData.referencia} onChange={(e) => setPagoData({ ...pagoData, referencia: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handlePagar}>Registrar Pago</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};

export default ExtraPagos;
