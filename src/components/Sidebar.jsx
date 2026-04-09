import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const [pendientesCount, setPendientesCount] = React.useState(0);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Overview', icon: '📊', roles: ['administrador', 'secretario'] },
    { path: '/general', label: 'General', icon: '📋', roles: ['administrador', 'secretario', 'tecnico'] },
    { path: '/ventas', label: 'Contrato', icon: '📝', roles: ['administrador', 'secretario', 'tecnico'] },
    { path: '/tecnica', label: 'Tecnico', icon: '🔧', roles: ['administrador', 'tecnico', 'instalador'] },
    { path: '/hoja-ruta', label: 'Hoja de Ruta', icon: '🗓️', roles: ['administrador', 'tecnico'] },
    { path: '/admin', label: 'Pagos', icon: '💰', roles: ['administrador', 'secretario'] },
    { path: '/administrar', label: 'Administrar', icon: '⚙️', roles: ['administrador', 'secretario'] },
    { path: '/reportes', label: 'Reportes', icon: '📑', roles: ['administrador', 'secretario'] },
    { path: '/config', label: 'Configuración', icon: '🛠️', roles: ['administrador'] },
    { path: '/tickets', label: 'Tickets Dev', icon: '🎫', roles: ['administrador'] },
    { path: 'divider-1', type: 'divider', roles: ['administrador', 'secretario'] },
    { path: '/extras-general', label: 'Extras Gral', icon: '🌍', roles: ['administrador', 'secretario'] },
    { path: '/extras-pagos', label: 'Extra Pagos', icon: '💸', roles: ['administrador', 'secretario'] },
    { path: 'divider-2', type: 'divider', roles: ['administrador', 'tecnico'] },
  ];

  const filteredItems = menuItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.rol))
  );

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
          background: 'rgba(99, 102, 241, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08),'
          overflowY: 'auto',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Logo + close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
              <img
                src="/image%20copy.png"
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <h2 style={{
              fontSize: '1.15rem', fontWeight: 'bold', margin: 0,
              background: 'linear-gradient(to right, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              OPSATEL
            </h2>
          </div>
          {/* Close button — only visible when sidebar is open as drawer (mobile) */}
          <button
            onClick={() => setIsOpen(false)}
            className="sidebar-close-btn"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* User info */}
        <div style={{
          background: 'rgba(139,92,246,0.12)',
          padding: '12px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid rgba(139,92,246,0.2)'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sesión como:</div>
          <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginTop: '2px' }}>{user?.username}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500' }}>{user?.rol}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {filteredItems.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`div-${index}`} style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />;
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
                  background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.25)' : 'none',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  fontWeight: isActive ? '700' : '400',
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
