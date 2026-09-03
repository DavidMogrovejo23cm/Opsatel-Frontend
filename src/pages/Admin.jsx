import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clienteService, configuracionService, hojaRutaService } from '../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { showAlert, showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';


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
  const [selectedComentariosModal, setSelectedComentariosModal] = useState(null);

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

    const isMantenimiento = !!cliente.mantenimiento;
    const customPriceVal = cliente.precio_plan_especial !== null && cliente.precio_plan_especial !== undefined ? parseFloat(cliente.precio_plan_especial) : 0;
    const isCustomPlan = !isMantenimiento && customPriceVal > 0;

    let netFee = 0;
    if (isMantenimiento) {
      netFee = 10.00;
    } else if (isCustomPlan) {
      netFee = customPriceVal;
    } else {
      const planObj = planesList.find(p => p.nombre.toLowerCase() === (cliente?.plan || '').toLowerCase());
      const planPrice = planObj ? parseFloat(planObj.precio || 0) : 0;
      if (cliente.saldo !== null && cliente.saldo !== undefined && parseFloat(cliente.saldo || 0) > 0) {
        netFee = parseFloat(cliente.saldo);
      } else if (planPrice > 0) {
        netFee = planPrice;
      } else {
        netFee = Math.max(0, parseFloat(cliente.total_pago || 0) - parseFloat(cliente.plus || 0) - parseFloat(cliente.adicional || 0));
      }
    }
    const internetSugerido = netFee.toFixed(2);

    const deudaPlus = parseFloat(cliente.plus || 0);
    const deudaAdicional = parseFloat(cliente.adicional || 0);
    const totalPendiente = (parseFloat(internetSugerido) + deudaPlus + deudaAdicional).toFixed(2);

    const isCortesiaTotal = !!cliente.cortesia_total;

    const planData = planesList.find(p => p.nombre === cliente.plan);
    const baseScreens = planData ? (planData.pantallas ?? 0) : 0;
    const initialScreens = (cliente.iptv_max_conn !== undefined && cliente.iptv_max_conn !== null && cliente.iptv_max_conn !== 0)
      ? cliente.iptv_max_conn
      : (baseScreens + Math.round(deudaPlus / 2));

    setPagoData({
      monto: isCortesiaTotal ? "0" : totalPendiente,
      metodo: bancosList.length > 0 ? bancosList[0].nombre : 'EFECTIVO',
      facturas: (cliente.facturas && String(cliente.facturas).trim().toUpperCase() === 'SI') ? 'SI' : 'NONE',
      internet_payment: isCortesiaTotal ? "0" : internetSugerido,
      app: cliente.app || '',
      payment_date: new Date().toISOString().split('T')[0],
      client_payment_date: cliente.client_payment_date || '',
      cod: cliente.cod || '',
      plus: "0",
      bank_plus: cliente.bank_plus || '',
      adicional: "0",
      deuda_plus: cliente.plus || '0',
      deuda_adicional: cliente.adicional || '0',
      iptv_max_conn: initialScreens,
      notas_pago: cliente.notas_pago || '',
      comentarios_edit: cliente.comentarios || '',
      cortesiaMode: isCortesiaTotal ? 'TOTAL' : 'NONE',
      cortesiaPct: '',
      isMantenimiento: isMantenimiento,
      isCustomPlan: isCustomPlan,
      precio_plan_especial: customPriceVal,
      customPlanPriceInput: customPriceVal > 0 ? customPriceVal.toString() : internetSugerido,
      original_internet: internetSugerido,
      original_plus: cliente.plus || '0',
      original_adicional: cliente.adicional || '0',
      descuentoValue: isCortesiaTotal ? internetSugerido : 0,
      iptvDescuentoValue: isCortesiaTotal ? (cliente.plus || '0') : 0
    });
    setShowPagoModal(true);
  };

  const handleRegistrarPago = async () => {
    if (!pagoData.monto || isNaN(pagoData.monto)) return showWarning("Ingrese un monto válido");

    const noneIfEmpty = (val) => (val && String(val).trim()) ? String(val).trim() : "NONE";

    const montoTotal = parseFloat(pagoData.monto || 0);
    let resto = montoTotal;

    const deudaInternet = Math.max(0, parseFloat(selectedCliente.saldo || 0));
    const deudaPlus = parseFloat(pagoData.deuda_plus || 0);
    const deudaAdicional = parseFloat(pagoData.deuda_adicional || 0);

    let abonoInternet = 0;
    let abonoPlus = 0;
    let abonoAdicional = 0;

    if (pagoData.cortesiaMode === 'TOTAL') {
      abonoInternet = deudaInternet;
      abonoPlus = deudaPlus;
      abonoAdicional = deudaAdicional;
    } else {
      // 1. Pagar Internet
      abonoInternet = Math.min(resto, deudaInternet);
      resto = parseFloat((resto - abonoInternet).toFixed(2));

      // 2. Pagar IPTV Plus
      abonoPlus = Math.min(resto, deudaPlus);
      resto = parseFloat((resto - abonoPlus).toFixed(2));

      // 3. Pagar Adicional
      abonoAdicional = Math.min(resto, deudaAdicional);
      resto = parseFloat((resto - abonoAdicional).toFixed(2));

      // 4. Si sobra saldo (excedente), se suma a abonoInternet
      if (resto > 0) {
        abonoInternet = parseFloat((abonoInternet + resto).toFixed(2));
      }
    }

    const descInternet = pagoData.cortesiaMode === 'TOTAL' ? deudaInternet : 0;
    const descPlus = pagoData.cortesiaMode === 'TOTAL' ? deudaPlus : 0;
    const descAdicional = pagoData.cortesiaMode === 'TOTAL' ? deudaAdicional : 0;

    try {
      if (abonoPlus > 0 && !pagoData.bank_plus) {
        return showWarning('Debe seleccionar el banco para el cobro de IPTV (Bank Plus).');
      }

      // Sincronizar deudas modificadas, comentarios y cortesía PRIMERO en el backend
      await clienteService.updateAdmin(selectedCliente.id, {
        plus: pagoData.deuda_plus,
        adicional: pagoData.deuda_adicional,
        comentarios: pagoData.comentarios_edit !== undefined ? pagoData.comentarios_edit : selectedCliente.comentarios,
        cortesia_total: pagoData.cortesiaMode === 'TOTAL',
        mantenimiento: !!pagoData.isMantenimiento
      });

      // Luego registrar el pago que descontará del saldo actualizado
      await clienteService.pagar(selectedCliente.id, {
        monto: montoTotal,
        metodo_pago: pagoData.metodo,
        mes_correspondiente: new Date().toISOString().slice(0, 7),
        referencia: `Pago vía Admin - ${pagoData.metodo}${pagoData.cortesiaMode !== 'NONE' ? ' (CORTESÍA)' : ''}`,
        facturas: noneIfEmpty(pagoData.facturas),
        internet_payment: abonoInternet > 0 ? abonoInternet.toFixed(2) : "NONE",
        app: noneIfEmpty(pagoData.app),
        payment_date: pagoData.payment_date || new Date().toISOString().split('T')[0],
        client_payment_date: noneIfEmpty(pagoData.client_payment_date),
        bank: pagoData.metodo,
        cod: noneIfEmpty(pagoData.cod),
        plus: abonoPlus.toFixed(2),
        bank_plus: noneIfEmpty(pagoData.bank_plus),
        adicional: abonoAdicional.toFixed(2),
        descuento_internet: descInternet,
        descuento_plus: descPlus,
        descuento_adicional: descAdicional,
        notas_pago: (() => {
          let nota = (pagoData.notas_pago && String(pagoData.notas_pago).trim()) ? String(pagoData.notas_pago).trim() : '';
          return nota.trim() || null;
        })()
      });

      setShowPagoModal(false);
      showSuccess("Pago registrado correctamente");
      fetchData();
    } catch (error) {
      showError("Error al registrar pago: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleGuardarCambios = async () => {
    try {
      await clienteService.updateAdmin(selectedCliente.id, {
        plus: pagoData.deuda_plus,
        adicional: pagoData.deuda_adicional,
        notas_pago: pagoData.notas_pago,
        comentarios: pagoData.comentarios_edit,
        app: pagoData.app,
        cod: pagoData.cod,
        facturas: pagoData.facturas,
        cortesia_total: pagoData.cortesiaMode === 'TOTAL',
        mantenimiento: !!pagoData.isMantenimiento,
        saldo: parseFloat(pagoData.original_internet || 0)
      });
      showSuccess("Valores guardados correctamente");
      fetchData(true);
    } catch (error) {
      showError("Error al guardar valores: " + (error.response?.data?.detail || error.message));
    }
  };

  const handlePlanChange = async (clienteId, nuevoPlan) => {
    try {
      await clienteService.updateAdmin(clienteId, { plan: nuevoPlan });
      showSuccess("Plan actualizado correctamente");
      fetchData();
    } catch (error) {
      showError("Error al actualizar plan");
    }
  };

  const [facturando, setFacturando] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const ejecutarFacturacion = async () => {
    if (cooldown > 0) return;
    const confirmado = await showConfirm("¿Ejecutar facturación?", "¿Desea ejecutar el cobro mensual para TODOS los clientes activos?", "Sí, ejecutar", "Cancelar");
    if (!confirmado) return;
    setFacturando(true);
    try {
      const resp = await clienteService.facturacionGlobal();
      showSuccess(resp.data.message);
      setCooldown(60);
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || "Error en facturación");
    } finally {
      setFacturando(false);
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
      if (statusFilter === 'JURIDICO' && !['JURIDICO', 'JURÍDICO'].includes(c.estado?.toUpperCase())) return false;
      if (statusFilter === 'PROCESO' && !['PROCESO', 'EN PROCESO'].includes(c.estado?.toUpperCase())) return false;

      return c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id?.toString().includes(searchTerm) ||
        c.ip?.toLowerCase().includes(searchTerm.toLowerCase());
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
            <option value="JURIDICO">Solo Jurídicos</option>
            <option value="PROCESO">Solo En Proceso</option>
          </select>

          <input
            className="input"
            placeholder="Buscar por ID, Nombre o IP..."
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
              <button
                className="btn btn-secondary"
                onClick={ejecutarFacturacion}
                disabled={facturando || cooldown > 0}
                style={{ opacity: (facturando || cooldown > 0) ? 0.7 : 1, cursor: (facturando || cooldown > 0) ? 'not-allowed' : 'pointer' }}
              >
                {facturando ? "⏳ Facturando..." : cooldown > 0 ? `⚙️ Facturación (${cooldown}s)` : "⚙️ Facturación Mensual"}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? <p>Cargando clientes...</p> : (
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto', overflowX: 'auto', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20 }}>
              <tr style={{ background: '#15122e' }}>
                <th style={{ position: 'sticky', top: 0, left: 0, background: '#15122e', zIndex: 25, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap', width: '60px', minWidth: '60px' }}>ID</th>
                <th style={{ position: 'sticky', top: 0, left: '60px', background: '#15122e', zIndex: 25, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap', width: '200px', minWidth: '200px' }}>Nombre</th>
                <th style={{ position: 'sticky', top: 0, left: '260px', background: '#15122e', zIndex: 25, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', borderRight: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap', width: '130px', minWidth: '130px' }}>IP</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Estado</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Plan Base</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Pantallas IPTV</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>IPTV (TV)</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Adicionales</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Plan</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Instalación / Últ. Visita</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Acciones</th>
                <th style={{ position: 'sticky', top: 0, background: '#15122e', zIndex: 20, padding: '12px 10px', borderBottom: '2px solid rgba(255, 255, 255, 0.15)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Comentarios del Contrato</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  opacity: c.estado?.toUpperCase() === 'PENDIENTE' ? 0.7 : 1
                }}>
                  <td style={{ position: 'sticky', left: 0, zIndex: 15, background: '#130f26', padding: '12px 10px', whiteSpace: 'nowrap' }}>{c.id}</td>
                  <td style={{ position: 'sticky', left: '60px', zIndex: 15, background: '#130f26', padding: '12px 10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{c.nombre}</td>
                  <td style={{ position: 'sticky', left: '260px', zIndex: 15, background: '#130f26', padding: '12px 10px', borderRight: '2px solid rgba(255, 255, 255, 0.15)', fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{c.ip || '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      background: c.estado?.toUpperCase() === 'ACTIVO' ? 'rgba(16, 185, 129, 0.1)' :
                        (c.estado?.toUpperCase() === 'INACTIVO' ? 'rgba(239, 68, 68, 0.1)' :
                          (c.estado?.toUpperCase() === 'JURIDICO' || c.estado?.toUpperCase() === 'JURÍDICO' ? 'rgba(236, 72, 153, 0.1)' :
                            (['PROCESO', 'EN PROCESO'].includes(c.estado?.toUpperCase()) ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)'))),
                      color: c.estado?.toUpperCase() === 'ACTIVO' ? '#10b981' :
                        (c.estado?.toUpperCase() === 'INACTIVO' ? '#ef4444' :
                          (c.estado?.toUpperCase() === 'JURIDICO' || c.estado?.toUpperCase() === 'JURÍDICO' ? '#ec4899' :
                            (['PROCESO', 'EN PROCESO'].includes(c.estado?.toUpperCase()) ? '#f59e0b' : '#94a3b8')))
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
                        if (c.iptv_max_conn !== undefined && c.iptv_max_conn !== null && c.iptv_max_conn !== 0) {
                          return c.iptv_max_conn;
                        }
                        const planData = planesList.find(p => p.nombre === c.plan);
                        const base = planData ? (planData.pantallas ?? 0) : 0;
                        return base + Math.round(parseFloat(c.plus || 0) / 2);
                      })()}
                      onChange={async (e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 0) return;
                        const planData = planesList.find(p => p.nombre === c.plan);
                        const baseScreens = planData ? (planData.pantallas ?? 0) : 0;
                        const newPlus = (Math.max(0, (val - baseScreens) * 2)).toString();
                        try {
                          await clienteService.updateAdmin(c.id, {
                            iptv_max_conn: val,
                            plus: newPlus
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
                  <td>
                    {parseFloat(c.plus || 0) > 0 ? (
                      <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                        ${parseFloat(c.plus).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>$0.00</span>
                    )}
                  </td>
                  <td>
                    {parseFloat(c.adicional || 0) > 0 ? (
                      <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                        ${parseFloat(c.adicional).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>$0.00</span>
                    )}
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

                  <td style={{ fontSize: '0.8rem', color: '#e2e8f0', maxWidth: '220px', padding: '12px 10px' }}>
                    {c.comentarios ? (
                      <div>
                        <span style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word'
                        }}>
                          {c.comentarios}
                        </span>
                        <button
                          onClick={() => setSelectedComentariosModal({ nombre: c.nombre, comentarios: c.comentarios })}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            padding: 0,
                            marginTop: '4px',
                            textDecoration: 'underline',
                            fontWeight: '600'
                          }}
                        >
                          Ver más
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
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
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 360px) 1fr',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: '24px',
            maxWidth: '1550px',
            width: '98%',
            margin: 'auto'
          }}>
            {/* Panel de Observaciones Lateral (IZQUIERDA) */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{
                width: '100%',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                background: '#151030',
                maxHeight: '92vh',
                overflowY: 'auto'
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
                      showSuccess('Comentarios del contrato guardados correctamente.');
                      fetchData();
                    } catch (err) {
                      showError('Error al guardar comentarios.');
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
            {/* Modal de Pago Principal (DERECHA) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="glass glass-card"
              style={{
                width: '100%',
                maxWidth: '100%',
                padding: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                position: 'relative',
                background: '#130f26',
                borderRadius: '24px',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Registrar Pago / Administrar Cuenta</h2>
                <button onClick={() => setShowPagoModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
              </div>

              <div style={{ padding: '0 0 12px 0', marginTop: '-8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente: </span>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem' }}>{selectedCliente?.nombre}</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '20px',
                alignItems: 'start',
                marginTop: '16px'
              }}>
                {/* 📊 COLUMNA IZQUIERDA: RESUMEN DE SALDOS Y MODIFICACIONES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Resumen de saldos */}
                  <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saldos Actuales en Sistema</h4>

                    {(parseFloat(pagoData.original_internet || 0) > 0 && pagoData.cortesiaMode !== 'TOTAL') && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Deuda Arrastrada (Saldo):</span>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                          ${parseFloat(pagoData.original_internet || 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Monto Plan Base (Internet):</span>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                        ${(parseFloat(pagoData.original_internet || 0)).toFixed(2)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '6px', paddingTop: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Monto IPTV ({(() => {
                        if (pagoData.iptv_max_conn !== undefined && pagoData.iptv_max_conn !== null && pagoData.iptv_max_conn !== 0) {
                          return pagoData.iptv_max_conn;
                        }
                        const planData = planesList.find(p => p.nombre === selectedCliente?.plan);
                        const base = planData ? (planData.pantallas ?? 0) : 0;
                        return base + Math.round(parseFloat(pagoData.deuda_plus || 0) / 2);
                      })()} Pantallas):</span>
                      <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                        ${parseFloat(pagoData.deuda_plus || 0).toFixed(2)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '6px', paddingTop: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Deuda Adicional:</span>
                      <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                        ${parseFloat(pagoData.deuda_adicional || 0).toFixed(2)}
                      </span>
                    </div>

                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        <span>Total Pendiente:</span>
                        <span style={{ color: (pagoData.cortesiaMode === 'TOTAL' ? 0 : (parseFloat(pagoData.original_internet || 0) + parseFloat(pagoData.deuda_plus || 0) + parseFloat(pagoData.deuda_adicional || 0))) > 0 ? '#f87171' : '#4ade80' }}>
                          ${(pagoData.cortesiaMode === 'TOTAL' ? 0 : (parseFloat(pagoData.original_internet || 0) + parseFloat(pagoData.deuda_plus || 0) + parseFloat(pagoData.deuda_adicional || 0))).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ⚙️ SECCIÓN 2: MODIFICAR DEUDAS EN CUENTA (GUARDAR VALORES) */}
                  <div style={{
                    padding: '14px',
                    background: 'rgba(167, 139, 250, 0.04)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(167, 139, 250, 0.2)'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ⚙️ Modificar Deudas en Cuenta (Guardar Valores)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#c084fc' }}>Deuda IPTV Plus ($)</label>
                        <input type="number" step="0.01" className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '10px', height: '36px', padding: '6px' }} value={pagoData.deuda_plus} onChange={(e) => {
                          const val = e.target.value;
                          const originalInternetVal = parseFloat(pagoData.original_internet || 0);
                          const debtAdicionalVal = parseFloat(pagoData.deuda_adicional || 0);
                          const debtPlusVal = parseFloat(val || 0);
                          const newTotal = (originalInternetVal + debtPlusVal + debtAdicionalVal).toFixed(2);
                          setPagoData({ ...pagoData, deuda_plus: val, monto: newTotal });
                        }} />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#c084fc' }}>Deuda Adicional ($)</label>
                        <input type="number" step="0.01" className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.3)', borderRadius: '10px', height: '36px', padding: '6px' }} value={pagoData.deuda_adicional} onChange={(e) => {
                          const val = e.target.value;
                          const originalInternetVal = parseFloat(pagoData.original_internet || 0);
                          const debtPlusVal = parseFloat(pagoData.deuda_plus || 0);
                          const debtAdicionalVal = parseFloat(val || 0);
                          const newTotal = (originalInternetVal + debtPlusVal + debtAdicionalVal).toFixed(2);
                          setPagoData({ ...pagoData, deuda_adicional: val, monto: newTotal });
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Sección de cortesía y mantenimiento */}
                  <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px dashed rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          id="cortesia_total"
                          checked={pagoData.cortesiaMode === 'TOTAL'}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const mode = isChecked ? 'TOTAL' : 'NONE';
                            if (mode === 'TOTAL') {
                              setPagoData({
                                ...pagoData,
                                cortesiaMode: mode,
                                monto: "0",
                                descuentoValue: pagoData.original_internet,
                                iptvDescuentoValue: pagoData.original_plus
                              });
                            } else {
                              const originalTotal = (parseFloat(pagoData.original_internet) + parseFloat(pagoData.deuda_plus) + parseFloat(pagoData.deuda_adicional)).toFixed(2);
                              setPagoData({
                                ...pagoData,
                                cortesiaMode: mode,
                                monto: originalTotal,
                                descuentoValue: 0,
                                iptvDescuentoValue: 0
                              });
                            }
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#818cf8', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#818cf8' }}>Cortesía Total (Cobro $0.00)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          id="mantenimiento_modal_checkbox"
                          checked={!!pagoData.isMantenimiento}
                          onChange={async (e) => {
                            const isChecked = e.target.checked;
                            const planObj = planesList.find(p => p.nombre.toLowerCase() === (selectedCliente?.plan || '').toLowerCase());
                            const planPrice = planObj ? parseFloat(planObj.precio || 0) : (selectedCliente?.tercera_edad && selectedCliente?.precio_plan_especial ? parseFloat(selectedCliente.precio_plan_especial) : 0);
                            const newInternetVal = isChecked ? "10.00" : (planPrice > 0 ? planPrice.toFixed(2) : (selectedCliente?.saldo ? parseFloat(selectedCliente.saldo).toFixed(2) : "0.00"));
                            const deudaPlus = parseFloat(pagoData.deuda_plus || 0);
                            const deudaAdic = parseFloat(pagoData.deuda_adicional || 0);
                            const newTotal = (parseFloat(newInternetVal) + deudaPlus + deudaAdic).toFixed(2);

                            setPagoData(prev => ({
                              ...prev,
                              isMantenimiento: isChecked,
                              isCustomPlan: false,
                              precio_plan_especial: 0,
                              original_internet: newInternetVal,
                              monto: prev.cortesiaMode === 'TOTAL' ? "0" : newTotal
                            }));

                            if (selectedCliente) {
                              selectedCliente.mantenimiento = isChecked;
                              selectedCliente.precio_plan_especial = 0;
                              selectedCliente.saldo = isChecked ? 10.00 : (planPrice > 0 ? planPrice : selectedCliente.saldo);
                            }

                            try {
                              await clienteService.updateAdmin(selectedCliente.id, {
                                mantenimiento: isChecked,
                                precio_plan_especial: 0,
                                ...(isChecked ? { saldo: 10.00 } : (planPrice > 0 ? { saldo: planPrice } : {}))
                              });
                              showSuccess(`Mantenimiento ${isChecked ? 'activado ($10.00)' : 'desactivado (tarifa plan)'} para ${selectedCliente.nombre}`);
                            } catch (err) {
                              showError('Error al actualizar mantenimiento');
                            }
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#ec4899', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f472b6' }}>🛠️ Mantenimiento ($10.00/mes)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          id="modificar_saldo_plan_checkbox"
                          checked={!!pagoData.isCustomPlan}
                          onChange={async (e) => {
                            const isChecked = e.target.checked;
                            const planObj = planesList.find(p => p.nombre.toLowerCase() === (selectedCliente?.plan || '').toLowerCase());
                            const planPrice = planObj ? parseFloat(planObj.precio || 0) : (selectedCliente?.saldo ? parseFloat(selectedCliente.saldo) : 0);

                            if (!isChecked) {
                              // Desmarcado: restaurar precio original del plan
                              const deudaPlus = parseFloat(pagoData.deuda_plus || 0);
                              const deudaAdic = parseFloat(pagoData.deuda_adicional || 0);
                              const newInternetVal = pagoData.isMantenimiento ? "10.00" : planPrice.toFixed(2);
                              const newTotal = (parseFloat(newInternetVal) + deudaPlus + deudaAdic).toFixed(2);

                              setPagoData(prev => ({
                                ...prev,
                                isCustomPlan: false,
                                precio_plan_especial: 0,
                                customPlanPriceInput: '',
                                original_internet: newInternetVal,
                                monto: prev.cortesiaMode === 'TOTAL' ? "0" : newTotal
                              }));

                              if (selectedCliente) {
                                selectedCliente.precio_plan_especial = 0;
                                if (!selectedCliente.mantenimiento) selectedCliente.saldo = planPrice;
                              }

                              try {
                                await clienteService.updateAdmin(selectedCliente.id, {
                                  precio_plan_especial: 0,
                                  ...(selectedCliente.mantenimiento ? {} : { saldo: planPrice })
                                });
                                showSuccess(`Tarifa del plan restaurada a $${planPrice.toFixed(2)} para ${selectedCliente.nombre}`);
                              } catch (err) {
                                showError('Error al restaurar tarifa del plan');
                              }
                            } else {
                              // Marcado: habilitar modificación de saldo
                              const currentVal = parseFloat(pagoData.customPlanPriceInput || pagoData.original_internet) || planPrice;
                              const deudaPlus = parseFloat(pagoData.deuda_plus || 0);
                              const deudaAdic = parseFloat(pagoData.deuda_adicional || 0);
                              const newTotal = (currentVal + deudaPlus + deudaAdic).toFixed(2);

                              setPagoData(prev => ({
                                ...prev,
                                isCustomPlan: true,
                                isMantenimiento: false,
                                precio_plan_especial: currentVal,
                                customPlanPriceInput: currentVal.toFixed(2),
                                original_internet: currentVal.toFixed(2),
                                monto: prev.cortesiaMode === 'TOTAL' ? "0" : newTotal
                              }));

                              if (selectedCliente) {
                                selectedCliente.mantenimiento = false;
                                selectedCliente.precio_plan_especial = currentVal;
                                selectedCliente.saldo = currentVal;
                              }

                              try {
                                await clienteService.updateAdmin(selectedCliente.id, {
                                  mantenimiento: false,
                                  precio_plan_especial: currentVal,
                                  saldo: currentVal
                                });
                                showSuccess(`Modificación de tarifa activada para ${selectedCliente.nombre}`);
                              } catch (err) {
                                showError('Error al activar tarifa especial');
                              }
                            }
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#fbbf24', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fbbf24' }}>🏷️ Modificar saldo plan</span>
                      </label>
                    </div>

                    {pagoData.isCustomPlan && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 'bold' }}>Valor Promocional del Internet ($):</span>
                        <input
                          type="number"
                          step="0.01"
                          className="input"
                          style={{ width: '120px', height: '36px', padding: '4px 8px', borderColor: '#fbbf24', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', margin: 0 }}
                          value={pagoData.customPlanPriceInput}
                          onChange={async (e) => {
                            const inputVal = e.target.value;
                            const numericVal = parseFloat(inputVal) || 0;
                            const deudaPlus = parseFloat(pagoData.deuda_plus || 0);
                            const deudaAdic = parseFloat(pagoData.deuda_adicional || 0);
                            const newTotal = (numericVal + deudaPlus + deudaAdic).toFixed(2);

                            setPagoData(prev => ({
                              ...prev,
                              customPlanPriceInput: inputVal,
                              precio_plan_especial: numericVal,
                              original_internet: numericVal.toFixed(2),
                              monto: prev.cortesiaMode === 'TOTAL' ? "0" : newTotal
                            }));

                            if (selectedCliente) {
                              selectedCliente.precio_plan_especial = numericVal;
                              selectedCliente.saldo = numericVal;
                            }

                            try {
                              await clienteService.updateAdmin(selectedCliente.id, {
                                precio_plan_especial: numericVal,
                                saldo: numericVal
                              });
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 💰 COLUMNA DERECHA: REGISTRO DE COBRO Y DETALLES DE TRANSACCIÓN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 💸 SECCIÓN 1: REGISTRAR COBRO */}
                  <div style={{
                    padding: '14px',
                    background: 'rgba(59, 130, 246, 0.04)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(59, 130, 246, 0.2)'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      💰 Registrar Cobro (Monto Total Recibido)
                    </h4>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#60a5fa' }}>Monto total entregado por cliente ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ borderColor: '#3b82f6', borderRadius: '10px', height: '42px', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 0 10px rgba(59, 130, 246, 0.15)', padding: '8px' }}
                        value={pagoData.monto}
                        onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })}
                        disabled={pagoData.cortesiaMode === 'TOTAL'}
                        autoFocus
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        * Ingrese el total de dinero entregado. El sistema liquidará automáticamente deudas prioritarias.
                      </span>
                    </div>
                  </div>

                  {/* 📝 SECCIÓN 3: DETALLES DE LA TRANSACCIÓN */}
                  <div style={{
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📝 Detalles del Pago / Transacción
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {/* Método */}
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#a78bfa' }}>Método de Pago</label>
                        <select className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.2)', borderRadius: '10px', background: '#130f26', color: 'white', height: '36px', padding: '6px' }} value={pagoData.metodo} onChange={(e) => setPagoData({ ...pagoData, metodo: e.target.value })}>
                          {bancosList.length === 0 && <option value="EFECTIVO" style={{ background: '#130f26', color: 'white' }}>EFECTIVO</option>}
                          {bancosList.map(b => (
                            <option key={b.id} value={b.nombre} style={{ background: '#130f26', color: 'white' }}>{b.nombre}</option>
                          ))}
                        </select>
                      </div>

                      {/* Bank Plus */}
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#a78bfa' }}>Banco IPTV</label>
                        <select className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.2)', borderRadius: '10px', background: '#130f26', color: 'white', height: '36px', padding: '6px' }} value={pagoData.bank_plus} onChange={(e) => setPagoData({ ...pagoData, bank_plus: e.target.value })}>
                          <option value="" style={{ background: '#130f26', color: 'white' }}>Ninguno</option>
                          {bancosList.map(b => (
                            <option key={b.id} value={b.nombre} style={{ background: '#130f26', color: 'white' }}>{b.nombre}</option>
                          ))}
                        </select>
                      </div>

                      {/* Cod */}
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#a78bfa' }}>Cod Factura</label>
                        <input className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.2)', borderRadius: '10px', height: '36px', padding: '6px' }} value={pagoData.cod} onChange={(e) => setPagoData({ ...pagoData, cod: e.target.value })} />
                      </div>

                      {/* Facturas */}
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#a78bfa' }}>Facturas</label>
                        <select
                          className="input"
                          style={{ borderColor: 'rgba(167, 139, 250, 0.2)', borderRadius: '10px', background: '#130f26', color: 'white', height: '36px', padding: '6px' }}
                          value={pagoData.facturas}
                          onChange={(e) => setPagoData({ ...pagoData, facturas: e.target.value })}
                        >
                          <option value="NONE" style={{ background: '#130f26', color: 'white' }}>NONE</option>
                          <option value="SI" style={{ background: '#130f26', color: 'white' }}>SI</option>
                        </select>
                      </div>

                      {/* Fecha Pago */}
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#a78bfa' }}>Fecha Pago</label>
                        <input type="date" className="input" style={{ borderColor: 'rgba(167, 139, 250, 0.2)', borderRadius: '10px', height: '36px', padding: '6px' }} value={pagoData.payment_date} onChange={(e) => setPagoData({ ...pagoData, payment_date: e.target.value })} />
                      </div>

                      {/* Nota de Pago / Reparación */}
                      <div className="form-group grid-span-2" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#a78bfa' }}>Nota de Pago / Reparación (Adicional)</label>
                        <textarea
                          className="input"
                          style={{ borderColor: 'rgba(167, 139, 250, 0.2)', borderRadius: '10px', minHeight: '36px', resize: 'vertical', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem' }}
                          value={pagoData.notas_pago}
                          onChange={(e) => setPagoData({ ...pagoData, notas_pago: e.target.value })}
                          placeholder="Escriba aquí si hay reparaciones..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowPagoModal(false)}>Cancelar</button>
                <button className="btn btn-secondary" onClick={handleGuardarCambios} style={{ backgroundColor: '#4b5563', color: 'white', padding: '8px 16px', fontSize: '0.85rem' }}>
                  💾 Guardar Valores
                </button>
                <button className="btn btn-primary" onClick={handleRegistrarPago} style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
                  De acuerdo (PAGAR)
                </button>
              </div>
            </motion.div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Liviano para Ver Más Comentarios del Contrato */}
      {selectedComentariosModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: '#151030', border: '1px solid rgba(96, 165, 250, 0.3)',
            borderRadius: '16px', padding: '24px', maxWidth: '550px', width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#60a5fa' }}>
                📝 Comentarios del Contrato - {selectedComentariosModal.nombre}
              </h3>
              <button onClick={() => setSelectedComentariosModal(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', maxHeight: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px' }}>
              {selectedComentariosModal.comentarios}
            </div>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedComentariosModal(null)} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};

export default Admin;
