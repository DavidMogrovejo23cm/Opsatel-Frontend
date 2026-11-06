/**
 * @file CallCenter.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { callCenterService, clienteService, hojaRutaService, configuracionService } from '../services/api';
import { whatsappService } from '../services/whatsappService';
import { motion, AnimatePresence } from 'framer-motion';
import { formatToDMY } from '../services/dateUtils';
import { showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';

/* ────────────────────────────────────────────
   ESTADO CONFIG
────────────────────────────────────────────── */
const ESTADOS = [
  { value: 'PENDIENTE',                      label: 'Pendiente',               sublabel: 'por atender', color: '#94a3b8', bg: 'rgba(100,116,139,0.15)', icon: '⏳' },
  { value: 'SOLUCIONADO',                    label: 'Solucionado',             sublabel: 'cerrados',    color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: '✅' },
  { value: 'ESPERA DE RESPUESTA DE CLIENTE', label: 'Espera Respuesta',       sublabel: 'en proceso',  color: '#eab308', bg: 'rgba(234,179,8,0.15)',   icon: '⏰' },
  { value: 'NO SOLUCIONADO',                 label: 'No Solucionado',          sublabel: 'sin resolver',color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '❌' },
  { value: 'VISITA TECNICA',                 label: 'Visita Técnica',          sublabel: 'programadas', color: '#f97316', bg: 'rgba(249,115,22,0.15)',  icon: '🔧' },
];

const STAT_CARDS = [
  { value: 'TODOS',                            label: 'Total Clientes',  sublabel: 'orden A-Z',   icon: '👥', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { value: 'PENDIENTE',                        label: 'Pendientes',      sublabel: 'por atender', icon: '⏳', color: '#94a3b8', bg: 'rgba(100,116,139,0.15)' },
  { value: 'SOLUCIONADO',                      label: 'Solucionados',    sublabel: 'cerrados',    icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { value: 'ESPERA DE RESPUESTA DE CLIENTE',   label: 'En espera',       sublabel: 'en proceso',  icon: '⏰', color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  { value: 'NO SOLUCIONADO',                   label: 'No solucionados', sublabel: 'sin resolver',icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { value: 'VISITA TECNICA',                   label: 'Visita técnica',  sublabel: 'programadas', icon: '🔧', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
];

const getEstado = (val) =>
  ESTADOS.find(e => e.value === (val || '').toUpperCase()) || ESTADOS[0];

const getInitials = (name) => {
  if (!name) return 'CL';
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarColor = (name) => {
  const gradients = [
    'linear-gradient(135deg, #6366f1, #4338ca)',
    'linear-gradient(135deg, #0ea5e9, #0369a1)',
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #10b981, #047857)',
    'linear-gradient(135deg, #f59e0b, #b45309)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #14b8a6, #0f766e)',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const getPhoneInfo = (rawPhone) => {
  if (!rawPhone) return { callPhone: '', waPhone: '' };
  const parts = String(rawPhone).split(/[/,;|\\\n\r]|\s+(?:y|o|-)\s+/i).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return { callPhone: '', waPhone: '' };
  const firstPart = parts[0].split(/\s+/)[0] || parts[0];
  const cleanDigits = firstPart.replace(/\D/g, '');
  let wa = cleanDigits;
  if (cleanDigits.startsWith('09')) wa = '593' + cleanDigits.slice(1);
  else if (!cleanDigits.startsWith('593') && cleanDigits.length === 9) wa = '593' + cleanDigits;
  return { callPhone: firstPart, waPhone: wa };
};

const formatChatDate = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(typeof dateVal === 'string' ? dateVal.replace(' ', 'T') : dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return String(dateVal);
  }
};

/* ────────────────────────────────────────────
   BADGE ESTADO
────────────────────────────────────────────── */
const EstadoBadge = ({ estado }) => {
  if (!estado) {
    return (
      <span style={{
        background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '4px 10px', borderRadius: '20px',
        fontSize: '0.62rem', fontWeight: '700',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        whiteSpace: 'nowrap',
      }}>
        ⚪ Sin Ticket
      </span>
    );
  }
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
   MAIN CALL CENTER COMPONENT
────────────────────────────────────────────── */
const CallCenter = () => {
  const [tickets, setTickets]       = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [tecnicos, setTecnicos]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cliente y Ticket seleccionado en Modal
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null); // id o 'NEW'
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    id: null,
    estado: 'PENDIENTE',
    a_cargo: '',
    problema: '',
    observacion_revision: '',
    registrado_por: ''
  });

  // Chat de WhatsApp en Modal
  const [chatMensajes, setChatMensajes] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [nuevoMensajeChat, setNuevoMensajeChat] = useState('');
  const [enviandoMensajeChat, setEnviandoMensajeChat] = useState(false);
  const chatEndRef = useRef(null);

  // Modal para Enviar a Hoja de Ruta
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

  /* ────────────────────────────────────────────
     FETCH DATA
  ────────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────
     ASOCIAR TICKETS A CLIENTES (Y PRESERVAR EXISTENTES)
  ────────────────────────────────────────────── */
  const clientTicketsMap = useMemo(() => {
    const map = new Map();
    const nameToId = new Map();
    const phoneToId = new Map();
    const ipToId = new Map();

    (clientes || []).forEach(c => {
      map.set(c.id, []);
      if (c.nombre) nameToId.set(c.nombre.trim().toLowerCase(), c.id);
      if (c.ip && c.ip.trim()) ipToId.set(c.ip.trim(), c.id);
      if (c.celular) {
        const clean = c.celular.replace(/\D/g, '');
        if (clean && clean.length >= 7) phoneToId.set(clean, c.id);
      }
    });

    const unmatchedTickets = [];

    (tickets || []).forEach(ticket => {
      let matchedId = null;
      const tName = (ticket.cliente_nombre || '').trim().toLowerCase();
      const tIp = (ticket.ip || '').trim();
      const tTel = (ticket.telefono || '').replace(/\D/g, '');

      if (ticket.cliente_id && map.has(ticket.cliente_id)) {
        matchedId = ticket.cliente_id;
      } else if (tName && nameToId.has(tName)) {
        matchedId = nameToId.get(tName);
      } else if (tIp && ipToId.has(tIp)) {
        matchedId = ipToId.get(tIp);
      } else if (tTel && tTel.length >= 7) {
        for (const [phone, cId] of phoneToId.entries()) {
          if (phone === tTel || phone.includes(tTel) || tTel.includes(phone)) {
            matchedId = cId;
            break;
          }
        }
      }

      if (matchedId && map.has(matchedId)) {
        map.get(matchedId).push(ticket);
      } else {
        unmatchedTickets.push(ticket);
      }
    });

    // Ordenar tickets de cada cliente: más reciente primero
    for (const list of map.values()) {
      list.sort((a, b) => new Date(b.fecha_ingreso || 0) - new Date(a.fecha_ingreso || 0));
    }

    return { map, unmatchedTickets };
  }, [clientes, tickets]);

  /* ────────────────────────────────────────────
     LISTA DE TODOS LOS CLIENTES ORDENADOS DE LA A A LA Z
  ────────────────────────────────────────────── */
  const allClientsList = useMemo(() => {
    // Clientes base ordenados de A a Z
    const sorted = [...(clientes || [])].sort((a, b) =>
      (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })
    );

    // Integrar cualquier ticket existente cuyo cliente no esté en la base de datos
    if (clientTicketsMap.unmatchedTickets.length > 0) {
      const grouped = {};
      clientTicketsMap.unmatchedTickets.forEach(t => {
        const key = (t.cliente_nombre || `Ticket #${t.id}`).trim();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
      });

      Object.entries(grouped).forEach(([name, tList]) => {
        tList.sort((a, b) => new Date(b.fecha_ingreso || 0) - new Date(a.fecha_ingreso || 0));
        const first = tList[0];
        const virtualClient = {
          id: `T-${first.id}`,
          nombre: name,
          celular: first.telefono || '',
          ip: first.ip || '',
          direccion: first.direccion || '',
          isVirtual: true,
        };
        clientTicketsMap.map.set(virtualClient.id, tList);
        sorted.push(virtualClient);
      });

      sorted.sort((a, b) =>
        (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })
      );
    }

    return sorted;
  }, [clientes, clientTicketsMap]);

  /* ────────────────────────────────────────────
     FILTRADO DE CLIENTES POR BÚSQUEDA Y ESTADO
  ────────────────────────────────────────────── */
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return allClientsList.filter(client => {
      const clientTickets = clientTicketsMap.map.get(client.id) || [];
      const latestTicket = clientTickets[0] || null;
      const latestEstado = (latestTicket?.estado || '').toUpperCase();

      // Filtro por Estado
      if (statusFilter !== 'TODOS') {
        if (!latestTicket || latestEstado !== statusFilter) {
          return false;
        }
      }

      // Filtro por Búsqueda General
      if (!term) return true;

      const matchName = (client.nombre || '').toLowerCase().includes(term);
      const matchCel = (client.celular || client.telefono || '').toLowerCase().includes(term);
      const matchIp = (client.ip || '').toLowerCase().includes(term);
      const matchDir = (client.direccion || client.parroquia || '').toLowerCase().includes(term);
      const matchCed = (client.cedula || '').toLowerCase().includes(term);
      const matchId = String(client.id || '').toLowerCase().includes(term);

      // Coincidencia en tickets del cliente
      const matchTicket = clientTickets.some(t =>
        String(t.id || '').includes(term) ||
        (t.problema || '').toLowerCase().includes(term) ||
        (t.observacion_revision || '').toLowerCase().includes(term) ||
        (t.a_cargo || '').toLowerCase().includes(term) ||
        (t.estado || '').toLowerCase().includes(term)
      );

      return matchName || matchCel || matchIp || matchDir || matchCed || matchId || matchTicket;
    });
  }, [allClientsList, clientTicketsMap, searchTerm, statusFilter]);

  /* ────────────────────────────────────────────
     CONTADORES PARA KPIS Y TABS
  ────────────────────────────────────────────── */
  const counts = useMemo(() => {
    const obj = { TODOS: allClientsList.length };
    ESTADOS.forEach(e => {
      obj[e.value] = allClientsList.filter(c => {
        const tList = clientTicketsMap.map.get(c.id) || [];
        const latest = tList[0];
        return latest && (latest.estado || '').toUpperCase() === e.value;
      }).length;
    });
    return obj;
  }, [allClientsList, clientTicketsMap]);

  /* ────────────────────────────────────────────
     PAGINACIÓN
  ────────────────────────────────────────────── */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  const totalItems = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedClients = useMemo(() => {
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, safeCurrentPage - 1);
      let end = Math.min(totalPages - 1, safeCurrentPage + 1);

      if (safeCurrentPage <= 3) end = 4;
      else if (safeCurrentPage >= totalPages - 2) start = totalPages - 3;

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  /* ────────────────────────────────────────────
     CARGAR CHAT DE WHATSAPP DEL CLIENTE
  ────────────────────────────────────────────── */
  const cargarChatCliente = async (phoneVal) => {
    const { waPhone, callPhone } = getPhoneInfo(phoneVal);
    const targetPhone = waPhone || callPhone;
    if (!targetPhone) {
      setChatMensajes([]);
      return;
    }
    setLoadingChat(true);
    try {
      const res = await whatsappService.obtenerChat(targetPhone);
      setChatMensajes(res.data?.mensajes || []);
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.warn("No se pudo cargar chat de WhatsApp:", err);
      setChatMensajes([]);
    } finally {
      setLoadingChat(false);
    }
  };

  /* ────────────────────────────────────────────
     ABRIR MODAL DE GESTIONAR CLIENTE
  ────────────────────────────────────────────── */
  const handleOpenModal = (client) => {
    setSelectedClient(client);
    setShowStatusDropdown(false);
    setNuevoMensajeChat('');

    const clientTickets = clientTicketsMap.map.get(client.id) || [];
    if (clientTickets.length > 0) {
      const latest = clientTickets[0];
      setSelectedTicketId(latest.id);
      setTicketForm({
        id: latest.id,
        estado: latest.estado || 'PENDIENTE',
        a_cargo: latest.a_cargo || latest.registrado_por || user.username || '',
        problema: latest.problema || '',
        observacion_revision: latest.observacion_revision || '',
        registrado_por: latest.registrado_por || user.username || ''
      });
    } else {
      setSelectedTicketId('NEW');
      setTicketForm({
        id: null,
        estado: 'PENDIENTE',
        a_cargo: user.username || '',
        problema: '',
        observacion_revision: '',
        registrado_por: user.username || ''
      });
    }

    setShowModal(true);
    cargarChatCliente(client.celular || client.telefono);
  };

  /* Seleccionar Ticket específico dentro del Modal */
  const handleSelectTicket = (t) => {
    setShowStatusDropdown(false);
    if (t === 'NEW') {
      setSelectedTicketId('NEW');
      setTicketForm({
        id: null,
        estado: 'PENDIENTE',
        a_cargo: user.username || '',
        problema: '',
        observacion_revision: '',
        registrado_por: user.username || ''
      });
    } else {
      setSelectedTicketId(t.id);
      setTicketForm({
        id: t.id,
        estado: t.estado || 'PENDIENTE',
        a_cargo: t.a_cargo || t.registrado_por || user.username || '',
        problema: t.problema || '',
        observacion_revision: t.observacion_revision || '',
        registrado_por: t.registrado_por || user.username || ''
      });
    }
  };

  /* ────────────────────────────────────────────
     GUARDAR O ACTUALIZAR TICKET
  ────────────────────────────────────────────── */
  const handleSaveTicket = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClient) return;

    setSubmitting(true);
    try {
      const payload = {
        cliente_nombre: selectedClient.nombre,
        ip: selectedClient.ip || '',
        direccion: selectedClient.direccion || '',
        telefono: selectedClient.celular || selectedClient.telefono || '',
        estado: ticketForm.estado || 'PENDIENTE',
        a_cargo: ticketForm.a_cargo || user.username || '',
        problema: ticketForm.problema || '',
        observacion_revision: ticketForm.observacion_revision || '',
      };

      let savedTicket = null;
      if (selectedTicketId && selectedTicketId !== 'NEW') {
        const res = await callCenterService.actualizar(selectedTicketId, payload);
        savedTicket = res.data;
        showSuccess(`Ticket #${selectedTicketId} actualizado correctamente`);
      } else {
        const res = await callCenterService.crear(payload);
        savedTicket = res.data;
        setSelectedTicketId(savedTicket.id);
        showSuccess(`Ticket #${savedTicket.id} registrado correctamente`);
      }

      await fetchData(true);

      // Si el ticket se cambió a VISITA TECNICA, abrir Hoja de Ruta
      if (ticketForm.estado === 'VISITA TECNICA') {
        handleOpenHojaRutaModal(savedTicket || { ...payload, id: selectedTicketId });
      }
    } catch (err) {
      console.error("Error al guardar ticket:", err);
      showError(err.response?.data?.detail || "Error al procesar el ticket");
    } finally {
      setSubmitting(false);
    }
  };

  /* ────────────────────────────────────────────
     ENVIAR MENSAJE DESDE EL CHAT DE WHATSAPP
  ────────────────────────────────────────────── */
  const handleEnviarMensajeChat = async (e) => {
    if (e) e.preventDefault();
    const text = nuevoMensajeChat.trim();
    if (!text || !selectedClient) return;

    const { waPhone, callPhone } = getPhoneInfo(selectedClient.celular || selectedClient.telefono);
    const targetPhone = waPhone || callPhone;
    if (!targetPhone) {
      showWarning("El cliente no tiene un número telefónico válido");
      return;
    }

    setEnviandoMensajeChat(true);
    try {
      await whatsappService.enviarMensajeChat(targetPhone, text);
      setNuevoMensajeChat('');

      // Agregar inmediatamente al listado local
      const nowStr = new Date().toISOString();
      setChatMensajes(prev => [
        ...prev,
        {
          id: Date.now(),
          rol: 'operador',
          mensaje: text,
          fecha_hora: nowStr
        }
      ]);

      setTimeout(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 80);

      // Sincronizar con el backend
      setTimeout(() => cargarChatCliente(targetPhone), 1500);
    } catch (err) {
      console.error("Error al enviar mensaje por WhatsApp:", err);
      showError("Error al enviar mensaje por WhatsApp");
    } finally {
      setEnviandoMensajeChat(false);
    }
  };

  /* ────────────────────────────────────────────
     ELIMINAR TICKET
  ────────────────────────────────────────────── */
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
      await fetchData(true);
      if (selectedClient) {
        handleOpenModal(selectedClient);
      }
    } catch {
      showError("Error al eliminar ticket");
    }
  };

  /* ────────────────────────────────────────────
     MODAL HOJA DE RUTA
  ────────────────────────────────────────────── */
  const handleOpenHojaRutaModal = (ticket) => {
    if (!ticket) return;

    const tNombre = (ticket.cliente_nombre || '').trim().toLowerCase();
    const matchedClient = (clientes || []).find(c =>
      c.nombre && c.nombre.trim().toLowerCase() === tNombre
    ) || selectedClient;

    const now = new Date();
    const currentHora = now.toTimeString().slice(0, 5);

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
      const obsConRef = hojaRutaForm.ticket_id
        ? `${hojaRutaForm.observacion}\n[Ref Ticket Call Center #${hojaRutaForm.ticket_id}]`
        : hojaRutaForm.observacion;

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
        observacion: obsConRef,
        parroquia: hojaRutaForm.parroquia,
        estado: 'Pendiente',
        callcenter_ticket_id: hojaRutaForm.ticket_id ? Number(hojaRutaForm.ticket_id) : null
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

  /* Datos del cliente seleccionado */
  const modalClientTickets = selectedClient ? (clientTicketsMap.map.get(selectedClient.id) || []) : [];
  const activeTicket = modalClientTickets.find(t => t.id === selectedTicketId) || null;
  const modalWaInfo = selectedClient ? getPhoneInfo(selectedClient.celular || selectedClient.telefono) : { waPhone: '', callPhone: '' };

  /* ────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────── */
  return (
    <div style={{ width: '100%', padding: '0' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '22px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '2.1rem', fontWeight: '900', margin: 0,
            background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            📞 Call Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
            Directorio general de clientes ordenados de la A a la Z, gestión de tickets y chat de WhatsApp en vivo.
          </p>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="cc-desktop-view">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}>
          {STAT_CARDS.map(card => {
            const isActive = statusFilter === card.value;
            const count = counts[card.value] ?? 0;
            return (
              <div
                key={card.value}
                onClick={() => {
                  setStatusFilter(card.value);
                  setCurrentPage(1);
                }}
                style={{
                  background: isActive
                    ? `linear-gradient(145deg, ${card.color}20 0%, rgba(255,255,255,0.03) 100%)`
                    : 'rgba(255,255,255,0.02)',
                  borderRadius: '18px',
                  border: `1.5px solid ${isActive ? card.color : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isActive ? `0 8px 24px ${card.color}24` : '0 4px 14px rgba(0,0,0,0.2)',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  userSelect: 'none'
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.borderColor = `${card.color}66`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  background: card.bg || `${card.color}22`,
                  border: `1.5px solid ${card.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', flexShrink: 0
                }}>
                  {card.icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: '700',
                    color: isActive ? card.color : 'var(--text-muted)',
                    textTransform: 'capitalize', letterSpacing: '0.02em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {card.label}
                  </div>
                  <div style={{
                    fontSize: '1.65rem', fontWeight: '900', color: '#fff',
                    lineHeight: '1.15', marginTop: '2px'
                  }}>
                    {count}
                  </div>
                  <div style={{
                    fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)',
                    marginTop: '2px', whiteSpace: 'nowrap'
                  }}>
                    {card.sublabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BARRA DE PESTAÑAS Y BUSCADOR */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '12px', marginBottom: '16px', flexWrap: 'wrap'
        }}>
          {/* Tabs por Estado */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[{ value: 'TODOS', label: 'Todos', color: '#8b5cf6', icon: '👥' }, ...ESTADOS].map(e => {
              const isActive = statusFilter === e.value;
              const cnt = counts[e.value] ?? 0;
              return (
                <button
                  key={e.value}
                  onClick={() => {
                    setStatusFilter(e.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '7px 16px', borderRadius: '25px',
                    border: `1.5px solid ${isActive ? (e.color || '#8b5cf6') : 'rgba(255,255,255,0.08)'}`,
                    background: isActive ? `${e.color || '#8b5cf6'}26` : 'rgba(255,255,255,0.03)',
                    color: isActive ? (e.color || '#8b5cf6') : 'var(--text-muted)',
                    cursor: 'pointer', fontWeight: isActive ? '800' : '500',
                    fontSize: '0.78rem', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <span>{e.icon}</span>
                  <span>{e.label}</span>
                  <span style={{
                    background: isActive ? (e.color || '#8b5cf6') : 'rgba(255,255,255,0.1)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    borderRadius: '12px', padding: '1px 8px',
                    fontSize: '0.68rem', fontWeight: '800'
                  }}>
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Buscador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder="🔍 Buscar cliente (A-Z), tel, IP, problema..."
                style={{
                  width: '300px', marginBottom: 0,
                  padding: '9px 32px 9px 16px', fontSize: '0.8rem',
                  borderRadius: '20px', background: 'rgba(255,255,255,0.04)',
                  borderColor: searchTerm ? '#8b5cf6' : 'rgba(255,255,255,0.1)'
                }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', fontSize: '0.8rem', padding: 0
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {(searchTerm || statusFilter !== 'TODOS') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('TODOS');
                }}
                style={{
                  padding: '7px 14px', borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer', fontWeight: '600', fontSize: '0.74rem'
                }}
              >
                Restablecer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── BÚSQUEDA GENERAL EN MÓVIL ── */}
      <div className="cc-mobile-view" style={{ padding: '0 4px 14px 4px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            className="input"
            placeholder="🔍 Buscar cliente (A-Z), teléfono, IP..."
            style={{
              width: '100%', marginBottom: 0,
              padding: '11px 40px 11px 16px', fontSize: '0.88rem',
              borderRadius: '14px', background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${searchTerm ? '#8b5cf6' : 'rgba(255,255,255,0.12)'}`,
              color: '#fff', boxSizing: 'border-box'
            }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: '0.9rem', padding: 0
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── TABLA PRINCIPAL DE CLIENTES (ORDENADOS A - Z) ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Cargando clientes de la A a la Z...
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden'
        }}>
          {/* ── VISTA ESCRITORIO: TABLA (NOMBRE, CONTACTO, ESTADO, A CARGO, ACCIONES) ── */}
          <div className="cc-desktop-view" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ minWidth: '950px', width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.07)'
                }}>
                  {['Nombre (A-Z)', 'Contacto', 'Estado', 'A Cargo', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '14px 18px', textAlign: 'left',
                      fontSize: '0.67rem', textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--text-muted)',
                      fontWeight: '800', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron clientes con los filtros actuales.
                    </td>
                  </tr>
                ) : paginatedClients.map((client, idx) => {
                  const clientTickets = clientTicketsMap.map.get(client.id) || [];
                  const latestTicket = clientTickets[0] || null;
                  const { callPhone, waPhone } = getPhoneInfo(client.celular || client.telefono);

                  return (
                    <tr
                      key={client.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        transition: 'background 0.15s',
                        verticalAlign: 'middle',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      {/* 1. NOMBRE (CON AVATAR) */}
                      <td style={{ padding: '14px 18px', minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px', height: '42px', borderRadius: '50%',
                            background: getAvatarColor(client.nombre),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '900', fontSize: '0.82rem', color: '#ffffff',
                            flexShrink: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            boxShadow: '0 3px 10px rgba(0,0,0,0.3)'
                          }}>
                            {getInitials(client.nombre)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontWeight: '800', fontSize: '0.88rem', color: '#f8fafc',
                              lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                              <span>{client.nombre || 'Sin Nombre'}</span>
                              {!client.isVirtual && client.id && (
                                <span style={{
                                  fontSize: '0.68rem', color: '#818cf8', fontWeight: '800',
                                  background: 'rgba(129, 140, 248, 0.12)', padding: '1px 6px',
                                  borderRadius: '6px'
                                }}>
                                  #{client.id}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                IP: <strong style={{ color: client.ip ? '#cbd5e1' : '#64748b' }}>{client.ip || 'N/A'}</strong>
                              </span>
                              {clientTickets.length > 0 && (
                                <span style={{
                                  fontSize: '0.62rem', background: 'rgba(236,72,153,0.14)',
                                  color: '#f472b6', padding: '1px 6px', borderRadius: '10px',
                                  fontWeight: '800'
                                }}>
                                  🎫 {clientTickets.length} ticket{clientTickets.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. CONTACTO (TELÉFONO, DIRECCIÓN) */}
                      <td style={{ padding: '14px 16px', minWidth: '200px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1' }}>
                            <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>📞</span>
                            <span>{client.celular || client.telefono || 'Sin teléfono'}</span>
                            {waPhone && (
                              <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#25d366', textDecoration: 'none',
                                  fontSize: '0.72rem', marginLeft: '4px'
                                }}
                                title="Abrir en WhatsApp"
                              >
                                💬
                              </a>
                            )}
                          </div>
                          {(client.direccion || client.parroquia) && (
                            <div style={{
                              display: 'flex', alignItems: 'flex-start', gap: '6px',
                              fontSize: '0.7rem', color: '#94a3b8', lineHeight: '1.3'
                            }}>
                              <span style={{ color: '#818cf8', flexShrink: 0 }}>📍</span>
                              <span>{client.direccion || client.parroquia}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. ESTADO */}
                      <td style={{ padding: '14px 16px' }}>
                        <EstadoBadge estado={latestTicket?.estado} />
                      </td>

                      {/* 4. A CARGO */}
                      <td style={{ padding: '14px 16px', minWidth: '140px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>👤</span>
                          <span style={{
                            fontSize: '0.78rem', fontWeight: '700',
                            color: (latestTicket?.a_cargo || latestTicket?.registrado_por) ? '#f1f5f9' : '#64748b'
                          }}>
                            {latestTicket?.a_cargo || latestTicket?.registrado_por || 'Sin asignar'}
                          </span>
                        </div>
                      </td>

                      {/* 5. ACCIONES */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleOpenModal(client)}
                          style={{
                            padding: '7px 16px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))',
                            border: '1px solid rgba(139,92,246,0.4)',
                            color: '#c4b5fd', cursor: 'pointer', fontSize: '0.74rem',
                            fontWeight: '800', marginRight: '6px', transition: 'all 0.2s',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 2px 8px rgba(139,92,246,0.2)'
                          }}
                        >
                          <span>⚙️</span> Gestionar ▾
                        </button>
                        {latestTicket?.estado === 'VISITA TECNICA' && (
                          <button
                            onClick={() => handleOpenHojaRutaModal(latestTicket)}
                            style={{
                              padding: '7px 12px', borderRadius: '10px',
                              background: 'rgba(249,115,22,0.15)',
                              border: '1px solid rgba(249,115,22,0.35)',
                              color: '#fb923c', cursor: 'pointer', fontSize: '0.72rem',
                              fontWeight: '700', marginRight: '6px', transition: 'all 0.2s',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}
                            title="Enviar a Hoja de Ruta"
                          >
                            🗓️ Hoja de Ruta
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── VISTA MÓVIL: TARJETAS DE CLIENTES ── */}
          <div className="cc-mobile-view" style={{ padding: '12px' }}>
            {paginatedClients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2rem' }}>👥</span>
                <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>No hay clientes que coincidan con la búsqueda</p>
              </div>
            ) : paginatedClients.map((client) => {
              const clientTickets = clientTicketsMap.map.get(client.id) || [];
              const latestTicket = clientTickets[0] || null;
              const { callPhone, waPhone } = getPhoneInfo(client.celular || client.telefono);

              return (
                <div key={`m-${client.id}`} className="cc-card-mobile">
                  {/* Header móvil */}
                  <div className="cc-card-mobile-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div className="cc-card-mobile-avatar" style={{ background: getAvatarColor(client.nombre) }}>
                        {getInitials(client.nombre)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#f8fafc', wordBreak: 'break-word', lineHeight: '1.25' }}>
                          {client.nombre || 'Sin Nombre'}
                          {!client.isVirtual && client.id && (
                            <span style={{ color: '#a78bfa', marginLeft: '6px', fontSize: '0.74rem', fontWeight: '800' }}>
                              #{client.id}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          IP: <span style={{ color: '#cbd5e1' }}>{client.ip || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <EstadoBadge estado={latestTicket?.estado} />
                  </div>

                  {/* Metadata móvil */}
                  <div className="cc-card-mobile-details">
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>📞 Contacto</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f1f5f9', marginTop: '2px' }}>
                        {client.celular || client.telefono || 'Sin teléfono'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>👤 A Cargo</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: (latestTicket?.a_cargo || latestTicket?.registrado_por) ? '#818cf8' : '#94a3b8', marginTop: '2px' }}>
                        {latestTicket?.a_cargo || latestTicket?.registrado_por || 'Sin asignar'}
                      </div>
                    </div>
                  </div>

                  {/* Dirección */}
                  {(client.direccion || client.parroquia) && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#94a3b8', fontSize: '0.72rem', lineHeight: '1.3' }}>
                      <span style={{ color: '#818cf8', flexShrink: 0 }}>📍</span>
                      <span>{client.direccion || client.parroquia}</span>
                    </div>
                  )}

                  {/* Acciones móvil */}
                  <div className="cc-card-mobile-actions">
                    <button
                      onClick={() => handleOpenModal(client)}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        border: 'none', color: '#fff', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: '800', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '6px',
                        boxShadow: '0 2px 8px rgba(139,92,246,0.3)'
                      }}
                    >
                      <span>⚙️</span> Gestionar
                    </button>
                    {latestTicket?.estado === 'VISITA TECNICA' && (
                      <button
                        onClick={() => handleOpenHojaRutaModal(latestTicket)}
                        style={{
                          padding: '10px 12px', borderRadius: '10px',
                          background: 'rgba(249,115,22,0.18)',
                          border: '1px solid rgba(249,115,22,0.35)',
                          color: '#fb923c', cursor: 'pointer',
                          fontSize: '0.76rem', fontWeight: '700', display: 'flex',
                          alignItems: 'center', gap: '4px'
                        }}
                      >
                        🗓️ Hoja Ruta
                      </button>
                    )}
                    {callPhone && (
                      <a
                        href={`tel:${callPhone}`}
                        style={{
                          padding: '10px 12px', borderRadius: '10px',
                          background: 'rgba(56, 189, 248, 0.16)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8', textDecoration: 'none',
                          fontSize: '0.76rem', fontWeight: '700', display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        📞
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── BARRA INFERIOR DE PAGINACIÓN ── */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.01)', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Mostrando <strong style={{ color: '#fff' }}>{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong style={{ color: '#fff' }}>{endIndex}</strong> de <strong style={{ color: '#fff' }}>{totalItems}</strong> clientes
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <span>Por página:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    background: '#1a1040', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', borderRadius: '8px', padding: '3px 8px',
                    fontSize: '0.74rem', cursor: 'pointer', outline: 'none'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Controles de página */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: safeCurrentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                  color: safeCurrentPage === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
                  cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem'
                }}
              >
                ‹
              </button>

              {getPageNumbers().map((p, pIdx) => (
                p === '...' ? (
                  <span key={`dots-${pIdx}`} style={{ color: 'var(--text-muted)', padding: '0 4px', fontSize: '0.8rem' }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      minWidth: '32px', height: '32px', padding: '0 8px',
                      borderRadius: '8px',
                      border: safeCurrentPage === p ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                      background: safeCurrentPage === p ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.04)',
                      color: safeCurrentPage === p ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontWeight: safeCurrentPage === p ? '800' : '500',
                      cursor: 'pointer', fontSize: '0.78rem'
                    }}
                  >
                    {p}
                  </button>
                )
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages || totalItems === 0}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: (safeCurrentPage >= totalPages || totalItems === 0) ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                  color: (safeCurrentPage >= totalPages || totalItems === 0) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
                  cursor: (safeCurrentPage >= totalPages || totalItems === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem'
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────
          MODAL DE GESTIONAR (CLIENTE, CARD TICKET Y WHATSAPP)
      ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              className="cc-modal-dialog"
              initial={{ scale: 0.92, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 25 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              style={{
                width: '100%', maxWidth: '1080px',
                maxHeight: '92vh',
                background: 'linear-gradient(145deg, #130f2c 0%, #1a1444 60%, #110e28 100%)',
                borderRadius: '24px',
                border: '1.5px solid rgba(139,92,246,0.3)',
                boxShadow: '0 25px 70px rgba(0,0,0,0.75), 0 0 35px rgba(139,92,246,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── MODAL HEADER: NOMBRE DE CLIENTE Y SUBTÍTULO BONITO (IP, NÚMERO, DIRECCIÓN) ── */}
              <div style={{
                padding: '22px 28px 18px',
                background: 'linear-gradient(90deg, rgba(236,72,153,0.12), rgba(139,92,246,0.15))',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                gap: '14px'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {/* Título: Nombre del cliente */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: getAvatarColor(selectedClient.nombre),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '900', fontSize: '0.86rem', color: '#fff',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.4)', flexShrink: 0
                    }}>
                      {getInitials(selectedClient.nombre)}
                    </div>
                    <div>
                      <h2 style={{
                        margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#ffffff',
                        lineHeight: '1.25', wordBreak: 'break-word', letterSpacing: '-0.01em'
                      }}>
                        {selectedClient.nombre}
                      </h2>
                    </div>
                    {!selectedClient.isVirtual && selectedClient.id && (
                      <span style={{
                        fontSize: '0.72rem', color: '#c4b5fd', fontWeight: '800',
                        background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.35)',
                        padding: '2px 8px', borderRadius: '8px'
                      }}>
                        ID: #{selectedClient.id}
                      </span>
                    )}
                  </div>

                  {/* Subtítulo bonito: IP, Número y Dirección */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginTop: '10px', flexWrap: 'wrap'
                  }}>
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8', padding: '4px 12px', borderRadius: '20px',
                      fontSize: '0.74rem', fontWeight: '700',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}>
                      🌐 IP: {selectedClient.ip || 'Sin IP'}
                    </span>

                    <span style={{
                      background: 'rgba(37, 211, 102, 0.12)',
                      border: '1px solid rgba(37, 211, 102, 0.3)',
                      color: '#25d366', padding: '4px 12px', borderRadius: '20px',
                      fontSize: '0.74rem', fontWeight: '700',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}>
                      📱 {selectedClient.celular || selectedClient.telefono || 'Sin número'}
                    </span>

                    <span style={{
                      background: 'rgba(167, 139, 250, 0.12)',
                      border: '1px solid rgba(167, 139, 250, 0.3)',
                      color: '#c4b5fd', padding: '4px 12px', borderRadius: '20px',
                      fontSize: '0.74rem', fontWeight: '700',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}>
                      📍 {selectedClient.direccion || selectedClient.parroquia || 'Sin dirección'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.8)', width: '36px', height: '36px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >
                  ✕
                </button>
              </div>

              {/* ── MODAL BODY: DOS COLUMNAS (CARD TICKET & CHAT DE WHATSAPP) ── */}
              <div style={{
                padding: '22px 26px',
                overflowY: 'auto',
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'minmax(340px, 1.15fr) minmax(320px, 0.95fr)',
                gap: '22px'
              }}>

                {/* ═════════════════════════════════════════════
                    COLUMNA 1: CARD TICKET DEL CLIENTE
                ═════════════════════════════════════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Selector / Pestañas de tickets existentes del cliente */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '8px'
                  }}>
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center', paddingBottom: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                        Tickets:
                      </span>
                      {modalClientTickets.map((t, idx) => {
                        const isSelected = selectedTicketId === t.id;
                        const tEst = getEstado(t.estado);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTicket(t)}
                            style={{
                              padding: '5px 12px', borderRadius: '10px',
                              border: `1.5px solid ${isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`,
                              background: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.03)',
                              color: isSelected ? '#fff' : 'var(--text-muted)',
                              cursor: 'pointer', fontSize: '0.72rem', fontWeight: '800',
                              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px'
                            }}
                          >
                            <span>#{t.id}</span>
                            <span>{tEst.icon}</span>
                            {idx === 0 && (
                              <span style={{ fontSize: '0.6rem', background: '#8b5cf6', color: '#fff', borderRadius: '4px', padding: '0 4px' }}>
                                Actual
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => handleSelectTicket('NEW')}
                        style={{
                          padding: '5px 12px', borderRadius: '10px',
                          border: `1.5px dashed ${selectedTicketId === 'NEW' ? '#ec4899' : 'rgba(236, 72, 153, 0.4)'}`,
                          background: selectedTicketId === 'NEW' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                          color: '#ec4899', cursor: 'pointer', fontSize: '0.72rem',
                          fontWeight: '800', whiteSpace: 'nowrap', display: 'inline-flex',
                          alignItems: 'center', gap: '4px'
                        }}
                      >
                        <span>+</span> Nuevo
                      </button>
                    </div>
                  </div>

                  {/* ── CARD TICKET ── */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1.5px solid rgba(139, 92, 246, 0.28)',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>

                    {/* Header de la Card: Número de Ticket y Dropdown de Estado */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingBottom: '14px'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.3rem' }}>🎫</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff' }}>
                            {selectedTicketId === 'NEW' || !selectedTicketId ? 'Nuevo Ticket' : `Ticket #${selectedTicketId}`}
                          </span>
                        </div>
                        {activeTicket?.fecha_ingreso && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            📅 Creado el {formatToDMY(activeTicket.fecha_ingreso)} {new Date(activeTicket.fecha_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>

                      {/* Dropdown interactivo de Estado */}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setShowStatusDropdown(prev => !prev)}
                          style={{
                            background: getEstado(ticketForm.estado).bg,
                            color: getEstado(ticketForm.estado).color,
                            border: `1.5px solid ${getEstado(ticketForm.estado).color}77`,
                            padding: '8px 16px', borderRadius: '20px',
                            fontSize: '0.8rem', fontWeight: '800',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            gap: '8px', boxShadow: `0 2px 10px ${getEstado(ticketForm.estado).color}25`,
                            transition: 'all 0.2s'
                          }}
                        >
                          <span>{getEstado(ticketForm.estado).icon}</span>
                          <span>{getEstado(ticketForm.estado).label}</span>
                          <span style={{ fontSize: '0.72rem' }}>▾</span>
                        </button>

                        <AnimatePresence>
                          {showStatusDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.15 }}
                              style={{
                                position: 'absolute', top: '100%', right: 0,
                                marginTop: '6px', background: '#1c1344',
                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                borderRadius: '14px', padding: '6px',
                                zIndex: 120, boxShadow: '0 12px 35px rgba(0,0,0,0.7)',
                                minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px'
                              }}
                            >
                              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase', fontWeight: '800' }}>
                                Seleccionar Estado:
                              </div>
                              {ESTADOS.map(est => (
                                <div
                                  key={est.value}
                                  onClick={() => {
                                    setTicketForm(prev => ({ ...prev, estado: est.value }));
                                    setShowStatusDropdown(false);
                                  }}
                                  style={{
                                    padding: '8px 12px', borderRadius: '8px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    gap: '10px', fontSize: '0.78rem', fontWeight: '700',
                                    color: est.color,
                                    background: ticketForm.estado === est.value ? `${est.color}24` : 'transparent',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = `${est.color}24`}
                                  onMouseLeave={e => {
                                    if (ticketForm.estado !== est.value) e.currentTarget.style.background = 'transparent';
                                  }}
                                >
                                  <span>{est.icon}</span>
                                  <span>{est.label}</span>
                                  {ticketForm.estado === est.value && (
                                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>✓</span>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Persona a cargo: sale automáticamente la cuenta que creó el ticket */}
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '12px', padding: '10px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.15rem' }}>👤</span>
                        <div>
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>
                            Persona A Cargo
                          </div>
                          <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#c4b5fd', marginTop: '2px' }}>
                            {ticketForm.a_cargo || user.username || 'Sin asignar'}
                          </div>
                        </div>
                      </div>
                      {ticketForm.registrado_por && (
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                          Creado por: <strong style={{ color: '#fff' }}>{ticketForm.registrado_por}</strong>
                        </span>
                      )}
                    </div>

                    {/* Input: Problema del cliente */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.76rem', fontWeight: '800', color: '#f8fafc' }}>
                        ⚠️ Problema del Cliente *
                      </label>
                      <textarea
                        className="input"
                        rows={3}
                        value={ticketForm.problema}
                        onChange={e => setTicketForm(prev => ({ ...prev, problema: e.target.value }))}
                        placeholder="Describe el problema reportado por el cliente..."
                        style={{
                          width: '100%', marginBottom: 0,
                          fontFamily: 'inherit', resize: 'vertical',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: '0.82rem', lineHeight: '1.45',
                          minHeight: '80px'
                        }}
                      />
                    </div>

                    {/* Input: Solución del problema */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.76rem', fontWeight: '800', color: '#34d399' }}>
                        ✅ Solución del Problema / Observación
                      </label>
                      <textarea
                        className="input"
                        rows={4}
                        value={ticketForm.observacion_revision}
                        onChange={e => setTicketForm(prev => ({ ...prev, observacion_revision: e.target.value }))}
                        placeholder="Detalle de la solución, pasos técnicos o diagnóstico realizado..."
                        style={{
                          width: '100%', marginBottom: 0,
                          fontFamily: 'inherit', resize: 'vertical',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid rgba(52, 211, 153, 0.3)',
                          fontSize: '0.82rem', lineHeight: '1.45',
                          minHeight: '95px'
                        }}
                      />
                    </div>

                    {/* Botones de acción del Ticket */}
                    <div style={{
                      display: 'flex', gap: '10px', alignItems: 'center',
                      justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '4px'
                    }}>
                      {ticketForm.estado === 'VISITA TECNICA' && (
                        <button
                          type="button"
                          onClick={() => handleOpenHojaRutaModal(activeTicket || { ...ticketForm, cliente_nombre: selectedClient.nombre })}
                          style={{
                            padding: '8px 14px', borderRadius: '10px',
                            background: 'rgba(249,115,22,0.18)',
                            border: '1px solid rgba(249,115,22,0.4)',
                            color: '#fb923c', cursor: 'pointer',
                            fontSize: '0.76rem', fontWeight: '800',
                            display: 'inline-flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          🗓️ Hoja de Ruta
                        </button>
                      )}

                      {user.rol?.toLowerCase() === 'administrador' && selectedTicketId && selectedTicketId !== 'NEW' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(selectedTicketId)}
                          style={{
                            padding: '8px 12px', borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171', cursor: 'pointer',
                            fontSize: '0.76rem', fontWeight: '700'
                          }}
                          title="Eliminar este ticket"
                        >
                          🗑️ Eliminar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveTicket}
                        disabled={submitting}
                        className="btn"
                        style={{
                          background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                          color: '#fff', fontWeight: '800',
                          fontSize: '0.82rem', padding: '9px 20px',
                          borderRadius: '12px', border: 'none',
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        {submitting ? '⌛ Guardando...' : (selectedTicketId === 'NEW' || !selectedTicketId ? '📞 Crear Ticket' : '💾 Guardar Ticket')}
                      </button>
                    </div>

                  </div>
                </div>

                {/* ═════════════════════════════════════════════
                    COLUMNA 2: CONVERSACIÓN DE WHATSAPP DEL CLIENTE
                ═════════════════════════════════════════════ */}
                <div style={{
                  background: 'rgba(10, 15, 26, 0.65)',
                  border: '1.5px solid rgba(37, 211, 102, 0.25)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  height: '100%',
                  minHeight: '480px',
                  maxHeight: '620px'
                }}>

                  {/* Header de WhatsApp */}
                  <div style={{
                    padding: '14px 18px',
                    background: 'linear-gradient(90deg, rgba(37, 211, 102, 0.14), rgba(16, 185, 129, 0.08))',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>💬</span>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#ffffff' }}>
                          Conversación de WhatsApp
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#86efac' }}>
                          📱 {modalWaInfo.waPhone ? `+${modalWaInfo.waPhone}` : (selectedClient.celular || 'Sin número')}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => cargarChatCliente(selectedClient.celular || selectedClient.telefono)}
                      disabled={loadingChat}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff', padding: '5px 10px',
                        borderRadius: '8px', fontSize: '0.72rem',
                        fontWeight: '700', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}
                      title="Recargar conversación"
                    >
                      <span>{loadingChat ? '⌛' : '🔄'}</span>
                      <span>{loadingChat ? 'Cargando...' : 'Actualizar'}</span>
                    </button>
                  </div>

                  {/* Mensajes del Chat con fechas y burbujas */}
                  <div style={{
                    flex: 1, overflowY: 'auto',
                    padding: '16px', display: 'flex',
                    flexDirection: 'column', gap: '12px',
                    background: 'rgba(0, 0, 0, 0.2)'
                  }}>
                    {loadingChat ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        ⌛ Cargando mensajes de WhatsApp...
                      </div>
                    ) : !modalWaInfo.waPhone && !modalWaInfo.callPhone ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>📱</span>
                        Este cliente no tiene un teléfono celular registrado para consultar WhatsApp.
                      </div>
                    ) : chatMensajes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>💬</span>
                        No se encontraron mensajes de WhatsApp registrados con este cliente.
                      </div>
                    ) : (
                      chatMensajes.map(m => {
                        const esCliente = m.rol === 'cliente';
                        const esOperador = m.rol === 'operador';
                        const esAsistente = m.rol === 'asistente';
                        const fechaHoraStr = formatChatDate(m.fecha_hora);

                        return (
                          <div
                            key={m.id}
                            style={{
                              alignSelf: esCliente ? 'flex-start' : 'flex-end',
                              maxWidth: '85%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: esCliente ? 'flex-start' : 'flex-end'
                            }}
                          >
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: esCliente ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                              background: esCliente
                                ? 'rgba(30, 41, 59, 0.95)'
                                : esOperador
                                ? 'linear-gradient(135deg, #065f46, #047857)'
                                : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                              border: esCliente
                                ? '1px solid rgba(255, 255, 255, 0.12)'
                                : esOperador
                                ? '1px solid rgba(52, 211, 153, 0.4)'
                                : '1px solid rgba(96, 165, 250, 0.4)',
                              color: '#f8fafc',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                              wordBreak: 'break-word',
                              fontSize: '0.82rem',
                              lineHeight: 1.45
                            }}>
                              {/* Remitente */}
                              <div style={{
                                fontSize: '0.68rem', fontWeight: '800',
                                marginBottom: '4px', display: 'flex',
                                alignItems: 'center', gap: '4px',
                                color: esCliente ? '#93c5fd' : esOperador ? '#a7f3d0' : '#bfdbfe'
                              }}>
                                {esCliente && <span>👤 Cliente</span>}
                                {esOperador && <span>👨‍💼 Operador</span>}
                                {esAsistente && <span>🤖 SAM Bot (IA)</span>}
                              </div>

                              {/* Mensaje */}
                              <div style={{ whiteSpace: 'pre-wrap' }}>
                                {m.mensaje}
                              </div>

                              {/* Fecha y Hora completa */}
                              <div style={{
                                fontSize: '0.64rem', opacity: 0.75,
                                textAlign: 'right', marginTop: '6px',
                                color: '#cbd5e1'
                              }}>
                                📅 {fechaHoraStr} {esOperador && '✓✓'}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Barra rápida de envío de WhatsApp */}
                  <form
                    onSubmit={handleEnviarMensajeChat}
                    style={{
                      padding: '10px 14px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(0, 0, 0, 0.35)',
                      display: 'flex', gap: '8px', alignItems: 'center'
                    }}
                  >
                    <input
                      className="input"
                      value={nuevoMensajeChat}
                      onChange={e => setNuevoMensajeChat(e.target.value)}
                      placeholder="Escribir mensaje a cliente..."
                      style={{
                        marginBottom: 0, fontSize: '0.78rem',
                        padding: '8px 12px', borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)', flex: 1
                      }}
                      disabled={enviandoMensajeChat || (!modalWaInfo.waPhone && !modalWaInfo.callPhone)}
                    />
                    <button
                      type="submit"
                      disabled={enviandoMensajeChat || !nuevoMensajeChat.trim() || (!modalWaInfo.waPhone && !modalWaInfo.callPhone)}
                      style={{
                        padding: '8px 14px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none', color: '#fff',
                        fontWeight: '800', fontSize: '0.76rem',
                        cursor: (enviandoMensajeChat || !nuevoMensajeChat.trim()) ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {enviandoMensajeChat ? '⌛' : '📤 Enviar'}
                    </button>
                  </form>

                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────
          MODAL: ENVIAR A HOJA DE RUTA
      ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHojaRutaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px', background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowHojaRutaModal(false); }}
          >
            <motion.div
              className="cc-modal-dialog"
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              style={{
                width: '100%', maxWidth: '680px', maxHeight: '90vh',
                background: 'linear-gradient(145deg, #181136 0%, #1e144a 60%, #130e2f 100%)',
                borderRadius: '24px', border: '1px solid rgba(249, 115, 22, 0.4)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(249, 115, 22, 0.15)',
                display: 'flex', flexDirection: 'column', overflowY: 'auto',
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
                    cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', transition: 'all 0.2s'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitHojaRuta} style={{ padding: '22px 28px', flex: 1 }}>
                
                {/* Resumen del cliente */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px', padding: '14px 18px', marginBottom: '18px',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px', fontSize: '0.78rem'
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
                <div className="cc-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
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
                        background: '#1e1842', color: '#fef3c7', fontWeight: '700'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Técnico y Actividad */}
                <div className="cc-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8' }}>
                      👨‍🔧 Técnico Responsable *
                    </label>
                    <select
                      className="input"
                      value={hojaRutaForm.tecnico}
                      onChange={e => setHojaRutaForm({ ...hojaRutaForm, tecnico: e.target.value })}
                      style={{
                        marginBottom: 0, width: '100%', background: '#1e1842',
                        color: '#ffffff', fontWeight: '700', border: '1px solid rgba(56, 189, 248, 0.4)'
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

                {/* Observaciones */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#fcd34d' }}>
                    📝 Observaciones para el Técnico *
                  </label>
                  <textarea
                    className="input"
                    rows="5"
                    value={hojaRutaForm.observacion}
                    onChange={e => setHojaRutaForm({ ...hojaRutaForm, observacion: e.target.value })}
                    placeholder="Detalle técnico de la visita, instrucciones para el técnico..."
                    style={{
                      fontFamily: 'inherit', resize: 'vertical', marginBottom: 0,
                      minHeight: '90px', width: '100%', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(252, 211, 77, 0.35)', color: '#f8fafc',
                      lineHeight: '1.5'
                    }}
                    required
                  />
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setShowHojaRutaModal(false)}
                    className="btn"
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600'
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
                      border: 'none', color: '#fff', fontWeight: '800',
                      fontSize: '0.82rem', padding: '10px 22px', borderRadius: '12px',
                      cursor: submittingHojaRuta ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
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
