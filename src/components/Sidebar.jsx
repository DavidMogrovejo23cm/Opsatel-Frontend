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
    { path: '/ventas', label: 'Contrato', icon: '📝', roles: ['administrador'] },
    { path: '/hoja-ruta', label: 'Hoja de Ruta', icon: '🗓️', roles: ['administrador', 'tecnico'] },
    { path: '/activacion', label: 'Activación', icon: '⚡', roles: ['administrador', 'tecnico', 'instalador'] },
    { path: '/admin', label: 'Pagos', icon: '💰', roles: ['administrador'] },
    { path: '/administrar', label: 'Administrar', icon: '⚙️', roles: ['administrador', 'tecnico'] },
    { path: '/call-center', label: 'Call Center', icon: '📞', roles: ['administrador'] },
    { path: '/balance', label: 'Balance', icon: '📒', roles: ['administrador'] },
    { path: '/config', label: 'Configuración', icon: '🛠️', roles: ['administrador'] },
    { path: '/whatsapp', label: 'WhatsApp', icon: '📱', roles: ['administrador'] },
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
      <div
        className={`sidebar${isOpen ? ' show-mobile' : ''}`}
        style={{
          width: '260px',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          zIndex: 150,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflowY: 'auto',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Logo + close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
              <img
                src="/image%20copy.png"
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <h2 style={{
              fontSize: '1.05rem', fontWeight: 'bold', margin: 0,
              background: 'linear-gradient(to right, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              OPSATEL
            </h2>
            <motion.button
              onClick={handleRefreshClick}
              title="Actualizar datos"
              whileHover={{ scale: 1.15, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-main)',
                marginLeft: '4px',
                padding: 0,
                fontSize: '0.78rem',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              🔄
            </motion.button>
            <motion.button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-main)',
                marginLeft: '2px',
                padding: 0,
                fontSize: '0.78rem',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.button>
          </div>
          {/* Close button — only visible when sidebar is open as drawer (mobile) */}
          <button
            onClick={() => setIsOpen(false)}
            className="sidebar-close-btn"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted, rgba(255,255,255,0.6))', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* User info */}
        <div style={{
          background: 'var(--user-info-bg, rgba(139,92,246,0.12))',
          padding: '12px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid var(--user-info-border, rgba(139,92,246,0.2))'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sesión como:</div>
          <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginTop: '2px', color: 'var(--text-main)' }}>{user?.username}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>{user?.rol}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {filteredItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`div-${index}`} style={{ height: '1px', background: 'var(--glass-border, rgba(255,255,255,0.05))', margin: '12px 0' }} />;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  marginBottom: '4px',
                  transition: 'all 0.25s ease',
                  background: isActive ? 'var(--sidebar-active-bg, rgba(255,255,255,0.18))' : 'transparent',
                  border: isActive ? '1px solid var(--sidebar-active-border, rgba(255,255,255,0.25))' : 'none',
                  color: isActive ? 'var(--sidebar-active-color, #ffffff)' : 'var(--sidebar-text-color, rgba(255,255,255,0.75))',
                  fontWeight: isActive ? '700' : '500',
                  textDecoration: 'none',
                })}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{item.label}</span>
                {item.path === '/tecnica' && pendientesCount > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      width: '8px', height: '8px',
                      background: '#f87171', borderRadius: '50%',
                      boxShadow: '0 0 8px rgba(248,113,113,0.8)',
                      flexShrink: 0
                    }}
                  />
                )}
                {item.path === '/hoja-ruta' && pendientesCount > 0 && (
                  <span
                    style={{
                      background: '#f87171',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      boxShadow: '0 0 8px rgba(248,113,113,0.8)',
                      flexShrink: 0
                    }}
                  >
                    {pendientesCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: '16px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171',
            padding: '11px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '0.9rem',
            transition: 'background 0.2s',
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>

      <style>{`
        /* Desktop: sidebar always visible */
        @media (min-width: 1025px) {
          .sidebar {
            transform: translateX(0) !important;
          }
          .sidebar-close-btn {
            display: none;
          }
        }
        /* Tablet/mobile: sidebar hidden by default, shown when .show-mobile */
        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%) !important;
          }
          .sidebar.show-mobile {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
