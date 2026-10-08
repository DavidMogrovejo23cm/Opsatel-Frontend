import React, { useEffect, useState, useMemo } from 'react';
import { clienteService } from '../services/api';
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

  // Normalizar enlace de WhatsApp para números de Ecuador u otros
  const getWhatsAppLink = (rawNumber) => {
    if (!rawNumber) return null;
    let clean = String(rawNumber).replace(/\D/g, '');
    if (clean.startsWith('09') && clean.length === 10) {
      clean = '593' + clean.slice(1);
    } else if (clean.startsWith('9') && clean.length === 9) {
      clean = '593' + clean;
    }
    return `https://wa.me/${clean}`;
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TECdt;
