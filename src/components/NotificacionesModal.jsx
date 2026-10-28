import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificacionService } from '../services/api';

/**
 * Modal para visualizar cambios en Comentarios y Observaciones de clientes activos
 * y marcarlos como leídos.
 */
const NotificacionesModal = ({ isOpen, onClose, onNotificationRead, unreadCount = 0 }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCampo, setFilterCampo] = useState('ALL'); // 'ALL' | 'Comentario' | 'Observación'
  const [processingId, setProcessingId] = useState(null);
  const [processingAll, setProcessingAll] = useState(false);

  // Cargar notificaciones cuando se abre el modal
  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const res = await notificacionService.listar(true);
      const items = res.data?.notificaciones || [];
      setNotificaciones(items);
      if (typeof onNotificationRead === 'function' && res.data?.unread_count !== undefined) {
        onNotificationRead(res.data.unread_count);
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotificaciones();
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Marcar una notificación individual como leída
  const handleMarcarLeida = async (id) => {
    try {
      setProcessingId(id);
      await notificacionService.marcarLeida(id);
      // Remover optimísticamente de la lista
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      if (typeof onNotificationRead === 'function') {
        onNotificationRead(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Marcar todas como leídas
  const handleMarcarTodasLeidas = async () => {
    if (notificaciones.length === 0) return;
    try {
      setProcessingAll(true);
      await notificacionService.marcarTodasLeidas();
      setNotificaciones([]);
      if (typeof onNotificationRead === 'function') {
        onNotificationRead(0);
      }
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    } finally {
      setProcessingAll(false);
    }
  };

  // Filtrar notificaciones por búsqueda y tipo de campo
  const filteredNotificaciones = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notificaciones.filter((n) => {
      const matchSearch =
        !q ||
        (n.cliente_nombre && n.cliente_nombre.toLowerCase().includes(q)) ||
        (n.cliente_ip && n.cliente_ip.toLowerCase().includes(q)) ||
        (n.cliente_id && String(n.cliente_id).includes(q)) ||
        (n.valor_nuevo && n.valor_nuevo.toLowerCase().includes(q)) ||
        (n.valor_anterior && n.valor_anterior.toLowerCase().includes(q));

      const matchCampo =
        filterCampo === 'ALL' ||
        (filterCampo === 'Comentario' && (n.campo || '').toLowerCase().includes('comentario')) ||
        (filterCampo === 'Observación' && (n.campo || '').toLowerCase().includes('observaci'));

      return matchSearch && matchCampo;
    });
  }, [notificaciones, search, filterCampo]);

  // Contadores para chips de filtrado
  const countComentarios = useMemo(
    () => notificaciones.filter((n) => (n.campo || '').toLowerCase().includes('comentario')).length,
    [notificaciones]
  );
  const countObservaciones = useMemo(
    () => notificaciones.filter((n) => (n.campo || '').toLowerCase().includes('observaci')).length,
    [notificaciones]
  );

  // Formateador de fecha amigable
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return fechaStr;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="notif-modal-backdrop" onClick={onClose}>
        <motion.div
          className="notif-modal-window"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del Modal */}
          <div className="notif-modal-header">
            <div className="notif-header-title-box">
              <div className="notif-header-icon-wrap">
                <span className="notif-bell-icon">🔔</span>
                {notificaciones.length > 0 && <span className="notif-header-pulse-dot" />}
              </div>
              <div>
                <div className="notif-title-row">
                  <h2 className="notif-main-title">Notificaciones de Clientes</h2>
                  <span className="notif-count-pill">
                    {notificaciones.length} {notificaciones.length === 1 ? 'pendiente' : 'pendientes'}
                  </span>
                </div>
                <p className="notif-sub-title">
                  Historial de cambios en Comentarios y Observaciones de Clientes Activos
                </p>
              </div>
            </div>

            <div className="notif-header-actions">
              {notificaciones.length > 0 && (
                <button
                  type="button"
                  className="notif-mark-all-btn"
                  onClick={handleMarcarTodasLeidas}
                  disabled={processingAll || loading}
                  title="Marcar todas las notificaciones como leídas"
                >
                  {processingAll ? 'Procesando...' : '✓ Marcar todas como leídas'}
                </button>
              )}
              <button
                type="button"
                className="notif-close-btn"
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="notif-filter-bar">
            <div className="notif-search-box">
              <span className="notif-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre, IP, ID de cliente o texto del cambio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="notif-search-input"
              />
              {search && (
                <button
                  type="button"
                  className="notif-search-clear"
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="notif-chips-group">
              <button
                type="button"
                className={`notif-chip ${filterCampo === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterCampo('ALL')}
              >
                Todas ({notificaciones.length})
              </button>
              <button
                type="button"
                className={`notif-chip chip-comentario ${filterCampo === 'Comentario' ? 'active' : ''}`}
                onClick={() => setFilterCampo('Comentario')}
              >
                📝 Comentarios ({countComentarios})
              </button>
              <button
                type="button"
                className={`notif-chip chip-observacion ${filterCampo === 'Observación' ? 'active' : ''}`}
                onClick={() => setFilterCampo('Observación')}
              >
                🔍 Observaciones ({countObservaciones})
              </button>
            </div>
          </div>

          {/* Contenido / Listado de Notificaciones */}
          <div className="notif-list-container">
            {loading ? (
              <div className="notif-loading-state">
                <div className="notif-spinner" />
                <p>Cargando notificaciones de clientes...</p>
              </div>
            ) : filteredNotificaciones.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon">
                  {notificaciones.length === 0 ? '✨' : '🔍'}
                </div>
                <h3 className="notif-empty-title">
                  {notificaciones.length === 0
                    ? '¡Todo al día!'
                    : 'No se encontraron resultados'}
                </h3>
                <p className="notif-empty-desc">
                  {notificaciones.length === 0
                    ? 'No hay cambios pendientes de leer en comentarios u observaciones de clientes activos.'
                    : 'Intenta con otro término de búsqueda o cambia el filtro seleccionado.'}
                </p>
                {notificaciones.length === 0 && (
                  <button
                    type="button"
                    className="notif-empty-refresh-btn"
                    onClick={fetchNotificaciones}
                  >
                    🔄 Comprobar de nuevo
                  </button>
                )}
              </div>
            ) : (
              <div className="notif-cards-wrapper">
                <AnimatePresence>
                  {filteredNotificaciones.map((n) => {
                    const isComentario = (n.campo || '').toLowerCase().includes('comentario');
                    const hasAnterior = n.valor_anterior && n.valor_anterior.trim() !== '';

                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30, scale: 0.95 }}
                        transition={{ duration: 0.22 }}
                        className={`notif-item-card ${isComentario ? 'border-comentario' : 'border-observacion'}`}
                      >
                        {/* Cabecera de la tarjeta */}
                        <div className="notif-card-header">
                          <div className="notif-card-client-info">
                            <span className="notif-card-client-id" title="ID de Cliente">
                              #{n.cliente_id}
                            </span>
                            <span className="notif-card-client-name" title={n.cliente_nombre}>
                              {n.cliente_nombre}
                            </span>
                            <span className="notif-card-ip-pill" title="IP del Cliente">
                              🌐 {n.cliente_ip || 'Sin IP'}
                            </span>
                          </div>

                          <div className="notif-card-meta">
                            <span
                              className={`notif-campo-badge ${isComentario ? 'badge-comentario' : 'badge-observacion'}`}
                            >
                              {isComentario ? '📝 Comentario' : '🔍 Observación'}
                            </span>
                            <span className="notif-card-time" title={n.fecha}>
                              ⏰ {formatearFecha(n.fecha)}
                            </span>
                            {n.usuario && (
                              <span className="notif-card-user" title="Usuario que realizó el cambio">
                                👤 {n.usuario}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bloques de Comparación del Cambio */}
                        <div className="notif-card-body">
                          {hasAnterior ? (
                            <div className="notif-diff-grid">
                              <div className="notif-diff-col col-before">
                                <div className="notif-diff-label">
                                  <span className="diff-dot-red" /> Valor anterior:
                                </div>
                                <div className="notif-diff-text text-before">
                                  {n.valor_anterior}
                                </div>
                              </div>
                              <div className="notif-diff-col col-after">
                                <div className="notif-diff-label">
                                  <span className="diff-dot-green" /> Nuevo cambio realizado:
                                </div>
                                <div className="notif-diff-text text-after">
                                  {n.valor_nuevo || '(Vacío)'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="notif-single-change">
                              <div className="notif-diff-label">
                                <span className="diff-dot-green" /> Cambio realizado (asignación inicial):
                              </div>
                              <div className="notif-diff-text text-after">
                                {n.valor_nuevo || '(Sin contenido)'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Pie de tarjeta con botón marcar como leído */}
                        <div className="notif-card-footer">
                          <div className="notif-footer-hint">
                            Cliente Activo • Cambio registrado en el sistema
                          </div>
                          <button
                            type="button"
                            className="notif-read-action-btn"
                            onClick={() => handleMarcarLeida(n.id)}
                            disabled={processingId === n.id}
                            title="Marcar este cambio como leído y retirar de la lista"
                          >
                            {processingId === n.id ? (
                              'Marcando...'
                            ) : (
                              <>
                                <span className="btn-check-icon">✓</span>
                                <span>Marcar como leído</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer del Modal */}
          <div className="notif-modal-footer">
            <div className="notif-footer-stats">
              Mostrando <strong>{filteredNotificaciones.length}</strong> de{' '}
              <strong>{notificaciones.length}</strong> notificaciones pendientes
            </div>
            <button type="button" className="notif-footer-close-btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>

      {/* Estilos encapsulados del Modal de Notificaciones */}
      <style>{`
        .notif-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(8, 12, 24, 0.78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .notif-modal-window {
          background: linear-gradient(145deg, #131b2e 0%, #0c1222 100%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          width: 100%;
          max-width: 820px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 35px rgba(99, 102, 241, 0.15);
          overflow: hidden;
          color: #f1f5f9;
        }

        /* Header */
        .notif-modal-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          gap: 16px;
        }

        .notif-header-title-box {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .notif-header-icon-wrap {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          flex-shrink: 0;
        }

        .notif-header-pulse-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 11px;
          height: 11px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid #0f172a;
          box-shadow: 0 0 8px #ef4444;
          animation: notifPulse 1.8s infinite;
        }

        .notif-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .notif-main-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .notif-count-pill {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.35);
          padding: 2px 9px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .notif-sub-title {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 3px 0 0 0;
        }

        .notif-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .notif-mark-all-btn {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #6ee7b7;
          padding: 7px 14px;
          border-radius: 9px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .notif-mark-all-btn:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.22);
          border-color: rgba(16, 185, 129, 0.55);
          transform: translateY(-1px);
        }

        .notif-mark-all-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .notif-close-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .notif-close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        /* Filter Bar */
        .notif-filter-bar {
          padding: 14px 24px;
          background: rgba(0, 0, 0, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notif-search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .notif-search-icon {
          position: absolute;
          left: 12px;
          font-size: 0.85rem;
          color: #64748b;
          pointer-events: none;
        }

        .notif-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 9px 36px 9px 34px;
          color: #f1f5f9;
          font-size: 0.82rem;
          transition: all 0.2s ease;
          outline: none;
        }

        .notif-search-input:focus {
          border-color: #6366f1;
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .notif-search-clear {
          position: absolute;
          right: 10px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 4px;
        }

        .notif-chips-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notif-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notif-chip:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
        }

        .notif-chip.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: #6366f1;
          color: #a5b4fc;
          font-weight: 600;
        }

        .notif-chip.chip-comentario.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
          color: #93c5fd;
        }

        .notif-chip.chip-observacion.active {
          background: rgba(245, 158, 11, 0.2);
          border-color: #f59e0b;
          color: #fcd34d;
        }

        /* List container */
        .notif-list-container {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
          min-height: 280px;
          max-height: 58vh;
        }

        .notif-cards-wrapper {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .notif-item-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }

        .notif-item-card:hover {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.4);
        }

        .notif-item-card.border-comentario {
          border-left: 4px solid #3b82f6;
        }

        .notif-item-card.border-observacion {
          border-left: 4px solid #f59e0b;
        }

        .notif-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .notif-card-client-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notif-card-client-id {
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .notif-card-client-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #ffffff;
        }

        .notif-card-ip-pill {
          background: rgba(14, 165, 233, 0.12);
          border: 1px solid rgba(14, 165, 233, 0.25);
          color: #7dd3fc;
          font-size: 0.72rem;
          padding: 2px 8px;
          border-radius: 12px;
          font-family: monospace;
          font-weight: 600;
        }

        .notif-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notif-campo-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .notif-campo-badge.badge-comentario {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }

        .notif-campo-badge.badge-observacion {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fcd34d;
        }

        .notif-card-time {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        .notif-card-user {
          font-size: 0.72rem;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.1);
          padding: 2px 6px;
          border-radius: 6px;
        }

        /* Diff content */
        .notif-card-body {
          margin-bottom: 14px;
        }

        .notif-diff-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .notif-diff-grid {
            grid-template-columns: 1fr;
          }
        }

        .notif-diff-col {
          border-radius: 10px;
          padding: 10px 12px;
        }

        .col-before {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .col-after {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .notif-single-change {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 10px;
          padding: 10px 12px;
        }

        .notif-diff-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .diff-dot-red {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
        }

        .diff-dot-green {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
        }

        .notif-diff-text {
          font-size: 0.84rem;
          line-height: 1.45;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .text-before {
          color: #f87171;
          text-decoration: line-through;
          opacity: 0.85;
        }

        .text-after {
          color: #a7f3d0;
          font-weight: 500;
        }

        /* Card footer */
        .notif-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
          gap: 12px;
        }

        .notif-footer-hint {
          font-size: 0.7rem;
          color: #64748b;
        }

        .notif-read-action-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }

        .notif-read-action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .notif-read-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-check-icon {
          font-weight: 800;
        }

        /* Loading & Empty states */
        .notif-loading-state,
        .notif-empty-state {
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .notif-spinner {
          width: 34px;
          height: 34px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .notif-empty-icon {
          font-size: 2.8rem;
          margin-bottom: 12px;
        }

        .notif-empty-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 6px 0;
        }

        .notif-empty-desc {
          font-size: 0.82rem;
          color: #94a3b8;
          max-width: 420px;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .notif-empty-refresh-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #e2e8f0;
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notif-empty-refresh-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        /* Footer */
        .notif-modal-footer {
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.15);
        }

        .notif-footer-stats {
          font-size: 0.74rem;
          color: #94a3b8;
        }

        .notif-footer-stats strong {
          color: #f1f5f9;
        }

        .notif-footer-close-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notif-footer-close-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }
      `}</style>
    </AnimatePresence>
  );
};

export default NotificacionesModal;
