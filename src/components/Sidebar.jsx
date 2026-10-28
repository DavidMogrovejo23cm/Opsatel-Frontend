/**
 * @file Sidebar.jsx
 * @description Sidebar de navegación modular para Opsatel, organizado por áreas de trabajo
 * (Clientes, Técnica, Finanzas, Sistema) para máxima usabilidad y menor fatiga cognitiva.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clienteService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Definición de Grupos y Módulos de Trabajo
const MENU_SECTIONS = [
  {
    id: 'principal',
    title: 'Principal',
    icon: '📊',
    items: [
      { path: '/', label: 'Overview / Resumen', icon: '📊', roles: ['administrador'] }
    ]
  },
  {
    id: 'clientes',
    title: 'Clientes & Ventas',
    icon: '👥',
    items: [
      { path: '/general', label: 'Clientes (General)', icon: '📋', roles: ['administrador'] },
      { path: '/ventas', label: 'Nuevo Contrato', icon: '📝', roles: ['administrador', 'secretario'] },
      { path: '/call-center', label: 'Call Center', icon: '📞', roles: ['administrador', 'secretario'] },
      { path: '/whatsapp', label: 'Notificaciones WhatsApp', icon: '📱', roles: ['administrador', 'secretario'] }
    ]
  },
  {
    id: 'tecnica',
    title: 'Operaciones Técnicas',
    icon: '🛠️',
    items: [
      { path: '/hoja-ruta', label: 'Hoja de Ruta', icon: '🗓️', roles: ['administrador', 'tecnico'] },
      { path: '/activacion', label: 'Activación de Fibra', icon: '⚡', roles: ['administrador', 'tecnico', 'instalador'] },
      { path: '/tecdt', label: 'Portal Técnico (TECdt)', icon: '🔧', roles: ['tecnico'] }
    ]
  },
  {
    id: 'finanzas',
    title: 'Finanzas & Cobros',
    icon: '💰',
    items: [
      { path: '/admin', label: 'Cobros y Pagos', icon: '💵', roles: ['administrador', 'secretario'] },
      { path: '/balance', label: 'Balance & Cajas', icon: '📒', roles: ['administrador'] },
      { path: '/extras-pagos', label: 'Pagos Extras', icon: '💸', roles: ['administrador', 'secretario'] },
      { path: '/extras-general', label: 'Extras General', icon: '🌍', roles: ['administrador', 'secretario'] }
    ]
  },
  {
    id: 'sistema',
    title: 'Administración & Sistema',
    icon: '⚙️',
    items: [
      { path: '/administrar', label: 'Administrar Clientes', icon: '⚙️', roles: ['administrador', 'secretario', 'tecnico'] },
      { path: '/config', label: 'Configuraciones', icon: '🛠️', roles: ['administrador'] },
      { path: '/asistencia', label: 'Control Asistencia', icon: '⏰', roles: ['administrador', 'secretario', 'tecnico', 'instalador'] },
      { path: '/upload-db', label: 'Copia Base de Datos', icon: '📂', roles: ['administrador'] },
      { path: '/eliminados', label: 'Papelera / Eliminados', icon: '🗑️', roles: ['administrador'] },
      { path: '/tickets', label: 'Tickets Soporte', icon: '🎫', roles: ['administrador'] }
    ]
  }
];

const Sidebar = ({ isOpen, setIsOpen, onRefresh, onOpenSearch }) => {
  const { user, logout } = useAuth();
  const [pendientesCount, setPendientesCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Estados de grupos colapsables (por defecto todos abiertos para rápido acceso)
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem('opsatel_sidebar_sections_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return { principal: true, clientes: true, tecnica: true, finanzas: true, sistema: false };
  });

  const toggleSection = (sectionId) => {
    setOpenSections(prev => {
      const updated = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem('opsatel_sidebar_sections_v2', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('opsatel_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opsatel_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await clienteService.getPendientesCount();
        setPendientesCount(res.data.count || 0);
      } catch (e) {
        console.error('Error fetching pendientes count:', e);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshClick = async () => {
    try {
      const res = await clienteService.getPendientesCount();
      setPendientesCount(res.data.count || 0);
    } catch (e) {
      console.error('Error fetching pendientes count on refresh:', e);
    }
    if (typeof onRefresh === 'function') {
      onRefresh();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtrar ítems y grupos según el rol del usuario conectado
  const visibleSections = useMemo(() => {
    return MENU_SECTIONS.map(section => {
      const allowedItems = section.items.filter(item => {
        if (item.path === '/general') {
          return user && (user.rol === 'administrador' || user.acceso_general_sin_clave);
        }
        return !item.roles || (user && item.roles.includes(user.rol));
      });
      return { ...section, items: allowedItems };
    }).filter(section => section.items.length > 0);
  }, [user]);

  // Asegura que el grupo que contiene la ruta activa esté abierto
  useEffect(() => {
    const currentPath = location.pathname;
    visibleSections.forEach(sec => {
      const hasActive = sec.items.some(item => item.path === currentPath);
      if (hasActive && !openSections[sec.id]) {
        setOpenSections(prev => ({ ...prev, [sec.id]: true }));
      }
    });
  }, [location.pathname, visibleSections]);

  return (
    <>
      <aside
        className={`sidebar ${isOpen ? 'show-mobile' : ''}`}
        aria-label="Navegación Principal"
      >
        {/* Cabecera del Sidebar */}
        <div className="sidebar-header">
          <div className="sidebar-brand-row">
            <div className="sidebar-logo-container">
              <img
                src="/image%20copy.png"
                alt="Opsatel Logo"
                className="sidebar-logo-img"
              />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-title">OPSATEL</span>
              <span className="sidebar-version">TELECOM ERP</span>
            </div>
            <div className="sidebar-quick-actions">
              <button
                onClick={handleRefreshClick}
                title="Actualizar datos"
                className="sidebar-icon-btn"
                type="button"
              >
                🔄
              </button>
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                className="sidebar-icon-btn"
                type="button"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>

            {/* Botón cerrar para móvil */}
            <button
              onClick={() => setIsOpen(false)}
              className="sidebar-close-btn"
              aria-label="Cerrar menú"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Tarjeta de usuario */}
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.username?.charAt(0)?.toUpperCase() || '👤'}
            </div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">{user?.username || 'Usuario'}</div>
              <div className="sidebar-user-role">{user?.rol || 'Invitado'}</div>
            </div>
            <div className="sidebar-user-status-dot" title="En línea" />
          </div>

          {/* Botón de acceso rápido a Búsqueda Global */}
          <button
            type="button"
            className="sidebar-search-trigger"
            onClick={() => {
              setIsOpen(false);
              if (onOpenSearch) onOpenSearch();
            }}
          >
            <span className="sidebar-search-trigger-icon">🔍</span>
            <span className="sidebar-search-trigger-text">Buscador global...</span>
            <kbd className="sidebar-search-trigger-kbd">Ctrl+K</kbd>
          </button>
        </div>

        {/* Lista de Secciones y Módulos con scroll */}
        <nav className="sidebar-nav-scroll">
          {visibleSections.map(section => {
            const isSectionOpen = openSections[section.id] !== false;
            const hasActiveRoute = section.items.some(it => it.path === location.pathname);

            return (
              <div key={section.id} className="sidebar-section-group">
                {/* Cabecera del Grupo colapsable */}
                <button
                  type="button"
                  className={`sidebar-section-header ${hasActiveRoute ? 'has-active' : ''}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="sidebar-section-icon">{section.icon}</span>
                  <span className="sidebar-section-title">{section.title}</span>
                  <span className="sidebar-section-chevron">
                    {isSectionOpen ? '▾' : '▸'}
                  </span>
                </button>

                {/* Submenú de enlaces */}
                <div className={`sidebar-section-content ${isSectionOpen ? 'open' : 'closed'}`}>
                  {section.items.map(item => {
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                      >
                        <span className="sidebar-nav-icon">{item.icon}</span>
                        <span className="sidebar-nav-label">{item.label}</span>

                        {item.path === '/tecnica' && pendientesCount > 0 && (
                          <div className="sidebar-pulse-dot" title="Nuevas tareas técnicas" />
                        )}
                        {item.path === '/hoja-ruta' && pendientesCount > 0 && (
                          <span className="sidebar-badge-count" title={`${pendientesCount} pendientes`}>
                            {pendientesCount}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer: Cerrar Sesión */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            type="button"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <style>{`
        /* Sidebar base container */
        .sidebar {
          width: 270px;
          height: 100vh;
          height: 100dvh;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          z-index: 1001;
          background: #090d16;
          background: linear-gradient(180deg, #0e1320 0%, #070913 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 10px 0 35px rgba(0, 0, 0, 0.55);
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          overflow: hidden !important;
          user-select: none;
        }

        /* Header fijo superior */
        .sidebar-header {
          flex-shrink: 0;
          padding: 16px 14px 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(14, 19, 32, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sidebar-brand-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-logo-container {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sidebar-brand-text {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .sidebar-title {
          font-size: 1.12rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.15;
        }

        .sidebar-version {
          font-size: 0.62rem;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .sidebar-quick-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .sidebar-icon-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-main);
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .sidebar-icon-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: translateY(-1px);
        }

        .sidebar-close-btn {
          display: none;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 700;
          margin-left: 4px;
        }

        /* User Card */
        .sidebar-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sidebar-user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: #ffffff;
          flex-shrink: 0;
        }

        .sidebar-user-details {
          flex: 1;
          min-width: 0;
        }

        .sidebar-user-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .sidebar-user-role {
          font-size: 0.65rem;
          font-weight: 600;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .sidebar-user-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }

        /* Botón de acceso rápido a búsqueda */
        .sidebar-search-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.8rem;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .sidebar-search-trigger:hover {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(99, 102, 241, 0.4);
          color: #f1f5f9;
        }

        .sidebar-search-trigger-icon {
          font-size: 0.85rem;
        }

        .sidebar-search-trigger-text {
          flex: 1;
          text-align: left;
        }

        .sidebar-search-trigger-kbd {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          font-size: 0.65rem;
          padding: 1px 5px;
          color: #cbd5e1;
          font-family: monospace;
        }

        /* Scroll de navegación */
        .sidebar-nav-scroll {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 10px 10px 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-nav-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }

        /* Grupos de secciones */
        .sidebar-section-group {
          display: flex;
          flex-direction: column;
        }

        .sidebar-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 6px 8px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s ease;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .sidebar-section-header:hover {
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.03);
        }

        .sidebar-section-header.has-active {
          color: #a5b4fc;
        }

        .sidebar-section-icon {
          font-size: 0.85rem;
        }

        .sidebar-section-title {
          flex: 1;
        }

        .sidebar-section-chevron {
          font-size: 0.75rem;
          color: #475569;
        }

        .sidebar-section-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 2px;
          overflow: hidden;
          transition: all 0.2s ease-in-out;
        }

        .sidebar-section-content.closed {
          max-height: 0;
          opacity: 0;
          pointer-events: none;
        }

        .sidebar-section-content.open {
          max-height: 400px;
          opacity: 1;
        }

        /* Enlaces de navegación */
        .sidebar-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.68);
          text-decoration: none;
          font-size: 0.83rem;
          font-weight: 500;
          transition: all 0.15s ease;
          position: relative;
        }

        .sidebar-nav-link:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          transform: translateX(2px);
        }

        .sidebar-nav-link.active {
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.08) 100%);
          border-left: 3px solid #6366f1;
          color: #ffffff;
          font-weight: 700;
          padding-left: 9px;
        }

        .sidebar-nav-icon {
          font-size: 0.95rem;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-pulse-dot {
          width: 7px;
          height: 7px;
          background: #38bdf8;
          border-radius: 50%;
          box-shadow: 0 0 8px #38bdf8;
        }

        .sidebar-badge-count {
          background: #ef4444;
          color: white;
          font-size: 0.68rem;
          font-weight: 800;
          border-radius: 9999px;
          min-width: 17px;
          height: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        /* Footer con Cerrar Sesión */
        .sidebar-footer {
          flex-shrink: 0;
          padding: 10px 12px 14px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(8, 11, 20, 0.95);
        }

        .sidebar-logout-btn {
          width: 100%;
          padding: 9px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .sidebar-logout-btn:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.35);
        }

        /* Desktop */
        @media (min-width: 1025px) {
          .sidebar {
            transform: translateX(0) !important;
          }
          .sidebar-close-btn {
            display: none !important;
          }
        }

        /* Mobile */
        @media (max-width: 1024px) {
          .sidebar {
            width: min(285px, 86vw) !important;
            transform: translateX(-100%) !important;
          }
          .sidebar.show-mobile {
            transform: translateX(0) !important;
          }
          .sidebar-close-btn {
            display: flex !important;
          }
        }

        /* Light Mode Styles */
        [data-theme="light"] .sidebar {
          background: #ffffff !important;
          border-right-color: #e2e8f0 !important;
          box-shadow: 10px 0 30px rgba(0, 0, 0, 0.06) !important;
        }
        [data-theme="light"] .sidebar-header {
          background: #f8fafc !important;
          border-bottom-color: #e2e8f0 !important;
        }
        [data-theme="light"] .sidebar-user-card {
          background: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
        }
        [data-theme="light"] .sidebar-user-name {
          color: #0f172a !important;
        }
        [data-theme="light"] .sidebar-search-trigger {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #64748b !important;
        }
        [data-theme="light"] .sidebar-search-trigger:hover {
          border-color: #6366f1 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .sidebar-section-header {
          color: #64748b !important;
        }
        [data-theme="light"] .sidebar-nav-link {
          color: #475569 !important;
        }
        [data-theme="light"] .sidebar-nav-link:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .sidebar-nav-link.active {
          background: #eff6ff !important;
          border-left-color: #3b82f6 !important;
          color: #1d4ed8 !important;
        }
        [data-theme="light"] .sidebar-footer {
          background: #f8fafc !important;
          border-top-color: #e2e8f0 !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
