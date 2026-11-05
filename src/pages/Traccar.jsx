/**
 * @file Traccar.jsx
 * @description Vista para el monitoreo en tiempo real de vehículos y personal mediante Traccar GPS.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const TRACCAR_URL = 'https://optimus.optimusecuador.us.ci/optimus/traccar/traccar.php';

const Traccar = () => {
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Detectar cambios en el modo de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const handleOpenExternal = () => {
    window.open(TRACCAR_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      ref={containerRef}
      className={`traccar-page-container ${isFullscreen ? 'fullscreen-mode' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Barra de control superior */}
      <div className="traccar-header-bar">
        <div className="traccar-title-group">
          <div className="traccar-icon-wrapper">
            <span className="traccar-icon">🛰️</span>
          </div>
          <div>
            <h2 className="traccar-title">Monitoreo GPS</h2>
            <p className="traccar-subtitle">Seguimiento y telemetría en tiempo real</p>
          </div>
          <div className="traccar-live-badge">
            <span className="pulse-dot"></span>
            <span>EN VIVO</span>
          </div>
        </div>

        <div className="traccar-actions">
          <button
            type="button"
            className="traccar-btn refresh"
            onClick={handleRefresh}
            title="Recargar vista de rastreo"
          >
            <span className="btn-icon">🔄</span>
            <span className="btn-label">Recargar</span>
          </button>

          <button
            type="button"
            className="traccar-btn fullscreen"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            <span className="btn-icon">{isFullscreen ? '🗗' : '⛶'}</span>
            <span className="btn-label">{isFullscreen ? 'Salir Fullscreen' : 'Pantalla Completa'}</span>
          </button>


        </div>
      </div>

      {/* Contenedor del Iframe con indicador de carga */}
      <div className="traccar-frame-wrapper">
        {loading && (
          <div className="traccar-loader-overlay">
            <div className="traccar-spinner"></div>
            <p className="traccar-loader-text">Conectando con servidor de rastreo Traccar...</p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={TRACCAR_URL}
          title="Monitoreo GPS Traccar en Tiempo Real"
          className="traccar-iframe"
          onLoad={() => setLoading(false)}
          allow="geolocation *; autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>

      <style>{`
        .traccar-page-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 16px;
          height: calc(100vh - 120px);
          min-height: 600px;
          box-sizing: border-box;
        }

        .traccar-page-container.fullscreen-mode {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          z-index: 99999;
          background: #09131d;
          padding: 12px;
          gap: 10px;
        }

        .traccar-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: var(--bg-card, rgba(16, 26, 38, 0.75));
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          flex-wrap: wrap;
          gap: 12px;
        }

        .traccar-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .traccar-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2));
          border: 1px solid rgba(6, 182, 212, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .traccar-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary, #f1f5f9);
          margin: 0;
          line-height: 1.2;
        }

        .traccar-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted, #94a3b8);
          margin: 2px 0 0 0;
        }

        .traccar-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-left: 8px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: traccar-pulse 1.8s infinite;
        }

        @keyframes traccar-pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .traccar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .traccar-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          background: var(--bg-hover, rgba(255, 255, 255, 0.05));
          color: var(--text-primary, #e2e8f0);
        }

        .traccar-btn:hover {
          background: var(--bg-active, rgba(255, 255, 255, 0.12));
          transform: translateY(-1px);
        }

        .traccar-btn.refresh:hover {
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.4);
        }

        .traccar-btn.fullscreen:hover {
          color: #a855f7;
          border-color: rgba(168, 85, 247, 0.4);
        }

        .traccar-btn.external:hover {
          color: #34d399;
          border-color: rgba(52, 211, 153, 0.4);
        }

        .btn-icon {
          font-size: 1rem;
          line-height: 1;
        }

        /* Iframe wrapper */
        .traccar-frame-wrapper {
          position: relative;
          flex: 1;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #06111d;
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
          display: flex;
        }

        .traccar-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          background: transparent;
        }

        .traccar-loader-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: rgba(8, 20, 33, 0.92);
          backdrop-filter: blur(4px);
          z-index: 10;
        }

        .traccar-spinner {
          width: 42px;
          height: 42px;
          border: 3px solid rgba(6, 182, 212, 0.2);
          border-top-color: #06b6d4;
          border-radius: 50%;
          animation: traccar-spin 0.9s linear infinite;
        }

        @keyframes traccar-spin {
          to { transform: rotate(360deg); }
        }

        .traccar-loader-text {
          font-size: 0.9rem;
          color: #94a3b8;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .traccar-page-container {
            height: calc(100vh - 100px);
            gap: 10px;
          }

          .traccar-header-bar {
            padding: 10px 14px;
          }

          .btn-label {
            display: none;
          }

          .traccar-btn {
            padding: 8px 10px;
          }

          .traccar-live-badge {
            display: none;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Traccar;

