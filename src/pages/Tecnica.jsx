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
    red: '', clave: ''
  });
  const [hasBreach, setHasBreach] = useState(false);
  const [editUbicacion, setEditUbicacion] = useState(false);

  const [nodosList, setNodosList] = useState([]);
  const [puertosList, setPuertosList] = useState([]);

  const fetchData = async () => {
    try {
      const response = await clienteService.listar();
      setClientes(response.data.filter(c =>
        c.estado?.toUpperCase() === 'EN ACTIVACIÓN' ||
        c.estado?.toUpperCase() === 'PENDIENTE'
      ));

      const [paRes, puRes] = await Promise.all([
        configuracionService.getNodos(),
        configuracionService.getPuertos()
      ]);
      setNodosList(paRes.data);
      setPuertosList(puRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    setFormData({
      mac: '',
      puerto: '', ont: '', servicio: '', breach: '',
      id_port: '', service_port: '', ip: '',
      dispositivo: '', potencia: '', nap: '',
      ubicacion: cliente.ubicacion || '',
      tecnico: '', activador: '',
      red: '', clave: ''
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
        
        let direction = "";
        if (isLat) {
            direction = val < 0 ? "S" : "N";
        } else {
            direction = val < 0 ? "O" : "E"; // O de Oeste
        }
        
        return `${degrees}°${minutes}'${seconds}''${direction}`;
    };

    return `${toDMS(lat, true)} ${toDMS(lng, false)}`;
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
      'mac', 'puerto', 'ont', 'servicio', 'id_port', 'service_port', 'ip', 
      'dispositivo', 'potencia', 'nap', 'tecnico', 'activador', 'red', 'clave',
      'ubicacion'
    ];
    if (hasBreach) requiredKeys.push('breach');

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
        const msg = detail.map(err => `${err.loc[err.loc.length-1]}: ${err.msg}`).join('\n');
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
    <div className="grid-tecnica" style={{
      display: 'grid',
      gridTemplateColumns: (selectedCliente && window.innerWidth > 1024) ? '1fr 2fr' : '1fr',
      gap: '24px'
    }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{
        maxHeight: '80vh',
        overflowY: 'auto',
        display: (selectedCliente && window.innerWidth <= 1024) ? 'none' : 'block'
      }}>
        <h2 style={{ marginBottom: '16px' }}>Pendientes de Activación</h2>
        {clientes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay pendientes de activación.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clientes.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className="glass"
                style={{
                  padding: '12px', cursor: 'pointer', borderRadius: '12px',
                  border: selectedCliente?.id === c.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: selectedCliente?.id === c.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)'
                }}
              >
                <strong>{c.id} - {c.nombre}</strong>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Configuración Técnica: {selectedCliente.nombre}</h3>
              {window.innerWidth <= 1024 && (
                <button className="btn btn-secondary" onClick={() => setSelectedCliente(null)}>Atrás</button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr',
              gap: '12px'
            }}>

              <div className="input-group" style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
                <label className="label" style={{ color: '#4ade80' }}>MAC del Equipo</label>
                <input
                  className="input"
                  name="mac"
                  value={formData.mac}
                  onChange={handleMacChange}
                  required
                  placeholder="Introduce la MAC"
                  style={{ border: '1px solid #4ade80' }}
                />
              </div>

              <div className="input-group">
                <label className="label">Puerto (Zona: {selectedCliente.nodo})</label>
                <select className="input" name="puerto" value={formData.puerto} onChange={handlePuertoChange} required style={{ appearance: 'none' }}>
                  <option value="">Seleccione Puerto</option>
                  {getPuertosDisponibles().map(p => (
                    <option key={p.id} value={p.nombre} style={{ background: '#1e1b4b' }}>{p.nombre}</option>
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
                  style={{ appearance: 'none' }}
                >
                  <option value="NO" style={{ background: '#1e1b4b' }}>NO</option>
                  <option value="SI" style={{ background: '#1e1b4b' }}>SÍ</option>
                </select>
              </div>

              <div className="input-group" style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
                <label className="label">ONT (Generado por servidor)</label>
                <textarea className="input" name="ont" value={formData.ont} onChange={handleChange} required style={{ height: '60px', fontSize: '0.75rem', fontFamily: 'monospace' }} />
              </div>

              <div className="input-group" style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
                <label className="label">Servicio (Generado por servidor)</label>
                <textarea className="input" name="servicio" value={formData.servicio} onChange={handleChange} required style={{ height: '60px', fontSize: '0.75rem', fontFamily: 'monospace' }} />
              </div>

              {hasBreach && (
                <div className="input-group" style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
                  <label className="label">Breach (Generado por servidor)</label>
                  <textarea className="input" name="breach" value={formData.breach} onChange={handleChange} style={{ height: '60px', fontSize: '0.75rem', fontFamily: 'monospace', border: '1px solid var(--primary)' }} />
                </div>
              )}

              <div className="input-group">
                <label className="label">ID Port (Sistema)</label>
                <input 
                  className="input" 
                  name="id_port" 
                  value={formData.id_port} 
                  readOnly 
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'not-allowed' }} 
                />
              </div>

              <div className="input-group">
                <label className="label">Service Port (Sistema)</label>
                <input 
                  className="input" 
                  name="service_port" 
                  value={formData.service_port} 
                  readOnly 
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'not-allowed' }} 
                />
              </div>

              <div className="input-group">
                <label className="label">IP (Sistema)</label>
                <input 
                  className="input" 
                  name="ip" 
                  value={formData.ip} 
                  readOnly 
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'not-allowed' }} 
                />
              </div>

              <div className="input-group">
                <label className="label">Dispositivo</label>
                <input className="input" name="dispositivo" value={formData.dispositivo} onChange={handleChange} required placeholder="Modelo router" />
              </div>

              <div className="input-group">
                <label className="label">Potencia (Rango: -6 a -27)</label>
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
                <label className="label">NAP</label>
                <input className="input" name="nap" value={formData.nap} onChange={handleChange} required />
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

              <div className="input-group" style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
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
                    background: !editUbicacion ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', 
                    color: !editUbicacion ? '#fbbf24' : 'white', 
                    cursor: !editUbicacion ? 'not-allowed' : 'text' 
                  }} 
                />
              </div>

              <div style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
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
    </div>
  );
};

export default Tecnica;
