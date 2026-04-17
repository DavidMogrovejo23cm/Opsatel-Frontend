import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { extrasService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';

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

  const calculateDebe = (e) => {
    const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const currentMonthIdx = new Date().getMonth();
    let totalDebe = 0;
    
    // Determinar mes de inicio basado en fecha_ingreso
    let startMonthIdx = 0;
    if (e.fecha_ingreso) {
        try {
            const mesIngreso = parseInt(e.fecha_ingreso.split('-')[1]);
            startMonthIdx = mesIngreso - 1;
        } catch(err) { startMonthIdx = 0; }
    }

    for (let i = startMonthIdx; i <= currentMonthIdx; i++) {
        const m = listMonths[i];
        // El saldo del mes en ExtrasGeneral se calcula como (valor - pago). 
        // Si no se ha tocado el mes (pago=0 y saldo=0), se debe el valor total del mes.
        const saldoMes = (parseFloat(e[`${m}_pago`] || 0) === 0 && (parseFloat(e[`${m}_saldo`] || 0) === 0)) 
            ? parseFloat(e.valor || 0) 
            : parseFloat(e[`${m}_saldo`] || 0);
        totalDebe += saldoMes;
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
      monto: debt > 0 ? debt : extra.valor || 0, // Sugerir el total de la deuda si existe
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
      fetchData();
    } catch (err) {
      alert("Error al registrar pago extra");
    }
  };

  const filteredExtras = extras.filter(e =>
    e.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
           <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>Gestión de Cobranzas <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '400' }}>(Extras)</span></h1>
           <p style={{ color: '#94a3b8', margin: 0 }}>Panel profesional de control de cartera y recaudación.</p>
        </div>
        <input
          className="input"
          placeholder="🔍 Buscar por COD o Nombre..."
          style={{ maxWidth: '300px', marginBottom: 0, borderRadius: '12px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* METRICAS PROFESIONALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '15px', borderLeft: '4px solid #f87171' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>CARTERA PENDIENTE (TOTAL)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f87171' }}>${totals.globalDebe.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass" style={{ padding: '20px', borderRadius: '15px', borderLeft: '4px solid #34d399' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>RECAUDADO ESTE MES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#34d399' }}>${totals.recaudadoMes.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass" style={{ padding: '20px', borderRadius: '15px', borderLeft: '4px solid #6366f1' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>TOTAL SERVICIOS ADM.</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#6366f1' }}>{totals.totalClientes}</div>
        </div>
      </div>

      {loading ? <p>Cargando clientes extras...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                      onClick={() => openPagoModal(e)}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
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
          zIndex: 9999
        }}>
          <div className="glass" style={{ width: '450px', padding: '32px' }}>
            <h2 style={{ marginBottom: '8px' }}>Registrar Pago Extra</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Cliente: <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedExtra?.nombre_cliente}</span>
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="label">Mes de Pago</label>
              <select className="input" value={pagoData.mes} onChange={(e) => setPagoData({ ...pagoData, mes: e.target.value })} style={{ background: '#1e1b4b' }}>
                {months.map(m => (
                  <option key={m} value={m} style={{ background: '#1e1b4b' }}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="label">Monto a Cobrar ($)</label>
              <input className="input" type="number" step="0.01" value={pagoData.monto} onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="label">Método de Pago</label>
              <select className="input" value={pagoData.metodo} onChange={(e) => setPagoData({ ...pagoData, metodo: e.target.value })} style={{ background: '#1e1b4b' }}>
                <option value="EFECTIVO" style={{ background: '#1e1b4b' }}>EFECTIVO</option>
                {bancosList.map(b => (
                  <option key={b.id} value={b.nombre} style={{ background: '#1e1b4b' }}>{b.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="label">Número de Factura</label>
              <input className="input" placeholder="Ej: 001-001-0001" value={pagoData.factura} onChange={(e) => setPagoData({ ...pagoData, factura: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="label">Referencia (Opcional)</label>
              <input className="input" value={pagoData.referencia} onChange={(e) => setPagoData({ ...pagoData, referencia: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
