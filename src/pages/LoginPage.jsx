/**
 * @file LoginPage.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Ambient background glow behind the card */}
      <div className="login-bg-glow" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="login-card-container"
      >
        {/* 3D Mascot Peeking around the top-left edge (Desktop Only) */}
        <div className="login-mascot-wrapper">
          <img
            src="/mascot-peeking-hq.png"
            alt="Mascota OPSATEL"
            className="login-mascot-img"
          />
        </div>

        {/* Mobile Header (Fiel a la referencia: Logo + ¡Bienvenido! + Mascota asomándose arriba a la derecha) */}
        <div className="login-mobile-header">
          <div className="login-mobile-header-left">
            <div className="login-mobile-logo-row">
              <img
                src="/opsatel-sphere-logo.png"
                alt="OPSATEL"
                className="login-mobile-sphere-logo"
              />
              <span className="login-mobile-brand-name">OPSATEL</span>
            </div>
            <h2 className="login-mobile-welcome-title">¡Bienvenido!</h2>
            <p className="login-mobile-welcome-subtitle">
              Inicia sesión para continuar en tu cuenta.
            </p>
          </div>

          <div className="login-mobile-mascot-wrapper">
            <img
              src="/mascot-mobile-peeking.png"
              alt="Mascota OPSATEL"
              className="login-mobile-mascot-img"
            />
          </div>
        </div>

        <div className="login-card">
          {/* Left Panel: Deep Purple Gradient & Welcome Text (Desktop Only) */}
          <div className="login-left">
            {/* Soft decorative diagonal stripes */}
            <div className="login-diagonal-stripe stripe-1" />
            <div className="login-diagonal-stripe stripe-2" />

            {/* Pill Badge top-right */}
            <div className="login-pill-badge">
              LOGIN
            </div>

            {/* Welcome Typography */}
            <div className="login-left-content">
              <h2 className="login-welcome-title">
                Bienvenido a<br />
                <span className="login-opsatel-highlight">OPSATEL</span>
              </h2>
              <p className="login-welcome-desc">
                Sistema de gestión personalizada para servicios de ISP y telecomunicaciones.
              </p>
            </div>
          </div>

          {/* Right Panel: Form and Logo */}
          <div className="login-right">
            <div className="login-brand-header">
              <div className="login-sphere-logo-container">
                <img
                  src="/opsatel-sphere-logo.png"
                  alt="OPSATEL"
                  className="login-sphere-logo"
                />
              </div>
              <h1 className="login-brand-title">OPSATEL</h1>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-input-group">
                <span className="login-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Usuario"
                  className="login-clean-input"
                  autoComplete="username"
                />
              </div>

              <div className="login-input-group">
                <span className="login-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Contraseña"
                  className="login-clean-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <div className="login-error-alert">
                  {error}
                </div>
              )}

              <div className="login-btn-container">
                <button
                  type="submit"
                  disabled={loading}
                  className="login-submit-btn"
                >
                  {loading ? 'Cargando...' : 'ENTRAR'}
                </button>
              </div>
            </form>

            <div className="login-footer-copy">
              © 2026 OPSATEL SERVICIO PERSONALIZADO
            </div>
          </div>
        </div>

        {/* Mobile Footer Decorativo (Fiel a la referencia: SIEMPRE CONTIGO con línea de resplandor) */}
        <div className="login-mobile-footer-brand">
          <div className="login-mobile-neon-curve" />
          <div className="login-mobile-tagline">
            <span className="login-tagline-line" />
            <span className="login-tagline-text">SIEMPRE CONTIGO</span>
            <span className="login-tagline-line" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
