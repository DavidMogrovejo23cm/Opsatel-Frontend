import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Overview', icon: '📊', roles: ['administrador', 'secretario', 'tecnico'] },
    { path: '/general', label: 'General', icon: '📋', roles: ['administrador', 'secretario', 'tecnico'] },
    { path: '/ventas', label: 'Contrato', icon: '📝', roles: ['administrador', 'secretario', 'tecnico'] },
    { path: '/tecnica', label: 'Tecnico', icon: '🔧', roles: ['administrador', 'tecnico', 'instalador'] },

    { path: '/admin', label: 'Pagos', icon: '💰', roles: ['administrador', 'secretario'] },
    { path: '/administrar', label: 'Administrar', icon: '⚙️', roles: ['administrador', 'secretario'] },
    { path: '/reportes', label: 'Reportes', icon: '📑', roles: ['administrador', 'secretario'] },
    { path: '/config', label: 'Configuración', icon: '🛠️', roles: ['administrador'] },

    // Extras
    { path: '----', type: 'divider', roles: ['administrador', 'secretario'] },
    { path: '/extras-general', label: 'Extras Gral', icon: '🌍', roles: ['administrador', 'secretario'] },
    { path: '/extras-pagos', label: 'Extra Pagos', icon: '💸', roles: ['administrador', 'secretario'] },
    { path: '----', type: 'divider', roles: ['administrador', 'tecnico'] },
  ];

  // Filtrar items según el rol del usuario
  const filteredItems = menuItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.rol))
  );

  const sidebarStyle = {
    width: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    zIndex: 100,
    transition: 'transform 0.3s ease',
    background: 'rgba(2, 6, 23, 0.8)', // Darker background to match the dashboard
    backdropFilter: 'blur(30px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
  };

  return (
    <>
      <div className={`sidebar ${isOpen ? 'show-mobile' : ''}`} style={{
        ...sidebarStyle,
        width: '260px',
        transform: (window.innerWidth <= 1024 && !isOpen) ? 'translateX(-100%)' : 'translateX(0)',
        display: (window.innerWidth <= 1024 && !isOpen) ? 'none' : 'flex'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img
                src="/image%20copy.png"
                alt="Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scale(1.0)',
                  objectPosition: 'center'
                }}
              />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              OPSATEL
            </h2>
          </div>
          {window.innerWidth <= 1024 && (
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '12px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sesión como:</div>
          <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{user?.username}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500' }}>{user?.rol}</div>
        </div>

        <nav style={{ flex: 1 }}>
          {filteredItems.map((item) => {
            if (item.type === 'divider') {
              return <div key={item.path} style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth <= 1024) setIsOpen(false); }}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  transition: 'all 0.3s ease',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)'
                })}
              >
                <span>{item.icon}</span>
                <span style={{ fontWeight: 500 }}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 'auto',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '12px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar {
            position: fixed !important;
            transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            display: flex !important;
            width: 280px !important;
            z-index: 1000 !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
