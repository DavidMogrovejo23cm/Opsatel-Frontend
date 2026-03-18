import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const menuItems = [
    { path: '/', label: 'Overview', icon: '📊' },
    { path: '/general', label: 'General', icon: '📋' },
    { path: '/ventas', label: 'Contrato', icon: '📝' },
    { path: '/tecnica', label: 'Tecnico', icon: '🔧' },
    { path: '/admin', label: 'Administración', icon: '💰' },
  ];

  return (
    <div className="sidebar glass" style={{ width: 'var(--sidebar-width)', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', padding: '24px', zIndex: 100 }}>
      <div className="logo" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          OPSATEL
        </h2>
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
        ))}
      </nav>

      <div className="footer" style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        v1.0.0
      </div>
    </div>
  );
};

export default Sidebar;
