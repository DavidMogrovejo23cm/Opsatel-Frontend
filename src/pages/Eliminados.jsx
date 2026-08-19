import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const Eliminados = () => {
  const [eliminados, setEliminados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchEliminados = async () => {
    try {
      const response = await clienteService.listarEliminados();
      setEliminados(response.data);
    } catch (error) {
      console.error('Error al cargar historial de eliminados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEliminados();
  }, []);

  const filtered = eliminados.filter(item => {
    return (
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cedula?.includes(searchTerm) ||
      item.cliente_id?.toString().includes(searchTerm) ||
      item.ip?.includes(searchTerm)
    );
  });

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'ELIMINADO' || s === 'OK') {
      return <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ OK</span>;
    }
    if (s === 'OMITIDO') {
      return <span style={{ color: '#94a3b8' }}>⚪ Omitido</span>;
    }
    if (s === 'ERROR') {
      return <span style={{ color: '#f87171', fontWeight: 'bold' }}>❌ Error</span>;
    }
    return <span style={{ color: '#fbbf24' }}>⏳ {status}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Historial de Clientes Eliminados</h1>
          <p>Consulta la bitácora de auditoría y fotografías de los clientes eliminados de la infraestructura.</p>
        </div>
        <div className="page-actions">
          <input
            className="input"
            placeholder="Buscar por ID original, nombre, cédula o IP..."
            style={{ marginBottom: 0, width: '320px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Cargando bitácora de auditoría...</p>
      ) : (
        <div className="table-container" style={{ maxHeight: '72vh', overflow: 'auto', width: '100%' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>ID Orig.</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Cédula</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Plan</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>IP</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>OLT</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>MikroTik</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>IPTV</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>QoS</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Fecha Eliminación</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Eliminado por</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron registros de clientes eliminados.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.cliente_id}</td>
                    <td style={{ padding: '12px' }}>{item.nombre}</td>
                    <td style={{ padding: '12px' }}>{item.cedula || '-'}</td>
                    <td style={{ padding: '12px' }}>{item.plan || '-'}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{item.ip || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(item.estado_olt)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(item.estado_mikrotik)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(item.estado_xui)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(item.estado_libreqos)}</td>
                    <td style={{ padding: '12px' }}>{new Date(item.deleted_at).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: '0.75rem' }}>
                        {item.deleted_by}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => setSelectedRecord(item)}
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedRecord && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass"
            style={{ width: '100%', maxWidth: '650px', padding: '32px', borderRadius: '24px', textAlign: 'left', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <h3 style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Ficha Completa de Cliente Eliminado</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID Original: {selectedRecord.cliente_id}</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', fontSize: '0.85rem' }}>
              <div>
                <p><strong>Nombre:</strong> {selectedRecord.nombre}</p>
                <p><strong>Cédula:</strong> {selectedRecord.cedula || '-'}</p>
                <p><strong>Plan:</strong> {selectedRecord.plan || '-'}</p>
                <p><strong>IP:</strong> {selectedRecord.ip || '-'}</p>
                <p><strong>MAC:</strong> {selectedRecord.mac || '-'}</p>
              </div>
              <div>
                <p><strong>Fecha Borrado:</strong> {new Date(selectedRecord.deleted_at).toLocaleString()}</p>
                <p><strong>Eliminado por:</strong> {selectedRecord.deleted_by}</p>
                <p><strong>Estado OLT:</strong> {selectedRecord.estado_olt}</p>
                <p><strong>Estado MikroTik:</strong> {selectedRecord.estado_mikrotik}</p>
                <p><strong>Estado XUI:</strong> {selectedRecord.estado_xui}</p>
                <p><strong>Estado LibreQoS:</strong> {selectedRecord.estado_libreqos}</p>
              </div>
            </div>

            {selectedRecord.detalles_error && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '8px' }}>Errores o Advertencias del Borrado:</h4>
                <pre style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f87171',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedRecord.detalles_error}
                </pre>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Fotografía de Datos original (Snapshot JSON):</h4>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <pre style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#a5b4fc', margin: 0 }}>
                  {JSON.stringify(selectedRecord.datos_cliente, null, 2)}
                </pre>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
              onClick={() => setSelectedRecord(null)}
            >
              Cerrar Ficha
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Eliminados;
