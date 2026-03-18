import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const Admin = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el Modal de Pago
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [pagoData, setPagoData] = useState({ monto: '', metodo: 'EFECTIVO' });

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

  const openPagoModal = (cliente) => {
    setSelectedCliente(cliente);
    setPagoData({ monto: Math.max(0, parseFloat(cliente.saldo)).toFixed(2), metodo: 'EFECTIVO' });
    setShowPagoModal(true);
  };

  const handleRegistrarPago = async () => {
    if (!pagoData.monto || isNaN(pagoData.monto)) return alert("Ingrese un monto válido");

    try {
      await clienteService.pagar(selectedCliente.id, {
        monto: parseFloat(pagoData.monto),
        metodo_pago: pagoData.metodo,
        mes_correspondiente: new Date().toISOString().slice(0, 7),
        referencia: `Pago vía Admin - ${pagoData.metodo}`
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
    if (!confirm("¿Desea ejecutar el cobro mensual para TODOS los clientes activos?")) return;
    try {
      await clienteService.facturacionGlobal();
      alert("Facturación completada");
      fetchData();
    } catch (error) {
      alert("Error en facturación");
    }
  };

  const handlePagoGlobalTest = async () => {
    if (!confirm("⚠️ TEST: ¿Desea resetear a 0 el saldo de TODOS los clientes con deuda?")) return;
    try {
      await clienteService.pagoGlobalTest();
      alert("Saldos liquidados correctamente");
      fetchData();
    } catch (error) {
      alert("Error en proceso de pago global");
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.toString().includes(searchTerm)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Administración y Cobros</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            className="input" 
            placeholder="Buscar por ID o Nombre..." 
            style={{ maxWidth: '250px', marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={handlePagoGlobalTest} style={{ borderColor: '#ef4444', color: '#f87171' }}>🛠️ Liquidar (Test)</button>
          <button className="btn btn-secondary" onClick={ejecutarFacturacion}>⚙️ Facturación Mensual</button>
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
                <th>Plus ($)</th>
                <th>Saldo Total</th>
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
                      {!['100mb', '600mb', '700mb', '800mb'].includes(c.plan) && (
                        <option value={c.plan}>{c.plan}</option>
                      )}
                      <option value="100mb" style={{background: '#1e1b4b'}}>100mb</option>
                      <option value="600mb" style={{background: '#1e1b4b'}}>600mb</option>
                      <option value="700mb" style={{background: '#1e1b4b'}}>700mb</option>
                      <option value="800mb" style={{background: '#1e1b4b'}}>800mb</option>
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
                  <td style={{ fontWeight: 'bold' }}>
                    {parseFloat(c.saldo) < 0 ? (
                      <span style={{ color: '#4ade80' }}>
                        (Excedente) ${Math.abs(parseFloat(c.saldo)).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: parseFloat(c.saldo) > 0 ? '#f87171' : '#4ade80' }}>
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

      {/* MODAL DE PAGO FLOTANTE */}
      {showPagoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass" 
            style={{ width: '400px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Registrar Pago</h2>
              <button 
                onClick={() => setShowPagoModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Cliente</div>
              <div style={{ fontWeight: '600' }}>{selectedCliente?.nombre}</div>
            </div>

            <div className="input-group">
              <label className="label">Monto a Cobrar ($)</label>
              <input 
                className="input" 
                type="number" 
                step="0.01"
                value={pagoData.monto} 
                onChange={(e) => setPagoData({...pagoData, monto: e.target.value})} 
                placeholder="0.00"
                style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </div>

            <div className="input-group">
              <label className="label">Elegir Método de Pago</label>
              <select 
                className="input" 
                value={pagoData.metodo} 
                onChange={(e) => setPagoData({...pagoData, metodo: e.target.value})}
                style={{ cursor: 'pointer' }}
              >
                <option value="EFECTIVO" style={{background: '#1e1b4b'}}>EFECTIVO</option>
                <option value="JEP" style={{background: '#1e1b4b'}}>JEP</option>
                <option value="PICHINCHA" style={{background: '#1e1b4b'}}>PICHINCHA</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => setShowPagoModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={handleRegistrarPago}
              >
                Confirmar Pago
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Admin;
