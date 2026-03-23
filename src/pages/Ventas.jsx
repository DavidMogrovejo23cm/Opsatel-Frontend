import React, { useState, useEffect } from 'react';
import { clienteService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';

const Ventas = () => {
  const [parroquiasList, setParroquiasList] = useState([]);
  const [planesList, setPlanesList] = useState([]);

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const [paRes, plRes] = await Promise.all([
          configuracionService.getParroquias(),
          configuracionService.getPlanes()
        ]);
        setParroquiasList(paRes.data);
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
    parroquia: '',
    plan: '',
    plus: '0',
    cedula_tipo: '',
    ubicacion: '',
    fecha_firma: new Date().toISOString().split('T')[0]
  });
  
  const [fileFrontal, setFileFrontal] = useState(null);
  const [filePosterior, setFilePosterior] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        setFormData({ ...formData, ubicacion: `${latDMS}, ${lngDMS}` });
      }, (error) => {
        alert("Error al obtener ubicación. Asegúrate de dar permisos.");
      });
    } else {
      alert("Geolocalización no disponible en este navegador.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await clienteService.crear(formData);
      const clienteId = response.data.id;

      // Subir fotos si existen
      if (fileFrontal || filePosterior) {
        const uploadData = new FormData();
        if (fileFrontal) uploadData.append('frontal', fileFrontal);
        if (filePosterior) uploadData.append('posterior', filePosterior);
        await clienteService.uploadCedula(clienteId, uploadData);
      }

      setMessage({ type: 'success', text: `Cliente ${response.data.nombre} creado con éxito. ID: ${clienteId}` });
      setFormData({
        nombre: '', cedula: '', celular: '', correo: '',
        direccion: '', parroquia: '', plan: '', plus: '0',
        cedula_tipo: '', ubicacion: '',
        fecha_firma: new Date().toISOString().split('T')[0]
      });
      setFileFrontal(null);
      setFilePosterior(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al crear el cliente. Verifique los datos.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card glass"
    >
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem' }}>Registro de Nuevo Cliente</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid-2-resp" style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr', 
          gap: '20px' 
        }}>
          <div className="input-group">
            <label className="label">Nombre Completo</label>
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
          <div className="input-group" style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
            <label className="label">Dirección</label>
            <input className="input" name="direccion" value={formData.direccion} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="label">Parroquia</label>
            <select className="input" name="parroquia" value={formData.parroquia} onChange={handleChange} required style={{ appearance: 'none' }}>
              <option value="">Seleccione parroquia</option>
              {parroquiasList.map(p => (
                <option key={p.id} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Plan Contratado</label>
            <select className="input" name="plan" value={formData.plan} onChange={handleChange} required style={{ appearance: 'none' }}>
              <option value="">Seleccione un plan</option>
              {planesList.map(p => (
                <option key={p.id} value={p.nombre}>{p.nombre} (${p.precio})</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Plus (Plan adicional $)</label>
            <input className="input" type="number" step="0.01" name="plus" value={formData.plus} onChange={handleChange} placeholder="0.00" />
          </div>
          <div className="input-group">
            <label className="label">Tipo de Cédula (Cedula_Tipo)</label>
            <select className="input" name="cedula_tipo" value={formData.cedula_tipo} onChange={handleChange} style={{ appearance: 'none' }}>
              <option value="">Seleccione tipo</option>
              <option value="Física">Física</option>
              <option value="Digital">Digital</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          <div className="input-group" style={{ gridColumn: window.innerWidth <= 768 ? 'span 1' : 'span 2' }}>
            <label className="label">Coordenadas (Ubicación)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="input" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Lat, Long (Manual o GPS)" style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={handleGetGPS} style={{ padding: '0 15px', height: '42px' }}>📍 GPS</button>
            </div>
          </div>
          <div className="input-group">
              <label className="label">Foto Cédula Frontal (Max 2 fotos total)</label>
              <input type="file" className="input" onChange={(e) => setFileFrontal(e.target.files[0])} accept="image/*" />
          </div>
          <div className="input-group">
              <label className="label">Foto Cédula Posterior</label>
              <input type="file" className="input" onChange={(e) => setFilePosterior(e.target.files[0])} accept="image/*" />
          </div>
        </div>

        {message && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: message.type === 'success' ? '1px solid #22c55e' : '1px solid #ef4444',
            color: message.type === 'success' ? '#4ade80' : '#f87171'
          }}>
            {message.text}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Procesando...' : 'Registrar Cliente'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Ventas;
