/**
 * @file GlobalSearchModal.jsx
 * @description Buscador Global tipo Command Palette (Ctrl + K) para búsqueda rápida de clientes,
 * páginas y acciones en todo el sistema Opsatel.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SYSTEM_PAGES = [
  { title: 'Dashboard / Resumen', path: '/', category: 'Navegación', icon: '📊', roles: ['administrador'] },
  { title: 'Clientes General', path: '/general', category: 'Clientes', icon: '📋', roles: ['administrador'] },
  { title: 'Nuevo Contrato (Ventas)', path: '/ventas', category: 'Clientes', icon: '📝', roles: ['administrador', 'secretario'] },
  { title: 'Hoja de Ruta Técnica', path: '/hoja-ruta', category: 'Técnica', icon: '🗓️', roles: ['administrador', 'tecnico'] },
  { title: 'Activación de Fibra', path: '/activacion', category: 'Técnica', icon: '⚡', roles: ['administrador', 'tecnico', 'instalador'] },
  { title: 'Equipos ONT', path: '/ont', category: 'Técnica', icon: '📡', roles: ['administrador', 'tecnico', 'instalador'] },
  { title: 'Cobros y Pagos', path: '/admin', category: 'Finanzas', icon: '💰', roles: ['administrador', 'secretario'] },
  { title: 'Balance y Cajas', path: '/balance', category: 'Finanzas', icon: '📒', roles: ['administrador'] },
  { title: 'Call Center', path: '/call-center', category: 'Soporte', icon: '📞', roles: ['administrador', 'secretario', 'tecnico'] },
  { title: 'WhatsApp Notificaciones', path: '/whatsapp', category: 'Clientes', icon: '📱', roles: ['administrador', 'secretario'] },
  { title: 'Administrar Clientes', path: '/administrar', category: 'Sistema', icon: '⚙️', roles: ['administrador', 'tecnico'] },
  { title: 'Configuración General', path: '/config', category: 'Sistema', icon: '🛠️', roles: ['administrador'] },
  { title: 'Control de Asistencia', path: '/asistencia', category: 'Personal', icon: '⏰', roles: ['administrador', 'secretario', 'tecnico', 'instalador'] },
  { title: 'Copia de Base de Datos', path: '/upload-db', category: 'Sistema', icon: '📂', roles: ['administrador'] },
  { title: 'Papelera / Eliminados', path: '/eliminados', category: 'Sistema', icon: '🗑️', roles: ['administrador'] },
  { title: 'Tickets Desarrollo', path: '/tickets', category: 'Soporte', icon: '🎫', roles: ['administrador'] }
];

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('todos'); // 'todos' | 'clientes' | 'paginas'
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Carga previa en segundo plano para búsqueda instantánea
  useEffect(() => {
    let isMounted = true;
    if (isOpen && clientes.length === 0) {
      setLoadingClientes(true);
      clienteService.listar()
        .then(res => {
          if (isMounted && res.data) {
            setClientes(Array.isArray(res.data) ? res.data : []);
          }
        })
        .catch(err => {
          console.error('Error cargando clientes para buscador global:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingClientes(false);
        });
    }
    return () => { isMounted = false; };
  }, [isOpen, clientes.length]);

  // Auto focus al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Filtrado de páginas permitidas según rol
  const allowedPages = useMemo(() => {
    return SYSTEM_PAGES.filter(p => !p.roles || (user && p.roles.includes(user.rol)));
  }, [user]);

  // Filtrado dinámico de resultados
  const filteredPages = useMemo(() => {
    if (filterType === 'clientes') return [];
    const q = query.trim().toLowerCase();
    if (!q) return allowedPages.slice(0, 5);
    return allowedPages.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.path.toLowerCase().includes(q)
    );
  }, [allowedPages, query, filterType]);

  const filteredClientes = useMemo(() => {
    if (filterType === 'paginas') return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return clientes.filter(c => {
      const nom = (c.nombre || '').toLowerCase();
      const ced = (c.cedula || '').toLowerCase();
      const ip = (c.ip || '').toLowerCase();
      const tel = (c.telefono || '').toLowerCase();
      const nod = (c.nodo || '').toLowerCase();
      const id = String(c.id || '');
      return nom.includes(q) || ced.includes(q) || ip.includes(q) || tel.includes(q) || nod.includes(q) || id === q;
    }).slice(0, 10);
  }, [clientes, query, filterType]);

  const allItems = useMemo(() => {
    const list = [];
    filteredPages.forEach(p => list.push({ type: 'page', data: p }));
    filteredClientes.forEach(c => list.push({ type: 'cliente', data: c }));
    return list;
  }, [filteredPages, filteredClientes]);

  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex]);

  const handleSelect = (item) => {
    if (!item) return;
    onClose();
    if (item.type === 'page') {
      navigate(item.data.path);
    } else if (item.type === 'cliente') {
      // Redirigir directamente por ID exacto para filtrar únicamente a este cliente
      navigate(`/admin?search=${encodeURIComponent(item.data.id)}&openPago=true`);
    }
  };

  const getStatusBadge = (estado) => {
    const est = (estado || '').toUpperCase();
    if (est === 'ACTIVO') {
      return <span className="search-status-badge badge-activo">Activo</span>;
    } else if (est === 'INACTIVO' || est === 'CORTADO') {
      return <span className="search-status-badge badge-inactivo">Inactivo</span>;
    } else if (est.includes('ACTIVAC') || est === 'PENDIENTE') {
      return <span className="search-status-badge badge-pendiente">Por Activar</span>;
    }
    return <span className="search-status-badge badge-otro">{estado || 'Sin estado'}</span>;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="global-search-backdrop" onClick={onClose}>
        <motion.div
          className="global-search-container"
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header del Buscador */}
          <div className="global-search-input-wrapper">
            <span className="global-search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="global-search-input"
              placeholder="Buscar cliente por nombre, cédula, IP, o navegar a una sección... (Esc para salir)"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
            />
            {query && (
              <button
                type="button"
                className="global-search-clear"
                onClick={() => setQuery('')}
              >
                ✕
              </button>
            )}
            <kbd className="global-search-esc-hint">ESC</kbd>
          </div>

          {/* Filtros Rápidos */}
          <div className="global-search-filters">
            <button
              className={`search-filter-btn ${filterType === 'todos' ? 'active' : ''}`}
              onClick={() => setFilterType('todos')}
            >
              Todos ({allItems.length})
            </button>
            <button
              className={`search-filter-btn ${filterType === 'clientes' ? 'active' : ''}`}
              onClick={() => setFilterType('clientes')}
            >
              👥 Clientes ({filteredClientes.length})
            </button>
            <button
              className={`search-filter-btn ${filterType === 'paginas' ? 'active' : ''}`}
              onClick={() => setFilterType('paginas')}
            >
              📄 Secciones ({filteredPages.length})
            </button>
            {loadingClientes && (
              <span className="search-loading-indicator">⏳ Indexando clientes...</span>
            )}
          </div>

          {/* Lista de Resultados */}
          <div className="global-search-results">
            {/* Clientes Encontrados */}
            {filteredClientes.length > 0 && (
              <div className="search-group">
                <div className="search-group-title">
                  <span>👥 CLIENTES REGISTRADOS</span>
                  <span className="search-group-count">{filteredClientes.length} resultados</span>
                </div>
                {filteredClientes.map((c, idx) => {
                  const globalIdx = filteredPages.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  return (
                    <div
                      key={`cli-${c.id || idx}`}
                      className={`search-result-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect({ type: 'cliente', data: c })}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                    >
                      <div className="search-item-avatar">
                        {c.nombre?.charAt(0)?.toUpperCase() || '👤'}
                      </div>
                      <div className="search-item-content">
                        <div className="search-item-primary">
                          <span className="search-client-name">{c.nombre}</span>
                          {getStatusBadge(c.estado)}
                          {c.saldo_pendiente > 0 && (
                            <span className="search-debt-pill">
                              Debe: ${Number(c.saldo_pendiente).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="search-item-meta">
                          {/* Contacto & Red Básica */}
                          {(c.celular || c.telefono) && (
                            <span className="search-tech-badge">📞 {c.celular || c.telefono}</span>
                          )}
                          {c.ip && (
                            <span className="search-tech-badge highlight" title="Dirección IP">🌐 {c.ip}</span>
                          )}
                          {c.nodo && (
                            <span className="search-tech-badge" title="Nodo">📍 Nodo: {c.nodo}</span>
                          )}
                          {(c.nap || c.caja) && (
                            <span className="search-tech-badge" title="Caja / NAP">📦 NAP: {c.nap || c.caja}</span>
                          )}
                          
                          {/* Datos Técnicos de Fibra & Puertos */}
                          {c.service_port && (
                            <span className="search-tech-badge" title="Service Port">🔌 S.Port: {c.service_port}</span>
                          )}
                          {c.id_port && (
                            <span className="search-tech-badge" title="ID Port">⚡ ID Port: {c.id_port}</span>
                          )}

                          {/* Clave / Contraseña WiFi o PPPoE */}
                          {(c.clave || c.password || c.contrasena) && (
                            <span className="search-tech-badge key" title="Clave / Contraseña">
                              🔑 Clave: {c.clave || c.password || c.contrasena}
                            </span>
                          )}

                          {c.cedula && (
                            <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>🆔 {c.cedula}</span>
                          )}
                        </div>
                      </div>

                      {/* Botones de acción rápida por cliente */}
                      <div className="search-item-actions">
                        <button
                          type="button"
                          title="Cobrar / Registrar Pago para este cliente"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            // Usar ID único para filtrar exactamente a este cliente
                            navigate(`/admin?search=${encodeURIComponent(c.id)}&openPago=true`);
                          }}
                          className="search-quick-btn pay"
                        >
                          💵 Pagar
                        </button>
                        <button
                          type="button"
                          title="Ver en Ficha General"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            // Usar ID único para filtrar exactamente en General
                            navigate(`/general?search=${encodeURIComponent(c.id)}`);
                          }}
                          className="search-quick-btn view"
                        >
                          📋 Ficha
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Páginas y Secciones */}
            {filteredPages.length > 0 && (
              <div className="search-group">
                <div className="search-group-title">
                  <span>📄 SECCIONES Y ACCIONES DEL SISTEMA</span>
                </div>
                {filteredPages.map((p, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={`page-${p.path}`}
                      className={`search-result-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect({ type: 'page', data: p })}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="search-item-icon">{p.icon}</div>
                      <div className="search-item-content">
                        <span className="search-page-title">{p.title}</span>
                        <span className="search-page-cat">{p.category}</span>
                      </div>
                      <span className="search-enter-hint">Ir a sección ↵</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sin resultados */}
            {allItems.length === 0 && query.trim() !== '' && (
              <div className="search-empty-state">
                <div className="search-empty-icon">🔍</div>
                <h4>No se encontraron resultados para "{query}"</h4>
                <p>Verifica si la cédula, el nombre o la dirección IP están bien escritos.</p>
              </div>
            )}
          </div>

          {/* Footer con Atajos */}
          <div className="global-search-footer">
            <div className="search-footer-shortcuts">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navegar</span>
              <span><kbd>↵</kbd> Seleccionar</span>
              <span><kbd>ESC</kbd> Cerrar</span>
            </div>
            <div className="search-footer-tip">
              💡 Tip: Escribe una cédula para saltar directo a cobrarle
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
