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

  const [nodosList, setNodosList] = useState([]);
  const [puertosList, setPuertosList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await clienteService.listar();
      setClientes(response.data.filter(c =>
        c.estado?.toUpperCase() === 'EN ACTIVACIÓN' ||
        c.estado?.toUpperCase() === 'PENDIENTE'
      ).sort((a, b) => a.id - b.id));

      const [paRes, puRes] = await Promise.all([
        configuracionService.getNodos(),
        configuracionService.getPuertos()
      ]);
      setNodosList(paRes.data);
      setPuertosList(puRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      iptv_max_conn: (parseFloat(cliente.plus || 0) > 0) ? (parseFloat(cliente.plus || 0) / 2 + 1) : (cliente.iptv_max_conn || 1),
      iptv_outputs: hasIptv ? '[1,2]' : '[]',
      iptv_notes: '', iptv_member_id: 1
    });
  };

  const handlePuertoChange = (e) => {
    const puerto = e.target.value;
    setFormData(prev => ({ ...prev, puerto }));
    fetchValoresTecnicos(puerto, formData.mac, hasBreach);
  };

  const handleMacChange = (e) => {
    const mac = e.target.value;
    setFormData(prev => ({ ...prev, mac }));
    if (formData.puerto) {
      fetchValoresTecnicos(formData.puerto, mac, hasBreach);
    }
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
      let direction = isLat ? (val < 0 ? "S" : "N") : (val < 0 ? "W" : "E");
      return `${degrees}°${minutes}'${seconds}''${direction}`;
    };
    return `${toDMS(lat, true)} ${toDMS(lng, false)}`;
  };

  const handleIptvToggle = (e) => {
    const checked = e.target.checked;
    if (!checked) {
      setSelectedCliente(prev => ({ ...prev, plus: "0", iptv_max_conn: 0 }));
    }
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
      iptv_max_conn: checked ? ((parseFloat(selectedCliente.plus || 0) > 0) ? (parseFloat(selectedCliente.plus || 0) / 2 + 1) : 1) : 0,
      plus: checked ? (selectedCliente.plus || '0') : '0'
    }));
  };

  const getIptvScript = (data) => {
    if (!data.iptv_activar) return '';
    const useExp = data.iptv_exp_date && data.iptv_exp_date !== 'Nunca';
    return `INSERT INTO lines (member_id, username, password, bouquet, allowed_outputs, max_connections, admin_enabled, enabled, ${useExp ? 'exp_date, ' : ''}is_restreamer, is_trial, is_mag, is_e2, is_stalker, is_isplock, allowed_ips, allowed_ua, created_at, force_server_id, bypass_ua) VALUES (${data.iptv_member_id || 1}, '${data.iptv_user}', '${data.iptv_pass}', '${data.iptv_bouquets}', '${data.iptv_outputs}', ${data.iptv_max_conn}, 1, 1, ${useExp ? "UNIX_TIMESTAMP() + (30 * 86400), " : ""}0, 0, 0, 0, 0, 0, '[]', '[]', UNIX_TIMESTAMP(), 0, 0);`;
  };

  const handleBouquetChange = (id) => {
    let current = [];
    try { current = JSON.parse(formData.iptv_bouquets || '[]'); } catch (e) { current = []; }
    if (current.includes(id)) {
      current = current.filter(b => b !== id);
      if (id === 10) current = current.filter(b => b !== 14);
    } else {
      current.push(id);
      if (id === 10 && !current.includes(14)) current.push(14);
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
          setFormData({ ...formData, [name]: convertToDMS(lat, lng) });
          return;
        }
      }
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredKeys = ['mac', 'puerto', 'ont', 'servicio', 'id_port', 'service_port', 'ip', 'dispositivo', 'potencia', 'nap', 'tecnico', 'activador', 'red', 'clave', 'ubicacion'];
    if (hasBreach) requiredKeys.push('breach');
    if (formData.iptv_activar) requiredKeys.push('iptv_user', 'iptv_pass', 'iptv_bouquets', 'iptv_exp_date', 'iptv_member_id', 'iptv_max_conn', 'iptv_outputs');
    if (requiredKeys.some(key => !formData[key]?.toString().trim())) return alert('¡Error! Todos los campos técnicos obligatorios deben estar llenos.');
    try {
      await clienteService.activar(selectedCliente.id, formData);
      alert('Configuración exitosa. Cliente activado.');
      setSelectedCliente(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error en la activación.');
    }
  };

  const getPuertosDisponibles = () => {
    if (!selectedCliente || !selectedCliente.nodo) return [];
    const nodoObj = nodosList.find(p => p.nombre.toUpperCase() === selectedCliente.nodo.toUpperCase());
    return nodoObj ? puertosList.filter(p => p.nodo_id === nodoObj.id) : [];
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Activación Técnica</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestión de ONU, IPTV y parámetros de red.</p>
        </div>
      </div>

      <div className="responsive-grid grid-3" style={{ gridTemplateColumns: selectedCliente ? '1fr 2fr' : '1fr', gap: '24px' }}>
        {/* Sidebar: List of pending clients */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="glass-card glass" 
          style={{ 
            maxHeight: '80vh', 
            overflowY: 'auto',
            display: (selectedCliente && window.innerWidth <= 1024) ? 'none' : 'block'
          }}
        >
          <h2 style={{ marginBottom: '16px' }}>Pendientes</h2>
          <input
            className="input"
            placeholder="🔍 Buscar..."
            value={searchPendientes}
            onChange={(e) => setSearchPendientes(e.target.value)}
            style={{ marginBottom: '16px' }}
          />
          {loading ? <p>Cargando...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {clientes.filter(c => c.nombre.toLowerCase().includes(searchPendientes.toLowerCase())).map(c => (
                <div key={c.id} onClick={() => handleSelect(c)} className="glass clickable-card" style={{ padding: '12px', borderLeft: selectedCliente?.id === c.id ? '4px solid var(--primary)' : '1px solid var(--glass-border)' }}>
                  <strong>{c.id} - {c.nombre}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.plan} | {c.nodo}</div>
                </div>
              ))}
              {clientes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No hay pendientes.</p>}
            </div>
          )}
        </motion.div>

        {/* Main: Configuration Form */}
        <AnimatePresence>
          {selectedCliente && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="glass-card glass" style={{ maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Configuración: {selectedCliente.nombre}</h3>
                <button className="btn btn-secondary" onClick={() => setSelectedCliente(null)}>Cerrar</button>
              </div>

              <form onSubmit={handleSubmit} className="responsive-grid grid-2" style={{ gap: '12px' }}>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="label" style={{ color: '#4ade80' }}>MAC del Equipo</label>
                  <input className="input" name="mac" value={formData.mac} onChange={handleMacChange} required style={{ border: '1px solid #4ade80' }} />
                </div>

                <div className="input-group">
                  <label className="label">Puerto (Zona: {selectedCliente.nodo})</label>
                  <select className="input" name="puerto" value={formData.puerto} onChange={handlePuertoChange} required>
                    <option value="">Seleccione Puerto</option>
                    {getPuertosDisponibles().map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="label">¿Bridge?</label>
                  <select className="input" value={hasBreach ? 'SI' : 'NO'} onChange={handleBreachChange}>
                    <option value="NO">NO</option>
                    <option value="SI">SÍ</option>
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="label">ONT</label>
                  <textarea className="input" name="ont" value={formData.ont} onChange={handleChange} required style={{ height: '60px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="label">Servicio</label>
                  <textarea className="input" name="servicio" value={formData.servicio} onChange={handleChange} required style={{ height: '60px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
                </div>

                <div className="input-group">
                  <label className="label">IP</label>
                  <input className="input" name="ip" value={formData.ip} readOnly style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--text-muted)' }} />
                </div>
                <div className="input-group">
                  <label className="label">Potencia</label>
                  <input className="input" name="potencia" value={formData.potencia} onChange={handleChange} placeholder="-21.0" required />
                </div>

                {/* IPTV Section */}
                <div className="input-group" style={{ gridColumn: 'span 2', background: 'rgba(99, 102, 241, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <input type="checkbox" id="iptv" checked={formData.iptv_activar} onChange={handleIptvToggle} />
                    <label htmlFor="iptv" style={{ fontWeight: 'bold', color: '#818cf8' }}>ACTIVAR IPTV</label>
                  </div>
                  {formData.iptv_activar && (
                    <div className="responsive-grid grid-2">
                       <input className="input" name="iptv_user" value={formData.iptv_user} onChange={handleChange} placeholder="User" />
                       <input className="input" name="iptv_pass" value={formData.iptv_pass} onChange={handleChange} placeholder="Pass" />
                       <div className="input-group" style={{ gridColumn: 'span 2' }}>
                          <label className="label">Planes de Canales</label>
                          <div className="responsive-grid grid-2" style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                             {[ { id: 1, label: 'TV VIVO' }, { id: 2, label: 'PELIS' }, { id: 5, label: 'SERIES' }, { id: 10, label: 'ADULTOS' } ].map(b => (
                               <label key={b.id} style={{ fontSize: '0.8rem' }}><input type="checkbox" checked={JSON.parse(formData.iptv_bouquets).includes(b.id)} onChange={() => handleBouquetChange(b.id)} /> {b.label}</label>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="label">Ubicación GPS</label>
                  <input className="input" name="ubicacion" value={formData.ubicacion} readOnly={!editUbicacion} onChange={handleChange} onClick={() => setEditUbicacion(true)} />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedCliente(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Completar Activación</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Tecnica;