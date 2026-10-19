/**
 * @file ExtraPagos.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { extrasService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';
import { showSuccess, showError } from '../utils/alerts';

const ExtraPagos = () => {
  const [extras, setExtras] = useState([]);
  const [bancosList, setBancosList] = useState([]);
  const [pagosHistory, setPagosHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState(null);

  // Modal para ver más referencias y comentarios
  const [refModalData, setRefModalData] = useState(null);
  const [editRefText, setEditRefText] = useState('');
  const [editObsText, setEditObsText] = useState('');
  const [savingRef, setSavingRef] = useState(false);

  // Estados para edición directa en línea (inline edit)
  const [editingCell, setEditingCell] = useState(null); // { id: number, field: 'valor' | 'pago' | 'saldo' }
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState(false);

  const months = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];

  const listMonths = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  // Mes seleccionado para gestionar en la tabla (por defecto el mes actual)
  const currentMonthName = months[new Date().getMonth()];
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);

  const [pagoData, setPagoData] = useState({
    monto: 0,
    metodo: 'EFECTIVO',
    mes: currentMonthName,
    referencia: '',
    factura: ''
  });

  const getMonthIdxByName = (mName) => {
    if (!mName) return new Date().getMonth();
    const idx = listMonths.indexOf(String(mName).trim().toLowerCase());
    return idx >= 0 ? idx : new Date().getMonth();
  };

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

  const strNonEmpty = (val) => {
    return val !== undefined && val !== null && String(val).trim() !== '';
  };

  // Obtiene el pago del mes seleccionado para un cliente
  const getPagoMes = (e, mesNombre = selectedMonth) => {
    if (!e) return 0;
    const m = (mesNombre || 'octubre').toLowerCase();
    return parseFloat(e[`${m}_pago`] || 0);
  };

  // Obtiene el saldo (debe o excedente) del mes seleccionado para un cliente
  // Si > 0: Debe (saldo pendiente)
  // Si < 0: Excedente / A favor
  // Si === 0: Al día
  // IMPORTANTE:
  // 1) Si estado es ELIMINADO: saldo es 0.00
  // 2) Arrastre acumulativo: Si en el mes anterior debía dinero (ej: Septiembre $4) y en el mes actual
  //    son $4 de valor base con pago $0, el total a cancelar es $8 ($4 + $4).
  const getSaldoMes = (e, mesNombre = selectedMonth) => {
    if (!e) return 0;
    if ((e.estado || '').trim().toUpperCase() === 'ELIMINADO') return 0;

    const mIdx = getMonthIdxByName(mesNombre);
    const m = listMonths[mIdx];
    const valorBase = parseFloat(e.valor || 0);
    const pagoMes = parseFloat(e[`${m}_pago`] || 0);
    const startMonthIdx = getStartMonthIdx(e.fecha_ingreso);

    if (mIdx < startMonthIdx) return 0;

    // Saldo acumulado del mes anterior
    const prevSaldo = (mIdx > 0 && mIdx > startMonthIdx)
      ? getSaldoMes(e, listMonths[mIdx - 1])
      : (mIdx > 0 ? parseFloat(e[`${listMonths[mIdx - 1]}_saldo`] || 0) : 0);

    const saldoField = e[`${m}_saldo`];
    if (strNonEmpty(saldoField)) {
      const numSaldo = parseFloat(saldoField);
      // Si el mes previo tenía saldo deudor y en el actual no hubo pago suficiente,
      // asegurar que refleje la acumulación (ej: sep 4 + oct 4 = 8)
      if (prevSaldo > 0 && pagoMes === 0 && numSaldo < prevSaldo + valorBase) {
        return Math.round((prevSaldo + valorBase) * 100) / 100;
      }
      return numSaldo;
    }

    return Math.round((prevSaldo + valorBase - pagoMes) * 100) / 100;
  };

  // Deuda total acumulada a la fecha actual (o mes actual)
  const calculateDebeTotal = (e) => {
    if (!e) return 0;
    if ((e.estado || '').trim().toUpperCase() === 'ELIMINADO') return 0;
    const currentMonthIdx = new Date().getMonth();
    return getSaldoMes(e, listMonths[currentMonthIdx]);
  };

  const fetchData = async () => {
    try {
      const [extrasResp, banksResp, pagosResp] = await Promise.all([
        extrasService.listar(),
        configuracionService.getBancos().catch(() => ({ data: [] })),
        extrasService.listarPagos().catch(() => ({ data: [] }))
      ]);
      setExtras(extrasResp.data || []);
      setBancosList(banksResp.data || []);
      setPagosHistory(pagosResp.data || []);
    } catch (err) {
      console.error(err);
      showError("Error al cargar los datos de extras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lista de estados disponibles para filtrar
  const availableEstados = useMemo(() => {
    const base = ['TODOS', '30 DÍAS', 'INFINITO', 'FIJO', 'SEMIFIJO', 'CORTE', 'EN CORTE', 'ELIMINADO'];
    const fromData = extras.map(e => (e.estado || '').trim().toUpperCase()).filter(Boolean);
    return Array.from(new Set([...base, ...fromData]));
  }, [extras]);

  // Métodos de pago sin duplicar "EFECTIVO"
  const uniqueMetodosPago = useMemo(() => {
    const list = ['EFECTIVO'];
    (bancosList || []).forEach(b => {
      const nombre = (b.nombre || '').trim();
      if (nombre && nombre.toUpperCase() !== 'EFECTIVO' && !list.includes(nombre)) {
        list.push(nombre);
      }
    });
    return list;
  }, [bancosList]);

  // Totales de recaudación y cartera pendiente para el mes seleccionado
  // REGLA CLAVE: En saldo pendiente / cartera NO cuentan los clientes con estado ELIMINADO
  const totals = useMemo(() => {
    let globalDebe = 0;
    let recaudadoMes = 0;
    extras.forEach(e => {
      if ((e.estado || '').trim().toUpperCase() === 'ELIMINADO') return;
      const saldoMes = getSaldoMes(e, selectedMonth);
      if (saldoMes > 0) {
        globalDebe += saldoMes;
      }
      recaudadoMes += getPagoMes(e, selectedMonth);
    });
    return { 
      globalDebe, 
      recaudadoMes, 
      totalClientes: extras.length,
      activosCount: extras.filter(x => (x.estado || '').trim().toUpperCase() !== 'ELIMINADO' && x.activo === 'SI').length 
    };
  }, [extras, selectedMonth]);

  // Abrir modal de cobro con sugerencia acumulada exacta
  const openPagoModal = (extra) => {
    if ((extra.estado || '').trim().toUpperCase() === 'ELIMINADO') {
      showError("El cliente tiene estado ELIMINADO y no registra saldo pendiente a cobrar.");
      return;
    }

    setSelectedExtra(extra);
    const saldoMesActual = getSaldoMes(extra, selectedMonth);
    const deudaTotal = calculateDebeTotal(extra);
    
    // Sugerencia de cobro inteligente: si debe en este mes cobra eso (que ya incluye meses previos acumulados), sino deuda total, sino valor base
    let montoInicial = parseFloat(extra.valor || 0);
    if (saldoMesActual > 0) {
      montoInicial = saldoMesActual;
    } else if (deudaTotal > 0) {
      montoInicial = deudaTotal;
    }

    setPagoData({
      monto: montoInicial,
      metodo: uniqueMetodosPago[0] || 'EFECTIVO',
      mes: selectedMonth,
      referencia: '',
      factura: ''
    });
    setShowPagoModal(true);
  };

  const handlePagar = async () => {
    try {
      await extrasService.pagar(selectedExtra.id, {
        monto: parseFloat(pagoData.monto || 0),
        metodo_pago: pagoData.metodo,
        mes_correspondiente: pagoData.mes,
        referencia: pagoData.referencia || `Pago EXTRA - ${pagoData.mes}`,
        factura: pagoData.factura
      });
      setShowPagoModal(false);
      showSuccess(`Pago de $${parseFloat(pagoData.monto || 0).toFixed(2)} registrado correctamente`);
      fetchData();
    } catch (err) {
      showError("Error al registrar pago extra: " + (err.response?.data?.detail || err.message));
    }
  };

  // --- LÓGICA DE EDICIÓN DIRECTA EN LÍNEA (INLINE EDIT) ---
  const handleStartEdit = (extra, field) => {
    if ((extra.estado || '').trim().toUpperCase() === 'ELIMINADO' && field === 'saldo') {
      showError("Los clientes con estado ELIMINADO tienen saldo $0.00 fijo.");
      return;
    }
    let initialVal = 0;
    if (field === 'valor') {
      initialVal = parseFloat(extra.valor || 0);
    } else if (field === 'pago') {
      initialVal = getPagoMes(extra, selectedMonth);
    } else if (field === 'saldo') {
      initialVal = getSaldoMes(extra, selectedMonth);
    }
    setEditingCell({ id: extra.id, field });
    setEditValue(initialVal.toFixed(2));
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleSaveEdit = async (extra, field) => {
    const valNum = parseFloat(editValue);
    if (isNaN(valNum)) {
      showError("Por favor ingresa un número válido");
      return;
    }

    const m = selectedMonth.toLowerCase();
    const mIdx = listMonths.indexOf(m);
    const isEliminado = (extra.estado || '').trim().toUpperCase() === 'ELIMINADO';
    const payload = {};

    if (field === 'valor') {
      payload.valor = valNum;
      // Arrastrar cálculo para todos los meses
      let running = 0;
      for (let j = 0; j < 12; j++) {
        const curM = listMonths[j];
        const curPago = parseFloat(extra[`${curM}_pago`] || 0);
        running = Math.round((running + valNum - curPago) * 100) / 100;
        payload[`${curM}_saldo`] = isEliminado ? 0 : running;
      }
      const currentMonthIdx = new Date().getMonth();
      const currKey = listMonths[currentMonthIdx];
      payload.saldo_pendiente = isEliminado ? 0 : Math.max(0, payload[`${currKey}_saldo`] ?? running);
    } else if (field === 'pago') {
      payload[`${m}_pago`] = valNum;
      if (!extra[`${m}_fecha_pago`] && valNum > 0) {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const mon = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        payload[`${m}_fecha_pago`] = `${d}/${mon}/${y}`;
      }
      if (!extra[`${m}_banco`] && valNum > 0) {
        payload[`${m}_banco`] = 'EFECTIVO';
      }
      const baseVal = parseFloat(extra.valor || 0);
      const prevM = mIdx > 0 ? listMonths[mIdx - 1] : null;
      const prevSaldo = prevM ? getSaldoMes(extra, listMonths[mIdx - 1]) : 0;
      const newSaldo = Math.round((prevSaldo + baseVal - valNum) * 100) / 100;
      payload[`${m}_saldo`] = isEliminado ? 0 : newSaldo;

      let running = newSaldo;
      for (let j = mIdx + 1; j < 12; j++) {
        const nextM = listMonths[j];
        const nextPago = parseFloat(extra[`${nextM}_pago`] || 0);
        running = Math.round((running + baseVal - nextPago) * 100) / 100;
        payload[`${nextM}_saldo`] = isEliminado ? 0 : running;
      }
      const currentMonthIdx = new Date().getMonth();
      const currKey = listMonths[currentMonthIdx];
      payload.saldo_pendiente = isEliminado ? 0 : Math.max(0, payload[`${currKey}_saldo`] ?? running);
    } else if (field === 'saldo') {
      if (isEliminado) {
        payload[`${m}_saldo`] = 0;
        payload.saldo_pendiente = 0;
      } else {
        payload[`${m}_saldo`] = valNum;
        const baseVal = parseFloat(extra.valor || 0);
        let running = valNum;
        for (let j = mIdx + 1; j < 12; j++) {
          const nextM = listMonths[j];
          const nextPago = parseFloat(extra[`${nextM}_pago`] || 0);
          running = Math.round((running + baseVal - nextPago) * 100) / 100;
          payload[`${nextM}_saldo`] = running;
        }
        const currentMonthIdx = new Date().getMonth();
        const currKey = listMonths[currentMonthIdx];
        payload.saldo_pendiente = Math.max(0, payload[`${currKey}_saldo`] ?? running);
      }
    }

    setSavingCell(true);
    try {
      const resp = await extrasService.actualizar(extra.id, payload);
      // Actualizar de forma inmediata en el estado local
      setExtras(prev => prev.map(item => item.id === extra.id ? { ...item, ...resp.data } : item));
      setEditingCell(null);
      showSuccess("Campo actualizado correctamente");
    } catch (err) {
      showError("Error al actualizar: " + (err.response?.data?.detail || err.message));
    } finally {
      setSavingCell(false);
    }
  };

  const roundTwo = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  // --- LÓGICA DE MODAL DE REFERENCIAS Y COMENTARIOS ---
  const openRefModal = (extra) => {
    const m = selectedMonth.toLowerCase();
    const refMes = extra[`${m}_cod`] || '';
    const obs = extra.observaciones || '';
    const clientePagos = pagosHistory.filter(p => p.cliente_id === extra.id);
    setRefModalData({
      cliente: extra,
      mes: selectedMonth,
      referenciaActual: refMes,
      observaciones: obs,
      historial: clientePagos
    });
    setEditRefText(refMes);
    setEditObsText(obs);
  };

  const handleSaveReferenciaModal = async () => {
    if (!refModalData) return;
    setSavingRef(true);
    try {
      const m = selectedMonth.toLowerCase();
      const payload = {
        [`${m}_cod`]: editRefText,
        observaciones: editObsText
      };
      const resp = await extrasService.actualizar(refModalData.cliente.id, payload);
      setExtras(prev => prev.map(item => item.id === refModalData.cliente.id ? { ...item, ...resp.data } : item));
      setRefModalData(null);
      showSuccess("Referencias y comentarios actualizados");
    } catch (err) {
      showError("Error al guardar referencia: " + (err.response?.data?.detail || err.message));
    } finally {
      setSavingRef(false);
    }
  };

  // Obtener referencia para previsualizar en la fila
  const getReferenciaPreview = (extra) => {
    const m = selectedMonth.toLowerCase();
    const refMes = (extra[`${m}_cod`] || '').trim();
    if (refMes) return refMes;

    // Si no tiene referencia en el mes, buscar en último pago de este cliente
    const clientePagos = pagosHistory.filter(p => p.cliente_id === extra.id);
    if (clientePagos.length > 0 && clientePagos[0].referencia) {
      return `[${clientePagos[0].mes_correspondiente || ''}] ${clientePagos[0].referencia}`;
    }

    if (extra.observaciones && extra.observaciones.trim()) {
      return extra.observaciones.trim();
    }

    return '';
  };

  const filteredExtras = extras.filter(e => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      e.nombre_cliente?.toLowerCase().includes(s) ||
      e.cod?.toLowerCase().includes(s) ||
      e.usuario?.toLowerCase().includes(s);

    const eEstado = (e.estado || '').trim().toUpperCase();
    const matchesEstado = selectedEstado === 'TODOS' || eEstado === selectedEstado.toUpperCase();

    return matchesSearch && matchesEstado;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
      
      {/* HEADER */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div className="page-header-info">
          <h1 style={{ fontWeight: '900', margin: 0 }}>
            Gestión de Cobranzas <span style={{ color: '#818cf8', fontSize: '1rem', fontWeight: '500' }}>(Extras)</span>
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Panel profesional de control de cartera mensual, saldos y recaudación directa.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* SELECTOR DE MES */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>MES:</span>
            <select
              className="input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                background: '#1e1b4b',
                color: '#38bdf8',
                fontWeight: 'bold',
                padding: '8px 12px',
                border: '1px solid #4f46e5',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: 0
              }}
            >
              {months.map(m => (
                <option key={m} value={m} style={{ background: '#0f172a', color: 'white' }}>
                  {m} {m === currentMonthName ? '(Actual)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* SELECTOR DE ESTADO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>ESTADO:</span>
            <select
              className="input"
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              style={{
                background: '#1e1b4b',
                color: selectedEstado === 'TODOS' ? '#94a3b8' : '#38bdf8',
                fontWeight: 'bold',
                padding: '8px 12px',
                border: selectedEstado === 'TODOS' ? '1px solid #4f46e5' : '1px solid #38bdf8',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: 0
              }}
              title="Filtrar por Estado de Cliente"
            >
              {availableEstados.map(est => {
                const count = est === 'TODOS'
                  ? extras.length
                  : extras.filter(x => (x.estado || '').trim().toUpperCase() === est.toUpperCase()).length;
                return (
                  <option key={est} value={est} style={{ background: '#0f172a', color: 'white' }}>
                    {est === 'TODOS' ? '🏷️ Todos los Estados' : est} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <input
            className="input"
            placeholder="🔍 Buscar por COD, Nombre o Usuario..."
            style={{ width: '100%', maxWidth: '260px', marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* METRICAS PROFESIONALES */}
      <div className="grid-responsive" style={{ marginBottom: '28px', gap: '16px' }}>
        <div className="glass-card glass" style={{ padding: '20px', borderLeft: '4px solid #f87171' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>
            CARTERA PENDIENTE ({selectedMonth})
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f87171' }}>
            ${totals.globalDebe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card glass" style={{ padding: '20px', borderLeft: '4px solid #34d399' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>
            RECAUDADO EN {selectedMonth}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#34d399' }}>
            ${totals.recaudadoMes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card glass" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>
            TOTAL SERVICIOS ADM.
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#6366f1' }}>
            {totals.totalClientes}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
          <p>Cargando información de cobranzas extras...</p>
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: '#94a3b8', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px' }}>COD</th>
                <th>NOMBRE CLIENTE</th>
                <th>USUARIO</th>
                <th style={{ minWidth: '110px' }}>VALOR BASE ✏️</th>
                <th style={{ minWidth: '120px' }}>PAGADO ({selectedMonth}) ✏️</th>
                <th style={{ minWidth: '130px' }}>DEBE (SALDO) ✏️</th>
                <th>ESTADO</th>
                <th>ACTIVO</th>
                <th>ACCIONES</th>
                <th style={{ minWidth: '180px' }}>REFERENCIAS / COMENTARIOS</th>
              </tr>
            </thead>
            <tbody>
              {filteredExtras.map(e => {
                const isEliminado = (e.estado || '').trim().toUpperCase() === 'ELIMINADO';
                const pagoMes = getPagoMes(e, selectedMonth);
                const saldoMes = getSaldoMes(e, selectedMonth);
                const selIdx = getMonthIdxByName(selectedMonth);
                const prevMonthName = selIdx > 0 ? months[selIdx - 1] : null;
                const prevDebt = (prevMonthName && !isEliminado) ? getSaldoMes(e, prevMonthName) : 0;
                const refPreview = getReferenciaPreview(e);

                const isEditingValor = editingCell?.id === e.id && editingCell?.field === 'valor';
                const isEditingPago = editingCell?.id === e.id && editingCell?.field === 'pago';
                const isEditingSaldo = editingCell?.id === e.id && editingCell?.field === 'saldo';

                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: '#cbd5e1' }}>
                      {e.cod}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                      {e.nombre_cliente}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {e.usuario || '-'}
                    </td>

                    {/* VALOR BASE / A COBRAR - EDITABLE DIRECTAMENTE */}
                    <td style={{ fontSize: '0.85rem' }}>
                      {isEditingValor ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(ev) => setEditValue(ev.target.value)}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter') handleSaveEdit(e, 'valor');
                              if (ev.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            disabled={savingCell}
                            style={{
                              width: '75px',
                              background: '#1e293b',
                              border: '1px solid #fbbf24',
                              color: '#fff',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(e, 'valor')}
                            disabled={savingCell}
                            title="Guardar valor base"
                            style={{ background: '#10b981', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={savingCell}
                            title="Cancelar"
                            style={{ background: '#ef4444', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEdit(e, 'valor')}
                          title="Clic para editar valor base a cobrar"
                          style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 'bold',
                            color: '#fbbf24',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid transparent',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(ev) => ev.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)'}
                          onMouseLeave={(ev) => ev.currentTarget.style.borderColor = 'transparent'}
                        >
                          ${parseFloat(e.valor || 0).toFixed(2)}
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>✏️</span>
                        </div>
                      )}
                    </td>

                    {/* PAGADO EN EL MES - EDITABLE DIRECTAMENTE */}
                    <td style={{ fontSize: '0.85rem' }}>
                      {isEditingPago ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(ev) => setEditValue(ev.target.value)}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter') handleSaveEdit(e, 'pago');
                              if (ev.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            disabled={savingCell}
                            style={{
                              width: '75px',
                              background: '#1e293b',
                              border: '1px solid #4ade80',
                              color: '#fff',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(e, 'pago')}
                            disabled={savingCell}
                            title="Guardar monto pagado"
                            style={{ background: '#10b981', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={savingCell}
                            title="Cancelar"
                            style={{ background: '#ef4444', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEdit(e, 'pago')}
                          title={`Clic para editar pago de ${selectedMonth}`}
                          style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 'bold',
                            color: '#4ade80',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid transparent',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(ev) => ev.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.4)'}
                          onMouseLeave={(ev) => ev.currentTarget.style.borderColor = 'transparent'}
                        >
                          ${pagoMes.toFixed(2)}
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>✏️</span>
                        </div>
                      )}
                    </td>

                    {/* DEBE / SALDO DEL MES Y EXCEDENTES - EDITABLE DIRECTAMENTE */}
                    <td style={{ fontSize: '0.85rem' }}>
                      {isEditingSaldo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(ev) => setEditValue(ev.target.value)}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter') handleSaveEdit(e, 'saldo');
                              if (ev.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            disabled={savingCell}
                            placeholder="Saldo"
                            style={{
                              width: '85px',
                              background: '#1e293b',
                              border: '1px solid #60a5fa',
                              color: '#fff',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(e, 'saldo')}
                            disabled={savingCell}
                            title="Guardar saldo"
                            style={{ background: '#10b981', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={savingCell}
                            title="Cancelar"
                            style={{ background: '#ef4444', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => !isEliminado && handleStartEdit(e, 'saldo')}
                          title={isEliminado ? "Cliente con estado ELIMINADO (Saldo $0.00)" : "Clic para editar saldo directamente. Valores negativos = excedente a favor."}
                          style={{
                            cursor: isEliminado ? 'default' : 'pointer',
                            display: 'inline-flex',
                            flexDirection: 'column',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid transparent',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(ev) => { if (!isEliminado) ev.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.4)'; }}
                          onMouseLeave={(ev) => { if (!isEliminado) ev.currentTarget.style.borderColor = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{
                              fontWeight: 'bold',
                              color: isEliminado ? '#94a3b8' : (saldoMes > 0 ? '#f87171' : (saldoMes < 0 ? '#34d399' : '#94a3b8'))
                            }}>
                              {isEliminado ? '$0.00' : (saldoMes > 0 ? `Debe $${saldoMes.toFixed(2)}` : (saldoMes < 0 ? `Excedente $${Math.abs(saldoMes).toFixed(2)}` : '$0.00'))}
                            </span>
                            {!isEliminado && <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>✏️</span>}
                          </div>

                          {/* Subtexto indicando arrastre de deuda previa o estado eliminado */}
                          {isEliminado ? (
                            <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 'bold' }}>
                              ELIMINADO (Sin saldo)
                            </span>
                          ) : (
                            prevDebt > 0 && pagoMes === 0 && (
                              <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '2px', fontWeight: '600' }}>
                                ⚠️ Incluye ${prevDebt.toFixed(2)} de {prevMonthName}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </td>

                    {/* ESTADO */}
                    <td style={{ fontSize: '0.8rem' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        background: isEliminado ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                        color: isEliminado ? '#ef4444' : '#a5b4fc',
                        border: isEliminado ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.3)'
                      }}>
                        {e.estado || '30 DÍAS'}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: e.activo === 'SI' ? '#34d399' : '#f87171' }}>
                      {e.activo}
                    </td>

                    {/* ACCIONES */}
                    <td>
                      {isEliminado ? (
                        <button
                          className="btn"
                          disabled
                          title="Cliente con estado ELIMINADO no registra saldo a cobrar"
                          style={{
                            padding: '7px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#64748b',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '6px',
                            cursor: 'not-allowed',
                            opacity: 0.7
                          }}
                        >
                          🚫 Eliminado
                        </button>
                      ) : (
                        <button
                          className="btn"
                          onClick={() => openPagoModal(e)}
                          style={{
                            padding: '7px 14px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                          }}
                        >
                          💰 Cobrar
                        </button>
                      )}
                    </td>

                    {/* COLUMNA REFERENCIAS / COMENTARIOS AL FINAL */}
                    <td style={{ fontSize: '0.8rem', maxWidth: '240px' }}>
                      {refPreview ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span
                            title={refPreview}
                            style={{
                              color: '#cbd5e1',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '160px'
                            }}
                          >
                            {refPreview}
                          </span>
                          <button
                            onClick={() => openRefModal(e)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.2)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              borderRadius: '4px',
                              color: '#a5b4fc',
                              fontSize: '0.7rem',
                              padding: '3px 7px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            👁️ Ver más
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.75rem' }}>
                            Sin referencia
                          </span>
                          <button
                            onClick={() => openRefModal(e)}
                            title="Añadir comentario o referencia"
                            style={{
                              background: 'transparent',
                              border: '1px dashed rgba(255,255,255,0.2)',
                              borderRadius: '4px',
                              color: '#94a3b8',
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              cursor: 'pointer'
                            }}
                          >
                            + Ref
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredExtras.length === 0 && (
            <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No se encontraron registros de clientes extras con el criterio ingresado.
            </p>
          )}
        </div>
      )}

      {/* MODAL PARA REGISTRAR COBRO / PAGO EXTRA */}
      {showPagoModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-card glass" style={{ width: '100%', maxWidth: '480px', padding: '26px' }}>
            <h2 style={{ marginBottom: '4px', fontWeight: '900', color: '#34d399' }}>💳 Registrar Pago Extra</h2>
            <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '0.9rem' }}>
              Cliente: <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedExtra?.nombre_cliente}</span> ({selectedExtra?.cod})
            </p>

            {/* Tarjeta de estado de saldo y deuda */}
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.25)', 
              borderRadius: '10px', 
              padding: '14px 16px', 
              marginBottom: '18px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>VALOR BASE MENSUAL</span>
                <span style={{ fontWeight: 'bold', color: '#60a5fa', fontSize: '1.05rem' }}>${parseFloat(selectedExtra?.valor || 0).toFixed(2)}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>ESTADO EN {pagoData.mes}</span>
                {(() => {
                  const s = getSaldoMes(selectedExtra, pagoData.mes);
                  if (s > 0) return <span style={{ fontWeight: 'bold', color: '#f87171', fontSize: '1.05rem' }}>Debe ${s.toFixed(2)}</span>;
                  if (s < 0) return <span style={{ fontWeight: 'bold', color: '#34d399', fontSize: '1.05rem' }}>Excedente ${Math.abs(s).toFixed(2)}</span>;
                  return <span style={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '1.05rem' }}>Al día ($0.00)</span>;
                })()}
              </div>
            </div>

            {/* Aviso si el cliente ya tiene excedente en el mes seleccionado */}
            {getSaldoMes(selectedExtra, pagoData.mes) < 0 && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#34d399',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✨</span>
                <span>Este cliente cuenta con un <b>excedente a favor de ${Math.abs(getSaldoMes(selectedExtra, pagoData.mes)).toFixed(2)}</b> en {pagoData.mes}.</span>
              </div>
            )}

            {/* Aviso si el valor a pagar incluye arrastre de deuda de meses anteriores */}
            {(() => {
              const pIdx = getMonthIdxByName(pagoData.mes);
              const pM = pIdx > 0 ? months[pIdx - 1] : null;
              const pDebt = pM ? getSaldoMes(selectedExtra, pM) : 0;
              if (pDebt > 0 && getPagoMes(selectedExtra, pagoData.mes) === 0) {
                return (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fbbf24',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚠️</span>
                    <span>El total sugerido de <b>${getSaldoMes(selectedExtra, pagoData.mes).toFixed(2)}</b> incluye <b>${pDebt.toFixed(2)}</b> adeudados de <b>{pM}</b> + mensualidad de {pagoData.mes}.</span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid-responsive" style={{ gap: '14px' }}>
              <div className="form-group">
                <label className="label">Mes de Pago</label>
                <select
                  className="input"
                  value={pagoData.mes}
                  onChange={(e) => {
                    const nuevoMes = e.target.value;
                    const saldoDelMes = getSaldoMes(selectedExtra, nuevoMes);
                    setPagoData(prev => ({
                      ...prev,
                      mes: nuevoMes,
                      monto: saldoDelMes > 0 ? saldoDelMes : (prev.monto || selectedExtra.valor || 0)
                    }));
                  }}
                  style={{ background: '#1e1b4b' }}
                >
                  {months.map(m => (
                    <option key={m} value={m} style={{ background: '#1e1b4b' }}>
                      {m} {m === currentMonthName ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* VALOR A COBRAR EN PAGOS TOTALMENTE EDITABLE */}
              <div className="form-group">
                <label className="label">Valor a Cobrar / Monto ($)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={pagoData.monto}
                  onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })}
                  style={{ fontWeight: 'bold', color: '#38bdf8' }}
                />
              </div>

              {/* MÉTODO DE PAGO DEDUPLICADO (SIN EFECTIVO REPETIDO) */}
              <div className="form-group">
                <label className="label">Método de Pago</label>
                <select
                  className="input"
                  value={pagoData.metodo}
                  onChange={(e) => setPagoData({ ...pagoData, metodo: e.target.value })}
                  style={{ background: '#1e1b4b' }}
                >
                  {uniqueMetodosPago.map(m => (
                    <option key={m} value={m} style={{ background: '#1e1b4b' }}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Número de Factura</label>
                <input
                  className="input"
                  placeholder="Ej: 001-001-0001"
                  value={pagoData.factura}
                  onChange={(e) => setPagoData({ ...pagoData, factura: e.target.value })}
                />
              </div>

              <div className="form-group grid-span-2">
                <label className="label">Referencia / Comentario</label>
                <input
                  className="input"
                  placeholder="Ej: Depósito bancario #12345 / Observaciones"
                  value={pagoData.referencia}
                  onChange={(e) => setPagoData({ ...pagoData, referencia: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '22px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handlePagar} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL "VER MÁS": REFERENCIAS, COMENTARIOS E HISTORIAL */}
      {refModalData && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-card glass" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: '900', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📝</span> Referencias y Comentarios
                </h2>
                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                  Cliente: <b style={{ color: 'white' }}>{refModalData.cliente.nombre_cliente}</b> ({refModalData.cliente.cod})
                </p>
              </div>
              <button
                onClick={() => setRefModalData(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Referencia del mes actual seleccionado */}
            <div style={{ marginBottom: '18px' }}>
              <label className="label" style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                Referencia del Mes ({refModalData.mes}):
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Escribe la referencia bancaria, código o comentario de pago para este mes..."
                value={editRefText}
                onChange={(e) => setEditRefText(e.target.value)}
                style={{ width: '100%', background: '#0f172a', resize: 'vertical' }}
              />
            </div>

            {/* Observaciones generales del cliente */}
            <div style={{ marginBottom: '20px' }}>
              <label className="label" style={{ fontWeight: 'bold', color: '#fbbf24' }}>
                Observaciones Generales del Cliente:
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="Observaciones de cuenta, instalación o acuerdos comerciales..."
                value={editObsText}
                onChange={(e) => setEditObsText(e.target.value)}
                style={{ width: '100%', background: '#0f172a', resize: 'vertical' }}
              />
            </div>

            {/* Historial de referencias de pagos registrados */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                Historial de Pagos Registrados:
              </h3>
              {refModalData.historial && refModalData.historial.length > 0 ? (
                <div style={{ maxHeight: '180px', overflowY: 'auto', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#1e293b', color: '#94a3b8', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Fecha</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Mes</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Monto</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Método</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Referencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refModalData.historial.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '6px 8px' }}>
                            {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : '-'}
                          </td>
                          <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#818cf8' }}>
                            {p.mes_correspondiente}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#34d399' }}>
                            ${parseFloat(p.monto || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '6px 8px', color: '#94a3b8' }}>
                            {p.metodo_pago}
                          </td>
                          <td style={{ padding: '6px 8px', color: '#e2e8f0' }}>
                            {p.referencia || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', margin: '4px 0' }}>
                  No hay pagos registrados en historial para este cliente aún.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setRefModalData(null)}
                disabled={savingRef}
              >
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveReferenciaModal}
                disabled={savingRef}
                style={{ background: '#4f46e5' }}
              >
                {savingRef ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </motion.div>
  );
};

export default ExtraPagos;
