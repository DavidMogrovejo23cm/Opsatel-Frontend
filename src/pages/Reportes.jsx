import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Make sure this matches api.js

const Reportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await clienteService.getHistorialReportes();
      setReportes(response.data);
    } catch (error) {
      console.error("Error al cargar historial de reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerarReporte = async () => {
    const confirmacion = window.confirm(
      "⚠ ATENCIÓN: Esta acción generará un archivo Excel con el estado actual de los clientes " +
      "y dejará EN BLANCO los campos de recibos (app, banco, fechas, etc.).\n" +
      "NOTA: El 'Saldo' actual permanecerá INTACTO para arrastrar deudas pendientes o saldos a favor al próximo mes.\n\n" +
      "¿Estás seguro de que quieres realizar el CIERRE DE MES?"
    );

    if (!confirmacion) return;

    try {
      setIsGenerating(true);
      const response = await clienteService.generarReporte();
      alert(`✅ ¡Éxito! ${response.data.message}`);
      fetchData(); // Recargar la lista
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      alert("Ya se hizo el reporte este mes, no se puede hacer de nuevo");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: window.innerWidth <= 768 ? 'stretch' : 'flex-start',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <h1>Reportes y Cierre de Mes</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Aquí puedes generar el reporte en Excel
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerarReporte}
          disabled={isGenerating}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            borderColor: '#dc2626',
            fontWeight: 'bold',
            padding: '12px 24px',
            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
            height: 'fit-content'
          }}
        >
          {isGenerating ? 'Generando...' : '🚨 CIERRE DE MES'}
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px', marginTop: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Historial de Reportes Descargables</h2>

        {loading ? (
          <p>Cargando reportes...</p>
        ) : reportes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Aún no hay reportes generados.</p>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}># ID</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>Mes / Año</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>Fecha y Hora de Cierre</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map(reporte => (
                  <tr key={reporte.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>{reporte.id}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{reporte.mes_anio}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                      {new Date(reporte.fecha_generacion).toLocaleString('es-ES')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <a
                        href={`${API_BASE_URL}${reporte.archivo_ruta_excel}`}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}
                      >
                        ⬇ Descargar Excel
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Reportes;
