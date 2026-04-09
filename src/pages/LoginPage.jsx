import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-card"
      >
        {/* Left Side: Gradient and Shapes */}
        <div className="login-left">
          {/* Decorative diagonal shapes */}
          <div style={{
            position: 'absolute', top: '-50px', left: '-50px',
            width: '200px', height: '150%',
            background: 'rgba(255, 255, 255, 0.05)',
            transform: 'rotate(15deg)', zIndex: 1
          }} />
          <div style={{
            position: 'absolute', top: '0', left: '120px',
            width: '100px', height: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            transform: 'rotate(15deg)', zIndex: 1
          }} />

          <div style={{ zIndex: 2, position: 'relative' }}>
            <div style={{
              background: 'var(--primary)',
              padding: '12px 30px',
              borderRadius: '50px 0 0 50px',
              display: 'inline-block',
              marginLeft: 'auto',
              position: 'absolute',
              right: '-40px', top: '-20px',
              color: 'white', fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
              LOGIN
            </div>
          </div>

          <div style={{ zIndex: 2, color: 'white', marginTop: 'auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2' }}>
              Bienvenido a<br />OPSATEL
            </h2>
            <p style={{ marginTop: '20px', opacity: 0.6, maxWidth: '280px' }}>
              Sistema de gestión personalizado para servicios de ISP y telecomunicaciones.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-right">
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{
              width: '110px', height: '110px', borderRadius: '50%',
              overflow: 'hidden', margin: '0 auto 20px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <img
                src="/image%20copy.png"
                alt="OPSATEL Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '2px' }}>
              OPSATEL
            </h1>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '350px' }}>
            <div style={{ marginBottom: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0', bottom: '12px', color: 'var(--primary)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Usuario"
                style={{
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0', padding: '12px 12px 12px 35px',
                  color: 'white', fontSize: '1rem', outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0', bottom: '12px', color: 'var(--primary)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Contraseña"
                style={{
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0', padding: '12px 12px 12px 35px',
                  color: 'white', fontSize: '1rem', outline: 'none'
                }}
              />
            </div>

            {error && (
              <div style={{
                color: '#f87171', fontSize: '0.85rem', marginBottom: '20px',
                textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)',
                padding: '8px', borderRadius: '8px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn"
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 60px', borderRadius: '12px',
                  fontSize: '1rem', fontWeight: 'bold',
                  textTransform: 'uppercase', letterSpacing: '1px',
                  background: 'linear-gradient(45deg, var(--primary), var(--accent))',
                  color: 'white', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.4)',
                  border: 'none', cursor: 'pointer'
                }}
              >
                {loading ? 'Cargando...' : 'ENTRAR'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 'auto', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem' }}>
            © 2026 OPSATEL SERVICIO PERSONALIZADO
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
