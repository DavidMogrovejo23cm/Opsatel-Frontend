import React, { useState, useEffect, useMemo } from 'react';
import { clienteService, configuracionService, hojaRutaService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeDateInput, toISODate } from '../services/dateUtils';
import { showAlert, showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';


const Ventas = () => {
  const [nodosList, setNodosList] = useState([]);
  const [parroquiasList, setParroquiasList] = useState([]);
  const [planesList, setPlanesList] = useState([]);
  const [tecnicosList, setTecnicosList] = useState([]);

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const [paRes, ppRes, plRes, usrRes] = await Promise.all([
          configuracionService.getNodos(),
          configuracionService.getParroquias(),
          configuracionService.getPlanes(),
          configuracionService.getUsuarios().catch(() => ({ data: [] }))
        ]);
        setNodosList(paRes.data);
        setParroquiasList(ppRes.data);
        setPlanesList(plRes.data);
        
        const allUsers = usrRes.data || [];
        const tecs = allUsers.filter(u => u.rol?.toLowerCase() === 'tecnico');
        setTecnicosList(tecs.length > 0 ? tecs : allUsers);
      } catch (error) {
        console.error("Error fetching configuraciones", error);
      }
    };
    fetchSelects();
  }, []);

  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    celular: '',
    correo: '',
    direccion: '',
    nodo: '',
    parroquia: '',
    plan: '',
    plus: '0',
    iptv_max_conn: 0,
    tv_tipo: 'Ninguno', // "Ninguno", "IPTV", "CATV"
    tiempo: '24',
    cedula_tipo: '',
    ubicacion: '',
    tercera_edad: false,
    plan_corporativo: false,
    mantenimiento: false,
    precio_plan_especial: 0,
    comentarios: '',
    fecha_firma: new Date().toISOString().split('T')[0]
  });

  const [fileFrontal, setFileFrontal] = useState(null);
  const [filePosterior, setFilePosterior] = useState(null);
  const [previewFrontal, setPreviewFrontal] = useState(null);
  const [previewPosterior, setPreviewPosterior] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal inteligente de programar instalación post-registro
  const [showInstModal, setShowInstModal] = useState(false);
  const [instForm, setInstForm] = useState(null);
  const [instSubmitting, setInstSubmitting] = useState(false);
  const [backupFormData, setBackupFormData] = useState(null);

  useEffect(() => {
    if (fileFrontal) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewFrontal(reader.result);
      reader.readAsDataURL(fileFrontal);
    } else {
      setPreviewFrontal(null);
    }
  }, [fileFrontal]);

  useEffect(() => {
    if (filePosterior) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewPosterior(reader.result);
      reader.readAsDataURL(filePosterior);
    } else {
      setPreviewPosterior(null);
    }
  }, [filePosterior]);

  const compressImage = (file, maxWidth = 1600, quality = 0.82) => {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const rawName = file.name || 'cedula.jpg';
              const baseName = rawName.includes('.') ? rawName.substring(0, rawName.lastIndexOf('.')) : rawName;
              const compressedFile = new File([blob], `${baseName}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const processImageFile = async (itemOrFile, defaultName = 'cedula.jpg') => {
    if (!itemOrFile) return null;
    let file = null;
    let mimeType = 'image/jpeg';
    let fileName = defaultName;

    if (itemOrFile instanceof File) {
      file = itemOrFile;
      mimeType = file.type || 'image/jpeg';
      fileName = file.name || defaultName;
    } else if (itemOrFile instanceof Blob) {
      file = itemOrFile;
      mimeType = file.type || 'image/jpeg';
    } else if (typeof itemOrFile === 'string') {
      const str = itemOrFile.trim();
      if (str.startsWith('data:image/')) {
        try {
          const arr = str.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          file = new Blob([u8arr], { type: mimeType });
        } catch (err) {
          console.error("Error al procesar data URL:", err);
          return null;
        }
      } else if (str.startsWith('http://') || str.startsWith('https://')) {
        try {
          const res = await fetch(str);
          const blob = await res.blob();
          file = blob;
          mimeType = blob.type || 'image/jpeg';
        } catch (err) {
          console.error("Error al descargar imagen desde URL:", err);
          return null;
        }
      }
    }

    if (!file) return null;

    const baseFile = file instanceof File ? file : new File([file], fileName, { type: mimeType });
    const compressed = await compressImage(baseFile);
    return compressed;
  };

  const handlePaste = async (e, setFile, defaultName = 'cedula_pegada.png') => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Archivos directos en el portapapeles (ej. copiado desde Explorador de Archivos de Windows)
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
          const processed = await processImageFile(file, defaultName);
          if (processed) {
            setFile(processed);
            return;
          }
        }
      }
    }

    // 2. Elementos del portapapeles (Recortes, captura de pantalla, copiar imagen de la web)
    const items = clipboardData.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1 || item.kind === 'file') {
          const blob = item.getAsFile();
          if (blob) {
            const processed = await processImageFile(blob, defaultName);
            if (processed) {
              setFile(processed);
              return;
            }
          }
        }
      }
    }

    // 3. Texto plano o URL (Copiar dirección de imagen o URL de datos)
    const pastedText = clipboardData.getData('text');
    if (pastedText) {
      const processed = await processImageFile(pastedText, defaultName);
      if (processed) {
        setFile(processed);
        return;
      }
    }

    // 4. HTML recortado de la web (etiqueta <img> de una página web)
    const htmlText = clipboardData.getData('text/html');
    if (htmlText) {
      const match = htmlText.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        const processed = await processImageFile(match[1], defaultName);
        if (processed) {
          setFile(processed);
          return;
        }
      }
    }
  };

  const handleDrop = async (e, setFile, defaultName = 'cedula_arrastrada.png') => {
    e.preventDefault();
    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;

    if (dataTransfer.files && dataTransfer.files.length > 0) {
      for (let i = 0; i < dataTransfer.files.length; i++) {
        const file = dataTransfer.files[i];
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
          const processed = await processImageFile(file, defaultName);
          if (processed) {
            setFile(processed);
            return;
          }
        }
      }
    }

    const urlText = dataTransfer.getData('text/uri-list') || dataTransfer.getData('text');
    if (urlText) {
      const processed = await processImageFile(urlText, defaultName);
      if (processed) {
        setFile(processed);
        return;
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'tercera_edad') {
      setFormData({
        ...formData,
        tercera_edad: checked,
        plan_corporativo: checked ? false : formData.plan_corporativo,
        plan: checked ? 'TERCERA EDAD' : ''
      });
    } else if (name === 'plan_corporativo') {
      setFormData({
        ...formData,
        plan_corporativo: checked,
        tercera_edad: checked ? false : formData.tercera_edad,
        plan: checked ? 'CORPORATIVO' : ''
      });
    } else if (name === 'plan') {
      const selectedPlan = planesList.find(p => p.nombre === value);
      const baseScreens = formData.tv_tipo === 'IPTV' ? (selectedPlan?.pantallas || 1) : 0;
      setFormData({
        ...formData,
        plan: value,
        iptv_max_conn: baseScreens,
        plus: '0'
      });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const convertToDMS = (decimal, type) => {
    const absDecimal = Math.abs(decimal);
    const degrees = Math.floor(absDecimal);
    const minutesDecimal = (absDecimal - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

    let direction = "";
    if (type === "lat") {
      direction = decimal >= 0 ? "N" : "S";
    } else {
      direction = decimal >= 0 ? "E" : "W";
    }

    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  const handleGetGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const latDMS = convertToDMS(position.coords.latitude, "lat");
        const lngDMS = convertToDMS(position.coords.longitude, "lng");
        // Formato solicitado: 2°55'51.44"S, 79° 2'43.37"W
        setFormData({ ...formData, ubicacion: `${latDMS}, ${lngDMS.replace('°', '° ')}` });
      }, (error) => {
        showError("Error al obtener ubicación. Asegúrate de dar permisos.");
      });
    } else {
      showWarning("Geolocalización no disponible en este navegador.");
    }
  };

  const handleConvertManual = () => {
    const val = formData.ubicacion.trim();
    const regexDD = /^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/;
    const match = val.match(regexDD);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const latDMS = convertToDMS(lat, "lat");
      const lngDMS = convertToDMS(lng, "lng");
      setFormData({ ...formData, ubicacion: `${latDMS}, ${lngDMS.replace('°', '° ')}` });
    } else {
      showWarning("Formato inválido. Asegúrate de usar: latitud, longitud (Ej: -2.93, -79.04)");
    }
  };

  // IA: Autocompletar formulario con texto libre
  const [smartFillText, setSmartFillText] = useState('');
  const [smartFillLoading, setSmartFillLoading] = useState(false);
  const [showSmartPanel, setShowSmartPanel] = useState(false);

  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setSmartFillLoading(true);
    try {
      const res = await clienteService.parseSmart(smartFillText);
      const d = res.data;
      setFormData(prev => ({
        ...prev,
        nombre: d.nombre || prev.nombre,
        cedula: d.cedula || prev.cedula,
        cedula_tipo: d.cedula_tipo || prev.cedula_tipo,
        celular: d.celular || prev.celular,
        correo: d.correo || prev.correo,
        direccion: d.direccion || prev.direccion,
        nodo: (d.nodo && nodosList.some(n => n.nombre === d.nodo)) ? d.nodo : prev.nodo,
        parroquia: (d.parroquia && parroquiasList.some(p => p.nombre === d.parroquia)) ? d.parroquia : prev.parroquia,
        plan: (d.plan && planesList.some(p => p.nombre === d.plan)) ? d.plan : prev.plan,
        ubicacion: d.ubicacion || prev.ubicacion,
        fecha_firma: d.fecha_firma || prev.fecha_firma,
        tiempo: d.tiempo !== undefined && d.tiempo !== null ? String(d.tiempo) : prev.tiempo,
        tercera_edad: d.tercera_edad !== undefined ? d.tercera_edad : prev.tercera_edad,
        precio_plan_especial: d.precio_plan_especial !== null && d.precio_plan_especial !== undefined ? d.precio_plan_especial : prev.precio_plan_especial,
        comentarios: d.comentarios || prev.comentarios,
        iptv_max_conn: d.iptv_max_conn !== null && d.iptv_max_conn !== undefined ? d.iptv_max_conn : prev.iptv_max_conn,
      }));
      setShowSmartPanel(false);
      setSmartFillText('');
      setMessage({ type: 'success', text: '✨ Formulario autocompletado con IA. Revisa y corrige si es necesario antes de registrar.' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessage({ type: 'error', text: typeof detail === 'string' ? detail : 'Error al procesar con IA.' });
    } finally {
      setSmartFillLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación manual de campos select obligatorios
    if (formData.cedula_tipo === 'Si' && (!fileFrontal || !filePosterior)) {
      setMessage({ type: 'error', text: 'Las fotos de la cédula son obligatorias si seleccionó "Si".' });
      return;
    }
    if (!formData.cedula_tipo) {
      setMessage({ type: 'error', text: 'Seleccione si se requiere digitalización de cédula.' });
      return;
    }
    if (!formData.parroquia) {
      setMessage({ type: 'error', text: 'Seleccione la parroquia.' });
      return;
    }
    if (!formData.nodo) {
      setMessage({ type: 'error', text: 'Seleccione el nodo.' });
      return;
    }
    if (!formData.plan) {
      setMessage({ type: 'error', text: 'Seleccione el plan contratado.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    console.log("Enviando contrato con parroquia:", formData.parroquia);
    const nowTimeStr = new Date().toTimeString().split(' ')[0];
    let fechaFirmaVal = normalizeDateInput(formData.fecha_firma);
    if (fechaFirmaVal && !fechaFirmaVal.includes(':')) {
      fechaFirmaVal += ` ${nowTimeStr}`;
    }

    const payload = {
      ...formData,
      correo: (formData.correo && String(formData.correo).trim()) ? String(formData.correo).trim() : null,
      precio_plan_especial: parseFloat(formData.precio_plan_especial) || 0.0,
      plan: formData.tercera_edad ? 'TERCERA EDAD' : (formData.plan_corporativo ? 'CORPORATIVO' : formData.plan),
      fecha_firma: fechaFirmaVal,
      estado: 'En Activación',
      saldo: prorrateo?.monto ? parseFloat(prorrateo.monto) : undefined
    };
    try {
      const response = await clienteService.crear(payload);
      const clienteId = response.data.id;

      // Subir fotos si existen
      if (fileFrontal || filePosterior) {
        try {
          const uploadData = new FormData();
          if (fileFrontal) {
            const compFront = await compressImage(fileFrontal);
            const name = compFront.name && compFront.name.includes('.') ? compFront.name : 'frontal.jpg';
            uploadData.append('frontal', compFront, name);
          }
          if (filePosterior) {
            const compPost = await compressImage(filePosterior);
            const name = compPost.name && compPost.name.includes('.') ? compPost.name : 'posterior.jpg';
            uploadData.append('posterior', compPost, name);
          }
          await clienteService.uploadCedula(clienteId, uploadData);
        } catch (uploadError) {
          // Si falla la subida de fotos, eliminar el cliente para no dejar registros huérfanos
          try { await clienteService.eliminar(clienteId); } catch (_) { }
          const detail = uploadError.response?.data?.detail;
          const errText = typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail.map(d => `${d.loc?.join('.') ?? ''}: ${d.msg}`).join(' | ')
              : 'Error al subir las fotos de la cédula. El cliente no fue registrado.';
          setMessage({ type: 'error', text: errText });
          return;
        }
      }

      setMessage({ type: 'success', text: `✅ Cliente ${response.data.nombre} creado con éxito (ID: ${clienteId}). ¿Deseas programar la instalación ahora?` });

      // Abrir modal inteligente pre-llenado con datos del nuevo cliente
      setInstForm({
        cliente_id: clienteId,
        nombre_cliente: response.data.nombre || formData.nombre,
        celular_cliente: formData.celular,
        ubicacion_cliente: formData.ubicacion || formData.direccion,
        parroquia: formData.parroquia,
        fecha: new Date().toISOString().split('T')[0],
        hora: '',
        tecnico: '',
        actividad: 'INSTALACION',
        observacion: formData.comentarios || '',
        ubicacion_caja: '',
        estado: 'Pendiente'
      });
      setBackupFormData({ ...formData });
      setShowInstModal(true);
      setFormData({
        nombre: '', cedula: '', celular: '', correo: '',
        direccion: '', nodo: '', parroquia: '', plan: '', plus: '0', iptv_max_conn: 0, tv_tipo: 'Ninguno', tiempo: '12',
        cedula_tipo: '', ubicacion: '',
        tercera_edad: false,
        plan_corporativo: false,
        mantenimiento: false,
        precio_plan_especial: 0,
        comentarios: '',
        fecha_firma: new Date().toISOString().split('T')[0]
      });
      setFileFrontal(null);
      setFilePosterior(null);
    } catch (error) {
      // Parsear y mostrar el error exacto retornado por el backend
      const detail = error.response?.data?.detail;
      let errText = 'Error al crear el cliente.';
      if (typeof detail === 'string') {
        errText = detail;
      } else if (Array.isArray(detail)) {
        // Errores de validación Pydantic: [{loc: [...], msg: '...', type: '...'}, ...]
        errText = detail.map(d => {
          const field = d.loc ? d.loc.filter(l => l !== 'body').join(' → ') : '';
          return field ? `Campo "${field}": ${d.msg}` : d.msg;
        }).join('\n');
      } else if (detail && typeof detail === 'object') {
        errText = JSON.stringify(detail);
      } else if (error.message) {
        errText = error.message;
      }
      setMessage({ type: 'error', text: errText });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarInstalacion = async () => {
    if (!instForm || !instForm.cliente_id) return;
    const confirmado = await showConfirm(
      "¿Cancelar y seguir editando?",
      "El cliente recién registrado se eliminará para que pueda continuar editando el contrato.",
      "Sí, cancelar y editar",
      "No, mantener"
    );
    if (confirmado) {
      try {
        await clienteService.eliminar(instForm.cliente_id);
        if (backupFormData) {
          setFormData(backupFormData);
        }
        setShowInstModal(false);
        setMessage({ type: 'info', text: 'Se ha restaurado el formulario del contrato para que continúe trabajando.' });
      } catch (err) {
        showError("Error al eliminar el cliente temporal: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  // Cálculo de Prorrateo en tiempo real (misma fórmula que el backend)
  const prorrateo = useMemo(() => {
    let tarifa = 0;
    if (formData.mantenimiento) {
      tarifa = 10.0;
    } else if (formData.tercera_edad || formData.plan_corporativo) {
      tarifa = parseFloat(formData.precio_plan_especial) || 0;
    } else if (formData.plan) {
      const selectedPlan = planesList.find(p => p.nombre === formData.plan);
      tarifa = parseFloat(selectedPlan?.precio) || 0;
    }
    if (tarifa === 0 || !formData.fecha_firma) return null;

    const fecha = new Date(formData.fecha_firma + 'T12:00:00');
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const day = fecha.getDate();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const activeDays = totalDays - day + 1;
    const monto = (tarifa / totalDays) * activeDays;

    return { monto: monto.toFixed(2), activeDays, totalDays, tarifa };
  }, [formData.plan, formData.precio_plan_especial, formData.tercera_edad, formData.plan_corporativo, formData.mantenimiento, formData.fecha_firma, planesList]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="contrato-card"
      >
        {/* HEADER CONTRATO */}
        <div className="contrato-header">
          <div className="contrato-title-wrapper">
            <div className="contrato-title-icon">
              <span>👥</span>
            </div>
            <div className="contrato-title-text">
              <h1>Registro de Nuevo Cliente</h1>
              <p>Complete los datos requeridos</p>
            </div>
          </div>

          {/* WIDGET PRORRATEO */}
          {prorrateo ? (
            <div className="contrato-prorrateo-badge">
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.55rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '2px' }}>
                  Pago Inicial
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>
                  ${prorrateo.monto}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(129, 140, 248, 0.25)', paddingLeft: '10px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                  {prorrateo.activeDays} de {prorrateo.totalDays} días
                </div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  Plan: ${prorrateo.tarifa}/mes
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></span>
              En línea
            </div>
          )}
        </div>

        {/* PANEL IA: AUTOCOMPLETAR */}
        <div className="contrato-smart-panel">
          <button
            type="button"
            className="contrato-smart-trigger"
            onClick={() => setShowSmartPanel(p => !p)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.1rem' }}>✨</span>
              <span>Autocompletar con IA</span>
              <span className="contrato-smart-pill">Smart</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>
                Pega cualquier texto o datos del cliente
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', opacity: 0.6, transform: showSmartPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              ▼
            </span>
          </button>

          <AnimatePresence>
            {showSmartPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 18px 18px 18px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                    Pega un mensaje de WhatsApp, correo o texto con los datos del cliente. La IA identificará cada campo y lo completará automáticamente.
                  </p>
                  <textarea
                    value={smartFillText}
                    onChange={e => setSmartFillText(e.target.value)}
                    placeholder={'Ejemplo:\n"Juan Pérez, ci 0102030405, cel 0998877665, plan 30 megas, sector Sayausí, dirección calle Principal s/n..."'}
                    rows={4}
                    className="contrato-textarea"
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleSmartFill}
                      disabled={smartFillLoading || !smartFillText.trim()}
                      className="btn btn-primary"
                      style={{ padding: '8px 20px', fontSize: '0.82rem', borderRadius: '10px' }}
                    >
                      {smartFillLoading ? '⏳ Procesando...' : '✨ Interpretar y Completar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SECCIÓN 1: DATOS PERSONALES Y CONTACTO */}
          <div className="contrato-section">
            <div className="contrato-section-header">
              <span>🪪</span>
              <span>DATOS PERSONALES Y CONTACTO</span>
            </div>
            <div className="contrato-grid">
              <div className="contrato-input-group">
                <label className="contrato-label">Nombre Completo (Apellidos y Nombres) *</label>
                <input
                  className="contrato-input"
                  name="nombre"
                  placeholder="Ej. Pérez Gómez Juan Carlos"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contrato-grid-2">
                <div className="contrato-input-group">
                  <label className="contrato-label">Cédula / RUC *</label>
                  <input
                    className="contrato-input"
                    name="cedula"
                    placeholder="0912345678"
                    value={formData.cedula}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="contrato-input-group">
                  <label className="contrato-label">Celular *</label>
                  <input
                    className="contrato-input"
                    name="celular"
                    placeholder="0991234567"
                    value={formData.celular}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="contrato-input-group">
                <label className="contrato-label">Correo Electrónico</label>
                <input
                  className="contrato-input"
                  type="email"
                  name="correo"
                  placeholder="cliente@ejemplo.com"
                  value={formData.correo}
                  onChange={handleChange}
                />
              </div>

              <div className="contrato-input-group">
                <label className="contrato-label">Dirección *</label>
                <input
                  className="contrato-input"
                  name="direccion"
                  placeholder="Calle principal, secundaria y # de casa"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contrato-grid-2">
                <div className="contrato-input-group">
                  <label className="contrato-label">Nodo *</label>
                  <select
                    className="contrato-select"
                    name="nodo"
                    value={formData.nodo}
                    onChange={handleChange}
                    required
                    style={{ appearance: 'none' }}
                  >
                    <option value="">Seleccione nodo</option>
                    {nodosList.map(p => (
                      <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="contrato-input-group">
                  <label className="contrato-label">Parroquia / Locación *</label>
                  <select
                    className="contrato-select"
                    name="parroquia"
                    value={formData.parroquia}
                    onChange={handleChange}
                    required
                    style={{ appearance: 'none' }}
                  >
                    <option value="">Seleccione parroquia</option>
                    {parroquiasList.map(p => (
                      <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PLAN Y SERVICIOS */}
          <div className="contrato-section">
            <div className="contrato-section-header">
              <span>📡</span>
              <span>PLAN Y SERVICIOS</span>
            </div>
            <div className="contrato-grid">
              {!formData.tercera_edad && !formData.plan_corporativo ? (
                <div className="contrato-input-group">
                  <label className="contrato-label">Plan Contratado *</label>
                  <select
                    className="contrato-select"
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    required
                    style={{ appearance: 'none' }}
                  >
                    <option value="">Seleccione plan</option>
                    {planesList.map(p => (
                      <option key={p.id} value={p.nombre}>{p.nombre} - ${p.precio}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="contrato-input-group">
                  <label className="contrato-label">Plan Contratado</label>
                  <input
                    className="contrato-input"
                    name="plan"
                    value={formData.tercera_edad ? 'TERCERA EDAD' : 'CORPORATIVO'}
                    readOnly
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                  />
                </div>
              )}

              <div className="contrato-grid-2">
                <div className="contrato-input-group">
                  <label className="contrato-label">Tiempo de Contrato (meses) *</label>
                  <input
                    className="contrato-input"
                    type="number"
                    name="tiempo"
                    value={formData.tiempo}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div className="contrato-input-group">
                  <label className="contrato-label">Televisión Contratada *</label>
                  <select
                    className="contrato-select"
                    name="tv_tipo"
                    value={formData.tv_tipo}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selectedPlan = planesList.find(p => p.nombre === formData.plan);
                      const baseScreens = val === 'IPTV' ? (selectedPlan?.pantallas || 1) : 0;
                      setFormData({
                        ...formData,
                        tv_tipo: val,
                        iptv_max_conn: baseScreens,
                        plus: '0'
                      });
                    }}
                    required
                    style={{ appearance: 'none' }}
                  >
                    <option value="Ninguno">Ninguno</option>
                    <option value="IPTV">IPTV (Televisión por Internet)</option>
                    <option value="CATV">CATV (Televisión por Cable Coaxial)</option>
                  </select>
                </div>
              </div>

              {formData.tv_tipo === 'IPTV' && (
                <div className="contrato-input-group">
                  <label className="contrato-label">Pantallas IPTV (Adicionales)</label>
                  <input
                    className="contrato-input"
                    type="number"
                    name="iptv_max_conn"
                    value={(() => {
                      const baseScreens = planesList.find(p => p.nombre === formData.plan)?.pantallas || 1;
                      return Math.max(0, formData.iptv_max_conn - baseScreens);
                    })()}
                    onChange={(e) => {
                      const additional = parseInt(e.target.value) || 0;
                      const baseScreens = planesList.find(p => p.nombre === formData.plan)?.pantallas || 1;
                      setFormData({
                        ...formData,
                        iptv_max_conn: baseScreens + additional,
                        plus: (additional * 2).toString()
                      });
                    }}
                    min="0"
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                    Total de pantallas: {formData.iptv_max_conn} (Base plan + Adicionales)
                  </small>
                </div>
              )}

              {(formData.tercera_edad || formData.plan_corporativo) && (
                <div className="contrato-input-group">
                  <label className="contrato-label">
                    {formData.plan_corporativo ? 'Valor Plan Corporativo ($)' : 'Valor Plan Especial ($)'}
                  </label>
                  <input
                    className="contrato-input"
                    type="number"
                    step="0.01"
                    name="precio_plan_especial"
                    value={formData.precio_plan_especial}
                    onChange={handleChange}
                    required
                    placeholder="Precio mensual"
                    style={{ border: `1px solid ${formData.plan_corporativo ? '#818cf8' : '#f59e0b'}` }}
                  />
                </div>
              )}

              {/* CHECKBOX TILES */}
              <div className="contrato-checkbox-grid">
                <label className={`contrato-checkbox-pill ${formData.tercera_edad ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="tercera_edad"
                    checked={formData.tercera_edad}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px', accentColor: '#a78bfa' }}
                  />
                  <span>Tercera Edad</span>
                </label>

                <label className={`contrato-checkbox-pill ${formData.plan_corporativo ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="plan_corporativo"
                    checked={formData.plan_corporativo}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px', accentColor: '#818cf8' }}
                  />
                  <span>Plan Corporativo</span>
                </label>
              </div>

              {/* VIP MAINTENANCE CARD */}
              <label className={`contrato-vip-row ${formData.mantenimiento ? 'active' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🛠️</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>Mantenimiento VIP</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="contrato-vip-tag">+$10.00/mes</span>
                  <input
                    type="checkbox"
                    name="mantenimiento"
                    checked={formData.mantenimiento}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', accentColor: '#ec4899', cursor: 'pointer' }}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* SECCIÓN 3: DIGITALIZACIÓN DE CÉDULA */}
          <div className="contrato-section">
            <div className="contrato-section-header">
              <span>🪪</span>
              <span>DIGITALIZACIÓN DE CÉDULA</span>
            </div>
            <div className="contrato-grid">
              <div className="contrato-input-group">
                <label className="contrato-label">¿Digitalizar Cédula?</label>
                <select
                  className="contrato-select"
                  name="cedula_tipo"
                  value={formData.cedula_tipo}
                  onChange={handleChange}
                  style={{ appearance: 'none' }}
                >
                  <option value="">Seleccione opción</option>
                  <option value="Si">Si (Mandatorio imagenes)</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="contrato-input-group">
                <label className="contrato-label">Foto Cédula Frontal</label>
                <div className="contrato-file-row">
                  <input
                    className="contrato-file-input"
                    placeholder={fileFrontal ? `📎 ${fileFrontal.name || 'Frontal cargada'}` : 'Pegar o arrastrar imagen (Ctrl+V)'}
                    onPaste={(e) => handlePaste(e, setFileFrontal, 'cedula_frontal.jpg')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, setFileFrontal, 'cedula_frontal.jpg')}
                    readOnly
                  />
                  <button
                    type="button"
                    className="contrato-file-btn"
                    onClick={() => document.getElementById('file-frontal').click()}
                  >
                    <span>📁</span> Subir
                  </button>
                </div>
                <input
                  id="file-frontal"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    if (e.target.files[0]) {
                      const f = await processImageFile(e.target.files[0], 'cedula_frontal.jpg');
                      setFileFrontal(f);
                    }
                  }}
                  accept="image/*"
                />
                {fileFrontal && previewFrontal && (
                  <div style={{ position: 'relative', marginTop: '10px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.15)', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                    <img src={previewFrontal} alt="Vista previa frontal" style={{ maxWidth: '100%', maxHeight: '110px', borderRadius: '8px' }} />
                    <button
                      type="button"
                      onClick={() => setFileFrontal(null)}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                    >✕</button>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: '4px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {fileFrontal?.name || 'Imagen Pegada'}
                    </div>
                  </div>
                )}
              </div>

              <div className="contrato-input-group">
                <label className="contrato-label">Foto Cédula Posterior</label>
                <div className="contrato-file-row">
                  <input
                    className="contrato-file-input"
                    placeholder={filePosterior ? `📎 ${filePosterior.name || 'Posterior cargada'}` : 'Pegar o arrastrar imagen (Ctrl+V)'}
                    onPaste={(e) => handlePaste(e, setFilePosterior, 'cedula_posterior.jpg')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, setFilePosterior, 'cedula_posterior.jpg')}
                    readOnly
                  />
                  <button
                    type="button"
                    className="contrato-file-btn"
                    onClick={() => document.getElementById('file-posterior').click()}
                  >
                    <span>📁</span> Subir
                  </button>
                </div>
                <input
                  id="file-posterior"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    if (e.target.files[0]) {
                      const f = await processImageFile(e.target.files[0], 'cedula_posterior.jpg');
                      setFilePosterior(f);
                    }
                  }}
                  accept="image/*"
                />
                {filePosterior && previewPosterior && (
                  <div style={{ position: 'relative', marginTop: '10px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.15)', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                    <img src={previewPosterior} alt="Vista previa posterior" style={{ maxWidth: '100%', maxHeight: '110px', borderRadius: '8px' }} />
                    <button
                      type="button"
                      onClick={() => setFilePosterior(null)}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                    >✕</button>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: '4px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {filePosterior?.name || 'Imagen Pegada'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: GEORREFERENCIACIÓN & NOTAS */}
          <div className="contrato-section">
            <div className="contrato-section-header">
              <span>📍</span>
              <span>GEORREFERENCIACIÓN & NOTAS</span>
            </div>
            <div className="contrato-grid">
              <div className="contrato-input-group">
                <label className="contrato-label">Ubicación</label>
                <input
                  className="contrato-input"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  onPaste={(e) => {
                    const pastedData = e.clipboardData.getData('text').trim();

                    const regexDD = /^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/;
                    const regexURL = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
                    const regexDMS = /(\d+°\d+'\d+\.?\d*"[NS])\s+(\d+°\d+'\d+\.?\d*"[EW])/;

                    let latDecimal, lngDecimal;

                    const matchDD = pastedData.match(regexDD);
                    const matchURL = pastedData.match(regexURL);
                    const matchDMS = pastedData.match(regexDMS);

                    if (matchDD) {
                      latDecimal = parseFloat(matchDD[1]);
                      lngDecimal = parseFloat(matchDD[2]);
                    } else if (matchURL) {
                      latDecimal = parseFloat(matchURL[1]);
                      lngDecimal = parseFloat(matchURL[2]);
                    } else if (matchDMS) {
                      e.preventDefault();
                      const latPart = matchDMS[1];
                      const lngPart = matchDMS[2].replace('°', '° ');
                      setFormData({ ...formData, ubicacion: `${latPart}, ${lngPart}` });
                      return;
                    }

                    if (latDecimal !== undefined && lngDecimal !== undefined) {
                      e.preventDefault();
                      const latDMS = convertToDMS(latDecimal, "lat");
                      const lngDMS = convertToDMS(lngDecimal, "lng");
                      setFormData({ ...formData, ubicacion: `${latDMS}, ${lngDMS.replace('°', '° ')}` });
                    }
                  }}
                  placeholder="Lat, Long (Manual o GPS)"
                />
                <div className="contrato-geo-buttons">
                  <button type="button" className="contrato-geo-btn" onClick={handleConvertManual}>
                    <span>🔄</span> Convertir
                  </button>
                  <button type="button" className="contrato-geo-btn gps" onClick={handleGetGPS}>
                    <span>📍</span> Capturar GPS
                  </button>
                </div>
              </div>

              <div className="contrato-input-group" style={{ marginTop: '6px' }}>
                <label className="contrato-label" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                  <span>Comentarios</span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>
                    (Ordene con un - para que sea más legible y separe con un enter para salto de línea)
                  </span>
                </label>
                <textarea
                  className="contrato-textarea"
                  name="comentarios"
                  value={formData.comentarios}
                  onChange={handleChange}
                  placeholder="Ingrese cualquier observación o comentario relevante para el contrato..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* MENSAJES DE ALERTA */}
          {message && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              marginBottom: '16px',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: message.type === 'success' ? '1px solid #22c55e' : '1px solid #ef4444',
              color: message.type === 'success' ? '#4ade80' : '#f87171',
              whiteSpace: 'pre-line',
              fontSize: '0.85rem',
              lineHeight: '1.5'
            }}>
              {message.type === 'error' ? '⚠️ ' : '✅ '}{typeof message.text === 'string' ? message.text.replace(/^(✅|⚠️)\s*/, '') : message.text}
            </div>
          )}

          {/* BOTÓN CTA REGISTRO */}
          <button className="contrato-submit-btn" type="submit" disabled={loading}>
            <span>✓</span> {loading ? 'Procesando...' : 'Registrar Cliente'}
          </button>
          <div className="contrato-footer-note">
            Verifique los datos ingresados antes de confirmar el registro.
          </div>
        </form>
      </motion.div>

      {/* MODAL INTELIGENTE: PROGRAMAR INSTALACIÓN POST-REGISTRO */}
      <AnimatePresence>
        {showInstModal && instForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(2,6,23,0.95)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass"
              style={{ width: '100%', maxWidth: '700px', padding: '32px 36px', borderRadius: '24px', border: '1px solid rgba(167,139,250,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>Sistema Inteligente</div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>🚀 Programar Instalación</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    Los datos del cliente han sido pre-cargados automáticamente.
                  </p>
                </div>
              </div>

              {/* Chip cliente */}
              <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '14px', padding: '14px 18px', marginBottom: '22px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '1.6rem' }}>👤</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{instForm.nombre_cliente}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                    {instForm.parroquia && <span>📍 {instForm.parroquia} &nbsp;&nbsp;</span>}
                    {instForm.celular_cliente && <span>📱 {instForm.celular_cliente}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Fecha Instalación</label>
                  <input type="date" className="input" value={toISODate(instForm.fecha)} onChange={e => setInstForm({ ...instForm, fecha: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Hora</label>
                  <input type="time" className="input" value={instForm.hora} onChange={e => setInstForm({ ...instForm, hora: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Técnico Responsable</label>
                  <select
                    className="input"
                    value={instForm.tecnico}
                    onChange={e => setInstForm({ ...instForm, tecnico: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: '1px solid rgba(167,139,250,0.4)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '0.85rem'
                    }}
                    required
                  >
                    <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>-- Seleccionar Técnico Responsable --</option>
                    {tecnicosList.map(t => (
                      <option key={t.id || t.username} value={t.username} style={{ background: '#0f172a', color: '#ffffff' }}>
                        👨‍🔧 {t.username} {t.rol ? `(${t.rol})` : ''}
                      </option>
                    ))}
                    {instForm.tecnico && !tecnicosList.some(t => t.username === instForm.tecnico) && (
                      <option value={instForm.tecnico} style={{ background: '#0f172a', color: '#ffffff' }}>
                        👨‍🔧 {instForm.tecnico}
                      </option>
                    )}
                  </select>
                </div>
                {instForm.observacion && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Observaciones (del contrato)</label>
                    <textarea className="input" rows="2" value={instForm.observacion} onChange={e => setInstForm({ ...instForm, observacion: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelarInstalacion}
                  style={{ padding: '10px 16px', fontSize: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', borderRadius: '10px', whiteSpace: 'nowrap' }}
                >
                  Cancelar (Editar Contrato)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInstModal(false)}
                  style={{ padding: '10px 16px', fontSize: '0.85rem', borderRadius: '10px', whiteSpace: 'nowrap' }}
                >
                  Omitir por ahora
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={instSubmitting || !instForm.fecha || !instForm.hora || !instForm.tecnico}
                  style={{ padding: '10px 22px', fontSize: '0.85rem', borderRadius: '10px', whiteSpace: 'nowrap' }}
                  onClick={async () => {
                    setInstSubmitting(true);
                    try {
                      await hojaRutaService.crear({
                        ...instForm,
                        cliente_id: instForm.cliente_id,
                        fecha: normalizeDateInput(instForm.fecha)
                      });
                      setShowInstModal(false);
                      showSuccess(`Instalación programada exitosamente para ${instForm.nombre_cliente}. Ya aparece en la Hoja de Ruta.`);
                    } catch (err) {
                      const detail = err.response?.data?.detail;
                      const msg = typeof detail === 'string' ? detail : 'Error al programar la instalación.';
                      showError(msg);
                    } finally {
                      setInstSubmitting(false);
                    }
                  }}
                >
                  {instSubmitting ? 'Programando...' : '📅 Enviar a Hoja de Ruta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Ventas;