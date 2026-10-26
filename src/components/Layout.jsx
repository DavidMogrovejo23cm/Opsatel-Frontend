/**
 * @file Layout.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();
  const pageKey = (location.pathname.split('/')[1] || 'overview').toLowerCase();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="layout-root" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>

      <div 
        className={`blur-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onRefresh={handleRefresh} />
      
      <main data-page={pageKey} className="app-main-layout">
        <div className="main-content-container">
          <Outlet key={refreshKey} />
        </div>
      </main>

      <style>{`
        .layout-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        .app-main-layout {
          margin-left: var(--sidebar-width);
          width: calc(100% - var(--sidebar-width));
          min-height: 100vh;
          background: transparent;
          transition: all 0.3s ease;
          padding: 32px 36px;
          box-sizing: border-box;
        }

        .main-content-container {
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* 1440px en adelante: contenedores centrados de 1140px a 1200px */
        @media (min-width: 1440px) {
          .main-content-container {
            max-width: 1200px;
          }
        }

        /* 1024px a 1366px: escritorios pequeños / portátiles */
        @media (min-width: 1025px) and (max-width: 1439px) {
          .app-main-layout {
            padding: 24px 28px;
          }
          .main-content-container {
            max-width: 1140px;
          }
        }

        /* Tabletas y móvil: <= 1024px */
        @media (max-width: 1024px) {
          .app-main-layout {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 20px 16px !important;
            padding-top: 76px !important;
          }
          .main-content-container {
            max-width: 100% !important;
          }
        }

        /* Smartphones estándar / móviles grandes: <= 480px */
        @media (max-width: 480px) {
          .app-main-layout {
            padding: 14px 10px !important;
            padding-top: 70px !important;
          }
        }

        /* Móviles pequeños: <= 359px (ej. 320px) */
        @media (max-width: 359px) {
          .app-main-layout {
            padding: 10px 6px !important;
            padding-top: 66px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
