import React, { useState, useEffect, useMemo } from 'react';
import { clienteService, configuracionService, hojaRutaService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Ventas = () => {
  const [nodosList, setNodosList] = useState([]);
  const [parroquiasList, setParroquiasList] = useState([]);
  const [planesList, setPlanesList] = useState([]);

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const [paRes, ppRes, plRes] = await Promise.all([
          configuracionService.getNodos(),
          configuracionService.getParroquias(),
          configuracionService.getPlanes()
        ]);
        setNodosList(paRes.data);
        setParroquiasList(ppRes.data);
        setPlanesList(plRes.data);
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
    iptv_max_conn: 1,
    tiempo: '24',
    cedula_tipo: '',
    ubicacion: '',
    tercera_edad: false,
    plan_corporativo: false,
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

  const handlePaste = (e, setFile) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        setFile(file);
        break;
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
      const baseScreens = selectedPlan?.pantallas || 1;
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
        alert("Error al obtener ubicación. Asegúrate de dar permisos.");
      });
    } else {
      alert("Geolocalización no disponible en este navegador.");
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
      alert("Formato inválido. Asegúrate de usar: latitud, longitud (Ej: -2.93, -79.04)");
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
    let clienteId = null;
    try {
      const response = await clienteService.crear(formData);
      clienteId = response.data.id;

      // Subir fotos si existen
      if (fileFrontal || filePosterior) {
        try {
          const uploadData = new FormData();
          if (fileFrontal) uploadData.append('frontal', fileFrontal);
          if (filePosterior) uploadData.append('posterior', filePosterior);
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
        direccion: '', nodo: '', parroquia: '', plan: '', plus: '0', iptv_max_conn: 0, tiempo: '12',
        cedula_tipo: '', ubicacion: '',
        tercera_edad: false,
        plan_corporativo: false,
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
    if (confirm("¿Desea cancelar y seguir detallando el contrato? El cliente recién registrado se eliminará para que pueda continuar editando.")) {
      try {
        await clienteService.eliminar(instForm.cliente_id);
        if (backupFormData) {
          setFormData(backupFormData);
        }
        setShowInstModal(false);
        setMessage({ type: 'info', text: 'Se ha restaurado el formulario del contrato para que continúe trabajando.' });
      } catch (err) {
        alert("Error al eliminar el cliente temporal: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  // Cálculo de Prorrateo en tiempo real (misma fórmula que el backend)
  const prorrateo = useMemo(() => {
    let tarifa = 0;
    if (formData.tercera_edad || formData.plan_corporativo) {
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
  }, [formData.plan, formData.precio_plan_especial, formData.tercera_edad, formData.plan_corporativo, formData.fecha_firma, planesList]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glass"
        style={{ position: 'relative' }}
      >
        {/* WIDGET PRORRATEO - Esquina superior derecha */}
        {prorrateo && (
          <div style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'rgba(129, 140, 248, 0.08)',
            border: '1px solid rgba(129, 140, 248, 0.35)',
            borderRadius: '14px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backdropFilter: 'blur(12px)',
            zIndex: 10
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.55rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '2px' }}>
                Pago Inicial
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>
                ${prorrateo.monto}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(129, 140, 248, 0.25)', paddingLeft: '12px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {prorrateo.activeDays} de {prorrateo.totalDays} días
              </div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                Plan: ${prorrateo.tarifa}/mes
              </div>
            </div>
          </div>
        )}

        <h1 style={{ marginBottom: '16px', fontSize: '1.8rem' }}>Registro de Nuevo Cliente</h1>

        {/* PANEL IA: AUTOCOMPLETAR */}
        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setShowSmartPanel(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: showSmartPanel ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.06)',
              border: '1px solid rgba(167,139,250,0.35)',
              borderRadius: '12px', padding: '8px 18px', cursor: 'pointer',
              color: '#a78bfa', fontSize: '0.82rem', fontWeight: 700,
              transition: 'all 0.2s', letterSpacing: '0.03em'
            }}
          >
            <span style={{ fontSize: '1rem' }}>✨</span>
            Autocompletar con IA
            <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 400 }}>Pega cualquier texto o datos del cliente</span>
            <span style={{ marginLeft: '4px', opacity: 0.5 }}>{showSmartPanel ? '▲' : '▼'}</span>
          </button>

          <AnimatePresence>
            {showSmartPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  marginTop: '12px', background: 'rgba(167,139,250,0.05)',
                  border: '1px solid rgba(167,139,250,0.2)', borderRadius: '16px', padding: '18px'
                }}>
                  <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                    Pega un mensaje de WhatsApp, un correo, una hoja de cálculo, o cualquier texto con los datos del cliente. La IA identificará cada campo y lo asignará automáticamente.
                  </p>
                  <textarea
                    value={smartFillText}
                    onChange={e => setSmartFillText(e.target.value)}
                    placeholder={'Ejemplo:\n"Juan Pérez, ci 0102030405, cel 0998877665, plan 30 megas, sector Sayausí, dirección calle Principal s/n..."'}
                    rows={5}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.25)',
                      borderRadius: '10px', color: 'white', padding: '12px',
                      fontFamily: 'inherit', fontSize: '0.82rem', resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleSmartFill}
                      disabled={smartFillLoading || !smartFillText.trim()}
                      className="btn btn-primary"
                      style={{ padding: '9px 22px', fontSize: '0.82rem' }}
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
          <div className="grid-responsive" style={{ gap: '20px' }}>
            <div className="input-group">
              <label className="label">Nombre Completo (Apellidos y Nombres)</label>
              <input className="input" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="label">Cédula / RUC</label>
              <input className="input" name="cedula" value={formData.cedula} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="label">Celular</label>
              <input className="input" name="celular" value={formData.celular} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="label">Correo Electrónico</label>
              <input className="input" type="email" name="correo" value={formData.correo} onChange={handleChange} />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="label">Dirección</label>
              <input className="input" name="direccion" value={formData.direccion} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="label">Nodo</label>
              <select className="input" name="nodo" value={formData.nodo} onChange={handleChange} required style={{ appearance: 'none' }}>
                <option value="">Seleccione nodo</option>
                {nodosList.map(p => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="label">Parroquia / Locación</label>
              <select className="input" name="parroquia" value={formData.parroquia} onChange={handleChange} required style={{ appearance: 'none' }}>
                <option value="">Seleccione parroquia</option>
                {parroquiasList.map(p => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            </div>
            {!formData.tercera_edad && !formData.plan_corporativo ? (
              <div className="input-group">
                <label className="label">Plan Contratado</label>
                <select className="input" name="plan" value={formData.plan} onChange={handleChange} required style={{ appearance: 'none' }}>
                  <option value="">Seleccione plan</option>
                  {planesList.map(p => (
                    <option key={p.id} value={p.nombre}>{p.nombre} - ${p.precio}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="input-group">
                <label className="label">Plan Contratado</label>
                <input className="input" name="plan" value={formData.tercera_edad ? 'TERCERA EDAD' : 'CORPORATIVO'} readOnly style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} />
              </div>
            )}
            <div className="input-group">
              <label className="label">Tiempo de Contrato </label>
              <input className="input" type="number" name="tiempo" value={formData.tiempo} onChange={handleChange} min="0" required />
            </div>
            <div className="input-group">
              <label className="label">Pantallas IPTV (Pantallas adicionales)</label>
              <input
                className="input"
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
            </div>
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  name="tercera_edad"
                  checked={formData.tercera_edad}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px' }}
                />
                Tercera Edad
              </label>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  name="plan_corporativo"
                  checked={formData.plan_corporativo}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#818cf8' }}
                />
                Plan Corporativo
              </label>
            </div>
            {(formData.tercera_edad || formData.plan_corporativo) && (
              <div className="input-group">
                <label className="label">
                  {formData.plan_corporativo ? 'Valor Plan Corporativo ($)' : 'Valor Plan Especial ($)'}
                </label>
                <input
                  className="input"
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
            <div className="input-group">
              <label className="label">¿Digitalizar Cédula?</label>
              <select className="input" name="cedula_tipo" value={formData.cedula_tipo} onChange={handleChange} style={{ appearance: 'none' }}>
                <option value="">Seleccione opción</option>
                <option value="Si">Si (Mandatorio imagenes)</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="input-group">
              <label className="label">Foto Cédula Frontal</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  className="input"
                  placeholder="Pegar imagen (Ctrl+V)"
                  style={{ flex: 1, marginBottom: 0 }}
                  onPaste={(e) => handlePaste(e, setFileFrontal)}
                  readOnly
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap', padding: '0 15px', height: '42px' }}
                  onClick={() => document.getElementById('file-frontal').click()}
                >
                  📁 Subir
                </button>
              </div>
              <input
                id="file-frontal"
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => setFileFrontal(e.target.files[0])}
                accept="image/*"
              />
              {fileFrontal && previewFrontal && (
                <div style={{ position: 'relative', marginTop: '10px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                  <img src={previewFrontal} alt="Vista previa frontal" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }} />
                  <button
                    type="button"
                    onClick={() => setFileFrontal(null)}
                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                  >✕</button>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '4px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fileFrontal?.name || 'Imagen Pegada'}
                  </div>
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="label">Foto Cédula Posterior</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  className="input"
                  placeholder="Pegar imagen (Ctrl+V)"
                  style={{ flex: 1, marginBottom: 0 }}
                  onPaste={(e) => handlePaste(e, setFilePosterior)}
                  readOnly
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap', padding: '0 15px', height: '42px' }}
                  onClick={() => document.getElementById('file-posterior').click()}
                >
                  📁 Subir
                </button>
              </div>
              <input
                id="file-posterior"
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => setFilePosterior(e.target.files[0])}
                accept="image/*"
              />
              {filePosterior && previewPosterior && (
                <div style={{ position: 'relative', marginTop: '10px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                  <img src={previewPosterior} alt="Vista previa posterior" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }} />
                  <button
                    type="button"
                    onClick={() => setFilePosterior(null)}
                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                  >✕</button>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '4px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {filePosterior?.name || 'Imagen Pegada'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="label">Ubicación</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                className="input"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                onPaste={(e) => {
                  const pastedData = e.clipboardData.getData('text').trim();

                  // 1. Detectar coordenadas decimales: -2.930955, -79.045381
                  const regexDD = /^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/;
                  // 2. Extraer de URL de Google Maps: .../@-2.930955,-79.045381,15z
                  const regexURL = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
                  // 3. Detectar DMS estándar (Google Maps): 2°55'51.4"S 79°02'43.4"W
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
                    // Si ya es DMS, solo ajustamos el formato (coma y espacio)
                    const latPart = matchDMS[1];
                    const lngPart = matchDMS[2].replace('°', '° ');
                    setFormData({ ...formData, ubicacion: `${latPart}, ${lngPart}` });
                    return;
                  }

                  if (latDecimal !== undefined && lngDecimal !== undefined) {
                    e.preventDefault();
                    const latDMS = convertToDMS(latDecimal, "lat");
                    const lngDMS = convertToDMS(lngDecimal, "lng");
                    // Ajustar el formato: 2°55'51.44"S, 79° 2'43.37"W
                    setFormData({ ...formData, ubicacion: `${latDMS}, ${lngDMS.replace('°', '° ')}` });
                  }
                }}
                placeholder="Lat, Long (Manual o GPS)"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary" onClick={handleConvertManual} style={{ padding: '0 15px', height: '42px', fontSize: '0.8rem' }}>🔄 Convertir</button>
              <button type="button" className="btn btn-secondary" onClick={handleGetGPS} style={{ padding: '0 15px', height: '42px' }}>📍 GPS</button>
            </div>
          </div>

          <div className="input-group" style={{ gridColumn: 'span 2', marginTop: '10px' }}>
            <label className="label">Comentarios (Ordenar con un - para que sea mas legible y separar con un enter para salto de linea)</label>
            <textarea
              className="input"
              name="comentarios"
              value={formData.comentarios}
              onChange={handleChange}
              placeholder="Ingrese cualquier observación o comentario relevante para el contrato..."
              rows="3"
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>
          {message && (
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: message.type === 'success' ? '1px solid #22c55e' : '1px solid #ef4444',
              color: message.type === 'success' ? '#4ade80' : '#f87171',
              whiteSpace: 'pre-line',
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              {message.type === 'error' ? '⚠️ ' : '✅ '}{message.text}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Procesando...' : 'Registrar Cliente'}
            </button>
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
              style={{ width: '100%', maxWidth: '620px', padding: '36px', borderRadius: '24px', border: '1px solid rgba(167,139,250,0.3)' }}
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
                  <input type="date" className="input" value={instForm.fecha} onChange={e => setInstForm({ ...instForm, fecha: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Hora</label>
                  <input type="time" className="input" value={instForm.hora} onChange={e => setInstForm({ ...instForm, hora: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Técnico Responsable</label>
                  <input className="input" value={instForm.tecnico} onChange={e => setInstForm({ ...instForm, tecnico: e.target.value })} placeholder="Nombre del técnico asignado" style={{ width: '100%', boxSizing: 'border-box' }} required />
                </div>
                {instForm.observacion && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Observaciones (del contrato)</label>
                    <textarea className="input" rows="2" value={instForm.observacion} onChange={e => setInstForm({ ...instForm, observacion: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelarInstalacion}
                  style={{ padding: '10px 22px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                >
                  Cancelar (Editar Contrato)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInstModal(false)}
                  style={{ padding: '10px 22px' }}
                >
                  Omitir por ahora
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={instSubmitting || !instForm.fecha || !instForm.hora || !instForm.tecnico}
                  style={{ padding: '10px 28px' }}
                  onClick={async () => {
                    setInstSubmitting(true);
                    try {
                      await hojaRutaService.crear({
                        ...instForm,
                        cliente_id: instForm.cliente_id
                      });
                      setShowInstModal(false);
                      setMessage({ type: 'success', text: `✅ Instalación programada exitosamente para ${instForm.nombre_cliente}. Ya aparece en la Hoja de Ruta.` });
                    } catch (err) {
                      const detail = err.response?.data?.detail;
                      const msg = typeof detail === 'string' ? detail : 'Error al programar la instalación.';
                      alert('Error: ' + msg);
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