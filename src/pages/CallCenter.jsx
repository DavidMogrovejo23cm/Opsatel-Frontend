import React, { useEffect, useState, useMemo, useRef } from 'react';
import { callCenterService, clienteService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatToDMY } from '../services/dateUtils';
import { showAlert, showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';


/* ────────────────────────────────────────────
   ESTADO CONFIG
────────────────────────────────────────────── */
const ESTADOS = [
  { value: 'PENDIENTE',                    label: 'Pendiente',               color: '#94a3b8', bg: 'rgba(100,116,139,0.15)', icon: '⏳' },
  { value: 'SOLUCIONADO',                  label: 'Solucionado',             color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: '✅' },
  { value: 'ESPERA DE RESPUESTA DE CLIENTE', label: 'Espera Respuesta',     color: '#eab308', bg: 'rgba(234,179,8,0.15)',   icon: '⏰' },
  { value: 'NO SOLUCIONADO',               label: 'No Solucionado',          color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '❌' },
  { value: 'VISITA TECNICA',               label: 'Visita Técnica',          color: '#f97316', bg: 'rgba(249,115,22,0.15)',  icon: '🔧' },
];

const getEstado = (val) =>
  ESTADOS.find(e => e.value === (val || '').toUpperCase()) || ESTADOS[0];

/* ────────────────────────────────────────────
   BADGE ESTADO
────────────────────────────────────────────── */
const EstadoBadge = ({ estado }) => {
  const cfg = getEstado(estado);
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      padding: '4px 10px', borderRadius: '20px',
      fontSize: '0.62rem', fontWeight: '800',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

/* ────────────────────────────────────────────
   MAIN
────────────────────────────────────────────── */
const CallCenter = () => {
  const [tickets, setTickets]       = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [editingId, setEditingId]   = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientRef = useRef(null);

  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  const initialForm = {
    cliente_nombre: '', ip: '', direccion: '',
    telefono: '', estado: 'PENDIENTE',
    a_cargo: '', problema: '', observacion_revision: '',
  };
  const [formData, setFormData] = useState(initialForm);

  /* Fetch data */
  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [tkRes, clRes] = await Promise.all([
        callCenterService.listar(),
        clienteService.listar(),
      ]);
      setTickets(tkRes.data || []);
      setClientes((clRes.data || []).filter(c => c.estado?.toUpperCase() === 'ACTIVO'));
    } catch (err) {
      console.error("Error cargando Call Center:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  /* Cerrar dropdown al click externo */
  useEffect(() => {
    const handler = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Filtros de tabla */
  const filteredTickets = useMemo(() => {
    if (!Array.isArray(tickets)) return [];
    const term = searchTerm.toLowerCase();
    return tickets
      .filter(t => {
        const matchSearch =
          (t.cliente_nombre || '').toLowerCase().includes(term) ||
          (t.telefono || '').toLowerCase().includes(term) ||
          (t.a_cargo || '').toLowerCase().includes(term) ||
          (t.problema || '').toLowerCase().includes(term);
        const matchDate = dateFilter ? (t.fecha_ingreso || '').startsWith(dateFilter) : true;
        const matchStatus = statusFilter === 'TODOS' ? true : (t.estado || '').toUpperCase() === statusFilter;
        return matchSearch && matchDate && matchStatus;
      })
      .sort((a, b) => new Date(b.fecha_ingreso || 0) - new Date(a.fecha_ingreso || 0));
  }, [tickets, searchTerm, dateFilter, statusFilter]);

  /* Clientes filtrados en dropdown */
  const filteredClientes = useMemo(() => {
    const term = clientSearch.toLowerCase();
    return clientes.filter(c =>
      (c.nombre || '').toLowerCase().includes(term) ||
      String(c.id).includes(term) ||
      (c.celular || '').includes(term)
    ).slice(0, 50);
  }, [clientes, clientSearch]);

  /* Open modal */
  const handleOpenModal = (ticket = null) => {
    if (ticket) {
      setEditingId(ticket.id);
      setFormData({
        cliente_nombre: ticket.cliente_nombre || '',
        ip: ticket.ip || '',
        direccion: ticket.direccion || '',
        telefono: ticket.telefono || '',
        estado: ticket.estado || 'PENDIENTE',
        a_cargo: ticket.a_cargo || '',
        problema: ticket.problema || '',
        observacion_revision: ticket.observacion_revision || '',
      });
      setClientSearch(ticket.cliente_nombre || '');
    } else {
      setEditingId(null);
      setFormData({ ...initialForm });
      setClientSearch('');
    }
    setShowClientDropdown(false);
    setShowModal(true);
  };

  /* Select client from dropdown */
  const handleSelectClient = (c) => {
    setFormData(prev => ({
      ...prev,
      cliente_nombre: c.nombre,
      ip: c.ip || prev.ip,
      direccion: c.direccion || prev.direccion,
      telefono: c.celular || prev.telefono,
    }));
    setClientSearch(c.nombre);
    setShowClientDropdown(false);
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await callCenterService.actualizar(editingId, formData);
      } else {
        await callCenterService.crear(formData);
      }
      setShowModal(false);
      fetchData(true);
    } catch (err) {
      showError(err.response?.data?.detail || "Error al procesar el registro");
    } finally {
      setSubmitting(false);
    }
  };

  /* Delete */
  const handleDelete = async (id) => {
    if (user.rol?.toLowerCase() !== 'administrador') {
      showWarning("Solo el administrador puede eliminar registros.");
      return;
    }
    const confirmado = await showConfirm("¿Eliminar ticket?", "¿Eliminar este ticket de Call Center?", "Sí, eliminar", "Cancelar");
    if (!confirmado) return;
    try {
      await callCenterService.eliminar(id);
      showSuccess("Ticket eliminado correctamente");
      fetchData(true);
    } catch { showError("Error al eliminar"); }
  };

  /* Counters para filtros */
  const counts = useMemo(() => {
    const base = tickets;
    const obj = { TODOS: base.length };
    ESTADOS.forEach(e => { obj[e.value] = base.filter(t => (t.estado || '').toUpperCase() === e.value).length; });
    return obj;
  }, [tickets]);

  /* ── RENDER ── */
  return (
    <div style={{ width: '100%', padding: '0' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '2.2rem', fontWeight: '900', margin: 0,
            background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            📞 Call Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            Registro y seguimiento de reclamos y soporte telefónico.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            className="input"
            style={{ width: '160px', marginBottom: 0, padding: '10px 12px' }}
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            title="Filtrar por fecha"
          />
          <input
            className="input"
            placeholder="🔍 Buscar cliente, tel..."
            style={{ width: '220px', marginBottom: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              padding: '10px 20px', fontWeight: '700', fontSize: '0.85rem'
            }}
          >
            + Nuevo Ticket
          </button>
        </div>
      </div>

      {/* ── FILTROS POR ESTADO ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[{ value: 'TODOS', label: 'Todos', color: '#6366f1', icon: '📋' }, ...ESTADOS].map(e => {
          const isActive = statusFilter === e.value;
          const cnt = counts[e.value] ?? 0;
          return (
            <button
              key={e.value}
              onClick={() => setStatusFilter(e.value)}
              style={{
                padding: '7px 16px',
                borderRadius: '25px',
                border: `1.5px solid ${isActive ? (e.color || '#6366f1') : 'rgba(255,255,255,0.1)'}`,
                background: isActive ? `${e.color || '#6366f1'}22` : 'rgba(255,255,255,0.03)',
                color: isActive ? (e.color || '#6366f1') : 'var(--text-muted)',
                cursor: 'pointer', fontWeight: isActive ? '700' : '400',
                fontSize: '0.78rem', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {e.icon} {e.label}
              <span style={{
                background: isActive ? (e.color || '#6366f1') : 'rgba(255,255,255,0.1)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                borderRadius: '10px', padding: '1px 7px', fontSize: '0.68rem', fontWeight: '700'
              }}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TABLA ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Cargando registros...
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '1200px', width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.07)'
                }}>
                  {['Fecha Ingreso', 'Cliente', 'Contacto', 'Problema', 'Observación Revisión', 'Estado', 'A Cargo', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left',
                      fontSize: '0.65rem', textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--text-muted)',
                      fontWeight: '700', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay registros con los filtros actuales.
                    </td>
                  </tr>
                ) : filteredTickets.map((t, idx) => (
                  <tr key={t.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    transition: 'background 0.15s',
                    verticalAlign: 'top',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                  >
                    <td style={{ padding: '14px 16px', minWidth: '130px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ec4899' }}>
                        {t.fecha_ingreso ? formatToDMY(t.fecha_ingreso) : '-'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t.fecha_ingreso ? new Date(t.fecha_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                        Por: {t.registrado_por || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', minWidth: '160px' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.82rem' }}>{t.cliente_nombre || '-'}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        IP: {t.ip || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', minWidth: '150px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>{t.telefono || '-'}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.55, marginTop: '2px' }}>{t.direccion || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 8px', minWidth: '180px', maxWidth: '200px' }}>
                      <div className="preserve-breaks" style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                        {t.problema || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', minWidth: '220px', maxWidth: '260px' }}>
                      <div className="preserve-breaks" style={{ fontSize: '0.73rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                        {t.observacion_revision || '-'}
                      </div>
                      {t.fecha_cambio_estado && t.estado !== 'PENDIENTE' && (
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                          🕐 {t.fecha_cambio_estado}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <EstadoBadge estado={t.estado} />
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{t.a_cargo || <span style={{ opacity: 0.4 }}>Sin asignar</span>}</div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleOpenModal(t)}
                        style={{
                          padding: '6px 14px', borderRadius: '10px',
                          background: 'rgba(139,92,246,0.15)',
                          border: '1px solid rgba(139,92,246,0.3)',
                          color: '#a78bfa', cursor: 'pointer', fontSize: '0.72rem',
                          fontWeight: '700', marginRight: '6px', transition: 'all 0.2s'
                        }}
                      >
                        ⚙️ Gestionar
                      </button>
                      {user.rol?.toLowerCase() === 'administrador' && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          style={{
                            padding: '6px 10px', borderRadius: '10px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: '#f87171', cursor: 'pointer', fontSize: '0.85rem',
                          }}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              style={{
                width: '100%', maxWidth: '860px',
                maxHeight: '90vh',
                background: 'linear-gradient(145deg, #1a1040 0%, #1e1550 60%, #13103a 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px 28px 20px',
                background: 'linear-gradient(90deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1))',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>
                    {editingId ? '⚙️ Gestionar Ticket' : '📞 Registrar Nuevo Reclamo'}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {editingId ? 'Actualiza el estado y observaciones del ticket.' : 'Completa los datos del reclamo o soporte.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', width: '36px', height: '36px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px 28px', flex: 1 }}>
                <form onSubmit={handleSubmit}>
                  {/* Sección: Datos del cliente */}
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase',
                      letterSpacing: '0.1em', color: '#ec4899'
                    }}>
                      Información del Cliente
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    {/* Dropdown cliente */}
                    <div ref={clientRef} style={{ position: 'relative' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Cliente Solicitante *
                      </label>
                      <input
                        className="input"
                        placeholder="Buscar por nombre, ID, o teléfono..."
                        value={clientSearch}
                        onChange={e => {
                          setClientSearch(e.target.value);
                          setFormData(prev => ({ ...prev, cliente_nombre: e.target.value }));
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        style={{ width: '100%', marginBottom: 0, paddingRight: '36px' }}
                        autoComplete="off"
                        required
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '38px', color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none' }}>
                        ▾
                      </span>
                      <AnimatePresence>
                        {showClientDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                              background: '#1a1040',
                              border: '1px solid rgba(139,92,246,0.3)',
                              borderRadius: '12px', marginTop: '4px',
                              maxHeight: '220px', overflowY: 'auto',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            }}
                          >
                            {filteredClientes.length === 0 ? (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                Sin coincidencias
                              </div>
                            ) : filteredClientes.map(c => (
                              <div
                                key={c.id}
                                onClick={() => handleSelectClient(c)}
                                style={{
                                  padding: '10px 14px', cursor: 'pointer',
                                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                                  transition: 'background 0.15s',
                                  display: 'flex', flexDirection: 'column', gap: '2px',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ fontWeight: '700', fontSize: '0.82rem' }}>
                                  #{c.id} — {c.nombre}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {c.parroquia} | 📱 {c.celular} | IP: {c.ip || 'N/A'}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        IP / Referencia de Conexión
                      </label>
                      <input
                        className="input"
                        value={formData.ip}
                        onChange={e => setFormData({ ...formData, ip: e.target.value })}
                        placeholder="Ej: 172.18.2.8"
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Teléfono(s) de Contacto
                      </label>
                      <input
                        className="input"
                        value={formData.telefono}
                        onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="0999... 0980..."
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Dirección / Sector
                      </label>
                      <input
                        className="input"
                        value={formData.direccion}
                        onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Ej: Av. Ordoñez Lasso..."
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase',
                      letterSpacing: '0.1em', color: '#ec4899'
                    }}>
                      Detalle del Reclamo
                    </span>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Problema del Cliente
                    </label>
                    <textarea
                      className="input"
                      rows="3"
                      value={formData.problema}
                      onChange={e => setFormData({ ...formData, problema: e.target.value })}
                      placeholder="Describe el problema reportado por el cliente..."
                      style={{ fontFamily: 'inherit', resize: 'vertical', marginBottom: 0 }}
                    />
                  </div>

                  {/* Sección resolución */}
                  <div style={{
                    background: 'rgba(0,0,0,0.25)', borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '18px', marginBottom: '20px'
                  }}>
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: '#8b5cf6'
                      }}>
                        🔍 Resolución y Seguimiento
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Estado del Ticket
                        </label>
                        <select
                          className="input"
                          value={formData.estado}
                          onChange={e => setFormData({ ...formData, estado: e.target.value })}
                          style={{ background: '#1e1b4b', fontWeight: '700', marginBottom: 0 }}
                        >
                          {ESTADOS.map(e => (
                            <option key={e.value} value={e.value}>{e.icon} {e.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Personal A Cargo
                        </label>
                        <input
                          className="input"
                          value={formData.a_cargo}
                          onChange={e => setFormData({ ...formData, a_cargo: e.target.value })}
                          placeholder="Ej: SOLANO, LLERENA..."
                          style={{ marginBottom: 0 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: '#fcd34d' }}>
                        Observación Después de Revisión
                      </label>
                      <textarea
                        className="input"
                        rows="6"
                        value={formData.observacion_revision}
                        onChange={e => setFormData({ ...formData, observacion_revision: e.target.value })}
                        placeholder="Detalle de la solución, pasos realizados, equipo revisado..."
                        style={{ fontFamily: 'inherit', resize: 'vertical', marginBottom: 0, minHeight: '110px' }}
                      />
                      <div style={{ textAlign: 'right', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                        {formData.observacion_revision.length} caracteres
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      disabled={submitting}
                      style={{
                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                        color: 'white', fontWeight: '700', minWidth: '150px',
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      {submitting ? '⌛ Guardando...' : (editingId ? '✅ Actualizar Ticket' : '📞 Crear Ticket')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallCenter;
