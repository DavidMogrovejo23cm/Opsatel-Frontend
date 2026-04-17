import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const ONT = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await clienteService.listar();
        const allClients = response.data;
        
        // Calcular fechas para los últimos 2 días
        const today = new Date();
        const datesToShow = [];
        for (let i = 0; i < 3; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          datesToShow.push(d.toISOString().split('T')[0]);
        }

        const filtered = allClients.filter(c => 
          c.estado?.toUpperCase() === 'ACTIVO' && 
          c.instalation_date && 
          datesToShow.includes(c.instalation_date)
        ).sort((a, b) => a.id - b.id); // Orden ascendente por ID

        setClientes(filtered);
        setFilteredClientes(filtered);
      } catch (error) {
        console.error("Error fetching ONT data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const results = clientes.filter(c => 
      c.nombre.toLowerCase().includes(search.toLowerCase()) || 
      c.id.toString().includes(search)
    );
    // Ordenar explícitamente por ID ascendente (menor a mayor)
    results.sort((a, b) => a.id - b.id);
    setFilteredClientes(results);
  }, [search, clientes]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="glass-card glass"
      style={{ minHeight: '80vh' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '8px' }}>Activaciones Recientes (ONT)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Muestra los comandos de configuración de los clientes activados en los últimos 2 días.</p>
        </div>
        <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre o ID..." 
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 20px', borderRadius: '14px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</div>
      ) : filteredClientes.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '20px',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📡</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No hay activaciones recientes en las últimas 48 horas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {filteredClientes.map(c => (
            <motion.div 
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass"
              style={{
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(30, 41, 59, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    marginBottom: '4px'
                  }}>
                    ID: {c.id}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{c.nombre}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    📅 Activado: {c.instalation_date} | 📍 {c.nodo}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {/* ONT COMMAND */}
                <div className="command-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#818cf8', textTransform: 'uppercase' }}>Comando ONT</label>
                    <button 
                      onClick={() => copyToClipboard(c.ont, 'Comando ONT')}
                      style={{ background: 'rgba(129, 140, 248, 0.15)', border: '1px solid rgba(129, 140, 248, 0.3)', color: '#a5b4fc', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Copiar
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {c.ont || 'N/A'}
                  </pre>
                </div>

                {/* SERVICE COMMAND */}
                <div className="command-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#34d399', textTransform: 'uppercase' }}>Comando Servicio</label>
                    <button 
                      onClick={() => copyToClipboard(c.servicio, 'Comando Servicio')}
                      style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#6ee7b7', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Copiar
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {c.servicio || 'N/A'}
                  </pre>
                </div>

                {/* BRIDGE COMMAND (only if explicitely present and not empty) */}
                {c.breach && c.breach.trim().length > 0 && c.breach.toUpperCase() !== 'NONE' && (
                  <div className="command-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fb923c', textTransform: 'uppercase' }}>Comando Bridge</label>
                      <button 
                        onClick={() => copyToClipboard(c.breach, 'Comando Bridge')}
                        style={{ background: 'rgba(251, 146, 60, 0.15)', border: '1px solid rgba(251, 146, 60, 0.3)', color: '#fdba74', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Copiar
                      </button>
                    </div>
                    <pre style={{ margin: 0, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {c.breach}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ONT;
