import React, { useEffect, useState } from 'react';
import { extrasService } from '../services/api';
import { motion } from 'framer-motion';

const Extras = () => {
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    cod: '',
    nombre_cliente: '',
    contacto: '',
    proveedor: 'OPSATEL',
    usuario: '',
    contrasena: '',
    cuentas: '1',
    mac_smart_one: '',
    observaciones: '',
    estado: 'FIJO',
    valor: 0.00,
    activo: 'SI'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await extrasService.listar();
      setExtras(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (extra) => {
    setIsEditing(true);
    setCurrentId(extra.id);
    setFormData({
      cod: extra.cod || '',
      nombre_cliente: extra.nombre_cliente || '',
      contacto: extra.contacto || '',
      proveedor: extra.proveedor || '',
      usuario: extra.usuario || '',
      contrasena: extra.contrasena || '',
      cuentas: extra.cuentas || '1',
      mac_smart_one: extra.mac_smart_one || '',
      observaciones: extra.observaciones || '',
      estado: extra.estado || '',
      valor: extra.valor || 0,
      activo: extra.activo || 'SI'
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await extrasService.actualizar(currentId, formData);
      } else {
        await extrasService.crear(formData);
      }
      setShowAddModal(false);
      setIsEditing(false);
      setFormData({ cod: '', nombre_cliente: '', contacto: '', proveedor: 'OPSATEL', usuario: '', contrasena: '', cuentas: '1', mac_smart_one: '', observaciones: '', estado: 'FIJO', valor: 0, activo: 'SI' });
      fetchData();
    } catch (err) {
      alert("Error al guardar cliente extra");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Desea eliminar este registro?")) return;
    try {
      await extrasService.eliminar(id);
      fetchData();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Administrar Extras (Registro)</h1>
        <button className="btn btn-primary" onClick={() => { setIsEditing(false); setShowAddModal(true); }}>
          ➕ Agregar Cliente Extra
        </button>
      </div>

      {loading ? <p>Cargando registros...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px' }}>COD</th>
                <th>NOMBRE</th>
                <th>PROVEEDOR</th>
                <th>USUARIO</th>
                <th>VALOR</th>
                <th>ESTADO</th>
                <th>ACTIVO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
                {extras.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '0.8rem' }}>{e.cod}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.nombre_cliente}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.proveedor}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.usuario}</td>
                        <td style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>${parseFloat(e.valor || 0).toFixed(2)}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.estado}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.activo}</td>
                        <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleEdit(e)}>✏️</button>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#f87171' }} onClick={() => handleDelete(e.id)}>🗑️</button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
          {extras.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Sin resultados.</p>}
        </div>
      )}

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', zIndex: 9999
        }}>
          <div className="glass" style={{ 
            width: '100%', maxWidth: '650px', 
            padding: '40px', borderRadius: '24px',
            maxHeight: 'calc(100vh - 40px)', 
            overflowY: 'auto',
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>

            <h2 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>{isEditing ? 'Editar' : 'Nuevo'} Cliente Extra</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
              Complete la información técnica y de cobro del servicio.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>COD</label>
                  <input className="input" name="cod" placeholder="Ej: 1C" value={formData.cod} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Proveedor</label>
                  <input className="input" name="proveedor" placeholder="Ej: OPSATEL" value={formData.proveedor} onChange={handleChange} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Nombre Completo</label>
                  <input className="input" name="nombre_cliente" placeholder="Nombre completo del cliente" value={formData.nombre_cliente} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Usuario</label>
                  <input className="input" name="usuario" placeholder="Username" value={formData.usuario} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Contraseña</label>
                  <input className="input" name="contrasena" type="text" placeholder="Password" value={formData.contrasena} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Contacto (Celular)</label>
                  <input className="input" name="contacto" placeholder="099..." value={formData.contacto} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Cuentas</label>
                  <input className="input" name="cuentas" type="number" value={formData.cuentas} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Estado Pago</label>
                  <select className="input" name="estado" value={formData.estado} onChange={handleChange} style={{ background: '#0f172a' }}>
                    <option value="FIJO" style={{ background: '#0f172a' }}>FIJO</option>
                    <option value="SEMIFIJO" style={{ background: '#0f172a' }}>SEMIFIJO</option>
                    <option value="IRREGULAR" style={{ background: '#0f172a' }}>IRREGULAR</option>
                    <option value="EXTERNO" style={{ background: '#0f172a' }}>EXTERNO</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Valor Mensual ($)</label>
                  <input className="input" type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Mac Smart One</label>
                  <input className="input" name="mac_smart_one" placeholder="Mac Address" value={formData.mac_smart_one} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Activo</label>
                  <select className="input" name="activo" value={formData.activo} onChange={handleChange} style={{ background: '#0f172a' }}>
                    <option value="SI" style={{ background: '#0f172a' }}>SÍ (Habilitado)</option>
                    <option value="NO" style={{ background: '#0f172a' }}>NO (Inhabilitado)</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="label" style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--primary)' }}>Observaciones</label>
                  <textarea 
                    className="input" 
                    name="observaciones" 
                    rows="2" 
                    style={{ resize: 'none' }}
                    value={formData.observaciones} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '10px 24px' }} onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 32px' }}>
                  {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Extras;
