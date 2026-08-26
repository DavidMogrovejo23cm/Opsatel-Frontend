import React, { useEffect, useState } from 'react';
import { extrasService } from '../services/api';
import { motion } from 'framer-motion';
import { showAlert, showSuccess, showError, showConfirm } from '../utils/alerts';


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
      showSuccess("Cliente extra guardado exitosamente");
      fetchData();
    } catch (err) {
      showError("Error al guardar cliente extra");
    }
  };

  const handleDelete = async (id) => {
    const confirmado = await showConfirm("¿Eliminar registro?", "¿Desea eliminar este registro?", "Sí, eliminar", "Cancelar");
    if (!confirmado) return;
    try {
      await extrasService.eliminar(id);
      showSuccess("Registro eliminado correctamente");
      fetchData();
    } catch (err) {
      showError("Error al eliminar");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
      
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-info">
          <h1 style={{ fontWeight: '900', margin: 0 }}>Administrar Extras <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '400' }}>(Registro)</span></h1>
          <p>Configuración y alta de servicios adicionales.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setIsEditing(false); setShowAddModal(true); }} style={{ whiteSpace: 'nowrap' }}>
            ➕ Agregar Cliente Extra
          </button>
        </div>
      </div>

      {loading ? <p>Cargando registros...</p> : (
        <div className="table-container">
          <table>
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
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', minWidth: 'auto' }} onClick={() => handleEdit(e)}>✏️</button>
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#f87171', minWidth: 'auto' }} onClick={() => handleDelete(e.id)}>🗑️</button>
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
          background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', zIndex: 9999
        }}>
          <div className="glass-card glass" style={{ 
            width: '100%', maxWidth: '650px', 
            padding: '24px', 
            maxHeight: '90vh', 
            overflowY: 'auto'
          }}>
            <div className="page-header" style={{ marginBottom: '24px' }}>
              <div className="page-header-info">
                <h2 style={{ fontWeight: '900', margin: 0 }}>{isEditing ? 'Editar' : 'Nuevo'} Cliente Extra</h2>
                <p style={{ fontSize: '0.85rem' }}>Complete la información técnica y de cobro.</p>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
                style={{ minWidth: 'auto', padding: '4px 12px', fontSize: '1.5rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-responsive">
                <div className="form-group">
                  <label className="label">COD</label>
                  <input className="input" name="cod" placeholder="Ej: 1C" value={formData.cod} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="label">Proveedor</label>
                  <input className="input" name="proveedor" placeholder="Ej: OPSATEL" value={formData.proveedor} onChange={handleChange} />
                </div>

                <div className="form-group grid-span-2">
                  <label className="label">Nombre Completo</label>
                  <input className="input" name="nombre_cliente" placeholder="Nombre completo del cliente" value={formData.nombre_cliente} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label">Usuario</label>
                  <input className="input" name="usuario" placeholder="Username" value={formData.usuario} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="label">Contraseña</label>
                  <input className="input" name="contrasena" type="text" placeholder="Password" value={formData.contrasena} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="label">Contacto (Celular)</label>
                  <input className="input" name="contacto" placeholder="099..." value={formData.contacto} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="label">Cuentas</label>
                  <input className="input" name="cuentas" type="number" value={formData.cuentas} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="label">Estado Pago</label>
                  <select className="input" name="estado" value={formData.estado} onChange={handleChange} style={{ background: '#0f172a' }}>
                    <option value="FIJO" style={{ background: '#0f172a' }}>FIJO</option>
                    <option value="SEMIFIJO" style={{ background: '#0f172a' }}>SEMIFIJO</option>
                    <option value="IRREGULAR" style={{ background: '#0f172a' }}>IRREGULAR</option>
                    <option value="EXTERNO" style={{ background: '#0f172a' }}>EXTERNO</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Valor Mensual ($)</label>
                  <input className="input" type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label">Mac Smart One</label>
                  <input className="input" name="mac_smart_one" placeholder="Mac Address" value={formData.mac_smart_one} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="label">Activo</label>
                  <select className="input" name="activo" value={formData.activo} onChange={handleChange} style={{ background: '#0f172a' }}>
                    <option value="SI" style={{ background: '#0f172a' }}>SÍ (Habilitado)</option>
                    <option value="NO" style={{ background: '#0f172a' }}>NO (Inhabilitado)</option>
                  </select>
                </div>

                <div className="form-group grid-span-2">
                  <label className="label">Observaciones</label>
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

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
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
