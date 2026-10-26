/**
 * @file Sidebar.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const Sidebar = ({ isOpen, setIsOpen, onRefresh }) => {
  const { user, logout } = useAuth();
  const [pendientesCount, setPendientesCount] = React.useState(0);
  const navigate = useNavigate();

  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('opsatel_theme') || 'dark';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opsatel_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await clienteService.getPendientesCount();
        setPendientesCount(res.data.count);
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
      setPendientesCount(res.data.count);
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

  const menuItems = [
    { path: '/', label: 'Overview', icon: '📊', roles: ['administrador'] },
    { path: '/general', label: 'General', icon: '📋', roles: ['administrador'] },
    { path: '/ventas', label: 'Contrato', icon: '📝', roles: ['administrador', 'secretario'] },
    { path: '/hoja-ruta', label: 'Hoja de Ruta', icon: '🗓️', roles: ['administrador', 'tecnico'] },
    { path: '/activacion', label: 'Activación', icon: '⚡', roles: ['administrador', 'tecnico', 'instalador'] },
    { path: '/tecdt', label: 'TECdt', icon: '🛠️', roles: ['tecnico'] },
    { path: '/admin', label: 'Pagos', icon: '💰', roles: ['administrador'] },
    { path: '/administrar', label: 'Administrar', icon: '⚙️', roles: ['administrador', 'tecnico'] },
    { path: '/call-center', label: 'Call Center', icon: '📞', roles: ['administrador'] },
    { path: '/balance', label: 'Balance', icon: '📒', roles: ['administrador'] },
    { path: '/config', label: 'Configuración', icon: '🛠️', roles: ['administrador'] },
    { path: '/whatsapp', label: 'WhatsApp', icon: '📱', roles: ['administrador', 'secretario'] },
    { path: '/tickets', label: 'Tickets Dev', icon: '🎫', roles: ['administrador'] },
    { path: 'divider-1', type: 'divider', roles: ['administrador', 'secretario'] },
    { path: '/extras-general', label: 'Extras Gral', icon: '🌍', roles: ['administrador'] },
    { path: '/extras-pagos', label: 'Extra Pagos', icon: '💸', roles: ['administrador'] },
    { path: '/asistencia', label: 'Asistencia', icon: '⏰', roles: ['administrador', 'secretario', 'tecnico', 'instalador'] },
    { path: 'divider-2', type: 'divider', roles: ['administrador', 'tecnico'] },
    { path: '/upload-db', label: 'Base de Datos', icon: '📂', roles: ['administrador'] },
    { path: '/eliminados', label: 'Eliminados', icon: '🗑️', roles: ['administrador'] },
    { path: 'divider-2', type: 'divider', roles: ['administrador', 'tecnico'] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.path === '/general') {
      return user && (user.rol === 'administrador' || user.acceso_general_sin_clave);
    }
    return !item.roles || (user && item.roles.includes(user.rol));
  });

  return (
    <>
      {/* Sidebar — always rendered, CSS controls visibility via .show-mobile */}
      <aside
        className={`sidebar${isOpen ? ' show-mobile' : ''}`}
        aria-label="Sidebar Navigation"
      >
        {/* HEADER: SIEMPRE VISIBLE EN LA PARTE SUPERIOR (FIJO) */}
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
              <span className="sidebar-version">SISTEMA</span>
            </div>
            <div className="sidebar-quick-actions">
              <motion.button
                onClick={handleRefreshClick}
                title="Actualizar datos"
                className="sidebar-icon-btn"
                whileHover={{ scale: 1.15, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                🔄
              </motion.button>
              <motion.button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                className="sidebar-icon-btn"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </motion.button>
            </div>

            {/* BOTÓN CERRAR (MÓVIL) - Visible, táctil y fácil de pulsar */}
            <button
              onClick={() => setIsOpen(false)}
              className="sidebar-close-btn"
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          {/* User info card */}
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
        </div>

        {/* NAVEGACIÓN: SCROLL NATIVO ULTRA FLUIDO CON TOUCH PERFECTO */}
        <nav className="sidebar-nav-scroll">
          {filteredItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`div-${index}`} className="sidebar-divider" />;
            }
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
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="sidebar-pulse-dot"
                  />
                )}
                {item.path === '/hoja-ruta' && pendientesCount > 0 && (
                  <span className="sidebar-badge-count">
                    {pendientesCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* FOOTER: CERRAR SESIÓN */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
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
          background: #0d121f;
          background: linear-gradient(180deg, #101626 0%, #0a0d17 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow: 10px 0 40px rgba(0, 0, 0, 0.6);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          overflow: hidden !important;
          touch-action: pan-y;
          overscroll-behavior: contain;
        }

        /* Header fijo arriba */
        .sidebar-header {
          flex-shrink: 0;
          padding: 18px 16px 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(16, 22, 38, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .sidebar-brand-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .sidebar-logo-container {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
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
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.15;
        }

        .sidebar-version {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .sidebar-quick-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sidebar-icon-btn {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-main);
          padding: 0;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .sidebar-icon-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .sidebar-close-btn {
          display: none;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 700;
          margin-left: 4px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .sidebar-close-btn:active {
          transform: scale(0.92);
          background: rgba(239, 68, 68, 0.25);
        }

        /* User Card */
        .sidebar-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .sidebar-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(236, 72, 153, 0.35) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
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
          font-size: 0.82rem;
          font-weight: 700;
          color: #f1f5f9;
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .sidebar-user-role {
          font-size: 0.68rem;
          font-weight: 600;
          color: #818cf8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 1px;
        }

        .sidebar-user-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
          flex-shrink: 0;
        }

        /* Contenedor central con scroll táctil suave */
        .sidebar-nav-scroll {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
          overscroll-behavior-y: contain !important;
          padding: 10px 12px;
        }

        .sidebar-nav-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          margin-bottom: 3px;
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          transition: all 0.18s ease;
          touch-action: pan-y;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .sidebar-nav-link:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #ffffff;
          transform: translateX(2px);
        }

        .sidebar-nav-link:active {
          transform: scale(0.98);
        }

        .sidebar-nav-link.active {
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.14) 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.18);
        }

        .sidebar-nav-icon {
          font-size: 1.05rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
        }

        .sidebar-nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 8px 4px;
        }

        .sidebar-pulse-dot {
          width: 8px;
          height: 8px;
          background: #f87171;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(248, 113, 113, 0.8);
          flex-shrink: 0;
        }

        .sidebar-badge-count {
          background: #ef4444;
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          border-radius: 9999px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
          flex-shrink: 0;
        }

        /* Footer fijo abajo */
        .sidebar-footer {
          flex-shrink: 0;
          padding: 10px 14px 16px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(10, 13, 23, 0.95);
        }

        .sidebar-logout-btn {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .sidebar-logout-btn:hover {
          background: rgba(239, 68, 68, 0.16);
          border-color: rgba(239, 68, 68, 0.4);
        }

        .sidebar-logout-btn:active {
          transform: scale(0.98);
        }

        /* Desktop: visible siempre */
        @media (min-width: 1025px) {
          .sidebar {
            transform: translateX(0) !important;
          }
          .sidebar-close-btn {
            display: none !important;
          }
        }

        /* Tablet/Mobile Drawer */
        @media (max-width: 1024px) {
          .sidebar {
            width: min(295px, 84vw) !important;
            transform: translateX(-100%) !important;
            box-shadow: 15px 0 50px rgba(0, 0, 0, 0.7) !important;
          }
          .sidebar.show-mobile {
            transform: translateX(0) !important;
          }
          .sidebar-close-btn {
            display: flex !important;
          }
        }

        /* Light Mode Overrides */
        [data-theme="light"] .sidebar {
          background: #ffffff !important;
          border-right-color: rgba(0, 0, 0, 0.08) !important;
          box-shadow: 10px 0 40px rgba(0, 0, 0, 0.15) !important;
        }
        [data-theme="light"] .sidebar-header {
          background: rgba(248, 250, 252, 0.95) !important;
          border-bottom-color: rgba(0, 0, 0, 0.06) !important;
        }
        [data-theme="light"] .sidebar-user-card {
          background: rgba(0, 0, 0, 0.03) !important;
          border-color: rgba(0, 0, 0, 0.06) !important;
        }
        [data-theme="light"] .sidebar-user-name {
          color: #0f172a !important;
        }
        [data-theme="light"] .sidebar-nav-link {
          color: #475569 !important;
        }
        [data-theme="light"] .sidebar-nav-link:hover {
          background: rgba(0, 0, 0, 0.04) !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .sidebar-nav-link.active {
          background: rgba(99, 102, 241, 0.12) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
          color: #4338ca !important;
        }
        [data-theme="light"] .sidebar-footer {
          background: rgba(248, 250, 252, 0.95) !important;
          border-top-color: rgba(0, 0, 0, 0.06) !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
