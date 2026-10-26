/**
 * @file CallCenter.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { callCenterService, clienteService, hojaRutaService, configuracionService } from '../services/api';
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
  const [tecnicos, setTecnicos]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [editingId, setEditingId]   = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [obsModalTicket, setObsModalTicket] = useState(null);
  const [copiedObs, setCopiedObs] = useState(false);
  const clientRef = useRef(null);

  // Estados para modal "Enviar a Hoja de Ruta"
  const [showHojaRutaModal, setShowHojaRutaModal] = useState(false);
  const [submittingHojaRuta, setSubmittingHojaRuta] = useState(false);
  const [hojaRutaForm, setHojaRutaForm] = useState({
    ticket_id: null,
    cliente_id: null,
    nombre_cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    tecnico: '',
    actividad: 'VISITA TECNICA',
    observacion: '',
    ubicacion_cliente: '',
    celular_cliente: '',
    parroquia: '',
    ubicacion_caja: '',
  });

  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  const handleCopyObs = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedObs(true);
    setTimeout(() => setCopiedObs(false), 2000);
  };

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
      const [tkRes, clRes, usrRes] = await Promise.all([
        callCenterService.listar(),
        clienteService.listar(),
        configuracionService.getUsuarios().catch(() => ({ data: [] })),
      ]);
      setTickets(tkRes.data || []);
      setClientes(clRes.data || []);
      const allUsers = usrRes.data || [];
      const tecs = allUsers.filter(u => u.rol?.toLowerCase() === 'tecnico');
      setTecnicos(tecs.length > 0 ? tecs : allUsers);
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
      (c.celular || '').includes(term) ||
      (c.cedula || '').includes(term)
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

  /* Abrir modal para Enviar a Hoja de Ruta */
  const handleOpenHojaRutaModal = (ticket) => {
    if (!ticket) return;

    const tNombre = (ticket.cliente_nombre || '').trim().toLowerCase();
    const tIp = (ticket.ip || '').trim();
    const tTel = (ticket.telefono || '').replace(/\D/g, '');

    const matchedClient = clientes.find(c => {
      if (tNombre && c.nombre && c.nombre.trim().toLowerCase() === tNombre) return true;
      if (tIp && c.ip && c.ip.trim() === tIp) return true;
      if (tTel && c.celular) {
        const cTel = c.celular.replace(/\D/g, '');
        if (cTel && (cTel.includes(tTel) || tTel.includes(cTel))) return true;
      }
      return false;
    });

    const now = new Date();
    const currentHora = now.toTimeString().slice(0, 5);

    // Las observaciones para Hoja de Ruta deben ser prioritariamente la Observación Revisión
    const obsRevision = (ticket.observacion_revision || '').trim();
    const problemaTxt = (ticket.problema || '').trim();
    let obsFinal = obsRevision;
    if (!obsFinal && problemaTxt) {
      obsFinal = `Problema reportado: ${problemaTxt}`;
    }

    const matchedTecnico = tecnicos.find(t => 
      ticket.a_cargo && t.username && t.username.toLowerCase() === ticket.a_cargo.trim().toLowerCase()
    );
    const tecDefault = matchedTecnico ? matchedTecnico.username : (ticket.a_cargo || (tecnicos[0]?.username || ''));

    setHojaRutaForm({
      ticket_id: ticket.id || null,
      cliente_id: matchedClient?.id || null,
      nombre_cliente: ticket.cliente_nombre || matchedClient?.nombre || '',
      fecha: new Date().toISOString().split('T')[0],
      hora: currentHora,
      tecnico: tecDefault,
      actividad: 'VISITA TECNICA',
      observacion: obsFinal,
      ubicacion_cliente: ticket.direccion || matchedClient?.ubicacion || matchedClient?.direccion || '',
      celular_cliente: ticket.telefono || matchedClient?.celular || '',
      parroquia: matchedClient?.parroquia || '',
      ubicacion_caja: matchedClient?.nap || matchedClient?.caja_nap || '',
    });

    setShowHojaRutaModal(true);
  };

  /* Submit Hoja de Ruta */
  const handleSubmitHojaRuta = async (e) => {
    e.preventDefault();
    if (!hojaRutaForm.hora) {
      showWarning("Por favor ingrese la hora de la visita técnica");
      return;
    }
    if (!hojaRutaForm.tecnico) {
      showWarning("Por favor seleccione un técnico responsable");
      return;
    }

    setSubmittingHojaRuta(true);
    try {
      const payload = {
        fecha: hojaRutaForm.fecha,
        hora: hojaRutaForm.hora,
        tecnico: hojaRutaForm.tecnico,
        cliente_id: hojaRutaForm.cliente_id ? Number(hojaRutaForm.cliente_id) : null,
        nombre_cliente: hojaRutaForm.nombre_cliente,
        ubicacion_cliente: hojaRutaForm.ubicacion_cliente,
        celular_cliente: hojaRutaForm.celular_cliente,
        ubicacion_caja: hojaRutaForm.ubicacion_caja,
        actividad: hojaRutaForm.actividad || 'VISITA TECNICA',
        observacion: hojaRutaForm.observacion,
        parroquia: hojaRutaForm.parroquia,
        estado: 'Pendiente'
      };

      await hojaRutaService.crear(payload);
      setShowHojaRutaModal(false);
      showSuccess("¡Visita técnica agendada exitosamente en la Hoja de Ruta!");
    } catch (err) {
      console.error("Error al agendar en Hoja de Ruta:", err);
      const detail = err.response?.data?.detail;
      showError(typeof detail === 'string' ? detail : "Error al registrar en Hoja de Ruta");
    } finally {
      setSubmittingHojaRuta(false);
    }
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let savedTicket = null;
      if (editingId) {
        const res = await callCenterService.actualizar(editingId, formData);
        savedTicket = res.data;
      } else {
        const res = await callCenterService.crear(formData);
        savedTicket = res.data;
      }
      setShowModal(false);
      await fetchData(true);

      // Si el ticket se marcó como VISITA TECNICA, abrir automáticamente el modal para enviar a Hoja de Ruta
      if (formData.estado === 'VISITA TECNICA') {
        handleOpenHojaRutaModal(savedTicket || { ...formData, id: editingId });
      } else {
        showSuccess(editingId ? "Ticket actualizado correctamente" : "Ticket registrado correctamente");
      }
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
                      {(() => {
                        const obs = (t.observacion_revision || '').trim();
                        if (!obs) {
                          return <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>-</span>;
                        }
                        const isLong = obs.length > 100 || obs.split('\n').length > 3;
                        return (
                          <div>
                            <div
                              className="preserve-breaks"
                              style={{
                                fontSize: '0.73rem',
                                color: 'var(--text-main)',
                                lineHeight: '1.5',
                                ...(isLong ? {
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  wordBreak: 'break-word',
                                  cursor: 'pointer',
                                } : {
                                  wordBreak: 'break-word',
                                })
                              }}
                              onClick={isLong ? () => setObsModalTicket(t) : undefined}
                              title={isLong ? "Clic para ver la información completa" : undefined}
                            >
                              {obs}
                            </div>
                            {isLong && (
                              <button
                                type="button"
                                onClick={() => setObsModalTicket(t)}
                                style={{
                                  background: 'rgba(139, 92, 246, 0.12)',
                                  border: '1px solid rgba(139, 92, 246, 0.25)',
                                  color: '#a78bfa',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.68rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  marginTop: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
                                  e.currentTarget.style.color = '#c4b5fd';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)';
                                  e.currentTarget.style.color = '#a78bfa';
                                }}
                              >
                                Ver más 👁️
                              </button>
                            )}
                          </div>
                        );
                      })()}
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
                      {t.estado === 'VISITA TECNICA' && (
                        <button
                          onClick={() => handleOpenHojaRutaModal(t)}
                          style={{
                            padding: '6px 12px', borderRadius: '10px',
                            background: 'rgba(249,115,22,0.15)',
                            border: '1px solid rgba(249,115,22,0.35)',
                            color: '#fb923c', cursor: 'pointer', fontSize: '0.72rem',
                            fontWeight: '700', marginRight: '6px', transition: 'all 0.2s',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}
                          title="Enviar o re-agendar en Hoja de Ruta"
                        >
                          🗓️ Hoja de Ruta
                        </button>
                      )}
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
                                <div style={{ fontWeight: '700', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>#{c.id} — {c.nombre}</span>
                                  {c.estado && (
                                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                                      {c.estado}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {c.parroquia || 'Sin sector'} | 📱 {c.celular || 'S/N'} | IP: {c.ip || 'N/A'}
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

      {/* ── MODAL DE DETALLE COMPLETO DE OBSERVACIÓN ── */}
      <AnimatePresence>
        {obsModalTicket && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1050,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setObsModalTicket(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              style={{
                width: '100%', maxWidth: '680px',
                maxHeight: '90vh',
                background: 'linear-gradient(145deg, #181236 0%, #1c1545 60%, #120e2e 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(139,92,246,0.3)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                background: 'linear-gradient(90deg, rgba(236,72,153,0.12), rgba(139,92,246,0.15))',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
                  }}>
                    📋
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>
                      Detalle de Observación / Revisión
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Ticket #{obsModalTicket.id} • {obsModalTicket.cliente_nombre || 'Cliente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setObsModalTicket(null)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', width: '34px', height: '34px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Metadatos del Ticket */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px',
                  background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.05em' }}>
                      Cliente Solicitante
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginTop: '3px' }}>
                      {obsModalTicket.cliente_nombre || '-'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#a78bfa', marginTop: '2px' }}>
                      {obsModalTicket.telefono ? `📞 ${obsModalTicket.telefono}` : ''}
                      {obsModalTicket.ip ? ` • IP: ${obsModalTicket.ip}` : ''}
                    </div>
                    {obsModalTicket.direccion && (
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                        📍 {obsModalTicket.direccion}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.05em' }}>
                      Estado del Ticket
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <EstadoBadge estado={obsModalTicket.estado} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                      A cargo: <strong style={{ color: '#e2e8f0' }}>{obsModalTicket.a_cargo || 'Sin asignar'}</strong>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.05em' }}>
                      Registro & Tiempos
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#ec4899', fontWeight: '700', marginTop: '3px' }}>
                      📅 {obsModalTicket.fecha_ingreso ? formatToDMY(obsModalTicket.fecha_ingreso) : '-'}
                      {obsModalTicket.fecha_ingreso && (
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>
                          {new Date(obsModalTicket.fecha_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {obsModalTicket.registrado_por && (
                      <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                        Por: {obsModalTicket.registrado_por}
                      </div>
                    )}
                    {obsModalTicket.fecha_cambio_estado && obsModalTicket.estado !== 'PENDIENTE' && (
                      <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginTop: '4px' }}>
                        🕐 Actualizado: {obsModalTicket.fecha_cambio_estado}
                      </div>
                    )}
                  </div>
                </div>

                {/* Problema Reportado */}
                {obsModalTicket.problema && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.05)',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#fbbf24', fontWeight: '800', letterSpacing: '0.08em', marginBottom: '5px' }}>
                      ⚠️ Problema / Motivo del Soporte
                    </div>
                    <div className="preserve-breaks" style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                      {obsModalTicket.problema}
                    </div>
                  </div>
                )}

                {/* Observación de Revisión (Completa) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#a78bfa', fontWeight: '800', letterSpacing: '0.08em' }}>
                      🔍 Observación y Solución de Revisión
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                        {(obsModalTicket.observacion_revision || '').length} caracteres
                      </span>
                      {obsModalTicket.observacion_revision && (
                        <button
                          type="button"
                          onClick={() => handleCopyObs(obsModalTicket.observacion_revision)}
                          style={{
                            background: copiedObs ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${copiedObs ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.12)'}`,
                            color: copiedObs ? '#34d399' : '#c4b5fd',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                          }}
                        >
                          {copiedObs ? '✓ ¡Copiado!' : '📋 Copiar'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="preserve-breaks" style={{
                    background: 'rgba(10, 8, 25, 0.65)',
                    padding: '18px',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    fontSize: '0.86rem',
                    lineHeight: '1.65',
                    color: '#f8fafc',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {obsModalTicket.observacion_revision || 'Sin observaciones registradas.'}
                  </div>
                </div>

              </div>

              {/* Actions Footer */}
              <div style={{
                padding: '16px 24px',
                background: 'rgba(0,0,0,0.25)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', justifyContent: 'flex-end', gap: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    const t = obsModalTicket;
                    setObsModalTicket(null);
                    handleOpenModal(t);
                  }}
                  className="btn"
                  style={{
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    color: '#c4b5fd',
                    fontSize: '0.8rem',
                    fontWeight: '700'
                  }}
                >
                  ⚙️ Gestionar Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setObsModalTicket(null)}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    minWidth: '100px'
                  }}
                >
                  Cerrar
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── MODAL: ENVIAR A HOJA DE RUTA ── */}
      <AnimatePresence>
        {showHojaRutaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowHojaRutaModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              style={{
                width: '100%', maxWidth: '680px',
                maxHeight: '90vh',
                background: 'linear-gradient(145deg, #181136 0%, #1e144a 60%, #130e2f 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(249, 115, 22, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '22px 28px 18px',
                background: 'linear-gradient(90deg, rgba(249,115,22,0.15), rgba(139,92,246,0.15))',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem'
                  }}>
                    🗓️
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>
                      Enviar a Hoja de Ruta
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#fed7aa' }}>
                      Configura la hora, técnico y observaciones para la visita técnica.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHojaRutaModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)', width: '34px', height: '34px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitHojaRuta} style={{ padding: '22px 28px', flex: 1 }}>
                
                {/* Resumen del cliente */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                  fontSize: '0.78rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>Cliente:</span>
                    <strong style={{ color: '#fff' }}>{hojaRutaForm.nombre_cliente || 'Sin nombre'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>Teléfono:</span>
                    <strong style={{ color: '#a78bfa' }}>{hojaRutaForm.celular_cliente || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>Dirección / Sector:</span>
                    <span style={{ color: '#cbd5e1' }}>{hojaRutaForm.ubicacion_cliente || 'N/A'}</span>
                  </div>
                </div>

                {/* Fecha y Hora */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1' }}>
                      📅 Fecha Programada *
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={hojaRutaForm.fecha}
                      onChange={e => setHojaRutaForm({ ...hojaRutaForm, fecha: e.target.value })}
                      style={{ marginBottom: 0, width: '100%' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#f59e0b' }}>
                      ⏰ Hora Programada *
                    </label>
                    <input
                      type="time"
                      className="input"
                      value={hojaRutaForm.hora}
                      onChange={e => setHojaRutaForm({ ...hojaRutaForm, hora: e.target.value })}
                      style={{
                        marginBottom: 0, width: '100%',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        background: '#1e1842',
                        color: '#fef3c7',
                        fontWeight: '700'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Técnico y Actividad */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8' }}>
                      👨‍🔧 Técnico Responsable *
                    </label>
                    <select
                      className="input"
                      value={hojaRutaForm.tecnico}
                      onChange={e => setHojaRutaForm({ ...hojaRutaForm, tecnico: e.target.value })}
                      style={{
                        marginBottom: 0, width: '100%',
                        background: '#1e1842',
                        color: '#ffffff',
                        fontWeight: '700',
                        border: '1px solid rgba(56, 189, 248, 0.4)'
                      }}
                      required
                    >
                      <option value="">-- Seleccionar Técnico --</option>
                      {tecnicos.map(t => (
                        <option key={t.id || t.username} value={t.username}>
                          👨‍🔧 {t.username} {t.rol ? `(${t.rol})` : ''}
                        </option>
                      ))}
                      {hojaRutaForm.tecnico && !tecnicos.some(t => t.username === hojaRutaForm.tecnico) && (
                        <option value={hojaRutaForm.tecnico}>
                          👨‍🔧 {hojaRutaForm.tecnico}
                        </option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1' }}>
                      Actividad
                    </label>
                    <input
                      className="input"
                      value={hojaRutaForm.actividad}
                      onChange={e => setHojaRutaForm({ ...hojaRutaForm, actividad: e.target.value })}
                      placeholder="Ej: VISITA TECNICA"
                      style={{ marginBottom: 0, width: '100%' }}
                    />
                  </div>
                </div>

                {/* Observaciones (Observación Revisión) */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fcd34d' }}>
                      📝 Observaciones para el Técnico (Observación Revisión) *
                    </label>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                      Pre-llenado de Call Center
                    </span>
                  </div>
                  <textarea
                    className="input"
                    rows="5"
                    value={hojaRutaForm.observacion}
                    onChange={e => setHojaRutaForm({ ...hojaRutaForm, observacion: e.target.value })}
                    placeholder="Detalle técnico de la visita, instrucciones para el técnico..."
                    style={{
                      fontFamily: 'inherit', resize: 'vertical', marginBottom: 0,
                      minHeight: '90px', width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(252, 211, 77, 0.35)',
                      color: '#f8fafc',
                      lineHeight: '1.5'
                    }}
                    required
                  />
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    Esta observación se registrará en la Hoja de Ruta para que el técnico la visualice en campo.
                  </div>
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setShowHojaRutaModal(false)}
                    className="btn"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingHojaRuta}
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '0.82rem',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      cursor: submittingHojaRuta ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(249, 115, 22, 0.35)'
                    }}
                  >
                    {submittingHojaRuta ? 'Enviando...' : '🚀 Confirmar y Enviar a Hoja de Ruta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallCenter;
