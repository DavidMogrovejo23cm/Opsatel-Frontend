/**
 * @file TECdt.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React, { useEffect, useState, useMemo } from 'react';
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

  // Estado para Modal de Medición de Potencia ONT / Bridge
  const [selectedClientForPower, setSelectedClientForPower] = useState(null);
  const [powerModalOpen, setPowerModalOpen] = useState(false);
  const [powerData, setPowerData] = useState(null);
  const [loadingPower, setLoadingPower] = useState(false);
  const [powerError, setPowerError] = useState(null);

  const handleAbrirPotencia = (cliente) => {
    setSelectedClientForPower(cliente);
    setPowerModalOpen(true);
    setPowerData(null);
    setPowerError(null);
    medirPotencia(cliente);
  };

  const medirPotencia = async (cliente) => {
    const target = cliente || selectedClientForPower;
    if (!target || !target.id) return;
    setLoadingPower(true);
    setPowerError(null);
    try {
      const res = await oltService.getOntPotencia(target.id);
      const data = res.data || {};
      setPowerData(data);
      const rx = data.potencia?.rx_power ?? data.potencia?.power;
      if (rx !== undefined && rx !== null) {
        setClientes(prev => prev.map(c => c.id === target.id ? { ...c, potencia: String(rx) } : c));
        setSelectedClientForPower(prev => prev ? { ...prev, potencia: String(rx) } : prev);
      }
    } catch (err) {
      console.error('Error midiendo potencia en TECdt:', err);
      const msg = err.response?.data?.detail || err.message || 'Error al consultar la potencia a la OLT';
      setPowerError(msg);
    } finally {
      setLoadingPower(false);
    }
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

      {/* Modal Ver Potencia ONT/Bridge */}
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
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !loadingPower) {
                setPowerModalOpen(false);
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
                maxWidth: '520px',
                borderRadius: '20px',
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
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
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    📡
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
                      Potencia Óptica (Bridge / ONT)
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Medición en vivo consultada a la OLT
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPowerModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '1.4rem',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Nombre y Datos del Cliente */}
                <div style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Cliente
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '-0.01em', marginBottom: '8px' }}>
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
                {loadingPower ? (
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
                      <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.98rem' }}>
                        Midiendo potencia en tiempo real...
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Consultando transceptor óptico en la OLT Huawei
                      </div>
                    </div>
                  </div>
                ) : powerError ? (
                  <div style={{
                    padding: '18px 20px',
                    borderRadius: '14px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.95rem', marginBottom: '6px' }}>
                      <span>⚠️</span>
                      <span>No se pudo obtener la potencia</span>
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
                    const rx = rxRaw !== null && rxRaw !== undefined && rxRaw !== '' ? parseFloat(rxRaw) : null;
                    const hasValidRx = rx !== null && !isNaN(rx);

                    // Evaluación de rango GPON
                    const isOptimal = hasValidRx && rx >= -27 && rx <= -14;
                    const isAcceptable = hasValidRx && ((rx < -27 && rx >= -29.5) || (rx > -14 && rx <= -8));
                    const isCritical = hasValidRx && (rx < -29.5 || rx > -8);

                    const statusColor = isOptimal ? '#10b981' : isAcceptable ? '#f59e0b' : hasValidRx ? '#ef4444' : '#94a3b8';
                    const statusBg = isOptimal ? 'rgba(16, 185, 129, 0.12)' : isAcceptable ? 'rgba(245, 158, 11, 0.12)' : hasValidRx ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)';
                    const statusBorder = isOptimal ? 'rgba(16, 185, 129, 0.3)' : isAcceptable ? 'rgba(245, 158, 11, 0.3)' : hasValidRx ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)';
                    const statusText = isOptimal ? '🟢 POTENCIA ÓPTIMA (-15 A -27 DBM)' : isAcceptable ? '🟡 ATENUADA / ALTO RIESGO' : hasValidRx ? '🔴 CRÍTICA / FUERA DE RANGO' : '⚪ SIN LECTURA DETECTADA';

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Tarjeta de Potencia Principal */}
                        <div style={{
                          padding: '24px 20px',
                          borderRadius: '16px',
                          background: statusBg,
                          border: `1px solid ${statusBorder}`,
                          textAlign: 'center',
                          boxShadow: `0 8px 24px ${statusColor}18`
                        }}>
                          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '8px' }}>
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
                            {hasValidRx ? `${rx.toFixed(2)} dBm` : (rxRaw ? `${rxRaw} dBm` : 'Sin Señal')}
                          </div>
                          <div style={{
                            display: 'inline-block',
                            marginTop: '12px',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: `1px solid ${statusBorder}`,
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            color: statusColor,
                            letterSpacing: '0.04em'
                          }}>
                            {statusText}
                          </div>
                        </div>

                        {/* Desglose de parámetros técnicos */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '10px'
                        }}>
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TX Power (ONT)</div>
                            <div style={{ fontSize: '0.92rem', fontWeight: '700', fontFamily: 'monospace', color: '#f8fafc', marginTop: '2px' }}>
                              {p.tx_power ? `${p.tx_power} dBm` : '—'}
                            </div>
                          </div>

                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                          }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OLT RX (SFP)</div>
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
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estado ONT</div>
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
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Temperatura / Voltaje</div>
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

              {/* Modal Footer con botón Verde "De nuevo" y botón Rojo "Cerrar" */}
              <div style={{
                padding: '18px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                {/* Botón VERDE: De nuevo */}
                <motion.button
                  whileHover={!loadingPower ? { scale: 1.02 } : {}}
                  whileTap={!loadingPower ? { scale: 0.97 } : {}}
                  type="button"
                  onClick={() => medirPotencia(selectedClientForPower)}
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
                  title="Medir de nuevo la potencia en la OLT"
                >
                  <motion.span
                    animate={loadingPower ? { rotate: 360 } : { rotate: 0 }}
                    transition={loadingPower ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                  >
                    🔄
                  </motion.span>
                  <span>De nuevo</span>
                </motion.button>

                {/* Botón ROJO: Cerrar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setPowerModalOpen(false)}
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
                  title="Cerrar ventana"
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
