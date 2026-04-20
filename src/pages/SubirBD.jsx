import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clienteService } from '../services/api';

const SubirBD = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await clienteService.uploadDatabase(formData);
      alert(resp.data?.message || 'Base de datos subida exitosamente');
      setFile(null);
      // Reset input
      const fileInput = document.getElementById('bd-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || 'Error al subir la base de datos';
      alert(errMsg);
    } finally {
      setLoading(false);
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
          Subir Base de Datos
        </h1>
        <span style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          IMPORTACIÓN
        </span>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        margin: '0 auto',
        // boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', lineHeight: '1.6' }}>
          Sube un archivo Excel (.xlsx o .xls) con la información de los clientes. El sistema mapeará automáticamente las columnas como <b>NOMBRE</b>, <b>CEDULA</b>, <b>CELULAR</b>, <b>PLAN</b>, <b>ESTADO</b>, etc., para poblar la base de datos de Opsatel.
        </p>

        <div style={{
          border: '2px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '40px',
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
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
            {file ? file.name : 'Arrastra tu archivo Excel aquí o haz clic'}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {file ? `Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Solo se permiten archivos Excel (.xlsx, .xls)'}
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
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default SubirBD;
