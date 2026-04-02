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
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a, #020617)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '350px', height: '350px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '50%', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glass"
        style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}
      >
        <div style={{ marginBottom: '32px' }}>
          <img 
            src="/LOGO%20OPSATEL.png" 
            alt="OPSATEL Logo" 
            style={{ width: '120px', height: 'auto', marginBottom: '16px' }}
          />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-1px' }}>OPSATEL</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Ingresa a tu cuenta de gestión</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label className="label">Usuario</label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="admin / secretario / tecnico"
            />
          </div>
          <div className="input-group" style={{ textAlign: 'left', marginTop: '16px' }}>
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              marginTop: '16px',
              color: '#f87171',
              fontSize: '0.85rem',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '32px', height: '48px', fontSize: '1rem' }}
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={{ marginTop: '32px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          © 2026 OPSATEL SERVICIO PERSONALIZADO
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
