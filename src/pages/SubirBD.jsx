import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clienteService } from '../services/api';
import { showAlert, showSuccess, showError, showWarning } from '../utils/alerts';

const SubirBD = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showWarning('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await clienteService.uploadDatabase(formData);
      showSuccess(resp.data?.message || 'Base de datos subida exitosamente');
      setFile(null);
      // Reset input
      const fileInput = document.getElementById('bd-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || 'Error al subir la base de datos';
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await clienteService.downloadDatabase();
      
      // Crear blob y forzar descarga del archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Base_Datos_Completa_Opsatel_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      showError('Error al descargar la base de datos. Asegúrese de que el backend local esté activo.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="page-container"
      style={{ padding: '24px', color: '#fff', minHeight: '100vh', background: 'var(--bg-main)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, letterSpacing: '-0.5px' }}>
          Gestión de Base de Datos
        </h1>
        <span style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          MANTENIMIENTO
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '32px',
        maxWidth: '1100px',
        margin: '0 auto'
      }}>
        
        {/* CARD 1: EXPORTACIÓN (DESCARGA) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.8rem' }}>📥</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Exportar Base de Datos</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', lineHeight: '1.6' }}>
              Descarga un respaldo completo y unificado de toda la información almacenada en el sistema.
              El archivo Excel generado contendrá pestañas individuales para:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.6)', paddingLeft: '20px', marginBottom: '32px', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <li>Clientes y Saldos</li>
              <li>Historial de Pagos y Egresos</li>
              <li>Configuración de Nodos, Puertos y Planes</li>
              <li>Historial de WhatsApp y Asistencias del Personal</li>
              <li>Proyectos y Gastos consolidados</li>
            </ul>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: downloading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            {downloading ? (
              <span style={{ display: 'inline-block', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}></span>
            ) : (
              <>
                <span>💾</span> Descargar Base de Datos Completa (.xlsx)
              </>
            )}
          </button>
        </div>

        {/* CARD 2: IMPORTACIÓN (SUBIDA) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.8rem' }}>📤</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>Importar / Actualizar</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px', lineHeight: '1.6' }}>
            Sube un archivo Excel (.xlsx o .xls) para poblar o actualizar la tabla de clientes. El sistema mapeará automáticamente columnas como <b>NOMBRE</b>, <b>CEDULA</b>, <b>CELULAR</b>, <b>PLAN</b>, etc.
          </p>

          <div style={{
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '30px 20px',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.2)',
            position: 'relative',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'all 0.3s ease'
          }}
          onClick={() => document.getElementById('bd-file-input').click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#8b5cf6'; }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              setFile(e.dataTransfer.files[0]);
            }
          }}
          >
            <input 
              type="file" 
              id="bd-file-input" 
              accept=".xlsx, .xls" 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📁</div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file ? file.name : 'Arrastra tu archivo Excel aquí o haz clic'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
              {file ? `Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Formatos permitidos: .xlsx, .xls'}
            </p>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              width: '100%',
              padding: '14px',
              background: file ? 'linear-gradient(90deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '12px',
              color: file ? '#fff' : 'rgba(255,255,255,0.3)',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: file && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-block', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}></span>
            ) : (
              <>
                <span>📤</span> Procesar e Importar Data
              </>
            )}
          </button>
        </div>

      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default SubirBD;
