import React, { useEffect, useState } from 'react';
import { extrasService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';

const ExtraPagos = () => {
  const [extras, setExtras] = useState([]);
  const [bancosList, setBancosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState(null);

  const [pagoData, setPagoData] = useState({ monto: 0, metodo: 'EFECTIVO', mes: 'ENERO', referencia: '', factura: '' });

  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  const fetchData = async () => {
    try {
      const resp = await extrasService.listar();
      const banksResp = await configuracionService.getBancos();
      setExtras(resp.data);
      setBancosList(banksResp.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePagar = async () => {
    try {
      await extrasService.pagar(selectedExtra.id, {
        monto: parseFloat(pagoData.monto),
        metodo_pago: pagoData.metodo,
        mes_correspondiente: pagoData.mes,
        referencia: pagoData.referencia || `Pago EXTRA - ${pagoData.mes}`,
        factura: pagoData.factura
      });
      setShowPagoModal(false); fetchData();
    } catch (err) { alert("Error"); }
  };

  const filteredExtras = extras.filter(e => e.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) || e.cod?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <h1>Extra Pagos</h1>
        <input className="input" placeholder="Buscar..." style={{ maxWidth: '250px', marginBottom: 0 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px' }}>COD</th>
                <th>CLIENTE</th>
                <th>VALOR BASE</th>
                <th>PAGADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredExtras.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px' }}>{e.cod}</td>
                  <td>{e.nombre_cliente}</td>
                  <td style={{ color: '#fbbf24', fontWeight: 'bold' }}>${parseFloat(e.valor || 0).toFixed(2)}</td>
                  <td style={{ color: '#4ade80' }}>${parseFloat(e.total_pagado || 0).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => { setSelectedExtra(e); setShowPagoModal(true); setPagoData({...pagoData, monto: e.valor}); }}>💰 Cobrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPagoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '15px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '20px' }}>
            <h2>Registrar Pago Extra</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: '10px 0 20px' }}>{selectedExtra?.nombre_cliente}</p>
            <div className="responsive-grid grid-2">
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="label">Mes</label>
                    <select className="input" value={pagoData.mes} onChange={e => setPagoData({...pagoData, mes: e.target.value})}>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="input-group">
                    <label className="label">Monto</label>
                    <input className="input" type="number" value={pagoData.monto} onChange={e => setPagoData({...pagoData, monto: e.target.value})} />
                </div>
                <div className="input-group">
                    <label className="label">Método</label>
                    <select className="input" value={pagoData.metodo} onChange={e => setPagoData({...pagoData, metodo: e.target.value})}>
                        <option value="EFECTIVO">EFECTIVO</option>
                        {bancosList.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
                    </select>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handlePagar}>Pagar</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ExtraPagos;
