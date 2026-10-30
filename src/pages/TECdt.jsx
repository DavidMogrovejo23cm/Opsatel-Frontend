/**
 * @file TECdt.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { clienteService, oltService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const TECdt = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [napFilter, setNapFilter] = useState('ALL');
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [revealedClaves, setRevealedClaves] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  // Estado para Modal de Medición de Potencia ONT en Tiempo Real
  const [selectedClientForPower, setSelectedClientForPower] = useState(null);
  const [powerModalOpen, setPowerModalOpen] = useState(false);
  const [powerData, setPowerData] = useState(null);
  const [loadingPower, setLoadingPower] = useState(false);
  const [powerError, setPowerError] = useState(null);

  // Estados de Monitoreo Continuo (Streaming cada ~3s sin cerrar sesión en OLT)
  const [powerHistory, setPowerHistory] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [streamStatusText, setStreamStatusText] = useState('');
  const abortControllerRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Limpieza al desmontar el componente para cerrar conexión en OLT
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Cálculo reactivo de estabilidad, tendencia y estadísticas ópticas en tiempo real
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

  // Estados para vista móvil del Técnico (Fiel a Imagen 2)
  const [mobileActiveView, setMobileActiveView] = useState('list'); // 'list' | 'power' | 'location'
  const [selectedMobileClient, setSelectedMobileClient] = useState(null);
  const [expandedTecData, setExpandedTecData] = useState({});
  const [revealedMobileCreds, setRevealedMobileCreds] = useState({});

  const toggleMobileTecData = (id) => {
    setExpandedTecData(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMobileCreds = (id) => {
    setRevealedMobileCreds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Detener y liberar conexión OLT en el backend
  const detenerStreamPotencia = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Iniciar monitoreo continuo Server-Sent Events (SSE) sin cerrar sesión OLT
  const iniciarStreamPotencia = async (cliente) => {
    const target = cliente || selectedClientForPower;
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

    // Punto inicial si ya existía potencia guardada
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

              if (rx !== null && !isNaN(rx)) {
                setClientes(prev => prev.map(c => c.id === target.id ? { ...c, potencia: String(rx) } : c));
                setSelectedClientForPower(prev => prev ? { ...prev, potencia: String(rx) } : prev);
              }
            } else if (data.type === 'error') {
              setPowerError(data.message || 'Error durante la lectura de la OLT');
              setLoadingPower(false);
            }
          } catch (parseErr) {
            console.error('Error parseando evento SSE:', parseErr);
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

  const handleMobileAbrirPotencia = (c) => {
    setSelectedMobileClient(c);
    setSelectedClientForPower(c);
    setMobileActiveView('power');
    setPowerData(null);
    setPowerError(null);
    iniciarStreamPotencia(c);
  };

  const handleMobileVolverDePotencia = () => {
    detenerStreamPotencia();
    setMobileActiveView('list');
  };

  const handleMobileAbrirUbicacion = (c) => {
    detenerStreamPotencia();
    setSelectedMobileClient(c);
    setMobileActiveView('location');
  };

  const handleAbrirPotencia = (cliente) => {
    setSelectedClientForPower(cliente);
    setPowerModalOpen(true);
    setPowerData(null);
    setPowerError(null);
    iniciarStreamPotencia(cliente);
  };

  const handleCerrarModalPotencia = () => {
    detenerStreamPotencia();
    setPowerModalOpen(false);
  };

  const limpiarGraficaPotencia = () => {
    setPowerHistory([]);
  };

  const togglePausaMonitoreo = () => {
    setIsPaused(prev => !prev);
  };

  const medirPotencia = async (cliente) => {
    iniciarStreamPotencia(cliente || selectedClientForPower);
  };

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await clienteService.listar();
      const list = res.data || [];
      list.sort((a, b) => a.id - b.id);
      setClientes(list);
    } catch (err) {
      console.error('Error fetching clientes in TECdt:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text, label) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(String(text).trim());
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleClaveVisibility = (id) => {
    setRevealedClaves(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Extraer lista única de NAPs para el selector de filtro
  const napsDisponibles = useMemo(() => {
    const naps = new Set();
    clientes.forEach(c => {
      if (c.nap && String(c.nap).trim()) {
        naps.add(String(c.nap).trim());
      }
    });
    return Array.from(naps).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [clientes]);

  // Filtrado reactivo en tiempo real
  const filteredClientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return clientes.filter(c => {
      if (napFilter !== 'ALL' && String(c.nap || '').trim() !== napFilter) {
        return false;
      }
      if (!term) return true;

      const idMatch = String(c.id || '').toLowerCase().includes(term);
      const nombreMatch = String(c.nombre || '').toLowerCase().includes(term);
      const celularMatch = String(c.celular || '').toLowerCase().includes(term);
      const claveMatch = String(c.clave || '').toLowerCase().includes(term);
      const contrasenaMatch = String(c.contrasena || c.iptv_pass || '').toLowerCase().includes(term);
      const ipMatch = String(c.ip || '').toLowerCase().includes(term);
      const napMatch = String(c.nap || '').toLowerCase().includes(term);
      const ubicacionMatch = String(c.ubicacion || c.direccion || '').toLowerCase().includes(term);

      return idMatch || nombreMatch || celularMatch || claveMatch || contrasenaMatch || ipMatch || napMatch || ubicacionMatch;
    });
  }, [clientes, searchTerm, napFilter]);

  // Normalizar enlace de WhatsApp para números de Ecuador u otros (usa el primer número si hay varios)
  const getWhatsAppLink = (rawNumber) => {
    if (!rawNumber) return null;
    const parts = String(rawNumber).split(/[/,;|\\\n\r]|\s+y\s+|\s+o\s+/i);
    const first = (parts[0] || '').trim();
    let clean = first.replace(/\D/g, '');
    if (clean.startsWith('09') && clean.length === 10) {
      clean = '593' + clean.slice(1);
    } else if (clean.startsWith('9') && clean.length === 9) {
      clean = '593' + clean;
    }
    return clean ? `https://wa.me/${clean}` : null;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Toast flotante de copiado rápido */}
      <AnimatePresence>
        {copiedField && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              fontWeight: '600',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>📋</span>
            <span>{copiedField} copiado al portapapeles</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vista de Escritorio TECdt */}
      <div className="tecdt-desktop-view">
        {/* Header */}
        <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(236, 72, 153, 0.25))',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              🛠️
            </div>
            <div>
              <h1 style={{ fontSize: '1.7rem', margin: 0, fontWeight: '800', letterSpacing: '-0.02em' }}>
                TECdt
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Panel de datos técnicos para técnicos: IDs, credenciales, IPs, NAPs y ubicación
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción rápida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowAllPasswords(prev => !prev)}
            className="btn btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showAllPasswords ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: showAllPasswords ? 'var(--primary)' : 'var(--glass-border)',
              color: showAllPasswords ? '#a5b4fc' : 'var(--text-main)'
            }}
            title={showAllPasswords ? 'Ocultar todas las claves y contraseñas' : 'Mostrar todas las claves y contraseñas'}
          >
            <span>{showAllPasswords ? '🙈' : '👁️'}</span>
            <span>{showAllPasswords ? 'Ocultar Claves' : 'Mostrar Claves'}</span>
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchData()}
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            disabled={loading}
          >
            <motion.span
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
            >
              🔄
            </motion.span>
            <span>Actualizar</span>
          </motion.button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', borderRadius: '16px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Input de Búsqueda */}
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '260px' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.95rem'
            }}>
              🔍
            </span>
            <input
              type="text"
              className="input"
              placeholder="Buscar por Nombre, ID, Número, Clave, Contraseña, IP, NAP o Ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: searchTerm ? '32px' : '14px',
                marginBottom: 0,
                height: '42px',
                fontSize: '0.88rem',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--glass-border)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por NAP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              NAP:
            </label>
            <select
              className="input"
              value={napFilter}
              onChange={(e) => setNapFilter(e.target.value)}
              style={{
                marginBottom: 0,
                height: '42px',
                fontSize: '0.85rem',
                minWidth: '160px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-main)'
              }}
            >
              <option value="ALL">📦 Todas las NAPs ({napsDisponibles.length})</option>
              {napsDisponibles.map(nap => (
                <option key={nap} value={nap}>{nap}</option>
              ))}
            </select>
          </div>

          {/* Contador de resultados */}
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)'
          }}>
            Mostrando <strong style={{ color: 'var(--primary)' }}>{filteredClientes.length}</strong> de <strong style={{ color: 'var(--text-main)' }}>{clientes.length}</strong> clientes
          </div>
        </div>
      </div>

      {/* Tabla de Clientes TECdt */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
        {loading && clientes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ fontSize: '2rem', display: 'inline-block', marginBottom: '12px' }}
            >
              🔄
            </motion.div>
            <p>Cargando información técnica de clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-main)' }}>No se encontraron clientes</h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>Intenta cambiar los términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{
                  background: 'var(--table-header-bg, rgba(15, 23, 42, 0.95))',
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  borderBottom: '1px solid var(--glass-border)'
                }}>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', width: '70px' }}>ID</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', minWidth: '220px' }}>CLIENTE</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', minWidth: '150px' }}>NÚMERO</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', minWidth: '150px' }}>CLAVE</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', minWidth: '150px' }}>CONTRASEÑA</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', minWidth: '140px' }}>IP</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', minWidth: '100px' }}>NAP</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', minWidth: '240px' }}>UBICACIÓN</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '700', minWidth: '160px', textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((c, index) => {
                  const id = c.id;
                  const nombre = c.nombre || '-';
                  const numero = c.celular || '-';
                  const clave = c.clave || '-';
                  const contrasena = c.contrasena || c.iptv_pass || c.clave || '-';
                  const ip = c.ip || '-';
                  const nap = c.nap || '-';
                  const ubicacion = c.ubicacion || c.direccion || '';

                  const isClaveVisible = showAllPasswords || !!revealedClaves[id];
                  const isPassVisible = showAllPasswords || !!revealedPasswords[id];
                  const waLink = getWhatsAppLink(c.celular);

                  return (
                    <tr
                      key={id}
                      style={{
                        borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.05))',
                        background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'}
                    >
                      {/* ID */}
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--primary)' }}>
                        <span
                          onClick={() => handleCopy(id, `ID ${id}`)}
                          style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            borderRadius: '6px',
                            border: '1px solid rgba(99, 102, 241, 0.25)'
                          }}
                          title="Click para copiar ID"
                        >
                          #{id}
                        </span>
                      </td>

                      {/* NOMBRE */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {nombre}
                        </div>
                        {c.nodo && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Nodo: {c.nodo}
                          </span>
                        )}
                      </td>

                      {/* NÚMERO */}
                      <td style={{ padding: '12px 16px' }}>
                        {numero !== '-' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              onClick={() => handleCopy(numero, `Número ${numero}`)}
                              style={{
                                fontFamily: 'monospace',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                textDecoration: 'underline dotted'
                              }}
                              title="Click para copiar número"
                            >
                              {numero}
                            </span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'rgba(37, 211, 102, 0.15)',
                                  border: '1px solid rgba(37, 211, 102, 0.3)',
                                  color: '#25d366',
                                  fontSize: '0.8rem',
                                  textDecoration: 'none'
                                }}
                                title="Abrir chat en WhatsApp"
                              >
                                💬
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* CLAVE */}
                      <td style={{ padding: '12px 16px' }}>
                        {clave !== '-' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              onClick={() => handleCopy(clave, `Clave de ${nombre}`)}
                              style={{
                                fontFamily: 'monospace',
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                cursor: 'pointer',
                                letterSpacing: isClaveVisible ? 'normal' : '0.15em'
                              }}
                              title="Click para copiar clave"
                            >
                              {isClaveVisible ? clave : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleClaveVisibility(id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                padding: '2px'
                              }}
                              title={isClaveVisible ? 'Ocultar' : 'Mostrar'}
                            >
                              {isClaveVisible ? '🙈' : '👁️'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* CONTRASEÑA */}
                      <td style={{ padding: '12px 16px' }}>
                        {contrasena !== '-' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              onClick={() => handleCopy(contrasena, `Contraseña de ${nombre}`)}
                              style={{
                                fontFamily: 'monospace',
                                color: '#f472b6',
                                background: 'rgba(244, 114, 182, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                border: '1px solid rgba(244, 114, 182, 0.2)',
                                cursor: 'pointer',
                                letterSpacing: isPassVisible ? 'normal' : '0.15em'
                              }}
                              title="Click para copiar contraseña"
                            >
                              {isPassVisible ? contrasena : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                padding: '2px'
                              }}
                              title={isPassVisible ? 'Ocultar' : 'Mostrar'}
                            >
                              {isPassVisible ? '🙈' : '👁️'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* IP */}
                      <td style={{ padding: '12px 16px' }}>
                        {ip !== '-' ? (
                          <span
                            onClick={() => handleCopy(ip, `IP ${ip}`)}
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: '600',
                              color: '#34d399',
                              background: 'rgba(52, 211, 153, 0.1)',
                              padding: '3px 7px',
                              borderRadius: '6px',
                              border: '1px solid rgba(52, 211, 153, 0.25)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Click para copiar IP"
                          >
                            🌐 {ip}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>
                        )}
                      </td>

                      {/* NAP */}
                      <td style={{ padding: '12px 16px' }}>
                        {nap !== '-' ? (
                          <span
                            onClick={() => handleCopy(nap, `NAP ${nap}`)}
                            style={{
                              fontWeight: '600',
                              color: '#fbbf24',
                              background: 'rgba(251, 191, 36, 0.1)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(251, 191, 36, 0.25)',
                              cursor: 'pointer',
                              display: 'inline-block'
                            }}
                            title="Click para copiar NAP"
                          >
                            📦 {nap}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* UBICACIÓN */}
                      <td style={{ padding: '12px 16px' }}>
                        {ubicacion ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '320px' }}>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#60a5fa',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.82rem'
                              }}
                              title={`Abrir en Google Maps: ${ubicacion}`}
                            >
                              <span>📍</span>
                              <span style={{ textDecoration: 'underline' }}>{ubicacion}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(ubicacion, `Ubicación de ${nombre}`)}
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: '0.72rem',
                                padding: '2px 5px',
                                flexShrink: 0
                              }}
                              title="Copiar dirección"
                            >
                              📋
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleAbrirPotencia(c)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.2))',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            color: '#38bdf8',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(56, 189, 248, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(99, 102, 241, 0.35))';
                            e.currentTarget.style.borderColor = '#38bdf8';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.2))';
                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title={`Medir potencia óptica de ${nombre}`}
                        >
                          <span style={{ fontSize: '0.95rem' }}>⚡</span>
                          <span>Ver Potencia</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {/* Vista Móvil TECdt (Fiel a Imagen 2) */}
      <div className="tecdt-mobile-view">
        <div className="tecdt-mobile-container">
          {/* Topbar fija con marca TECdt y botón refrescar */}
          <div className="tecdt-mobile-topbar">
            <div className="tecdt-mobile-brand">
              <div 
                className="tecdt-mobile-brand-icon"
                onClick={() => window.dispatchEvent(new CustomEvent('open-opsatel-sidebar'))}
                title="Abrir menú"
                style={{ cursor: 'pointer' }}
              >
                🛠️
              </div>
              <div className="tecdt-mobile-brand-text">
                <h1>TECdt</h1>
                <p>Panel de datos técnicos</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="tecdt-mobile-refresh-btn"
              onClick={() => fetchData()}
              disabled={loading}
              title="Actualizar datos"
            >
              <motion.span
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={loading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
              >
                🔄
              </motion.span>
            </motion.button>
          </div>

          {/* VISTA 1, 2, 3: LISTADO DE TARJETAS DE CLIENTE */}
          {mobileActiveView === 'list' && (
            <>
              {/* Buscador móvil */}
              <div className="pagos-mobile-search-container" style={{ marginBottom: '10px' }}>
                <span className="pagos-mobile-search-icon">🔍</span>
                <input
                  type="text"
                  className="pagos-mobile-search-input"
                  placeholder="Buscar por Nombre, ID, IP, NAP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="pagos-mobile-search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Lista de tarjetas */}
              {filteredClientes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  No se encontraron clientes técnicos.
                </div>
              ) : (
                filteredClientes.map((c) => {
                  const id = c.id;
                  const isActivo = (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
                  const isTecOpen = !!expandedTecData[id];
                  const isCredsRevealed = showAllPasswords || !!revealedMobileCreds[id];
                  const waLink = getWhatsAppLink(c.celular);
                  const coords = c.coordenadas || c.ubicacion || c.direccion || '-';

                  const claveVal = isCredsRevealed || revealedClaves[id] ? (c.clave || '-') : '••••••••';
                  const passVal = isCredsRevealed || revealedPasswords[id] ? (c.contrasena || c.iptv_pass || c.clave || '-') : '••••••••';

                  return (
                    <div key={id} className="tecdt-mobile-card">
                      {/* Cabecera: Avatar, Nombre, Subtítulo y Estado */}
                      <div className="tecdt-mobile-card-header">
                        <div className="tecdt-mobile-avatar">
                          👤
                        </div>
                        <div className="tecdt-mobile-header-info">
                          <div className="tecdt-mobile-name" title={c.nombre}>
                            {c.nombre || '-'}
                          </div>
                          <div className="tecdt-mobile-subinfo">
                            ID #{c.id} · Nodo: {c.nodo || c.nap || 'BAÑOS'}
                          </div>
                        </div>
                        <div className={`pagos-mobile-status-badge ${isActivo ? 'activo' : 'inactivo'}`}>
                          <span>{c.estado || 'Activo'}</span>
                        </div>
                      </div>

                      {/* Teléfono y WhatsApp */}
                      <div className="tecdt-mobile-phone-row">
                        <a
                          href={c.celular ? `tel:${c.celular}` : '#'}
                          className="tecdt-mobile-phone-pill"
                        >
                          <span>📞</span>
                          <span>{c.celular || 'Sin número'}</span>
                        </a>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tecdt-mobile-wa-btn"
                            title="Abrir WhatsApp"
                          >
                            💬
                          </a>
                        )}
                      </div>

                      {/* Cuadrículas IP y NAP */}
                      <div className="tecdt-mobile-grid-2">
                        <div className="tecdt-mobile-metric-box ip">
                          <div className="tecdt-mobile-metric-header">
                            <span>🌐</span>
                            <span>IP</span>
                          </div>
                          <div className="tecdt-mobile-metric-val">{c.ip || '-'}</div>
                        </div>

                        <div className="tecdt-mobile-metric-box nap">
                          <div className="tecdt-mobile-metric-header">
                            <span>📦</span>
                            <span>NAP</span>
                          </div>
                          <div className="tecdt-mobile-metric-val">⬇ {c.nap || '-'}</div>
                        </div>
                      </div>

                      {/* Acordeón Datos Técnicos (Clave y Contraseña) */}
                      <div className={`tecdt-mobile-accordion ${isTecOpen ? 'open' : ''}`}>
                        <div
                          className="tecdt-mobile-accordion-head"
                          onClick={() => toggleMobileTecData(id)}
                        >
                          <div className="tecdt-mobile-accordion-left">
                            <div className="tecdt-mobile-shield-icon">
                              🛡️
                            </div>
                            <div>
                              <div className="tecdt-mobile-accordion-title">Datos técnicos</div>
                              <div className="tecdt-mobile-accordion-sub">
                                {isTecOpen ? 'Clave y contraseña' : 'Clave y contraseña ocultas'}
                              </div>
                            </div>
                          </div>
                          <span className={`tecdt-mobile-accordion-chevron ${isTecOpen ? 'open' : ''}`}>
                            ▼
                          </span>
                        </div>

                        {isTecOpen && (
                          <div className="tecdt-mobile-accordion-body">
                            {/* Clave */}
                            <div className="tecdt-mobile-cred-item">
                              <div className="tecdt-mobile-cred-left">
                                <span>🔑</span>
                                <div>
                                  <span className="tecdt-mobile-cred-label">Clave</span>
                                  <span className="tecdt-mobile-cred-val">{claveVal}</span>
                                </div>
                              </div>
                              <div className="tecdt-mobile-cred-actions">
                                <button
                                  type="button"
                                  className="tecdt-mobile-icon-btn"
                                  onClick={() => toggleClaveVisibility(id)}
                                  title="Mostrar/Ocultar Clave"
                                >
                                  {revealedClaves[id] ? '👁️‍🗨️' : '👁️'}
                                </button>
                                <button
                                  type="button"
                                  className="tecdt-mobile-icon-btn"
                                  onClick={() => handleCopy(c.clave, 'Clave')}
                                  title="Copiar Clave"
                                >
                                  📋
                                </button>
                              </div>
                            </div>

                            {/* Contraseña */}
                            <div className="tecdt-mobile-cred-item">
                              <div className="tecdt-mobile-cred-left">
                                <span>🔒</span>
                                <div>
                                  <span className="tecdt-mobile-cred-label">Contraseña</span>
                                  <span className="tecdt-mobile-cred-val">{passVal}</span>
                                </div>
                              </div>
                              <div className="tecdt-mobile-cred-actions">
                                <button
                                  type="button"
                                  className="tecdt-mobile-icon-btn"
                                  onClick={() => togglePasswordVisibility(id)}
                                  title="Mostrar/Ocultar Contraseña"
                                >
                                  {revealedPasswords[id] ? '👁️‍🗨️' : '👁️'}
                                </button>
                                <button
                                  type="button"
                                  className="tecdt-mobile-icon-btn"
                                  onClick={() => handleCopy(c.contrasena || c.iptv_pass || c.clave, 'Contraseña')}
                                  title="Copiar Contraseña"
                                >
                                  📋
                                </button>
                              </div>
                            </div>

                            {/* Botón Alternar Credenciales */}
                            <button
                              type="button"
                              className="tecdt-mobile-toggle-all-btn"
                              onClick={() => toggleMobileCreds(id)}
                            >
                              <span>{isCredsRevealed ? '🙈 Ocultar credenciales' : '👁️ Mostrar credenciales'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Ubicación Google Maps */}
                      <div
                        className="tecdt-mobile-loc-row"
                        onClick={() => handleMobileAbrirUbicacion(c)}
                      >
                        <div className="tecdt-mobile-loc-left">
                          <span style={{ fontSize: '1.2rem' }}>📍</span>
                          <div style={{ minWidth: 0 }}>
                            <div className="tecdt-mobile-loc-title">Ver ubicación en Google Maps</div>
                            <div className="tecdt-mobile-loc-coords">{coords}</div>
                          </div>
                        </div>
                        <span className="tecdt-mobile-loc-ext">↗</span>
                      </div>

                      {/* Botón Ver Potencia */}
                      <button
                        type="button"
                        className="tecdt-mobile-btn-potencia"
                        onClick={() => handleMobileAbrirPotencia(c)}
                      >
                        <span>‹</span>
                        <span>⚡ Ver potencia</span>
                      </button>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* VISTA 4: VISTA DE POTENCIA ÓPTICA EN TIEMPO REAL */}
          {mobileActiveView === 'power' && selectedMobileClient && (
            <div>
              <div
                className="tecdt-subview-header"
                onClick={handleMobileVolverDePotencia}
              >
                <span className="tecdt-subview-back-icon">‹</span>
                <h2 className="tecdt-subview-title">Potencia Óptica en Vivo</h2>
              </div>

              {/* Tarjeta de cliente compacta */}
              <div className="tecdt-subview-client-card">
                <div className="tecdt-mobile-avatar">👤</div>
                <div>
                  <div style={{ fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', fontSize: '0.92rem' }}>
                    {selectedMobileClient.nombre}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
                    ID #{selectedMobileClient.id} · Puerto: {powerData?.gpon_port || selectedMobileClient.puerto || '0/0/X'} · ONT: {powerData?.ont_id ?? selectedMobileClient.id_port ?? '1'}
                  </div>
                </div>
              </div>

              {/* Barra de Monitoreo en Vivo (Streaming continuo cada ~3s) */}
              <div style={{
                margin: '10px 0 14px 0',
                padding: '8px 12px',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <motion.div
                    animate={isStreaming && !isPaused ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: isPaused ? '#f59e0b' : isStreaming ? '#10b981' : '#94a3b8',
                      boxShadow: isStreaming && !isPaused ? '0 0 10px #10b981' : 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isPaused ? '#fbbf24' : isStreaming ? '#34d399' : '#94a3b8' }}>
                    {isPaused ? 'PAUSADO' : isStreaming ? 'EN VIVO (cada ~3s)' : 'INICIANDO'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={togglePausaMonitoreo}
                    style={{
                      padding: '4px 10px',
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
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer'
                    }}
                    title="Reiniciar puntos de la gráfica"
                  >
                    🧹 Limpiar
                  </button>
                </div>
              </div>

              {/* Mediciones de Potencia */}
              {loadingPower && powerHistory.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#38bdf8' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ fontSize: '2rem', display: 'inline-block', marginBottom: '10px' }}
                  >
                    🔄
                  </motion.div>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600' }}>Iniciando sesión en la OLT...</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    Conectando y preparando canal de streaming continuo
                  </p>
                </div>
              ) : powerError && powerHistory.length === 0 ? (
                <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', color: '#f87171', textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>⚠️</div>
                  <div style={{ fontSize: '0.85rem' }}>{powerError}</div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => iniciarStreamPotencia(selectedMobileClient)}
                    style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    Reintentar conexión
                  </button>
                </div>
              ) : (
                (() => {
                  const p = powerData?.potencia || {};
                  const rxRaw = p.rx_power ?? p.power ?? selectedMobileClient?.potencia;
                  const rxNum = trendInfo.current ?? (rxRaw !== null && rxRaw !== undefined && rxRaw !== '' ? parseFloat(rxRaw) : null);
                  const hasValidRx = rxNum !== null && !isNaN(rxNum);
                  const isOptimal = hasValidRx && rxNum >= -27 && rxNum <= -14;
                  const isAcceptable = hasValidRx && ((rxNum < -27 && rxNum >= -29.5) || (rxNum > -14 && rxNum <= -8));
                  const statusColor = isOptimal ? '#10b981' : isAcceptable ? '#f59e0b' : hasValidRx ? '#ef4444' : '#94a3b8';

                  // Dominio dinámico para el eje Y
                  const rxVals = powerHistory.filter(s => s.rx !== null && !isNaN(s.rx)).map(s => s.rx);
                  const minV = rxVals.length ? Math.min(...rxVals) : -30;
                  const maxV = rxVals.length ? Math.max(...rxVals) : -12;
                  const yMin = Math.min(-30, Math.floor(minV - 2));
                  const yMax = Math.max(-12, Math.ceil(maxV + 2));

                  return (
                    <>
                      {/* Tarjeta de Potencia RX Actual */}
                      <div style={{
                        padding: '16px',
                        borderRadius: '16px',
                        background: `${statusColor}14`,
                        border: `1px solid ${statusColor}35`,
                        textAlign: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.06em' }}>
                          Potencia RX Actual (ONT)
                        </div>
                        <div style={{
                          fontSize: '2.4rem',
                          fontWeight: '900',
                          fontFamily: 'monospace',
                          color: statusColor,
                          lineHeight: 1.1,
                          marginTop: '4px'
                        }}>
                          {hasValidRx ? `${rxNum.toFixed(2)} dBm` : 'Sin Señal'}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: `1px solid ${statusColor}40`,
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          color: statusColor
                        }}>
                          {isOptimal ? '🟢 POTENCIA ÓPTIMA' : isAcceptable ? '🟡 ATENUADA / RIESGO' : hasValidRx ? '🔴 CRÍTICA' : '⚪ SIN SEÑAL'}
                        </div>
                      </div>

                      {/* Tarjeta de Estabilidad y Tendencia (Sube / Baja / Estable) */}
                      <div style={{
                        padding: '14px',
                        borderRadius: '14px',
                        background: trendInfo.badgeBg,
                        border: `1px solid ${trendInfo.color}35`,
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Comportamiento Óptico
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: trendInfo.color }}>
                            {trendInfo.icon} {trendInfo.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.3' }}>
                          {trendInfo.description}
                        </div>
                        {trendInfo.avg !== null && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                            <span>Prom: <strong>{trendInfo.avg} dBm</strong></span>
                            <span>Mín: <strong>{trendInfo.min}</strong></span>
                            <span>Máx: <strong>{trendInfo.max}</strong></span>
                            <span>Muestras: <strong>{trendInfo.totalSamples}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Gráfica en Tiempo Real con Recharts */}
                      <div style={{
                        padding: '12px',
                        borderRadius: '14px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Gráfica de Potencia en Vivo
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                            {powerHistory.length} lecturas
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 170 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={powerHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="mobilePowerGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={statusColor} stopOpacity={0.4} />
                                  <stop offset="95%" stopColor={statusColor} stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                              <YAxis domain={[yMin, yMax]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} unit=" dBm" />
                              <Tooltip
                                contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '0.75rem' }}
                                labelStyle={{ color: 'var(--text-muted)' }}
                              />
                              <ReferenceLine y={-15} stroke="#10b981" strokeDasharray="3 3" />
                              <ReferenceLine y={-27} stroke="#f59e0b" strokeDasharray="3 3" />
                              <ReferenceLine y={-29.5} stroke="#ef4444" strokeDasharray="3 3" />
                              <Area
                                type="monotone"
                                dataKey="rx"
                                stroke={statusColor}
                                strokeWidth={2.2}
                                fill="url(#mobilePowerGrad)"
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Métricas Técnicas Secundarias */}
                      <div className="tecdt-power-metric-grid" style={{ marginBottom: '14px' }}>
                        <div className="tecdt-power-card">
                          <span className="tecdt-power-card-label">TX (Transmisión)</span>
                          <span className="tecdt-power-card-val">{p.tx_power ? `${p.tx_power} dBm` : '1.2 dBm'}</span>
                          <span className="tecdt-power-card-badge">✔ Normal</span>
                        </div>
                        <div className="tecdt-power-card">
                          <span className="tecdt-power-card-label">OLT RX (SFP)</span>
                          <span className="tecdt-power-card-val">{p.olt_rx_power ? `${p.olt_rx_power} dBm` : '—'}</span>
                          <span className="tecdt-power-card-badge">{p.status || 'Online'}</span>
                        </div>
                      </div>
                    </>
                  );
                })()
              )}

              <button
                type="button"
                className="tecdt-subview-return-btn"
                onClick={handleMobileVolverDePotencia}
              >
                <span>‹</span>
                <span>Volver a la tarjeta (Cerrar sesión OLT)</span>
              </button>
            </div>
          )}

          {/* VISTA 5: UBICACIÓN EN GOOGLE MAPS */}
          {mobileActiveView === 'location' && selectedMobileClient && (
            <div>
              <div
                className="tecdt-subview-header"
                onClick={() => setMobileActiveView('list')}
              >
                <span className="tecdt-subview-back-icon">‹</span>
                <h2 className="tecdt-subview-title">Ubicación</h2>
              </div>

              {/* Tarjeta de cliente compacta */}
              <div className="tecdt-subview-client-card">
                <div className="tecdt-mobile-avatar">👤</div>
                <div>
                  <div style={{ fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', fontSize: '0.92rem' }}>
                    {selectedMobileClient.nombre}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
                    ID #{selectedMobileClient.id} · Nodo: {selectedMobileClient.nodo || selectedMobileClient.nap || 'BAÑOS'}
                  </div>
                </div>
              </div>

              {/* Mapa de Google */}
              {(() => {
                const rawCoords = selectedMobileClient.coordenadas || selectedMobileClient.ubicacion || selectedMobileClient.direccion || '';
                const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(rawCoords || 'Ecuador')}`;
                const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(rawCoords || 'Ecuador')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

                return (
                  <>
                    <div className="tecdt-map-container">
                      <iframe
                        title="Google Maps Location"
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                      />
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tecdt-map-open-btn"
                      >
                        <span>📍 Abrir en Google Maps</span>
                        <span>↗</span>
                      </a>
                    </div>

                    <div className="tecdt-coords-card">
                      <span className="tecdt-coords-icon">📍</span>
                      <div>
                        <span className="tecdt-coords-label">Coordenadas</span>
                        <div className="tecdt-coords-val">{rawCoords || 'Sin coordenadas registradas'}</div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <button
                type="button"
                className="tecdt-subview-return-btn"
                onClick={() => setMobileActiveView('list')}
              >
                <span>‹</span>
                <span>Volver a la tarjeta</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {powerModalOpen && selectedClientForPower && (
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
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCerrarModalPotencia();
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
                maxHeight: '92vh',
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
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.25))',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem'
                  }}>
                    📡
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
                      Medición de Potencia Óptica en Tiempo Real
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Canal continuo cada ~3s a la OLT Huawei (sin cerrar sesión entre muestras)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCerrarModalPotencia}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-muted)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                  title="Cerrar ventana y liberar OLT"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Nombre y Datos del Cliente */}
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
                      Cliente seleccionado
                    </div>
                    {/* Barra de Monitoreo en Vivo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                        <span style={{ fontSize: '0.76rem', fontWeight: '800', color: isPaused ? '#fbbf24' : isStreaming ? '#34d399' : '#94a3b8' }}>
                          {isPaused ? 'PAUSADO' : isStreaming ? 'EN VIVO (cada ~3s)' : 'CONECTANDO'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={togglePausaMonitoreo}
                        style={{
                          padding: '3px 9px',
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
                          padding: '3px 9px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-muted)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          cursor: 'pointer'
                        }}
                        title="Reiniciar muestras de la gráfica"
                      >
                        🧹 Limpiar
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '-0.01em', marginBottom: '8px' }}>
                    {selectedClientForPower.nombre || 'Sin nombre'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                      ID: #{selectedClientForPower.id}
                    </span>
                    {selectedClientForPower.ip && (
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.25)', fontFamily: 'monospace' }}>
                        🌐 {selectedClientForPower.ip}
                      </span>
                    )}
                    {(powerData?.gpon_port || selectedClientForPower.puerto) && (
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.25)', fontFamily: 'monospace' }}>
                        GPON: {powerData?.gpon_port || selectedClientForPower.puerto}
                      </span>
                    )}
                    {(powerData?.ont_id !== undefined || selectedClientForPower.id_port !== undefined) && (
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.25)', fontFamily: 'monospace' }}>
                        ONT ID: {powerData?.ont_id ?? selectedClientForPower.id_port}
                      </span>
                    )}
                    {(powerData?.olt || selectedClientForPower.nodo) && (
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-main)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        OLT: {powerData?.olt || selectedClientForPower.nodo}
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
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: '3px solid rgba(56, 189, 248, 0.2)',
                        borderTopColor: '#38bdf8'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '1rem' }}>
                        Iniciando sesión en la OLT Huawei...
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Estableciendo canal SSH directo para monitoreo en vivo continuo
                      </div>
                    </div>
                  </div>
                ) : powerError && powerHistory.length === 0 ? (
                  <div style={{
                    padding: '18px 20px',
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
                    {selectedClientForPower.potencia && (
                      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#fca5a5', opacity: 0.85 }}>
                        Última potencia guardada en sistema: <strong>{selectedClientForPower.potencia} dBm</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  (() => {
                    const p = powerData?.potencia || {};
                    const rxRaw = p.rx_power ?? p.power ?? selectedClientForPower.potencia;
                    const rxNum = trendInfo.current ?? (rxRaw !== null && rxRaw !== undefined && rxRaw !== '' ? parseFloat(rxRaw) : null);
                    const hasValidRx = rxNum !== null && !isNaN(rxNum);

                    // Evaluación de rango GPON
                    const isOptimal = hasValidRx && rxNum >= -27 && rxNum <= -14;
                    const isAcceptable = hasValidRx && ((rxNum < -27 && rxNum >= -29.5) || (rxNum > -14 && rxNum <= -8));
                    const isCritical = hasValidRx && (rxNum < -29.5 || rxNum > -8);

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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
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
                            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '4px' }}>
                              Potencia Recibida (RX Power)
                            </div>
                            <div style={{
                              fontSize: '2.8rem',
                              fontWeight: '900',
                              fontFamily: 'monospace',
                              color: statusColor,
                              letterSpacing: '-0.02em',
                              lineHeight: 1
                            }}>
                              {hasValidRx ? `${rxNum.toFixed(2)} dBm` : 'Sin Señal'}
                            </div>
                            <div style={{
                              display: 'inline-block',
                              marginTop: '8px',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              background: 'rgba(0, 0, 0, 0.25)',
                              border: `1px solid ${statusBorder}`,
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              color: statusColor,
                              letterSpacing: '0.04em'
                            }}>
                              {statusText}
                            </div>
                          </div>

                          {/* Columna 2: Indicador de Estabilidad y Tendencia (Sube, Baja, Estable) */}
                          <div style={{
                            padding: '18px 20px',
                            borderRadius: '16px',
                            background: trendInfo.badgeBg,
                            border: `1px solid ${trendInfo.color}35`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
                                  Estabilidad & Tendencia
                                </span>
                                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: trendInfo.color }}>
                                  {trendInfo.icon} {trendInfo.label}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.35' }}>
                                {trendInfo.description}
                              </p>
                            </div>

                            {/* Estadísticas de la Sesión en Vivo */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(4, 1fr)',
                              gap: '6px',
                              marginTop: '12px',
                              paddingTop: '10px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Promedio</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f8fafc', fontFamily: 'monospace' }}>
                                  {trendInfo.avg !== null ? `${trendInfo.avg}` : '—'}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mínimo</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#38bdf8', fontFamily: 'monospace' }}>
                                  {trendInfo.min !== null ? `${trendInfo.min}` : '—'}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Máximo</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f59e0b', fontFamily: 'monospace' }}>
                                  {trendInfo.max !== null ? `${trendInfo.max}` : '—'}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Muestras</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#a78bfa', fontFamily: 'monospace' }}>
                                  {trendInfo.totalSamples}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gráfica de Potencia a Tiempo Real con Recharts */}
                        <div style={{
                          padding: '16px 18px',
                          borderRadius: '16px',
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
                                Evolución Óptica en Vivo (dBm)
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                · Muestra cada ~3s
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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

                          <div style={{ width: '100%', height: 210 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={powerHistory} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="desktopPowerGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={statusColor} stopOpacity={0.45} />
                                    <stop offset="95%" stopColor={statusColor} stopOpacity={0.02} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                <YAxis domain={[yMin, yMax]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} unit=" dBm" />
                                <Tooltip
                                  contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '10px',
                                    fontSize: '0.78rem',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                                  }}
                                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                                />
                                <ReferenceLine y={-15} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Óptimo (-15)', fill: '#10b981', fontSize: 10, position: 'right' }} />
                                <ReferenceLine y={-27} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Límite GPON (-27)', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                                <ReferenceLine y={-29.5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Crítico (-29.5)', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                                <Area
                                  type="monotone"
                                  dataKey="rx"
                                  stroke={statusColor}
                                  strokeWidth={2.6}
                                  fill="url(#desktopPowerGrad)"
                                  isAnimationActive={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Desglose de parámetros técnicos */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '10px'
                        }}>
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TX Power (ONT)</div>
                            <div style={{ fontSize: '0.92rem', fontWeight: '700', fontFamily: 'monospace', color: '#f8fafc', marginTop: '2px' }}>
                              {p.tx_power ? `${p.tx_power} dBm` : '1.2 dBm'}
                            </div>
                          </div>

                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OLT RX (SFP)</div>
                            <div style={{ fontSize: '0.92rem', fontWeight: '700', fontFamily: 'monospace', color: '#f8fafc', marginTop: '2px' }}>
                              {p.olt_rx_power ? `${p.olt_rx_power} dBm` : '—'}
                            </div>
                          </div>

                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estado ONT</div>
                            <div style={{
                              fontSize: '0.92rem',
                              fontWeight: '700',
                              color: p.status === 'online' ? '#10b981' : p.status === 'offline' ? '#ef4444' : '#f8fafc',
                              marginTop: '2px',
                              textTransform: 'uppercase'
                            }}>
                              {p.status || (hasValidRx ? 'Online' : '—')}
                            </div>
                          </div>

                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temperatura / Voltaje</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>
                              {p.temperature ? `${p.temperature}°C` : '—'} {p.voltage ? `| ${p.voltage}V` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Modal Footer con botón Verde "De nuevo / Reconectar" y botón Rojo "Cerrar" */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                {/* Botón VERDE: De nuevo / Reconectar */}
                <motion.button
                  whileHover={!loadingPower ? { scale: 1.02 } : {}}
                  whileTap={!loadingPower ? { scale: 0.97 } : {}}
                  type="button"
                  onClick={() => iniciarStreamPotencia(selectedClientForPower)}
                  disabled={loadingPower}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: loadingPower ? 'not-allowed' : 'pointer',
                    opacity: loadingPower ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Reiniciar canal de medición en vivo"
                >
                  <motion.span
                    animate={loadingPower ? { rotate: 360 } : { rotate: 0 }}
                    transition={loadingPower ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                  >
                    🔄
                  </motion.span>
                  <span>De nuevo / Reiniciar</span>
                </motion.button>

                {/* Botón ROJO: Cerrar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleCerrarModalPotencia}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Cerrar ventana y desconectar de la OLT"
                >
                  <span>✕</span>
                  <span>Cerrar</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TECdt;
