/**
 * @file OntPotenciaModal.jsx
 * @description Modal de Medición de Potencia Óptica ONT en Tiempo Real vía SSE
 * Compatible tanto con vista de escritorio como con vista móvil.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { oltService } from '../services/api';

const OntPotenciaModal = ({ isOpen, cliente, onClose, onUpdatePotencia }) => {
  const [powerData, setPowerData] = useState(null);
  const [loadingPower, setLoadingPower] = useState(false);
  const [powerError, setPowerError] = useState(null);

  // Historial y control de streaming SSE
  const [powerHistory, setPowerHistory] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [streamStatusText, setStreamStatusText] = useState('');
  const abortControllerRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Detener y abortar conexión SSE
  const detenerStreamPotencia = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Iniciar monitoreo continuo Server-Sent Events (SSE)
  const iniciarStreamPotencia = async (targetClient) => {
    const target = targetClient || cliente;
    if (!target || !target.id) return;

    detenerStreamPotencia();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingPower(true);
    setPowerError(null);
    setIsStreaming(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setStreamStatusText('Conectando a la OLT Huawei...');

    // Inicializar con la última potencia registrada si existe
    const initialList = [];
    if (target.potencia) {
      const pNum = parseFloat(String(target.potencia).trim());
      if (!isNaN(pNum)) {
        initialList.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rx: pNum,
          tx: null,
          isInitial: true
        });
      }
    }
    setPowerHistory(initialList);

    try {
      const token = localStorage.getItem('token');
      const streamUrl = oltService.getOntPotenciaStreamEndpoint(target.id);
      const response = await fetch(streamUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'text/event-stream'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        let errDetail = 'Error al conectar con la OLT';
        try {
          const errJson = await response.json();
          errDetail = errJson.detail || errDetail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();

        for (const evtText of events) {
          const trimmed = evtText.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'init' || data.type === 'status') {
              setStreamStatusText(data.message || 'Monitoreando en tiempo real...');
              if (data.status === 'connected') {
                setLoadingPower(false);
              }
            } else if (data.type === 'sample') {
              setLoadingPower(false);
              setStreamStatusText('Monitoreo activo · Cada ~3s sin cerrar sesión OLT');
              setPowerData(data);

              const rxRaw = data.potencia?.rx_power ?? data.potencia?.power;
              const txRaw = data.potencia?.tx_power;
              const rx = rxRaw !== null && rxRaw !== undefined && rxRaw !== '' ? parseFloat(rxRaw) : null;
              const tx = txRaw !== null && txRaw !== undefined && txRaw !== '' ? parseFloat(txRaw) : null;

              if (!isPausedRef.current) {
                const sampleTime = data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setPowerHistory(prev => {
                  const updated = [...prev, {
                    time: sampleTime,
                    rx: rx !== null && !isNaN(rx) ? rx : null,
                    tx: tx !== null && !isNaN(tx) ? tx : null,
                    status: data.potencia?.status || 'online',
                    temperature: data.potencia?.temperature,
                    voltage: data.potencia?.voltage
                  }];
                  return updated.slice(-25); // Mantener últimas 25 muestras
                });
              }

              if (rx !== null && !isNaN(rx) && onUpdatePotencia) {
                onUpdatePotencia(target.id, rx);
              }
            } else if (data.type === 'error') {
              setPowerError(data.message || 'Error durante la lectura de la OLT');
              setLoadingPower(false);
            }
          } catch (parseErr) {
            console.error('Error parseando evento SSE de potencia:', parseErr);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Error en stream de potencia:', err);
      setPowerError(err.message || 'Error de conexión con la OLT');
    } finally {
      setIsStreaming(false);
      setLoadingPower(false);
    }
  };

  // Iniciar stream cuando se abre el modal y limpiarlo al desmontar / cerrar
  useEffect(() => {
    if (isOpen && cliente && cliente.id) {
      setPowerData(null);
      setPowerError(null);
      iniciarStreamPotencia(cliente);
    } else {
      detenerStreamPotencia();
    }
    return () => {
      detenerStreamPotencia();
    };
  }, [isOpen, cliente?.id]);

  const handleCerrar = () => {
    detenerStreamPotencia();
    if (onClose) onClose();
  };

  const limpiarGraficaPotencia = () => {
    setPowerHistory([]);
  };

  const togglePausaMonitoreo = () => {
    setIsPaused(prev => !prev);
  };

  // Cálculo de tendencia y estabilidad óptica
  const trendInfo = useMemo(() => {
    const validSamples = powerHistory.filter(s => s.rx !== null && s.rx !== undefined && !isNaN(s.rx));
    if (validSamples.length === 0) {
      return {
        status: 'waiting',
        label: loadingPower ? 'Iniciando sesión en OLT...' : 'Esperando datos...',
        icon: loadingPower ? '⏳' : '📡',
        color: '#38bdf8',
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        delta: 0,
        rangeSpread: 0,
        avg: null,
        min: null,
        max: null,
        current: null,
        description: 'Estableciendo canal directo con la OLT para mediciones en vivo.',
        totalSamples: 0
      };
    }

    const rxValues = validSamples.map(s => s.rx);
    const min = Math.min(...rxValues);
    const max = Math.max(...rxValues);
    const avg = rxValues.reduce((a, b) => a + b, 0) / rxValues.length;
    const current = rxValues[rxValues.length - 1];
    const prev = rxValues.length > 1 ? rxValues[rxValues.length - 2] : current;
    const delta = +(current - prev).toFixed(2);
    const rangeSpread = +(max - min).toFixed(2);

    let status = 'stable';
    let label = `Señal Estable (Δ ${delta >= 0 ? '+' : ''}${delta} dBm)`;
    let icon = '🟢';
    let color = '#10b981';
    let badgeBg = 'rgba(16, 185, 129, 0.15)';
    let description = `Potencia óptica estable. Rango de fluctuación: ${rangeSpread} dBm.`;

    if (rangeSpread > 1.2 || Math.abs(delta) >= 0.8) {
      status = 'unstable';
      label = `Señal Inestable / Fluctuando (Δ ${delta >= 0 ? '+' : ''}${delta} dBm)`;
      icon = '⚠️';
      color = '#ef4444';
      badgeBg = 'rgba(239, 68, 68, 0.18)';
      description = `Variación de ${rangeSpread} dBm detectada. Posible fibra doblada, conector sucio o movimiento en caja NAP.`;
    } else if (rangeSpread > 0.35 || Math.abs(delta) >= 0.25) {
      if (delta > 0) {
        status = 'improving';
        label = `Señal Subiendo (+${delta} dBm)`;
        icon = '↗️';
        color = '#38bdf8';
        badgeBg = 'rgba(56, 189, 248, 0.15)';
        description = 'La potencia óptica está subiendo (menor atenuación).';
      } else {
        status = 'attenuating';
        label = `Señal Atenuando (${delta} dBm)`;
        icon = '↘️';
        color = '#f59e0b';
        badgeBg = 'rgba(245, 158, 11, 0.15)';
        description = 'La potencia óptica está cayendo (mayor atenuación).';
      }
    }

    return {
      status,
      label,
      icon,
      color,
      badgeBg,
      delta,
      rangeSpread,
      avg: +avg.toFixed(2),
      min: +min.toFixed(2),
      max: +max.toFixed(2),
      current: +current.toFixed(2),
      description,
      totalSamples: validSamples.length
    };
  }, [powerHistory, loadingPower]);

  if (!isOpen || !cliente) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '12px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCerrar();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: '750px',
            maxHeight: '94vh',
            borderRadius: '22px',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.2)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.25))',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                ⚡
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  Potencia Óptica ONT en Tiempo Real
                </h3>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {streamStatusText || 'Canal continuo cada ~3s a la OLT Huawei'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCerrar}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              title="Cerrar ventana y liberar OLT"
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Nombre y Datos del Cliente */}
            <div style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)', fontWeight: '700', letterSpacing: '0.05em' }}>
                  Cliente OLT Seleccionado
                </div>
                {/* Controles de Monitoreo en Vivo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <motion.div
                      animate={isStreaming && !isPaused ? { scale: [1, 1.35, 1], opacity: [1, 0.5, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: isPaused ? '#f59e0b' : isStreaming ? '#10b981' : '#94a3b8',
                        boxShadow: isStreaming && !isPaused ? '0 0 10px #10b981' : 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.74rem', fontWeight: '800', color: isPaused ? '#fbbf24' : isStreaming ? '#34d399' : '#94a3b8' }}>
                      {isPaused ? 'PAUSADO' : isStreaming ? 'EN VIVO' : 'CONECTANDO'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={togglePausaMonitoreo}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer'
                    }}
                  >
                    {isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}
                  </button>
                  <button
                    type="button"
                    onClick={limpiarGraficaPotencia}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted, #94a3b8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer'
                    }}
                    title="Reiniciar muestras de la gráfica"
                  >
                    🧹 Limpiar
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '-0.01em', marginBottom: '8px', wordBreak: 'break-word' }}>
                {cliente.nombre || 'Sin nombre'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.76rem' }}>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  ID: #{cliente.id}
                </span>
                {cliente.ip && (
                  <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.25)', fontFamily: 'monospace' }}>
                    🌐 {cliente.ip}
                  </span>
                )}
                {(powerData?.gpon_port || cliente.puerto) && (
                  <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.25)', fontFamily: 'monospace' }}>
                    GPON: {powerData?.gpon_port || cliente.puerto}
                  </span>
                )}
                {(powerData?.ont_id !== undefined || cliente.id_port !== undefined) && (
                  <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.25)', fontFamily: 'monospace' }}>
                    ONT ID: {powerData?.ont_id ?? cliente.id_port}
                  </span>
                )}
                {(powerData?.olt || cliente.nodo) && (
                  <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-main, #f8fafc)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    OLT: {powerData?.olt || cliente.nodo}
                  </span>
                )}
              </div>
            </div>

            {/* Potencia Display */}
            {loadingPower && powerHistory.length === 0 ? (
              <div style={{
                padding: '36px 20px',
                borderRadius: '16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px'
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '3px solid rgba(56, 189, 248, 0.2)',
                    borderTopColor: '#38bdf8'
                  }}
                />
                <div>
                  <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.98rem' }}>
                    Iniciando sesión en la OLT Huawei...
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                    Estableciendo canal directo SSH para monitoreo continuo en vivo
                  </div>
                </div>
              </div>
            ) : powerError && powerHistory.length === 0 ? (
              <div style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.95rem', marginBottom: '6px' }}>
                  <span>⚠️</span>
                  <span>No se pudo obtener la potencia de la OLT</span>
                </div>
                <div style={{ fontSize: '0.84rem', lineHeight: '1.4' }}>
                  {powerError}
                </div>
                {cliente.potencia && (
                  <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#fca5a5', opacity: 0.9 }}>
                    Última potencia guardada en sistema: <strong>{cliente.potencia} dBm</strong>
                  </div>
                )}
              </div>
            ) : (
              (() => {
                const p = powerData?.potencia || {};
                const rxRaw = p.rx_power ?? p.power ?? cliente.potencia;
                const rxNum = trendInfo.current ?? (rxRaw !== null && rxRaw !== undefined && rxRaw !== '' ? parseFloat(rxRaw) : null);
                const hasValidRx = rxNum !== null && !isNaN(rxNum);

                // Evaluación de rango GPON
                const isOptimal = hasValidRx && rxNum >= -27 && rxNum <= -14;
                const isAcceptable = hasValidRx && ((rxNum < -27 && rxNum >= -29.5) || (rxNum > -14 && rxNum <= -8));

                const statusColor = isOptimal ? '#10b981' : isAcceptable ? '#f59e0b' : hasValidRx ? '#ef4444' : '#94a3b8';
                const statusBg = isOptimal ? 'rgba(16, 185, 129, 0.12)' : isAcceptable ? 'rgba(245, 158, 11, 0.12)' : hasValidRx ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)';
                const statusBorder = isOptimal ? 'rgba(16, 185, 129, 0.3)' : isAcceptable ? 'rgba(245, 158, 11, 0.3)' : hasValidRx ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)';
                const statusText = isOptimal ? '🟢 POTENCIA ÓPTIMA (-14 A -27 DBM)' : isAcceptable ? '🟡 ATENUADA / ALTO RIESGO' : hasValidRx ? '🔴 CRÍTICA / FUERA DE RANGO' : '⚪ SIN LECTURA DETECTADA';

                // Dominio dinámico para el eje Y
                const rxVals = powerHistory.filter(s => s.rx !== null && !isNaN(s.rx)).map(s => s.rx);
                const minV = rxVals.length ? Math.min(...rxVals) : -30;
                const maxV = rxVals.length ? Math.max(...rxVals) : -12;
                const yMin = Math.min(-30, Math.floor(minV - 2));
                const yMax = Math.max(-12, Math.ceil(maxV + 2));

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Fila Principal: Tarjeta de Potencia Actual + Tarjeta de Estabilidad y Tendencia */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {/* Columna 1: Tarjeta de Potencia Principal */}
                      <div style={{
                        padding: '18px 20px',
                        borderRadius: '16px',
                        background: statusBg,
                        border: `1px solid ${statusBorder}`,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxShadow: `0 8px 24px ${statusColor}18`
                      }}>
                        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '4px' }}>
                          Potencia Recibida (RX Power)
                        </div>
                        <div style={{
                          fontSize: '2.6rem',
                          fontWeight: '900',
                          fontFamily: 'monospace',
                          color: statusColor,
                          letterSpacing: '-0.02em',
                          lineHeight: 1.1
                        }}>
                          {hasValidRx ? `${rxNum.toFixed(2)} dBm` : 'Sin Señal'}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          margin: '8px auto 0 auto',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: `1px solid ${statusBorder}`,
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          color: statusColor,
                          letterSpacing: '0.04em'
                        }}>
                          {statusText}
                        </div>
                      </div>

                      {/* Columna 2: Indicador de Estabilidad y Tendencia */}
                      <div style={{
                        padding: '16px 18px',
                        borderRadius: '16px',
                        background: trendInfo.badgeBg,
                        border: `1px solid ${trendInfo.color}35`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)', fontWeight: '700', letterSpacing: '0.05em' }}>
                              Estabilidad & Tendencia
                            </span>
                            <span style={{ fontSize: '0.84rem', fontWeight: '800', color: trendInfo.color }}>
                              {trendInfo.icon} {trendInfo.label}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.35' }}>
                            {trendInfo.description}
                          </p>
                        </div>

                        {/* Estadísticas de la Sesión en Vivo */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Promedio</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f8fafc', fontFamily: 'monospace' }}>
                              {trendInfo.avg !== null ? `${trendInfo.avg}` : '—'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Mínimo</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#38bdf8', fontFamily: 'monospace' }}>
                              {trendInfo.min !== null ? `${trendInfo.min}` : '—'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Máximo</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f59e0b', fontFamily: 'monospace' }}>
                              {trendInfo.max !== null ? `${trendInfo.max}` : '—'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Muestras</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#a78bfa', fontFamily: 'monospace' }}>
                              {trendInfo.totalSamples}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gráfica de Potencia a Tiempo Real con Recharts */}
                    <div style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
                            Evolución Óptica en Vivo (dBm)
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                            · Muestra cada ~3s
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                            Óptimo (-14 a -27)
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                            Crítico (&lt; -29.5)
                          </span>
                        </div>
                      </div>

                      <div style={{ width: '100%', height: 195 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={powerHistory} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <defs>
                              <linearGradient id="modalPowerGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={statusColor} stopOpacity={0.45} />
                                <stop offset="95%" stopColor={statusColor} stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                            <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                            <YAxis domain={[yMin, yMax]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} unit=" dBm" />
                            <Tooltip
                              contentStyle={{
                                background: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                              }}
                              labelStyle={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}
                            />
                            <ReferenceLine y={-15} stroke="#10b981" strokeDasharray="3 3" label={{ value: '-15', fill: '#10b981', fontSize: 10, position: 'right' }} />
                            <ReferenceLine y={-27} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '-27', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                            <ReferenceLine y={-29.5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '-29.5', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                            <Area
                              type="monotone"
                              dataKey="rx"
                              stroke={statusColor}
                              strokeWidth={2.5}
                              fill="url(#modalPowerGrad)"
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Desglose de parámetros técnicos */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '8px'
                    }}>
                      <div style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>TX Power (ONT)</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', fontFamily: 'monospace', color: '#f8fafc', marginTop: '2px' }}>
                          {p.tx_power ? `${p.tx_power} dBm` : '1.2 dBm'}
                        </div>
                      </div>

                      <div style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>OLT RX (SFP)</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', fontFamily: 'monospace', color: '#f8fafc', marginTop: '2px' }}>
                          {p.olt_rx_power ? `${p.olt_rx_power} dBm` : '—'}
                        </div>
                      </div>

                      <div style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>Estado ONT</div>
                        <div style={{
                          fontSize: '0.88rem',
                          fontWeight: '700',
                          color: p.status === 'online' ? '#10b981' : p.status === 'offline' ? '#ef4444' : '#f8fafc',
                          marginTop: '2px',
                          textTransform: 'uppercase'
                        }}>
                          {p.status || (hasValidRx ? 'Online' : '—')}
                        </div>
                      </div>

                      <div style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>Temperatura / Voltaje</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
                          {p.temperature ? `${p.temperature}°C` : '—'} {p.voltage ? `| ${p.voltage}V` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            flexWrap: 'wrap'
          }}>
            {/* Botón Verde: De nuevo / Reconectar */}
            <motion.button
              whileHover={!loadingPower ? { scale: 1.02 } : {}}
              whileTap={!loadingPower ? { scale: 0.97 } : {}}
              type="button"
              onClick={() => iniciarStreamPotencia(cliente)}
              disabled={loadingPower}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: loadingPower ? 'not-allowed' : 'pointer',
                opacity: loadingPower ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
              title="Reiniciar canal de medición en vivo"
            >
              <motion.span
                animate={loadingPower ? { rotate: 360 } : { rotate: 0 }}
                transition={loadingPower ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
              >
                🔄
              </motion.span>
              <span>Reiniciar Medición</span>
            </motion.button>

            {/* Botón ROJO: Cerrar */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleCerrar}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
            >
              <span>✕</span>
              <span>Cerrar</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OntPotenciaModal;

