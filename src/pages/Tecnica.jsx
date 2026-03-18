import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Tecnica = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [formData, setFormData] = useState({
    puerto: '', ont: '', servicio: '', breach: '',
    id_port: '', service_port: '', ip: '',
    dispositivo: '', potencia: '', nap: '',
    ubicacion: '', tecnico: '', activador: '',
    red: '', clave: ''
  });

  const fetchData = async () => {
    try {
      
      const response = await clienteService.listar();
      
      setClientes(response.data.filter(c => c.estado === 'En Activación' || c.estado === 'Pendiente'));
    } catch (error) {
      console.error("Error fetching clientes", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelect = (cliente) => {
    setSelectedCliente(cliente);
    setFormData({ ...formData, ubicacion: cliente.direccion }); 
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await clienteService.activar(selectedCliente.id, formData);
      alert('Configuración exitosa. Cliente activado.');
      setSelectedCliente(null);
      fetchData();
    } catch (error) {
      alert('Error en la activación');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedCliente ? '1fr 2fr' : '1fr', gap: '24px' }}>
      <motion.div className="glass-card glass">
        <h2 style={{ marginBottom: '16px' }}>Pendientes de Activación</h2>
        {clientes.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No hay clientes pendientes.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clientes.map(c => (
              <div 
                key={c.id} 
                onClick={() => handleSelect(c)}
                className="glass" 
                style={{ padding: '12px', cursor: 'pointer', border: selectedCliente?.id === c.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}
              >
                <strong>{c.id} - {c.nombre}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.plan} | {c.estado}</div>
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
          >
            <h3>Configuración Técnica: {selectedCliente.nombre}</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="label">Puerto</label>
                <input className="input" name="puerto" value={formData.puerto} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="label">ONT</label>
                <input className="input" name="ont" value={formData.ont} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="label">IP</label>
                <input className="input" name="ip" value={formData.ip} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="label">POTENCIA</label>
                <input className="input" name="potencia" value={formData.potencia} onChange={handleChange} required />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="label">Ubicación (GPS/Mapa)</label>
                <input className="input" name="ubicacion" value={formData.ubicacion} onChange={handleChange} required />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedCliente(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Finalizar Activación</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tecnica;
