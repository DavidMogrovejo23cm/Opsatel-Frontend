/**
 * @file SubirBD.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clienteService, extrasService, backupService } from '../services/api';
import { showAlert, showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';

const SubirBD = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Estados para Backup y Restauración SQL (.sql)
  const [fileSql, setFileSql] = useState(null);
  const [loadingSql, setLoadingSql] = useState(false);
  const [downloadingSql, setDownloadingSql] = useState(false);

  // Estados para Respaldos Automáticos Programados
  const [autoConfig, setAutoConfig] = useState({
    enabled: true,
    frecuencia: 'cada_dia',
    hora: '02:00',
    dia_semana: 6,
    dia_mes: 1,
    retencion_dias: 30,
    telegram_enabled: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    email_enabled: false,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    email_destinatario: '',
    ultimo_respaldo: null,
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [runningAutoBackup, setRunningAutoBackup] = useState(false);
  const [testingNotif, setTestingNotif] = useState(false);
  const [canalActivo, setCanalActivo] = useState('telegram'); // 'telegram' | 'email'

  // Estados para Lista de Archivos de Respaldo en el Servidor
  const [archivosBackup, setArchivosBackup] = useState([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [downloadingServerFile, setDownloadingServerFile] = useState(null);
  const [deletingServerFile, setDeletingServerFile] = useState(null);

  // Estados para Sección Extras General (Completamente Separada)
  const [fileExtras, setFileExtras] = useState(null);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [downloadingExtras, setDownloadingExtras] = useState(false);
  const [modoExtras, setModoExtras] = useState('merge');

  const cargarAutoConfig = async () => {
    try {
      setLoadingConfig(true);
      const resp = await backupService.getAutoConfig();
      if (resp.data) {
        setAutoConfig(prev => ({ ...prev, ...resp.data }));
      }
    } catch (err) {
      console.error('Error cargando configuración de respaldo automático:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const cargarArchivosBackup = async () => {
    try {
      setLoadingArchivos(true);
      const resp = await backupService.getArchivos();
      setArchivosBackup(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error('Error cargando lista de respaldos en el servidor:', err);
    } finally {
      setLoadingArchivos(false);
    }
  };

  useEffect(() => {
    cargarAutoConfig();
    cargarArchivosBackup();
  }, []);

  const handleSaveAutoConfig = async () => {
    setSavingConfig(true);
    try {
      const resp = await backupService.saveAutoConfig(autoConfig);
      showSuccess(resp.data?.message || 'Configuración de respaldos automáticos guardada exitosamente.');
      await cargarAutoConfig();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.detail || 'Error al guardar la configuración de respaldo');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleEjecutarAutoBackupAhora = async () => {
    const confirmado = await showConfirm(
      '¿Ejecutar Respaldo Automático Ahora?',
      'Esta acción generará inmediatamente una copia completa de la base de datos (.sql), la guardará en el servidor, limpiará respaldos viejos y enviará las notificaciones configuradas.',
      'Sí, ejecutar ahora',
      'Cancelar',
      'question'
    );
    if (!confirmado) return;

    setRunningAutoBackup(true);
    try {
      const resp = await backupService.ejecutarAhora();
      let extraInfo = '';
      if (resp.data?.telegram?.activo) {
        extraInfo += resp.data.telegram.resultado?.ok ? '\n📱 Notificación y documento enviados a Telegram' : '\n⚠️ Aviso Telegram: ' + (resp.data.telegram.resultado?.error || 'No enviado');
      }
      if (resp.data?.email?.activo) {
        extraInfo += resp.data.email.resultado?.ok ? '\n📧 Correo enviado exitosamente' : '\n⚠️ Aviso Correo: ' + (resp.data.email.resultado?.error || 'No enviado');
      }
      showSuccess(`${resp.data?.mensaje || 'Respaldo generado con éxito.'}${extraInfo}`, '¡Respaldo Exitoso!');
      await cargarAutoConfig();
      await cargarArchivosBackup();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.detail || 'Error al ejecutar el respaldo automático');
    } finally {
      setRunningAutoBackup(false);
    }
  };

  const handleDescargarArchivoServidor = async (nombre) => {
    setDownloadingServerFile(nombre);
    try {
      const resp = await backupService.descargarArchivo(nombre);
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombre);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess(`Descarga iniciada para '${nombre}'.`);
    } catch (err) {
      console.error(err);
      showError('Error al descargar el archivo de respaldo: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDownloadingServerFile(null);
    }
  };

  const handleEliminarArchivoServidor = async (nombre) => {
    const confirmado = await showConfirm(
      '¿Eliminar Respaldo del Servidor?',
      `¿Estás seguro de que deseas eliminar permanentemente el archivo <b>${nombre}</b> del servidor? Esta acción no se puede deshacer.`,
      'Sí, eliminar archivo',
      'Cancelar',
      'warning'
    );
    if (!confirmado) return;

    setDeletingServerFile(nombre);
    try {
      const resp = await backupService.eliminarArchivo(nombre);
      showSuccess(resp.data?.message || 'Archivo eliminado correctamente.');
      await cargarArchivosBackup();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.detail || 'Error al eliminar el archivo');
    } finally {
      setDeletingServerFile(null);
    }
  };

  const handleProbarNotificacion = async (tipo) => {
    setTestingNotif(true);
    try {
      const payload = {
        tipo,
        telegram_bot_token: autoConfig.telegram_bot_token,
        telegram_chat_id: autoConfig.telegram_chat_id,
        smtp_host: autoConfig.smtp_host,
        smtp_port: parseInt(autoConfig.smtp_port || 587),
        smtp_user: autoConfig.smtp_user,
        smtp_password: autoConfig.smtp_password,
        email_destinatario: autoConfig.email_destinatario
      };
      const resp = await backupService.probarNotificacion(payload);
      showSuccess(resp.data?.message || 'Prueba enviada exitosamente.');
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.detail || 'Error al realizar la prueba de notificación');
    } finally {
      setTestingNotif(false);
    }
  };


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

  const handleDownloadSql = async () => {
    setDownloadingSql(true);
    try {
      const response = await backupService.exportZip();
      if (response.data.type && response.data.type.includes('text/html')) {
        throw new Error('El servidor web devolvió una página HTML en lugar del archivo de respaldo. Verifique la ruta del backend.');
      }
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      link.setAttribute('download', `backup_opsatel_${stamp}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Copia de seguridad completa (.zip: Base de Datos + Fotos) descargada exitosamente.');
    } catch (error) {
      console.error(error);
      showError('Error al descargar el respaldo: ' + (error.response?.data?.detail || error.message));
    } finally {
      setDownloadingSql(false);
    }
  };

  const handleUploadSql = async () => {
    if (!fileSql) {
      showWarning('Por favor selecciona un archivo de respaldo con extensión .zip o .sql');
      return;
    }

    const confirmado = await showConfirm(
      '¿Restaurar Respaldo Completo?',
      '⚠️ Esta operación restaurará la base de datos y todas las imágenes (cédulas, fachadas, dispositivos) del archivo seleccionado. ¿Deseas continuar?',
      'Sí, restaurar ahora',
      'Cancelar',
      'warning'
    );

    if (!confirmado) return;

    setLoadingSql(true);
    const formData = new FormData();
    formData.append('file', fileSql);

    try {
      const resp = await backupService.importZip(formData);
      const fotosTxt = resp.data.imagenes_restauradas !== undefined ? `\nImágenes restauradas: ${resp.data.imagenes_restauradas}` : '';
      showSuccess(
        `${resp.data.message}\nSentencias ejecutadas: ${resp.data.total_sentencias}\nTablas procesadas: ${resp.data.tablas_afectadas}${fotosTxt}`,
        '¡Restauración Exitosa!'
      );
      setFileSql(null);
      const inputElem = document.getElementById('bd-sql-file-input');
      if (inputElem) inputElem.value = '';
    } catch (error) {
      console.error(error);
      showError('Error al restaurar respaldo: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoadingSql(false);
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

      {/* SECCIÓN PRINCIPAL: BACKUP Y RESTAURACIÓN INTEGRAL (.SQL) */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto 36px auto',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(15, 23, 42, 0.8))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2.2rem' }}>🗄️</span>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
                Respaldo y Restauración Completa (.SQL)
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                Copia exacta de toda la base de datos MySQL (tablas, claves, índices y registros). Permite descargar e importar sin pérdidas ni duplicados.
              </p>
            </div>
          </div>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            MySQL / MariaDB Nativo
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
          {/* Subcard Descargar .zip */}
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>📥</span>
                <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#34d399', fontWeight: 'bold' }}>Exportar Paquete Completo (.ZIP)</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '20px' }}>
                Genera al instante un archivo comprimido <code>.zip</code> con el volcado íntegro de la base de datos (<code>database.sql</code>) y todas las fotografías del sistema (cédulas, fachadas, dispositivos, comprobantes).
              </p>
            </div>
            <button
              onClick={handleDownloadSql}
              disabled={downloadingSql}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(90deg, #059669, #10b981)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: 'bold',
                cursor: downloadingSql ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {downloadingSql ? '⏳ Generando paquete .zip...' : '📥 Descargar Respaldo Completo (.zip)'}
            </button>
          </div>

          {/* Subcard Restaurar .zip */}
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>📤</span>
                <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#f43f5e', fontWeight: 'bold' }}>Restaurar desde .ZIP / .SQL</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '16px' }}>
                Selecciona un archivo <code>.zip</code> previamente descargado para restaurar la base de datos y desempacar todas las imágenes automáticamente (también compatible con archivos <code>.sql</code>).
              </p>
              <input
                id="bd-sql-file-input"
                type="file"
                accept=".zip,.sql"
                disabled={loadingSql}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFileSql(e.target.files[0]);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px dashed rgba(244, 63, 94, 0.4)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  cursor: loadingSql ? 'not-allowed' : 'pointer'
                }}
              />
            </div>
            <button
              onClick={handleUploadSql}
              disabled={!fileSql || loadingSql}
              style={{
                width: '100%',
                padding: '12px',
                background: (!fileSql || loadingSql) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(90deg, #e11d48, #be123c)',
                border: 'none',
                borderRadius: '10px',
                color: (!fileSql || loadingSql) ? 'rgba(255,255,255,0.3)' : 'white',
                fontWeight: 'bold',
                cursor: (!fileSql || loadingSql) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loadingSql ? '⏳ Restaurando base de datos e imágenes...' : '🚀 Iniciar Restauración (.zip)'}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: RESPALDOS AUTOMÁTICOS PROGRAMADOS */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto 36px auto',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.85))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2.4rem' }}>⏰</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
                  Respaldos Automáticos Diarios (Sin Intervención)
                </h2>
                <span style={{
                  background: autoConfig.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: autoConfig.enabled ? '#34d399' : '#f87171',
                  border: `1px solid ${autoConfig.enabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {autoConfig.enabled ? '● ACTIVO EN MADRUGADA' : '○ EN PAUSA'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                El servidor genera el paquete <code>.zip</code> (Base de datos + Todas las Fotos) automáticamente a la hora fijada, depura respaldos que superen los días de retención y te envía el archivo a Telegram / Correo.
              </p>
            </div>
          </div>

          <button
            onClick={handleEjecutarAutoBackupAhora}
            disabled={runningAutoBackup}
            style={{
              padding: '10px 18px',
              background: runningAutoBackup ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: runningAutoBackup ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            {runningAutoBackup ? '⏳ Ejecutando respaldo...' : '⚡ Ejecutar Respaldo Automático Ahora'}
          </button>
        </div>

        {/* Fila de Parámetros Principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          background: 'rgba(0,0,0,0.25)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px'
        }}>
          {/* Switch Activar */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
              Estado del Servicio Automático
            </label>
            <button
              type="button"
              onClick={() => setAutoConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: autoConfig.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${autoConfig.enabled ? '#10b981' : '#ef4444'}`,
                borderRadius: '8px',
                color: autoConfig.enabled ? '#34d399' : '#f87171',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{autoConfig.enabled ? '✅ Respaldo Automático Activado' : '❌ Respaldo Automático Desactivado'}</span>
            </button>
          </div>

          {/* Selector de Frecuencia */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
              Frecuencia de Respaldo
            </label>
            <select
              value={autoConfig.frecuencia || 'cada_dia'}
              onChange={(e) => setAutoConfig(prev => ({ ...prev, frecuencia: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              <option value="cada_hora">⏱️ Cada Hora</option>
              <option value="cada_dia">📅 Cada Día</option>
              <option value="cada_semana">🗓️ Cada Semana</option>
              <option value="cada_mes">📆 Cada Mes</option>
            </select>
          </div>

          {/* Hora de Ejecución (si no es cada_hora) */}
          {autoConfig.frecuencia !== 'cada_hora' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
                Hora de Ejecución (Ecuador / Servidor)
              </label>
              <input
                type="time"
                value={autoConfig.hora}
                onChange={(e) => setAutoConfig(prev => ({ ...prev, hora: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          )}

          {/* Día de la semana (si es cada_semana) */}
          {autoConfig.frecuencia === 'cada_semana' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
                Día de la Semana
              </label>
              <select
                value={autoConfig.dia_semana ?? 6}
                onChange={(e) => setAutoConfig(prev => ({ ...prev, dia_semana: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}
              >
                <option value={0}>Lunes</option>
                <option value={1}>Martes</option>
                <option value={2}>Miércoles</option>
                <option value={3}>Jueves</option>
                <option value={4}>Viernes</option>
                <option value={5}>Sábado</option>
                <option value={6}>Domingo</option>
              </select>
            </div>
          )}

          {/* Día del mes (si es cada_mes) */}
          {autoConfig.frecuencia === 'cada_mes' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
                Día del Mes
              </label>
              <select
                value={autoConfig.dia_mes ?? 1}
                onChange={(e) => setAutoConfig(prev => ({ ...prev, dia_mes: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Día {d} del mes</option>
                ))}
              </select>
            </div>
          )}

          {/* Días de Retención */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
              Retención de Archivos (Rotación)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                min="1"
                max="365"
                value={autoConfig.retencion_dias}
                onChange={(e) => setAutoConfig(prev => ({ ...prev, retencion_dias: parseInt(e.target.value) || 30 }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}
              />
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Días</span>
            </div>
          </div>
        </div>


        {/* Sección Canales de Alerta y Notificación (Telegram / Correo) */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📬</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#e2e8f0' }}>
                Notificaciones y Envío de Copia Remota (Opcional)
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setCanalActivo('telegram')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  background: canalActivo === 'telegram' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: canalActivo === 'telegram' ? '#38bdf8' : '#94a3b8',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                📱 Telegram Bot {autoConfig.telegram_enabled && '●'}
              </button>
              <button
                type="button"
                onClick={() => setCanalActivo('email')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  background: canalActivo === 'email' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                  color: canalActivo === 'email' ? '#c084fc' : '#94a3b8',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                📧 Correo SMTP {autoConfig.email_enabled && '●'}
              </button>
            </div>
          </div>

          {/* Contenido Canal Telegram */}
          {canalActivo === 'telegram' && (
            <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <input
                    type="checkbox"
                    checked={autoConfig.telegram_enabled}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, telegram_enabled: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Habilitar alertas y envío del archivo .sql a Telegram</span>
                </label>
                {autoConfig.telegram_enabled && (
                  <button
                    type="button"
                    onClick={() => handleProbarNotificacion('telegram')}
                    disabled={testingNotif || !autoConfig.telegram_bot_token || !autoConfig.telegram_chat_id}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: testingNotif ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {testingNotif ? 'Enviando...' : '🔔 Enviar Mensaje de Prueba'}
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                    Telegram Bot Token (ej: <code>123456:ABC-DEF...</code>)
                  </label>
                  <input
                    type="text"
                    placeholder="Obtenido en @BotFather"
                    value={autoConfig.telegram_bot_token}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, telegram_bot_token: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                    Telegram Chat ID o Grupo (ej: <code>-100123456789</code> o tu ID personal)
                  </label>
                  <input
                    type="text"
                    placeholder="Obtenido en @userinfobot o @myidbot"
                    value={autoConfig.telegram_chat_id}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '10px', marginBottom: 0 }}>
                💡 <b>Ventaja Telegram:</b> Si el respaldo pesa menos de 45 MB, el bot enviará el archivo <code>.sql</code> adjunto directamente a tu chat para que lo tengas respaldado en la nube de Telegram y en tu teléfono.
              </p>
            </div>
          )}

          {/* Contenido Canal Email */}
          {canalActivo === 'email' && (
            <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <input
                    type="checkbox"
                    checked={autoConfig.email_enabled}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, email_enabled: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Habilitar alertas y envío por Correo Electrónico (SMTP)</span>
                </label>
                {autoConfig.email_enabled && (
                  <button
                    type="button"
                    onClick={() => handleProbarNotificacion('email')}
                    disabled={testingNotif || !autoConfig.smtp_host || !autoConfig.smtp_user || !autoConfig.email_destinatario}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid #c084fc',
                      borderRadius: '8px',
                      color: '#c084fc',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: testingNotif ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {testingNotif ? 'Enviando...' : '✉️ Enviar Correo de Prueba'}
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Servidor SMTP</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={autoConfig.smtp_host}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Puerto SMTP</label>
                  <input
                    type="number"
                    placeholder="587"
                    value={autoConfig.smtp_port}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Usuario / Correo Remitente</label>
                  <input
                    type="text"
                    placeholder="tu_correo@gmail.com"
                    value={autoConfig.smtp_user}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Contraseña de Aplicación</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={autoConfig.smtp_password}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Correo Destinatario</label>
                  <input
                    type="email"
                    placeholder="admin@opsatel.com"
                    value={autoConfig.email_destinatario}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, email_destinatario: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón Guardar Configuración y Widget de Último Respaldo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            {autoConfig.ultimo_respaldo ? (
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                <span style={{ color: '#34d399', fontWeight: 'bold' }}>Último respaldo automático: </span>
                <span>{autoConfig.ultimo_respaldo.fecha}</span> | <span>{autoConfig.ultimo_respaldo.archivo}</span> (<span>{autoConfig.ultimo_respaldo.tamano_mb} MB</span>)
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Aún no se ha registrado una ejecución de respaldo automático.
              </div>
            )}
          </div>

          <button
            onClick={handleSaveAutoConfig}
            disabled={savingConfig}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: 'bold',
              cursor: savingConfig ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {savingConfig ? 'Guardando...' : '💾 Guardar Configuración Programada'}
          </button>
        </div>
      </div>

      {/* SECCIÓN 3: BÓVEDA DE RESPALDOS GUARDADOS EN EL SERVIDOR */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto 36px auto',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2.2rem' }}>🗄️</span>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
                Bóveda de Respaldos en el Servidor
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
                Historial de copias de seguridad generadas automáticamente y almacenadas en el disco del servidor. Puedes descargarlas a tu PC o eliminarlas en cualquier momento.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
              Total: <b>{archivosBackup.length}</b> respaldo(s)
            </span>
            <button
              onClick={cargarArchivosBackup}
              disabled={loadingArchivos}
              style={{
                padding: '8px 14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                cursor: loadingArchivos ? 'not-allowed' : 'pointer'
              }}
            >
              {loadingArchivos ? 'Actualizando...' : '🔄 Actualizar Lista'}
            </button>
          </div>
        </div>

        {loadingArchivos ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Cargando historial de respaldos...
          </div>
        ) : archivosBackup.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.1)',
            color: '#94a3b8'
          }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📂</span>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No hay archivos de respaldo almacenados todavía en la bóveda del servidor.</p>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Puedes hacer clic en <b>"⚡ Ejecutar Respaldo Automático Ahora"</b> para generar el primero de inmediato.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 14px' }}>Archivo de Respaldo</th>
                  <th style={{ padding: '12px 14px' }}>Fecha y Hora</th>
                  <th style={{ padding: '12px 14px' }}>Tamaño</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {archivosBackup.map((item, index) => (
                  <tr
                    key={item.nombre}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>
                      💾 {item.nombre}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#e2e8f0' }}>
                      {item.fecha}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 'bold' }}>
                      {item.tamano_mb} MB
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDescargarArchivoServidor(item.nombre)}
                          disabled={downloadingServerFile === item.nombre}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            color: '#34d399',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            cursor: downloadingServerFile === item.nombre ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {downloadingServerFile === item.nombre ? 'Descargando...' : '📥 Descargar a PC'}
                        </button>
                        <button
                          onClick={() => handleEliminarArchivoServidor(item.nombre)}
                          disabled={deletingServerFile === item.nombre}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            color: '#f87171',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            cursor: deletingServerFile === item.nombre ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {deletingServerFile === item.nombre ? 'Borrando...' : '🗑️ Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
