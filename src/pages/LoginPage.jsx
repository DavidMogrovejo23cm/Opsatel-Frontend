import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #1a0b3e 40%, #0d1b4b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Outfit', sans-serif",
    }}>

      {/* Glow orbs decorativos */}
      <div style={{
        position: 'absolute', top: '-120px', left: '-120px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', right: '-80px',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '50%', right: '10%',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', transform: 'translateY(-50%)'
      }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '420px',
          margin: '20px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '28px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)',
          overflow: 'hidden',
          padding: '0',
        }}
      >
        {/* Header top accent bar */}
        <div style={{
          height: '3px',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
        }} />

        <div style={{ padding: '44px 36px 36px' }}>
          {/* Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                width: '90px', height: '90px',
                borderRadius: '50%', overflow: 'hidden',
                margin: '0 auto 18px',
                border: '2px solid rgba(139,92,246,0.4)',
                boxShadow: '0 0 30px rgba(139,92,246,0.3), 0 8px 24px rgba(0,0,0,0.4)',
                background: 'rgba(139,92,246,0.08)',
              }}
            >
              <img
                src="/image%20copy.png"
                alt="OPSATEL"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
            <h1 style={{
              fontSize: '1.9rem', fontWeight: '900', color: 'white',
              letterSpacing: '3px', margin: 0,
              background: 'linear-gradient(135deg, #e0d7ff, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              OPSATEL
            </h1>
            <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.8rem', marginTop: '6px', letterSpacing: '0.5px' }}>
              Sistema de Gestión ISP
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Usuario */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block', fontSize: '0.72rem', fontWeight: '700',
                letterSpacing: '0.08em', color: '#a78bfa', textTransform: 'uppercase',
                marginBottom: '8px'
              }}>Usuario</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#7c3aed', display: 'flex', alignItems: 'center'
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  style={{
                    width: '100%', background: 'rgba(139,92,246,0.07)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '14px', padding: '13px 16px 13px 42px',
                    color: 'white', fontSize: '0.95rem', outline: 'none',
                    transition: 'all 0.25s', fontFamily: 'Outfit, sans-serif',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.background = 'rgba(139,92,246,0.12)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.3)'; e.target.style.background = 'rgba(139,92,246,0.07)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', fontSize: '0.72rem', fontWeight: '700',
                letterSpacing: '0.08em', color: '#a78bfa', textTransform: 'uppercase',
                marginBottom: '8px'
              }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#7c3aed', display: 'flex', alignItems: 'center'
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  style={{
                    width: '100%', background: 'rgba(139,92,246,0.07)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '14px', padding: '13px 44px 13px 42px',
                    color: 'white', fontSize: '0.95rem', outline: 'none',
                    transition: 'all 0.25s', fontFamily: 'Outfit, sans-serif',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.background = 'rgba(139,92,246,0.12)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.3)'; e.target.style.background = 'rgba(139,92,246,0.07)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(148,163,184,0.6)', fontSize: '1rem', padding: '0', display: 'flex'
                  }}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px', padding: '10px 14px',
                  color: '#f87171', fontSize: '0.85rem', marginBottom: '18px', textAlign: 'center'
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading
                  ? 'rgba(139,92,246,0.4)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)',
                border: 'none', borderRadius: '14px',
                color: 'white', fontSize: '1rem', fontWeight: '700',
                letterSpacing: '1.5px', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.4)',
                transition: 'all 0.3s', fontFamily: 'Outfit, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    display: 'inline-block', width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite'
                  }} />
                  Verificando...
                </>
              ) : '🔐 Ingresar'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', color: 'rgba(148,163,184,0.4)', fontSize: '0.72rem' }}>
            © 2026 OPSATEL · Servicio Personalizado
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(148,163,184,0.45); }
      `}</style>
    </div>
  );
};

export default LoginPage;
