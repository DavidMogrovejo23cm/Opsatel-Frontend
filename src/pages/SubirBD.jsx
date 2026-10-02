import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clienteService, extrasService } from '../services/api';
import { showAlert, showSuccess, showError, showWarning } from '../utils/alerts';

const SubirBD = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Estados para Sección Extras General (Completamente Separada)
  const [fileExtras, setFileExtras] = useState(null);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [downloadingExtras, setDownloadingExtras] = useState(false);
  const [modoExtras, setModoExtras] = useState('merge');

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

  const handleUploadExtras = async () => {
    if (!fileExtras) {
      showWarning('Por favor selecciona un archivo Excel (.xlsx o .xls) de Extras');
      return;
    }
    setLoadingExtras(true);
    const formData = new FormData();
    formData.append('file', fileExtras);
    formData.append('modo', modoExtras);

    try {
      const resp = await extrasService.uploadDatabase(formData);
      showSuccess(resp.data?.message || 'Base de datos de Extras subida exitosamente');
      setFileExtras(null);
      const fileInput = document.getElementById('bd-extras-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || 'Error al subir la base de datos de extras';
      showError(errMsg);
    } finally {
      setLoadingExtras(false);
    }
  };

  const handleDownloadExtras = async () => {
    setDownloadingExtras(true);
    try {
      const response = await extrasService.downloadDatabase();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Base_Datos_Extras_General_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Archivo de Extras descargado exitosamente');
    } catch (error) {
      console.error(error);
      showError('Error al descargar la base de datos de extras.');
    } finally {
      setDownloadingExtras(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="page-container"
      style={{ padding: '24px', color: 'var(--text-main)', minHeight: '100vh', background: 'transparent' }}
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
              <li>Clientes en cualquier estado (Activos, Suspendidos, Retirados y Eliminados)</li>
              <li>Historial completo de Pagos, Saldos y Egresos</li>
              <li>Call Center, Tickets y Hojas de Ruta de Técnicos</li>
              <li>Balance, Finanzas, Turnos de Caja, Proyectos y Gastos</li>
              <li>Asistencias del Personal y Horarios</li>
              <li>Configuración total (Nodos, Puertos, OLT, WhatsApp, Cajas NAP, etc.)</li>
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

      {/* SECCIÓN TOTALMENTE APARTADA: CLIENTES EXTRAS / EXTRA GENERAL */}
      <div style={{
        maxWidth: '1100px',
        margin: '40px auto 0 auto',
        background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2.2rem' }}>📺</span>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, color: '#a5b4fc' }}>
                Base de Datos: Clientes Extras (Extra General / Plataforma)
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>
                Sección 100% independiente de la base de datos principal de clientes. Maneja cuentas IPTV/TV, estados, precios individuales y pagos mensuales.
              </p>
            </div>
          </div>
          <span style={{
            background: 'rgba(99, 102, 241, 0.25)',
            border: '1px solid #6366f1',
            color: '#c7d2fe',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            🔒 MÓDULO AISLADO EXTRAS
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginTop: '20px'
        }}>
          {/* EXPORTAR EXTRAS */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#34d399', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📥</span> Descargar Excel Extras
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
                Exporta el libro de Excel con la cuadrícula completa de Extras (Enero a Diciembre), pagos registrados, saldos, usuarios y contraseñas.
              </p>
            </div>
            <button
              onClick={handleDownloadExtras}
              disabled={downloadingExtras}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 'bold',
                cursor: downloadingExtras ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {downloadingExtras ? 'Descargando...' : '📥 Descargar Excel Extras (.xlsx)'}
            </button>
          </div>

          {/* IMPORTAR EXTRAS */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#818cf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📤</span> Subir Excel Extras
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '14px' }}>
              Sube el archivo Excel de Extras (hoja PLATAFORMA). Cuadra precios, meses, saldos y pagos sin alterar clientes normales.
            </p>

            <div style={{
              border: '2px dashed rgba(99, 102, 241, 0.4)',
              borderRadius: '10px',
              padding: '18px',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.3)',
              cursor: 'pointer',
              marginBottom: '14px'
            }}
            onClick={() => document.getElementById('bd-extras-file-input').click()}
            >
              <input
                type="file"
                id="bd-extras-file-input"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={e => setFileExtras(e.target.files?.[0] || null)}
              />
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>📑</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: fileExtras ? '#34d399' : '#fff' }}>
                {fileExtras ? fileExtras.name : 'Selecciona o arrastra el archivo de Extras'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                {fileExtras ? `${(fileExtras.size / 1024).toFixed(1)} KB` : 'Formato .xlsx con cuadrícula de Extras'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="modoExtras"
                  value="merge"
                  checked={modoExtras === 'merge'}
                  onChange={() => setModoExtras('merge')}
                />
                <span>Actualizar y fusionar</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="modoExtras"
                  value="replace"
                  checked={modoExtras === 'replace'}
                  onChange={() => setModoExtras('replace')}
                />
                <span style={{ color: '#f87171' }}>Reemplazar completa</span>
              </label>
            </div>

            <button
              onClick={handleUploadExtras}
              disabled={!fileExtras || loadingExtras}
              style={{
                width: '100%',
                padding: '12px',
                background: fileExtras ? 'linear-gradient(90deg, #4f46e5, #7c3aed)' : 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '10px',
                color: fileExtras ? '#fff' : 'rgba(255,255,255,0.3)',
                fontWeight: 'bold',
                cursor: fileExtras && !loadingExtras ? 'pointer' : 'not-allowed',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loadingExtras ? (
                <span style={{ display: 'inline-block', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}></span>
              ) : (
                '🚀 Importar Base de Extras'
              )}
            </button>
          </div>
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
