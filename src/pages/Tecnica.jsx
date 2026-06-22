import React, { useEffect, useState } from 'react';
import { clienteService, configuracionService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Tecnica = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [formData, setFormData] = useState({
    mac: '',
    puerto: '', ont: '', servicio: '', breach: '',
    id_port: '', service_port: '', ip: '',
    dispositivo: '', potencia: '', nap: '',
    ubicacion: '', tecnico: '', activador: '',
    red: '', clave: '',
    plus: '0',
    iptv_activar: false,
    iptv_user: '', iptv_pass: '', iptv_bouquets: '[]',
    iptv_exp_date: '', iptv_max_conn: 1, iptv_outputs: '[]',
    iptv_notes: '', iptv_member_id: 1
  });
  const [hasBreach, setHasBreach] = useState(false);
  const [editUbicacion, setEditUbicacion] = useState(false);
  const [searchPendientes, setSearchPendientes] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error

  const [nodosList, setNodosList] = useState([]);
  const [puertosList, setPuertosList] = useState([]);
  const [planesList, setPlanesList] = useState([]);
  const [cajasNapList, setCajasNapList] = useState([]);

  const fetchData = async () => {
    try {
      const response = await clienteService.listar();
      setClientes(response.data.filter(c =>
        c.estado?.toUpperCase() === 'EN ACTIVACIÓN' ||
        c.estado?.toUpperCase() === 'PENDIENTE'
      ).sort((a, b) => a.id - b.id));

      const [paRes, puRes, plRes, cnRes] = await Promise.all([
        configuracionService.getNodos(),
        configuracionService.getPuertos(),
        configuracionService.getPlanes(),
        configuracionService.getCajasNap().catch(() => ({ data: [] }))
      ]);
      setNodosList(paRes.data);
      setPuertosList(puRes.data);
      setPlanesList(plRes.data);
      setCajasNapList(cnRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // AUTO-SAVE EFFECT
  useEffect(() => {
    if (!selectedCliente) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await clienteService.actualizar(selectedCliente.id, {
          ...formData,
          breach: hasBreach ? formData.breach : 'NONE'
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error("Auto-save error:", error);
        setSaveStatus('error');
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [formData, hasBreach, selectedCliente]);

  // Realiza la consulta centralizada al backend y recibe las fórmulas GPON resueltas
  const fetchValoresTecnicos = async (puerto, mac, breach) => {
    if (!puerto || !selectedCliente?.nodo) return;
    try {
      const res = await clienteService.getNextTecnicoValues(
        selectedCliente.nodo,
        puerto,
        mac || '',
        selectedCliente.nombre || '',
        breach,
        selectedCliente.id || ''
      );
      const d = res.data;
      setFormData(prev => ({
        ...prev,
        id_port: d.id_port || '',
        service_port: d.service_port || '',
        ip: d.ip || '',
        ont: d.ont || '',
        servicio: d.servicio || '',
        breach: d.breach || ''
      }));
    } catch (error) {
      console.error("Error al obtener valores técnicos:", error);
    }
  };

  const handleSelect = (cliente) => {
    setSelectedCliente(cliente);
    setHasBreach(false);
    setEditUbicacion(false);

    const hasIptv = (cliente.iptv_max_conn || 0) > 0 || (parseFloat(cliente.plus || 0) > 0);

    // Generar username: ID + Primer Apellido + Primera Letra Nombre
    const nameParts = (cliente.nombre || '').trim().split(' ').filter(p => p.length > 0);
    let generatedUser = cliente.id.toString();
    if (nameParts.length >= 2) {
      generatedUser += nameParts[0].toLowerCase() + nameParts[1][0].toLowerCase();
    } else if (nameParts.length === 1) {
      generatedUser += nameParts[0].toLowerCase();
    }

    setFormData({
      mac: '',
      puerto: '', ont: '', servicio: '', breach: '',
      id_port: '', service_port: '', ip: '',
      dispositivo: '', potencia: '', nap: '',
      ubicacion: cliente.ubicacion || '',
      tecnico: '', activador: '',
      red: '', clave: '',
      plus: cliente.plus || '0',
      iptv_activar: hasIptv,
      iptv_user: hasIptv ? generatedUser : '',
      iptv_pass: hasIptv ? 'TV' + new Date().getFullYear() + '.@' : '',
      iptv_bouquets: hasIptv ? '[1,2,5]' : '[]',
      iptv_exp_date: hasIptv ? 'Nunca' : '',
      // Prioritize the calculated screen count if plus is set, otherwise use stored iptv_max_conn
      iptv_max_conn: (() => {
        const baseScreens = planesList.find(p => p.nombre === cliente.plan)?.pantallas || 1;
        return (parseFloat(cliente.plus || 0) > 0) ? (parseFloat(cliente.plus || 0) / 2 + baseScreens) : (cliente.iptv_max_conn || baseScreens);
      })(),
      iptv_outputs: hasIptv ? '[1,2]' : '[]',
      iptv_notes: '', iptv_member_id: 1
    });
  };

  const handlePuertoChange = (e) => {
    const puerto = e.target.value;
    setFormData(prev => ({ ...prev, puerto }));
    fetchValoresTecnicos(puerto, formData.mac, hasBreach);
  };


  const handleBreachChange = (e) => {
    const val = e.target.value === 'SI';
    setHasBreach(val);
    if (formData.puerto) {
      fetchValoresTecnicos(formData.puerto, formData.mac, val);
    }
  };

  const convertToDMS = (lat, lng) => {
    const toDMS = (val, isLat) => {
      const absVal = Math.abs(val);
      const degrees = Math.floor(absVal);
      const minutesDecimal = (absVal - degrees) * 60;
      const minutes = Math.floor(minutesDecimal);
      const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

      let direction = "";
      if (isLat) {
        direction = val < 0 ? "S" : "N";
      } else {
        direction = val < 0 ? "W" : "E";
      }

      return `${degrees}°${minutes}'${seconds}''${direction}`;
    };

    return `${toDMS(lat, true)} ${toDMS(lng, false)}`;
  };

  const handleIptvToggle = (e) => {
    const checked = e.target.checked;

    // Si se deselecciona, quitamos el costo y las pantallas del cliente (requerimiento user)
    if (!checked) {
      setSelectedCliente(prev => ({ ...prev, plus: "0", iptv_max_conn: 0 }));
    }

    // Generar username: ID + Primer Apellido + Primera Letra Nombre
    const nameParts = (selectedCliente.nombre || '').trim().split(' ').filter(p => p.length > 0);
    let generatedUser = selectedCliente.id.toString();
    if (nameParts.length >= 2) {
      generatedUser += nameParts[0].toLowerCase() + nameParts[1][0].toLowerCase();
    } else if (nameParts.length === 1) {
      generatedUser += nameParts[0].toLowerCase();
    }

    setFormData(prev => ({
      ...prev,
      iptv_activar: checked,
      iptv_exp_date: checked ? 'Nunca' : '',
      iptv_user: checked ? generatedUser : '',
      iptv_pass: checked ? 'TV' + new Date().getFullYear() + '.@' : '',
      iptv_member_id: 1,
      iptv_bouquets: checked ? '[1,2,5]' : '[]',
      iptv_outputs: checked ? '[1,2]' : '[]',
      // Prefer calculation from plus if it exists, otherwise use stored value
      // Las extras se calculan del valor 'plus' sumado a las base del plan
      iptv_max_conn: checked ? (() => {
        const baseScreens = planesList.find(p => p.nombre === selectedCliente.plan)?.pantallas || 1;
        return (parseFloat(selectedCliente.plus || 0) > 0) ? (parseFloat(selectedCliente.plus || 0) / 2 + baseScreens) : baseScreens;
      })() : 0,
      plus: checked ? (selectedCliente.plus || '0') : '0'
    }));
  };

  const getIptvScript = (data) => {
    if (!data.iptv_activar) return '';
    const useExp = data.iptv_exp_date && data.iptv_exp_date !== 'Nunca';
    return `INSERT INTO lines (
  member_id, username, password, bouquet, allowed_outputs, max_connections,
  admin_enabled, enabled, ${useExp ? 'exp_date, ' : ''}is_restreamer, is_trial, is_mag, is_e2, is_stalker, is_isplock,
  allowed_ips, allowed_ua, created_at, force_server_id, bypass_ua
) VALUES (
  ${data.iptv_member_id || 1}, '${data.iptv_user}', '${data.iptv_pass}', '${data.iptv_bouquets}', '${data.iptv_outputs}', ${data.iptv_max_conn},
  1, 1, ${useExp ? "UNIX_TIMESTAMP() + (30 * 86400), " : ""}0, 0, 0, 0, 0, 0, '[]', '[]', UNIX_TIMESTAMP(), 0, 0
);`;
  };

  const handleBouquetChange = (id) => {
    let current = [];
    try { current = JSON.parse(formData.iptv_bouquets || '[]'); } catch (e) { current = []; }
    if (current.includes(id)) {
      current = current.filter(b => b !== id);
      if (id === 10) current = current.filter(b => b !== 14); // Desactivar 14 si se desactiva 10
    } else {
      current.push(id);
      if (id === 10 && !current.includes(14)) current.push(14); // Activar 14 si se activa 10
    }
    setFormData(prev => ({ ...prev, iptv_bouquets: JSON.stringify(current) }));
  };

  const handleOutputChange = (id) => {
    let current = [];
    try { current = JSON.parse(formData.iptv_outputs || '[]'); } catch (e) { current = []; }
    if (current.includes(id)) {
      current = current.filter(o => o !== id);
    } else {
      current.push(id);
    }
    setFormData(prev => ({ ...prev, iptv_outputs: JSON.stringify(current) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'ubicacion' && value.includes(',')) {
      const parts = value.split(',').map(p => p.trim());
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        if (!isNaN(lat) && !isNaN(lng)) {
          const dms = convertToDMS(lat, lng);
          setFormData({ ...formData, [name]: dms });
          return;
        }
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación manual de campos obligatorios
    const requiredKeys = [
      'puerto', 'ont', 'servicio', 'id_port', 'service_port', 'ip',
      'dispositivo', 'potencia', 'nap', 'tecnico', 'activador', 'red', 'clave',
      'ubicacion'
    ];
    if (hasBreach) requiredKeys.push('breach');

    // IPTV Validations
    if (formData.iptv_activar) {
      requiredKeys.push('iptv_user', 'iptv_pass', 'iptv_bouquets', 'iptv_exp_date', 'iptv_member_id', 'iptv_max_conn', 'iptv_outputs');
    }

    const hayCamposVacios = requiredKeys.some(key => !formData[key]?.toString().trim());

    if (hayCamposVacios) {
      alert('¡Error! Todos los campos técnicos del formulario deben estar llenos para completar la activación.');
      return;
    }

    try {
      console.log("Activando cliente con ID:", selectedCliente.id);
      console.log("Datos enviados (formData):", formData);
      await clienteService.activar(selectedCliente.id, formData);
      alert('Configuración exitosa. Cliente activado.');
      setSelectedCliente(null);
      fetchData();
    } catch (error) {
      console.error("Error completo de activación:", error.response?.data);
      let detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        // Errores de validación Pydantic (422)
        const msg = detail.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join('\n');
        alert(`Error de validación:\n${msg}`);
      } else {
        // Errores controlados por el backend (400, 404, etc)
        alert(detail || 'Error en la activación. Verifique los datos duplicados (MAC, IP, etc).');
      }
    }
  };

  const getPuertosDisponibles = () => {
    if (!selectedCliente || !selectedCliente.nodo) return [];
    const nodoObj = nodosList.find(p => p.nombre.toUpperCase() === selectedCliente.nodo.toUpperCase());
    if (!nodoObj) return [];
    return puertosList.filter(p => p.nodo_id === nodoObj.id);
  };

  return (
    <div className={`tecnica-layout ${selectedCliente ? 'has-selected' : ''}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass tecnica-list">
        <h2 style={{ marginBottom: '16px' }}>Pendientes de Activación</h2>
        <div style={{ marginBottom: '16px' }}>
          <input
            className="input"
            placeholder="🔍 Buscar pendiente..."
            value={searchPendientes}
            onChange={(e) => setSearchPendientes(e.target.value)}
            style={{ width: '100%', fontSize: '0.9rem' }}
          />
        </div>
        {clientes.filter(c =>
          c.nombre.toLowerCase().includes(searchPendientes.toLowerCase()) ||
          c.id.toString().includes(searchPendientes)
        ).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay pendientes de activación.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clientes.filter(c =>
              c.nombre.toLowerCase().includes(searchPendientes.toLowerCase()) ||
              c.id.toString().includes(searchPendientes)
            ).map(c => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className="glass"
                style={{
                  padding: '12px', cursor: 'pointer', borderRadius: '12px',
                  border: selectedCliente?.id === c.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: selectedCliente?.id === c.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)'
                }}
              >
                <strong style={{ color: 'var(--text-main)' }}>{c.id} - {c.nombre}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.plan} | {c.nodo}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedCliente && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-card glass"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="page-header" style={{ marginBottom: '20px' }}>
              <div className="page-header-info">
                <h3 style={{ margin: 0 }}>Configuración Técnica: {selectedCliente.nombre}</h3>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  {saveStatus === 'saving' && <span style={{ color: 'var(--primary)' }}>⏳ Guardando cambios...</span>}
                  {saveStatus === 'saved' && <span style={{ color: '#4ade80' }}>✔ Cambios guardados</span>}
                  {saveStatus === 'error' && <span style={{ color: '#f87171' }}>⚠️ Error al auto-guardar</span>}
                  {saveStatus === 'idle' && <span style={{ color: 'var(--text-muted)' }}>Autoguardado activo</span>}
                </div>
              </div>
              <button className="btn btn-secondary tecnica-back-btn" onClick={() => setSelectedCliente(null)}>Atrás</button>
            </div>

            <form onSubmit={handleSubmit} className="grid-responsive" style={{ gap: '12px' }}>


              <div className="input-group">
                <label className="label">Puerto (Zona: {selectedCliente.nodo})</label>
                <select className="input" name="puerto" value={formData.puerto} onChange={handlePuertoChange} required style={{ appearance: 'none', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-main)' }}>
                  <option value="">Seleccione Puerto</option>
                  {getPuertosDisponibles().map(p => (
                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                  ))}
                </select>
                {getPuertosDisponibles().length === 0 && (
                  <span style={{ color: '#f59e0b', fontSize: '0.7rem', marginTop: '4px' }}>
                    ⚠️ Este nodo no tiene puertos. Vaya a Configuraciones → Puertos para añadir uno.
                  </span>
                )}
              </div>

              <div className="input-group">
                <label className="label">¿Tiene Bridge?</label>
                <select
                  className="input"
                  value={hasBreach ? 'SI' : 'NO'}
                  onChange={handleBreachChange}
                  style={{ appearance: 'none', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-main)' }}
                >
                  <option value="NO">NO</option>
                  <option value="SI">SÍ</option>
                </select>
              </div>

              {/* Las textareas de ONT, Servicio y Breach se han movido a la página de ONT según requerimiento */}

              <div className="input-group">
                <label className="label">ID Port</label>
                <input
                  className="input"
                  name="id_port"
                  value={formData.id_port}
                  readOnly
                  style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div className="input-group">
                <label className="label">Service Port (Sistema)</label>
                <input
                  className="input"
                  name="service_port"
                  value={formData.service_port}
                  readOnly
                  style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div className="input-group">
                <label className="label">IP (Sistema)</label>
                <input
                  className="input"
                  name="ip"
                  value={formData.ip}
                  readOnly
                  style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div className="input-group">
                <label className="label">Dispositivo</label>
                <input className="input" name="dispositivo" value={formData.dispositivo} onChange={handleChange} required placeholder="Modelo router" />
              </div>

              <div className="input-group">
                <label className="label">Potencia (Rango: -6 a -24)</label>
                <input
                  className="input"
                  name="potencia"
                  value={formData.potencia}
                  onChange={handleChange}
                  required
                  placeholder="-21.5"
                  style={{
                    borderColor: (() => {
                      const val = parseFloat(formData.potencia?.replace(',', '.'));
                      if (isNaN(val)) return 'var(--glass-border)';
                      return (val < -27 || val > -6) ? '#f87171' : '#4ade80';
                    })(),
                    outline: 'none'
                  }}
                />
                {(() => {
                  const val = parseFloat(formData.potencia?.replace(',', '.'));
                  if (isNaN(val) && formData.potencia) return <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px' }}>Formato inválido</span>;
                  if (val < -27 || val > -6) return (
                    <span style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold' }}>
                      ⚠️ Rango Permitido: -6.0 a -27.0
                    </span>
                  );
                  return null;
                })()}
              </div>

              <div className="input-group">
                <label className="label">Caja NAP</label>
                <select
                  className="input"
                  name="nap"
                  value={formData.nap}
                  onChange={handleChange}
                  required
                  style={{ appearance: 'none', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-main)' }}
                >
                  <option value="">Seleccione Caja NAP...</option>
                  {(() => {
                    const nodoObj = nodosList.find(n => n.nombre?.toUpperCase() === selectedCliente?.nodo?.toUpperCase());
                    const cajasFiltradas = nodoObj
                      ? cajasNapList.filter(c => c.nodo_id === nodoObj.id)
                      : cajasNapList;
                    return cajasFiltradas.map(c => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ));
                  })()}
                  {formData.nap && !cajasNapList.some(c => c.nombre === formData.nap) && (
                    <option value={formData.nap}>{formData.nap}</option>
                  )}
                </select>
                {(() => {
                  const nodoObj = nodosList.find(n => n.nombre?.toUpperCase() === selectedCliente?.nodo?.toUpperCase());
                  const cajasFiltradas = nodoObj ? cajasNapList.filter(c => c.nodo_id === nodoObj.id) : cajasNapList;
                  if (cajasFiltradas.length === 0) return (
                    <span style={{ color: '#f59e0b', fontSize: '0.7rem', marginTop: '4px' }}>
                      ⚠️ Sin cajas para este nodo. Añádalas en Configuraciones → Cajas NAP.
                    </span>
                  );
                  return null;
                })()}
              </div>

              <div className="input-group">
                <label className="label">Técnico</label>
                <input className="input" name="tecnico" value={formData.tecnico} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label className="label">Activador</label>
                <input className="input" name="activador" value={formData.activador} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label className="label">Red</label>
                <input className="input" name="red" value={formData.red} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label className="label">Clave</label>
                <input className="input" name="clave" value={formData.clave} onChange={handleChange} required />
              </div>

              {/* IPTV ACTIVATION SECTION */}
              <div className="input-group grid-span-2" style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: formData.iptv_activar ? '16px' : '0' }}>
                  <input
                    type="checkbox"
                    id="activar_iptv"
                    checked={formData.iptv_activar}
                    onChange={handleIptvToggle}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#var(--primary)' }}
                  />
                  <label htmlFor="activar_iptv" style={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', color: '#818cf8' }}>
                    ACTIVAR IPTV
                  </label>
                </div>

                {formData.iptv_activar && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid-responsive" style={{ gap: '12px' }}>
                    <div className="input-group">
                      <label className="label">IPTV Username</label>
                      <input className="input" name="iptv_user" value={formData.iptv_user} onChange={handleChange} placeholder="Username" />
                    </div>
                    <div className="input-group">
                      <label className="label">IPTV Password</label>
                      <input className="input" name="iptv_pass" value={formData.iptv_pass} onChange={handleChange} placeholder="Password" />
                    </div>
                    <div className="input-group">
                      <label className="label">Expiración </label>
                      <input className="input" name="iptv_exp_date" value={formData.iptv_exp_date} onChange={handleChange} placeholder="YYYY-MM-DD HH:mm" />
                    </div>
                    <div className="input-group">
                      <label className="label">IPTV Owner (member_id)</label>
                      <input className="input" type="number" name="iptv_member_id" value={formData.iptv_member_id} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label className="label">Conexiones Máximas</label>
                      <input className="input" type="number" name="iptv_max_conn" value={formData.iptv_max_conn} onChange={handleChange} />
                    </div>

                    <div className="input-group grid-span-2">
                      <label className="label">Bouquets (Plan de Canales)</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        {[
                          { id: 1, label: 'TV EN VIVO' },
                          { id: 2, label: 'PELÍCULAS' },
                          { id: 5, label: 'SERIES' },
                          { id: 10, label: 'TV ADULTOS (+14)' }
                        ].map(b => (
                          <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input
                              type="checkbox"
                              checked={JSON.parse(formData.iptv_bouquets || '[]').includes(b.id)}
                              onChange={() => handleBouquetChange(b.id)}
                            />
                            {b.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="input-group grid-span-2">
                      <label className="label">Access Outputs</label>
                      <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        {[
                          { id: 1, label: 'HLS' },
                          { id: 2, label: 'MPEGTS' },
                          { id: 3, label: 'RTMP' }
                        ].map(o => (
                          <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input
                              type="checkbox"
                              checked={JSON.parse(formData.iptv_outputs || '[]').includes(o.id)}
                              onChange={() => handleOutputChange(o.id)}
                            />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="input-group grid-span-2">
                      <label className="label">Admin Notes</label>
                      <textarea className="input" name="iptv_notes" value={formData.iptv_notes} onChange={handleChange} style={{ height: '60px' }} />
                    </div>

                    <div className="input-group grid-span-2" style={{ marginTop: '10px' }}>
                      <label className="label" style={{ color: '#818cf8', display: 'flex', justifyContent: 'space-between' }}>
                        Script de Activación (SQL)
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(getIptvScript(formData));
                            alert('Script copiado al portapapeles');
                          }}
                          style={{ background: 'rgba(129, 140, 248, 0.2)', border: '1px solid #818cf8', color: '#818cf8', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Copiar Script
                        </button>
                      </label>
                      <pre style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#c7d2fe',
                        overflowX: 'auto',
                        border: '1px solid rgba(129, 140, 248, 0.3)',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {getIptvScript(formData)}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="input-group grid-span-2">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label">Ubicación GPS (Copiada del Contrato)</label>
                  <button
                    type="button"
                    onClick={() => setEditUbicacion(!editUbicacion)}
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      background: editUbicacion ? '#ef444455' : '#3b82f655',
                      color: editUbicacion ? '#fca5a5' : '#93c5fd',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {editUbicacion ? 'Bloquear' : 'Modificar Ubicación'}
                  </button>
                </div>
                <input
                  className="input"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  readOnly={!editUbicacion}
                  style={{
                    background: !editUbicacion ? '#f1f5f9' : 'rgba(255,255,255,0.05)',
                    color: !editUbicacion ? '#d97706' : '#ffffff',
                    cursor: !editUbicacion ? 'not-allowed' : 'text',
                    border: editUbicacion ? '1px solid var(--primary)' : '1px solid #e2e8f0'
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedCliente(null)}>Cancelar</button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#f87171' }}
                  onClick={async () => {
                    if (window.confirm(`¿Está seguro de eliminar a ${selectedCliente.nombre}? Esta acción liberará su ID.`)) {
                      try {
                        await clienteService.eliminar(selectedCliente.id);
                        alert('Cliente eliminado y ID liberado.');
                        setSelectedCliente(null);
                        fetchData();
                      } catch (error) {
                        alert('Error al eliminar: ' + (error.response?.data?.detail || error.message));
                      }
                    }
                  }}
                >
                  Eliminar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={(() => {
                    const val = parseFloat(formData.potencia?.replace(',', '.'));
                    return isNaN(val) || val < -27 || val > -6;
                  })()}
                  style={{
                    opacity: (() => {
                      const val = parseFloat(formData.potencia?.replace(',', '.'));
                      return (isNaN(val) || val < -27 || val > -6) ? 0.5 : 1;
                    })(),
                    cursor: (() => {
                      const val = parseFloat(formData.potencia?.replace(',', '.'));
                      return (isNaN(val) || val < -27 || val > -6) ? 'not-allowed' : 'pointer';
                    })()
                  }}
                >
                  Completar Activación
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .tecnica-layout { display: grid; grid-template-columns: 1fr; gap: 24px; }
        .tecnica-list { max-height: 80vh; overflow-y: auto; }
        .tecnica-back-btn { display: none; }

        @media (min-width: 1025px) {
          .tecnica-layout.has-selected { grid-template-columns: 350px 1fr; }
        }

        @media (max-width: 1024px) {
          .tecnica-layout.has-selected .tecnica-list { display: none; }
          .tecnica-back-btn { display: block; }
        }
      `}</style>
    </div>
  );
};

export default Tecnica;