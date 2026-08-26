import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>

      <div 
        className={`blur-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onRefresh={handleRefresh} />
      
      <main style={{ 
        marginLeft: 'var(--sidebar-width)', 
        padding: '36px 48px', 
        width: 'calc(100% - var(--sidebar-width))',
        minHeight: '100vh',
        background: 'transparent',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          <Outlet key={refreshKey} />
        </div>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          main {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 24px 20px !important;
            padding-top: 76px !important;
          }
        }
        @media (max-width: 480px) {
          main {
            padding: 16px 12px !important;
            padding-top: 70px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
