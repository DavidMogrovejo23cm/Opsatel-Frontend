/**
 * @file Layout.jsx
 * @description Layout principal de Opsatel con Header empresarial, Acciones Rápidas,
 * Buscador Global (Ctrl + K) y navegación modular optimizada.
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearchModal from './GlobalSearchModal';
import { useAuth } from '../context/AuthContext';

const BREADCRUMB_MAP = {
  '': { title: 'Dashboard', module: 'Principal', icon: '📊' },
  'general': { title: 'Base General', module: 'Clientes', icon: '📋' },
  'ventas': { title: 'Nuevo Contrato', module: 'Clientes', icon: '📝' },
  'call-center': { title: 'Call Center', module: 'Soporte', icon: '📞' },
  'whatsapp': { title: 'Notificaciones WhatsApp', module: 'Clientes', icon: '📱' },
  'hoja-ruta': { title: 'Hoja de Ruta', module: 'Técnica', icon: '🗓️' },
  'activacion': { title: 'Activación de Fibra', module: 'Técnica', icon: '⚡' },
  'ont': { title: 'Equipos ONT', module: 'Técnica', icon: '📡' },
  'tecdt': { title: 'Portal Técnico', module: 'Técnica', icon: '🔧' },
  'admin': { title: 'Cobros y Pagos', module: 'Finanzas', icon: '💰' },
  'balance': { title: 'Balance & Cajas', module: 'Finanzas', icon: '📒' },
  'extras-pagos': { title: 'Pagos Extras', module: 'Finanzas', icon: '💸' },
  'extras-general': { title: 'Extras General', module: 'Finanzas', icon: '🌍' },
  'administrar': { title: 'Administrar Clientes', module: 'Sistema', icon: '⚙️' },
  'config': { title: 'Configuración', module: 'Sistema', icon: '🛠️' },
  'asistencia': { title: 'Control Asistencia', module: 'Personal', icon: '⏰' },
  'upload-db': { title: 'Copia Base de Datos', module: 'Sistema', icon: '📂' },
  'eliminados': { title: 'Papelera / Eliminados', module: 'Sistema', icon: '🗑️' },
  'tickets': { title: 'Tickets Soporte', module: 'Soporte', icon: '🎫' }
};

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const rawPath = location.pathname.split('/')[1] || '';
  const pageKey = rawPath.toLowerCase();
  const currentCrumb = BREADCRUMB_MAP[pageKey] || { title: pageKey, module: 'Opsatel', icon: '📁' };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Atajo global para abrir el buscador con Ctrl + K o Cmd + K
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Bloquea el scroll del fondo en móviles cuando el menú lateral está abierto
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="layout-root">
      {/* Overlay oscuro para móvil cuando el sidebar está abierto */}
      <div 
        className={`blur-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Menú lateral moderno */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onRefresh={handleRefresh}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
      
      {/* Contenedor principal con Header Superior */}
      <div className="app-main-layout">
        {/* TOP ENTERPRISE HEADER */}
        <header className="app-top-header">
          {/* Lado Izquierdo: Botón Hamburguesa móvil + Breadcrumbs */}
          <div className="top-header-left">
            <button 
              className="top-header-hamburger" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir Menú"
              type="button"
            >
              ☰
            </button>
            <div className="top-header-breadcrumbs">
              <span className="crumb-module">{currentCrumb.module}</span>
              <span className="crumb-separator">/</span>
              <span className="crumb-current">
                <span className="crumb-icon">{currentCrumb.icon}</span>
                {currentCrumb.title}
              </span>
            </div>
          </div>

          {/* Centro: Buscador Global (Ctrl + K) */}
          <div className="top-header-center">
            <button 
              type="button" 
              className="top-header-search-bar"
              onClick={() => setIsSearchOpen(true)}
            >
              <span className="search-bar-icon">🔍</span>
              <span className="search-bar-placeholder">
                Buscar cliente por cédula, nombre o IP...
              </span>
              <kbd className="search-bar-kbd">Ctrl + K</kbd>
            </button>
          </div>

          {/* Lado Derecho: Acciones Rápidas */}
          <div className="top-header-right">
            {/* Acciones Rápidas según Rol */}
            <div className="top-quick-actions-bar">
              {(user?.rol === 'administrador' || user?.rol === 'secretario') && (
                <button
                  type="button"
                  className="quick-action-pill primary"
                  onClick={() => navigate('/admin')}
                  title="Cobrar cuota o registrar pago"
                >
                  <span>💵</span>
                  <span className="quick-action-text">Cobrar</span>
                </button>
              )}

              {(user?.rol === 'administrador' || user?.rol === 'secretario') && (
                <button
                  type="button"
                  className="quick-action-pill secondary"
                  onClick={() => navigate('/ventas')}
                  title="Registrar nuevo contrato de cliente"
                >
                  <span>➕</span>
                  <span className="quick-action-text">Contrato</span>
                </button>
              )}

              {(user?.rol === 'administrador' || user?.rol === 'tecnico') && (
                <button
                  type="button"
                  className="quick-action-pill outline"
                  onClick={() => navigate('/hoja-ruta')}
                  title="Ver hoja de ruta técnica del día"
                >
                  <span>🗓️</span>
                  <span className="quick-action-text">Ruta</span>
                </button>
              )}
            </div>

            {/* Botón Refrescar Vista */}
            <button 
              type="button" 
              className="top-header-icon-btn" 
              onClick={handleRefresh}
              title="Refrescar contenido"
            >
              🔄
            </button>
          </div>
        </header>

        {/* CONTENIDO DE LA PÁGINA */}
        <main data-page={pageKey} className="main-content-container">
          <Outlet key={refreshKey} />
        </main>
      </div>

      {/* MODAL DE BÚSQUEDA GLOBAL */}
      <GlobalSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      <style>{`
        .layout-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: transparent;
        }

        .app-main-layout {
          margin-left: 270px;
          width: calc(100% - 270px);
          min-height: 100vh;
          background: transparent;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          transition: all 0.25s ease;
        }

        /* Top Header Empresarial */
        .app-top-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 32px;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-sizing: border-box;
        }

        .top-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .top-header-hamburger {
          display: none;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 1.15rem;
          align-items: center;
          justify-content: center;
        }

        .top-header-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.85rem;
          white-space: nowrap;
        }

        .crumb-module {
          color: #94a3b8;
          font-weight: 500;
        }

        .crumb-separator {
          color: #475569;
          font-size: 0.75rem;
        }

        .crumb-current {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #f8fafc;
          font-weight: 700;
        }

        .crumb-icon {
          font-size: 0.95rem;
        }

        /* Centro: Barra de búsqueda */
        .top-header-center {
          flex: 1;
          max-width: 480px;
          display: flex;
          justify-content: center;
        }

        .top-header-search-bar {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #94a3b8;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.83rem;
          transition: all 0.2s ease;
        }

        .top-header-search-bar:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(99, 102, 241, 0.45);
          color: #f1f5f9;
        }

        .search-bar-icon {
          font-size: 0.9rem;
        }

        .search-bar-placeholder {
          flex: 1;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-bar-kbd {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 5px;
          font-size: 0.68rem;
          padding: 2px 6px;
          color: #cbd5e1;
          font-family: monospace;
          font-weight: 600;
        }

        /* Lado Derecho */
        .top-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .top-quick-actions-bar {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .quick-action-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 9px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.18s ease;
          border: none;
        }

        .quick-action-pill.primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
        }

        .quick-action-pill.primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .quick-action-pill.secondary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }

        .quick-action-pill.secondary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .quick-action-pill.outline {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
        }

        .quick-action-pill.outline:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .top-header-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .top-header-icon-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: rotate(45deg);
        }

        /* Contenedor del contenido principal */
        .main-content-container {
          width: 100%;
          flex: 1;
          padding: 24px 32px;
          box-sizing: border-box;
        }

        /* Tablet y Móvil */
        @media (max-width: 1024px) {
          .app-main-layout {
            margin-left: 0 !important;
            width: 100% !important;
          }

          .app-top-header {
            padding: 0 16px;
            height: 58px;
          }

          .top-header-hamburger {
            display: flex;
          }

          .main-content-container {
            padding: 16px;
          }

          .top-header-center {
            max-width: 220px;
          }

          .search-bar-placeholder {
            display: none;
          }

          .search-bar-kbd {
            display: none;
          }

          .quick-action-text {
            display: none;
          }

          .quick-action-pill {
            padding: 7px 9px;
          }
        }

        @media (max-width: 600px) {
          .top-header-breadcrumbs {
            display: none;
          }
        }

        /* Estilos Light Mode para Top Header */
        [data-theme="light"] .app-top-header {
          background: rgba(255, 255, 255, 0.92) !important;
          border-bottom-color: #e2e8f0 !important;
        }
        [data-theme="light"] .crumb-module {
          color: #64748b !important;
        }
        [data-theme="light"] .crumb-current {
          color: #0f172a !important;
        }
        [data-theme="light"] .top-header-search-bar {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #64748b !important;
        }
        [data-theme="light"] .top-header-search-bar:hover {
          background: #e2e8f0 !important;
          border-color: #6366f1 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .search-bar-kbd {
          background: #e2e8f0 !important;
          border-color: #cbd5e1 !important;
          color: #475569 !important;
        }
        [data-theme="light"] .top-header-icon-btn {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
        }
        [data-theme="light"] .top-header-hamburger {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .quick-action-pill.outline {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
        }
      `}</style>
    </div>
  );
};

export default Layout;
