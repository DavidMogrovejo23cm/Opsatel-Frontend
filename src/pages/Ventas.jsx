import React, { useState } from 'react';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const Ventas = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    celular: '',
    correo: '',
    direccion: '',
    parroquia: '',
    plan: '',
    plus: '0',
    fecha_firma: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await clienteService.crear(formData);
      setMessage({ type: 'success', text: `Cliente ${response.data.nombre} creado con éxito. ID: ${response.data.id}` });
      setFormData({
        nombre: '', cedula: '', celular: '', correo: '',
        direccion: '', parroquia: '', plan: '',
        fecha_firma: new Date().toISOString().split('T')[0]
      });
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="label">Dirección</label>
            <input className="input" name="direccion" value={formData.direccion} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="label">Parroquia</label>
            <input className="input" name="parroquia" value={formData.parroquia} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="label">Plan Contratado</label>
            <select className="input" name="plan" value={formData.plan} onChange={handleChange} required style={{ appearance: 'none' }}>
              <option value="">Seleccione un plan</option>
              <option value="100mb">100mb ($17.25)</option>
              <option value="600mb">600mb ($17.87)</option>
              <option value="700mb">700mb ($21.73)</option>
              <option value="800mb">800mb ($32.20)</option>
            </select>
          </div>
          <div className="input-group">
            <label className="label">Plus (Plan adicional $)</label>
            <input className="input" type="number" step="0.01" name="plus" value={formData.plus} onChange={handleChange} placeholder="0.00" />
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
