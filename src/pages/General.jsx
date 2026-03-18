import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

const General = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for inline editing
  const [editingCell, setEditingCell] = useState(null); // { id, col }
  const [tempValue, setTempValue] = useState('');

  const fetchData = async () => {
    try {
      const response = await clienteService.listar();
      setClientes(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartEdit = (id, col, value) => {
    if (col === 'id') return; // ID is not editable
    setEditingCell({ id, col });
    setTempValue(value || '');
  };

  const handleSaveEdit = async (id, col) => {
    if (!editingCell) return;
    try {
      // Check if value actually changed
      const original = clientes.find(c => c.id === id)[col];
      if (tempValue === original) {
        setEditingCell(null);
        return;
      }

      await clienteService.actualizar(id, { [col]: tempValue });
      setEditingCell(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error al guardar cambio");
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e, id, col) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id, col);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cedula?.includes(searchTerm) ||
    c.id.toString().includes(searchTerm)
  );

  const allColumns = [
    "id", "nombre", "celular", "cedula", "correo", "direccion", "parroquia", "plan",
    "estado", "puerto", "ont", "servicio", "breach", "id_port", "service_port",
    "ip", "dispositivo", "potencia", "nap", "ubicacion", "tecnico", "activador", "red", "clave",
    "tiempo", "arrienda", "cuenta", "facturas", "internet_payment", "app", "payment_date", 
    "client_payment_date", "bank", "cod", "plus", "bank_plus", "saldo"
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Vista General de Clientes</h1>
          <p style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '4px' }}>
            💡 Haz doble clic en cualquier celda para editar el valor manualmente.
          </p>
        </div>
        <input 
          className="input" 
          placeholder="Buscar por ID, Nombre o Cédula..." 
          style={{ maxWidth: '300px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? <p>Cargando datos...</p> : (
        <div style={{ overflowX: 'auto', maxHeight: '72vh', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <tr>
                {allColumns.map(col => (
                  <th key={col} style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {col.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {allColumns.map(col => {
                    const isEditing = editingCell?.id === c.id && editingCell?.col === col;
                    
                    return (
                      <td 
                        key={col} 
                        onDoubleClick={() => handleStartEdit(c.id, col, c[col])}
                        style={{ 
                          padding: '6px 12px', 
                          whiteSpace: 'nowrap', 
                          minWidth: '100px',
                          background: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          cursor: col === 'id' ? 'default' : 'pointer'
                        }}
                      >
                        {isEditing ? (
                          <input 
                            autoFocus
                            className="input"
                            style={{ 
                              padding: '4px 8px', 
                              height: '28px', 
                              fontSize: '0.8rem',
                              background: '#1e1b4b',
                              border: '1px solid var(--primary)'
                            }}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={() => handleSaveEdit(c.id, col)}
                            onKeyDown={(e) => handleKeyDown(e, c.id, col)}
                          />
                        ) : (
                          <span style={{ 
                            color: col === 'estado' ? (c[col]?.toUpperCase() === 'ACTIVO' ? '#4ade80' : '#fbbf24') : 'inherit',
                            fontWeight: col === 'id' ? '600' : 'normal'
                          }}>
                            {col === 'saldo' ? `$${parseFloat(c[col]).toFixed(2)}` : (c[col] || '-')}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Total: {filteredClientes.length} clientes encontrados.</span>
        <span>Presiona Enter para guardar / Esc para cancelar</span>
      </div>
    </motion.div>
  );
};

export default General;
