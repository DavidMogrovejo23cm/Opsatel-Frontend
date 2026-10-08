import React, { useEffect, useState, useMemo } from 'react';
import { clienteService, configuracionService } from '../services/api';
import { motion } from 'framer-motion';
import { formatToDMY, normalizeDateInput } from '../services/dateUtils';
import { showAlert, showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';



const General = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInstalacionFilter, setFechaInstalacionFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');

  // Actúa como el motor de edición "en vivo" (Inline Editing)
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const currentUser = configuracionService.getCurrentUser();
  const hasDirectAccess = currentUser && (currentUser.rol === 'administrador' || currentUser.acceso_general_sin_clave);

  // Autenticación de entrada: se pide PIN una sola vez al entrar si no tiene acceso directo sin clave
  const [isAuthenticated, setIsAuthenticated] = useState(!!hasDirectAccess);
  const [showEntryPinModal, setShowEntryPinModal] = useState(!hasDirectAccess);
  const [entryPinInput, setEntryPinInput] = useState('');

  // Control de permisos para modificar la tabla: debe estar autenticado y tener rol autorizado o acceso directo
  const canModifyTable = isAuthenticated && (!currentUser || ['administrador', 'secretario', 'tecnico'].includes(currentUser.rol) || currentUser.acceso_general_sin_clave);

  // Estados para el PIN de seguridad (legacy, solo para delete si no autenticado)
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // Estados para el progreso de eliminación completa
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(null);


  const [planesList, setPlanesList] = useState([]);
  const [fileFrontal, setFileFrontal] = useState(null);
  const [filePosterior, setFilePosterior] = useState(null);
  const [uploadingCedula, setUploadingCedula] = useState(false);

  // Definición de las columnas del sistema
  const allColumns = [
    "id", "nombre", "ip", "celular", "cedula", "cedula_tipo", "fotos_cedula", "correo", "direccion", "nodo", "parroquia",
    "fecha_firma", "instalation_date", "estado", "observaciones", "iptv_cuenta", "puerto", "ont", "servicio", "breach", "id_port", "service_port",
    "dispositivo", "potencia", "nap", "ubicacion_cliente", "tecnico", "activador", "red", "clave", "mac",
    "tiempo", "arrienda", "app", "payment_date", "bank", "cod", "facturas", "plan", "plus", "bank_plus", "adicional", "internet_payment", "total_pago", "total", "comentarios"
  ];

  // Estado para los anchos ajustables de cada columna
  const [colWidths, setColWidths] = useState(() => {
    const widths = {};
    allColumns.forEach(col => {
      if (col === 'id') widths[col] = 60;
      else if (col === 'nombre') widths[col] = 220;
      else if (col === 'ip') widths[col] = 130;
      else if (col === 'celular') widths[col] = 130;
      else if (col === 'cedula') widths[col] = 110;
      else if (col === 'cod' || col === 'facturas') widths[col] = 90;
      else widths[col] = 150;
    });
    return widths;
  });

  const handleMouseDown = (e, colName) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colName] || 150;

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      setColWidths(prev => ({
        ...prev,
        [colName]: newWidth
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const fetchData = async () => {
    try {
      const response = await clienteService.listar();
      setClientes(response.data);
      if (response.data.length > 0) {
        console.log("DEBUG PRIMER CLIENTE:", response.data[0]);
      }
      const planesResp = await configuracionService.getPlanes();
      setPlanesList(planesResp.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyClose = (e) => {
      if (e.key === 'Escape') {
        if (showEntryPinModal) setShowEntryPinModal(false);
        if (showPinModal) setShowPinModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyClose);
    return () => window.removeEventListener('keydown', handleKeyClose);
  }, [showEntryPinModal, showPinModal]);

  const handleStartEdit = (id, col, value) => {
    // Si el usuario no tiene permisos para modificar la tabla, no se permite editar
    if (!canModifyTable) {
      showWarning('No tienes permisos para modificar la tabla.');
      return;
    }

    // Si el cliente está en Finiquito (fantasma), es solo lectura / texto histórico
    const clienteActual = clientes.find(c => c.id === id);
    if (clienteActual?.estado?.toUpperCase() === 'FINIQUITO') return;

    // Reglas maestras de bloqueo: No permite editar campos que el sistema genera automáticamente.
    // 'ip' es editable para quienes tienen permiso de modificar la tabla
    const lockedCols = ['id', 'id_port', 'service_port', 'mac'];
    if (lockedCols.includes(col)) return;

    if (col === 'estado' && value?.toLowerCase() === 'pendiente') return;

    setFileFrontal(null);
    setFilePosterior(null);
    setEditingCell({ id, col });
    if (col === 'cedula_tipo') {
      setTempValue(value || 'No');
    } else if (col === 'total') {
      const pm = clienteActual?.pago_mensual;
      setTempValue((pm !== undefined && pm !== null && pm !== '') ? String(pm) : '0');
    } else if (col === 'total_pago') {
      const saldoVal = (clienteActual?.saldo !== null && clienteActual?.saldo !== undefined) ? parseFloat(clienteActual.saldo || 0) : (clienteActual?.mantenimiento ? 10.00 : (clienteActual?.precio_plan_especial && parseFloat(clienteActual.precio_plan_especial) > 0 ? parseFloat(clienteActual.precio_plan_especial) : 0));
      const plusVal = parseFloat(clienteActual?.plus || 0);
      const adicVal = parseFloat(clienteActual?.adicional || 0);
      const totalPendienteSum = (clienteActual?.total_pago !== undefined && clienteActual?.total_pago !== null) ? parseFloat(clienteActual.total_pago) : (saldoVal + plusVal + adicVal);
      setTempValue(String(totalPendienteSum));
    } else {
      setTempValue(value !== undefined && value !== null ? String(value) : '');
    }
  };

const compressImage = (file, maxWidth = 1600, quality = 0.82) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) return resolve(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name || 'cedula.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

  const handleSaveCedulaTipo = async (id, newCedulaTipo, fileFront, filePost) => {
    try {
      setUploadingCedula(true);

      const targetClient = clientes.find(c => c.id === id);
      const hasExistingPhoto = targetClient && ((targetClient.cedula_frontal && targetClient.cedula_frontal.trim() !== '') || (targetClient.cedula_posterior && targetClient.cedula_posterior.trim() !== ''));
      const hasNewPhoto = !!(fileFront || filePost);

      const finalCedulaTipo = (hasExistingPhoto || hasNewPhoto) ? 'Si' : (newCedulaTipo || 'No');

      await clienteService.actualizar(id, { cedula_tipo: finalCedulaTipo });

      if (fileFront || filePost) {
        const uploadData = new FormData();
        if (fileFront) {
          const compFront = await compressImage(fileFront);
          uploadData.append('frontal', compFront);
        }
        if (filePost) {
          const compPost = await compressImage(filePost);
          uploadData.append('posterior', compPost);
        }
        await clienteService.uploadCedula(id, uploadData);
      }

      showSuccess('Cédula y fotos actualizadas correctamente');
      setEditingCell(null);
      setFileFrontal(null);
      setFilePosterior(null);
      fetchData();
    } catch (error) {
      console.error(error);
      showError('Error al guardar cédula: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingCedula(false);
    }
  };

  const handleSaveEdit = async (id, col) => {
    if (!editingCell) return;

    const clienteActual = clientes.find(c => c.id === id);
    let original = clienteActual?.[col];
    if (col === 'total') original = clienteActual?.pago_mensual;
    else if (col === 'total_pago') original = clienteActual?.total_pago;

    let valToSave = tempValue;
    if (typeof valToSave === 'string') {
      valToSave = valToSave.trim();
    }
    if (['fecha_firma', 'instalation_date', 'payment_date'].includes(col)) {
      valToSave = normalizeDateInput(tempValue);
    }

    let payload = {};
    if (col === 'total') {
      const numVal = parseFloat(String(valToSave).replace('$', '').replace(',', '.')) || 0;
      if (numVal === parseFloat(original || 0)) {
        setEditingCell(null);
        return;
      }
      valToSave = numVal;
      payload = { pago_mensual: numVal, total: numVal };
    } else if (col === 'total_pago') {
      const numVal = parseFloat(String(valToSave).replace('$', '').replace(',', '.')) || 0;
      if (numVal === parseFloat(original || 0)) {
        setEditingCell(null);
        return;
      }
      valToSave = numVal;
      payload = { total_pago: numVal };
    } else if (col === 'cod') {
      if (valToSave === (original || '')) {
        setEditingCell(null);
        return;
      }
      payload = { cod: valToSave };
      if (valToSave && String(valToSave).trim() !== '') {
        payload.facturas = 'SI';
      }
    } else {
      if (valToSave === (original || '')) {
        setEditingCell(null);
        return;
      }
      payload = { [col]: valToSave };
    }

    // Si ya está autenticado, guardar directamente sin PIN
    if (isAuthenticated || col === 'facturas' || col === 'cod') {
      try {
        await clienteService.actualizar(id, payload);
        showSuccess(`Campo ${col.toUpperCase()} actualizado correctamente`);
        setEditingCell(null);
        fetchData();
      } catch (error) {
        console.error(error);
        const errMsg = error.response?.data?.detail || "Error al guardar cambio";
        showError(typeof errMsg === 'string' ? errMsg : "Error al guardar cambio");
        setEditingCell(null);
      }
      return;
    }

    setPendingAction({ type: 'edit', id, col, value: valToSave, payload });
    setShowPinModal(true);
    setPinInput('');
  };

  const handleSaveDropdown = async (id, col, newValue) => {
    if (newValue === clientes.find(c => c.id === id)?.[col]) {
      setEditingCell(null);
      return;
    }

    if (col === 'estado' && newValue.toLowerCase() === 'finiquito') {
      const confirmed = await showConfirm(
        "¿Pasar cliente a Finiquito?",
        "El cliente pasará a ser un registro fantasma (solo historial de lectura), no se le facturará ni se enviarán mensajes, y se guardará una copia completa en Eliminados.",
        "Sí, aplicar Finiquito",
        "Cancelar"
      );
      if (!confirmed) {
        setEditingCell(null);
        return;
      }
    }

    // Si ya está autenticado, guardar directamente sin PIN
    if (isAuthenticated || col === 'facturas' || col === 'cod') {
      try {
        await clienteService.actualizar(id, { [col]: newValue });
        setEditingCell(null);
        fetchData();
      } catch (error) {
        console.error(error);
        showError("Error al guardar cambio");
        setEditingCell(null);
      }
      return;
    }

    setPendingAction({ type: 'dropdown', id, col, value: newValue });
    setShowPinModal(true);
    setPinInput('');
  };

  const handleDeleteCliente = async (cliente) => {
    if (!canModifyTable) {
      showWarning('No tienes permisos para eliminar clientes.');
      return;
    }

    const confirmed = await showConfirm(
      '¿Eliminar cliente del sistema?',
      `¿Estás seguro de que deseas eliminar a "${cliente.nombre}" (ID: ${cliente.id}) únicamente del sistema? (No afectará equipos externos).`,
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    try {
      await clienteService.eliminar(cliente.id);
      showSuccess(`Cliente "${cliente.nombre}" eliminado del sistema`);
      fetchData();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || 'Error al eliminar el cliente del sistema';
      showError(typeof errMsg === 'string' ? errMsg : 'Error al eliminar el cliente');
    }
  };

  const handleDeleteCompleto = async (cliente) => {
    if (!canModifyTable) {
      showWarning('No tienes permisos para borrar clientes de todos los sistemas.');
      return;
    }

    const confirmed = await showConfirm(
      '💥 ¿Borrar de TODOS los sistemas?',
      `¿Estás seguro de borrar a "${cliente.nombre}" (ID: ${cliente.id}) de OLT, MikroTik, LibreQoS, XUI y Base de Datos? Esta acción es definitiva.`,
      'Sí, Borrar Todo',
      'Cancelar'
    );

    if (!confirmed) return;

    setPendingAction({ type: 'delete', id: cliente.id, nombre: cliente.nombre });
    if (isAuthenticated) {
      executePendingActionDirect({ type: 'delete', id: cliente.id, nombre: cliente.nombre });
    } else {
      setShowPinModal(true);
      setPinInput('');
    }
  };

  const handleDeleteClick = handleDeleteCompleto;

  // Ejecutar acción directamente (sin PIN, ya autenticado)
  const executePendingActionDirect = async (action) => {
    const { type, id, col, value } = action;

    if (type === 'delete') {
      setShowProgressModal(true);
      setDeletionProgress({
        status: 'processing',
        olt: 'PENDIENTE',
        mikrotik: 'PENDIENTE',
        xui: 'PENDIENTE',
        libreqos: 'PENDIENTE',
        database: 'PENDIENTE',
        message: 'Iniciando proceso de borrado completo (OLT, MikroTik, XUI, LibreQoS, Base de Datos)...'
      });

      try {
        const response = await clienteService.eliminarCompletamente(id, { pin: '1234566' });
        
        setDeletionProgress({
          status: 'success',
          olt: response.data.olt,
          mikrotik: response.data.mikrotik,
          xui: response.data.xui,
          libreqos: response.data.libreqos,
          database: response.data.database,
          message: '¡El cliente ha sido borrado exitosamente de todos los sistemas!'
        });
        
        setPendingAction(null);
        fetchData();
      } catch (error) {
        console.error(error);
        const errDetail = error.response?.data?.detail || {};
        const failedStage = errDetail.stage || 'database';
        const errMsg = errDetail.message || 'Error inesperado durante el borrado';

        setDeletionProgress(prev => ({
          status: 'error',
          olt: failedStage === 'olt' ? 'ERROR' : (prev?.olt || 'PENDIENTE'),
          mikrotik: failedStage === 'mikrotik' ? 'ERROR' : (prev?.mikrotik || 'PENDIENTE'),
          xui: failedStage === 'xui' ? 'ERROR' : (prev?.xui || 'PENDIENTE'),
          libreqos: failedStage === 'libreqos' ? 'ERROR' : (prev?.libreqos || 'PENDIENTE'),
          database: failedStage === 'database' ? 'ERROR' : (prev?.database || 'PENDIENTE'),
          message: `Fallo en etapa [${failedStage.toUpperCase()}]: ${errMsg}`
        }));
        
        setPendingAction(null);
      }
      return;
    }

    try {
      const payload = action.payload || (action.col === 'total' ? { pago_mensual: action.value, total: action.value } : { [action.col]: action.value });
      await clienteService.actualizar(id, payload);
      setEditingCell(null);
      fetchData();
    } catch (error) {
      console.error(error);
      showError("Error al guardar cambio");
      setEditingCell(null);
    }
  };

  const executePendingAction = async () => {
    const originalPin = pinInput; // Keep the PIN for backend confirmation

    if (pinInput !== "1234566") {
      showError("PIN Incorrecto");
      setPinInput('');
      return;
    }

    const { type, id, col, value } = pendingAction;

    if (type === 'delete') {
      setShowPinModal(false);
      setShowProgressModal(true);
      setDeletionProgress({
        status: 'processing',
        olt: 'PENDIENTE',
        mikrotik: 'PENDIENTE',
        xui: 'PENDIENTE',
        libreqos: 'PENDIENTE',
        database: 'PENDIENTE',
        message: 'Iniciando proceso de borrado completo (OLT, MikroTik, XUI, LibreQoS, Base de Datos)...'
      });

      try {
        // Enviar borrado total al backend con validación del PIN
        const response = await clienteService.eliminarCompletamente(id, { pin: originalPin });
        
        setDeletionProgress({
          status: 'success',
          olt: response.data.olt,
          mikrotik: response.data.mikrotik,
          xui: response.data.xui,
          libreqos: response.data.libreqos,
          database: response.data.database,
          message: '¡El cliente ha sido borrado exitosamente de todos los sistemas!'
        });
        
        setPendingAction(null);
        setPinInput('');
        fetchData();
      } catch (error) {
        console.error(error);
        const errDetail = error.response?.data?.detail || {};
        const failedStage = errDetail.stage || 'database';
        const errMsg = errDetail.message || 'Error inesperado durante el borrado';

        setDeletionProgress(prev => ({
          status: 'error',
          olt: failedStage === 'olt' ? 'ERROR' : (prev?.olt || 'PENDIENTE'),
          mikrotik: failedStage === 'mikrotik' ? 'ERROR' : (prev?.mikrotik || 'PENDIENTE'),
          xui: failedStage === 'xui' ? 'ERROR' : (prev?.xui || 'PENDIENTE'),
          libreqos: failedStage === 'libreqos' ? 'ERROR' : (prev?.libreqos || 'PENDIENTE'),
          database: failedStage === 'database' ? 'ERROR' : (prev?.database || 'PENDIENTE'),
          message: `Fallo en etapa [${failedStage.toUpperCase()}]: ${errMsg}`
        }));
        
        setPendingAction(null);
        setPinInput('');
      }
      return;
    }

    try {
      const payload = pendingAction.payload || (pendingAction.col === 'total' ? { pago_mensual: pendingAction.value, total: pendingAction.value } : { [pendingAction.col]: pendingAction.value });
      await clienteService.actualizar(id, payload);
      setEditingCell(null);
      setShowPinModal(false);
      setPendingAction(null);
      fetchData();
    } catch (error) {
      console.error(error);
      showError("Error al guardar cambio");
      setShowPinModal(false);
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

  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [pagoFilter, setPagoFilter] = useState('TODOS'); // 'TODOS', 'PAGADO', 'PENDIENTE_PAGO'
  const [planFilter, setPlanFilter] = useState('TODOS');
  const [selectedAction, setSelectedAction] = useState('VER'); // 'VER' o 'BORRAR'

  // Contador de clientes en general según el estado
  const statusCounts = useMemo(() => {
    const counts = {
      TODOS: clientes.length,
      ACTIVO: 0,
      INACTIVO: 0,
      PROCESO: 0,
      JURIDICO: 0,
      PENDIENTE: 0,
      FINIQUITO: 0,
      CORTESIA: 0,
      TRASLADO: 0
    };

    clientes.forEach(c => {
      const est = (c.estado || '').trim().toUpperCase();
      if (est === 'ACTIVO') counts.ACTIVO++;
      else if (est === 'INACTIVO') counts.INACTIVO++;
      else if (est === 'PROCESO' || est === 'EN PROCESO') counts.PROCESO++;
      else if (est === 'JURIDICO' || est === 'JURÍDICO') counts.JURIDICO++;
      else if (est === 'PENDIENTE' || est === 'EN ACTIVACIÓN' || est === 'EN ACTIVACION') counts.PENDIENTE++;
      else if (est === 'FINIQUITO') counts.FINIQUITO++;
      else if (est === 'CORTESIA' || est === 'CORTESÍA') counts.CORTESIA++;
      else if (est === 'TRASLADO') counts.TRASLADO++;
    });

    return counts;
  }, [clientes]);

  // Extraer los planes únicos (de planesList y de clientes) con conteos para el filtro
  const { planesDisponibles, planCounts } = useMemo(() => {
    const counts = {};
    const setPlanes = new Map();

    // 1. Agregar planes configurados formalmente
    (planesList || []).forEach(p => {
      if (p?.nombre && p.nombre.trim()) {
        const norm = p.nombre.trim();
        setPlanes.set(norm.toLowerCase(), norm);
      }
    });

    // 2. Mapear los planes que tienen los clientes y contabilizarlos
    clientes.forEach(c => {
      const pName = (c.plan || '').trim();
      if (pName) {
        const pLower = pName.toLowerCase();
        if (!setPlanes.has(pLower)) {
          setPlanes.set(pLower, pName);
        }
        counts[pLower] = (counts[pLower] || 0) + 1;
      } else {
        counts['__sin_plan__'] = (counts['__sin_plan__'] || 0) + 1;
      }
    });

    const planesArr = Array.from(setPlanes.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

    return { planesDisponibles: planesArr, planCounts: counts };
  }, [planesList, clientes]);

  const filteredClientes = clientes
    .filter(c => {
      // Filtro por término de búsqueda (ID, Nombre, Cédula, Parroquia, Fecha, IP o Plan)
      const matchSearch = c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cedula?.includes(searchTerm) ||
        c.id.toString().includes(searchTerm) ||
        c.parroquia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.plan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatToDMY(c.instalation_date).toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Filtro específico por IP
      if (ipFilter.trim()) {
        const targetIp = ipFilter.trim().toLowerCase();
        const clientIp = String(c.ip || '').toLowerCase();
        if (!clientIp.includes(targetIp)) {
          return false;
        }
      }

      // Filtro progresivo por fecha de instalación
      if (fechaInstalacionFilter.trim()) {
        const q = fechaInstalacionFilter.trim().toLowerCase();
        const rawDate = String(c.instalation_date || '').toLowerCase();
        const formattedDate = formatToDMY(c.instalation_date).toLowerCase();

        const qClean = q.replace(/[-/]/g, '');
        const formattedClean = formattedDate.replace(/[-/]/g, '');
        const rawClean = rawDate.replace(/[-/]/g, '');

        const matchFormatted = formattedDate.includes(q);
        const matchRaw = rawDate.includes(q);
        const matchClean = qClean.length >= 2 && (formattedClean.includes(qClean) || rawClean.includes(qClean));

        if (!matchFormatted && !matchRaw && !matchClean) {
          return false;
        }
      }

      // Filtro por estado
      if (statusFilter === 'ACTIVO' && c.estado?.toUpperCase() !== 'ACTIVO') return false;
      if (statusFilter === 'INACTIVO' && c.estado?.toUpperCase() !== 'INACTIVO') return false;
      if (statusFilter === 'PROCESO' && !['PROCESO', 'EN PROCESO'].includes(c.estado?.toUpperCase())) return false;
      if (statusFilter === 'JURIDICO' && c.estado?.toUpperCase() !== 'JURIDICO') return false;
      if (statusFilter === 'PENDIENTE' && !['PENDIENTE', 'EN ACTIVACIÓN', 'EN ACTIVACION'].includes(c.estado?.toUpperCase())) return false;
      if (statusFilter === 'FINIQUITO' && c.estado?.toUpperCase() !== 'FINIQUITO') return false;
      if (statusFilter === 'CORTESIA' && !['CORTESIA', 'CORTESÍA'].includes(c.estado?.toUpperCase())) return false;
      if (statusFilter === 'TRASLADO' && c.estado?.toUpperCase() !== 'TRASLADO') return false;

      // Filtro por pago (Pagados vs Con Deuda Pendiente)
      const saldoVal = (c.saldo !== null && c.saldo !== undefined) ? parseFloat(c.saldo || 0) : (c.mantenimiento ? 10.00 : (c.precio_plan_especial && parseFloat(c.precio_plan_especial) > 0 ? parseFloat(c.precio_plan_especial) : 0));
      const plusVal = parseFloat(c.plus || 0);
      const adicVal = parseFloat(c.adicional || 0);
      const totalDeuda = (c.total_pago !== undefined && c.total_pago !== null) ? parseFloat(c.total_pago) : (saldoVal + plusVal + adicVal);

      if (pagoFilter === 'PAGADO' && totalDeuda > 0) return false;
      if (pagoFilter === 'PENDIENTE_PAGO' && totalDeuda <= 0) return false;

      // Filtro por Plan de Internet
      if (planFilter !== 'TODOS') {
        if (planFilter === 'SIN_PLAN') {
          if (c.plan && c.plan.trim()) return false;
        } else {
          const cPlan = (c.plan || '').trim().toLowerCase();
          if (cPlan !== planFilter.trim().toLowerCase()) return false;
        }
      }

      return true;
    })
    .sort((a, b) => a.id - b.id);

  // Handler para el PIN de entrada
  const handleEntryPinSubmit = () => {
    if (entryPinInput === '1234566') {
      setIsAuthenticated(true);
      setShowEntryPinModal(false);
    } else {
      showError('PIN Incorrecto');
      setEntryPinInput('');
    }
  };

  // Si no está autenticado, mostrar modal de PIN de entrada
  if (showEntryPinModal && !isAuthenticated) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
      }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass"
          style={{ width: '100%', maxWidth: '360px', padding: '40px', borderRadius: '24px', textAlign: 'center' }}
        >
          <button
            type="button"
            onClick={() => setShowEntryPinModal(false)}
            aria-label="Cerrar acceso a Vista General"
            style={{ position: 'absolute', top: 18, right: 20, background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔐</div>
          <h2 style={{ marginBottom: '8px' }}>Acceso a Vista General</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Ingrese el PIN para acceder y modificar datos.
          </p>

          <input
            autoFocus
            type="password"
            className="input"
            placeholder="••••••"
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', marginBottom: '24px' }}
            value={entryPinInput}
            onChange={(e) => setEntryPinInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEntryPinSubmit();
              if (e.key === 'Escape') setShowEntryPinModal(false);
            }}
          />

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            onClick={handleEntryPinSubmit}
          >
            Ingresar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card glass" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="page-header">
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>Vista General de Clientes</h1>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: 'var(--text-main, #f8fafc)',
              fontSize: '0.85rem',
              fontWeight: '600',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              <span style={{ fontSize: '1.05rem' }}>
                {statusFilter === 'ACTIVO' ? '🟢' : statusFilter === 'INACTIVO' ? '🔴' : statusFilter === 'PROCESO' ? '🟡' : statusFilter === 'JURIDICO' ? '⚖️' : statusFilter === 'PENDIENTE' ? '⏳' : statusFilter === 'FINIQUITO' ? '👻' : statusFilter === 'CORTESIA' ? '🎁' : statusFilter === 'TRASLADO' ? '🚚' : '👥'}
              </span>
              <span>
                {statusFilter === 'TODOS' && <>Total Clientes: <strong style={{ color: '#ffffff', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.TODOS.toLocaleString()}</strong></>}
                {statusFilter === 'ACTIVO' && <>Activos: <strong style={{ color: '#34d399', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.ACTIVO.toLocaleString()}</strong></>}
                {statusFilter === 'INACTIVO' && <>Inactivos: <strong style={{ color: '#f87171', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.INACTIVO.toLocaleString()}</strong></>}
                {statusFilter === 'PROCESO' && <>En Proceso: <strong style={{ color: '#fbbf24', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.PROCESO.toLocaleString()}</strong></>}
                {statusFilter === 'JURIDICO' && <>Jurídico: <strong style={{ color: '#f43f5e', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.JURIDICO.toLocaleString()}</strong></>}
                {statusFilter === 'PENDIENTE' && <>Pendientes: <strong style={{ color: '#38bdf8', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.PENDIENTE.toLocaleString()}</strong></>}
                {statusFilter === 'CORTESIA' && <>Cortesía: <strong style={{ color: '#ec4899', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.CORTESIA.toLocaleString()}</strong></>}
                {statusFilter === 'TRASLADO' && <>Traslado: <strong style={{ color: '#06b6d4', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.TRASLADO.toLocaleString()}</strong></>}
                {statusFilter === 'FINIQUITO' && <>Finiquitos: <strong style={{ color: '#94a3b8', fontSize: '0.98rem', marginLeft: '4px' }}>{statusCounts.FINIQUITO.toLocaleString()}</strong></>}
              </span>
              {(searchTerm || fechaInstalacionFilter || ipFilter || pagoFilter !== 'TODOS' || planFilter !== 'TODOS') && (
                <span style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 'normal', marginLeft: '4px' }}>
                  (Mostrando: <strong>{filteredClientes.length.toLocaleString()}</strong>)
                </span>
              )}
            </div>
          </div>
          <p style={{ marginTop: '6px' }}>
            💡 Haz doble clic en cualquier celda para editar el valor.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input"
            style={{ width: 'auto', minWidth: '190px', marginBottom: 0, background: 'var(--input-select-bg, #1e1b4b)', color: 'var(--text-main)', fontSize: '0.82rem', height: '38px', padding: '4px 10px' }}
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="VER">⚙️ Acciones...</option>
            <option value="ELIMINAR">🗑️ Eliminar (Solo Sistema)</option>
            <option value="BORRAR">💥 Borrar (Todo: OLT, MikroTik, XUI, LibreQoS)</option>
          </select>
          <select
            className="input"
            style={{ width: 'auto', minWidth: '170px', marginBottom: 0, background: 'var(--input-select-bg, #1e1b4b)', color: 'var(--text-main)', fontSize: '0.82rem', height: '38px', padding: '4px 10px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos los Estados ({statusCounts.TODOS})</option>
            <option value="ACTIVO">Activos ({statusCounts.ACTIVO})</option>
            <option value="INACTIVO">Inactivos ({statusCounts.INACTIVO})</option>
            <option value="PROCESO">En Proceso ({statusCounts.PROCESO})</option>
            <option value="JURIDICO">Jurídico ({statusCounts.JURIDICO})</option>
            <option value="PENDIENTE">Pendientes ({statusCounts.PENDIENTE})</option>
            {statusCounts.CORTESIA > 0 && <option value="CORTESIA">🎁 Cortesía ({statusCounts.CORTESIA})</option>}
            {statusCounts.TRASLADO > 0 && <option value="TRASLADO">🚚 Traslado ({statusCounts.TRASLADO})</option>}
            <option value="FINIQUITO">👻 Finiquitos ({statusCounts.FINIQUITO})</option>
          </select>
          <select
            className="input"
            style={{ width: 'auto', minWidth: '180px', marginBottom: 0, background: 'var(--input-select-bg, #1e1b4b)', color: 'var(--primary)', fontWeight: '600', fontSize: '0.82rem', height: '38px', padding: '4px 10px' }}
            value={pagoFilter}
            onChange={(e) => setPagoFilter(e.target.value)}
          >
            <option value="TODOS">💳 Todos los Pagos</option>
            <option value="PAGADO">✅ Pagados (Pendiente $0)</option>
            <option value="PENDIENTE_PAGO">⚠️ Con Deuda Pendiente</option>
          </select>
          <select
            className="input"
            style={{
              width: 'auto',
              minWidth: '175px',
              marginBottom: 0,
              background: 'var(--input-select-bg, #1e1b4b)',
              color: planFilter !== 'TODOS' ? '#38bdf8' : 'var(--text-main)',
              fontWeight: planFilter !== 'TODOS' ? '600' : 'normal',
              fontSize: '0.82rem',
              height: '38px',
              padding: '4px 10px',
              borderColor: planFilter !== 'TODOS' ? '#38bdf8' : undefined
            }}
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            title="Filtrar por Plan de Internet"
          >
            <option value="TODOS">📶 Planes: Todos ({clientes.length})</option>
            {planesDisponibles.map(planName => {
              const count = planCounts[planName.toLowerCase()] || 0;
              return (
                <option key={planName} value={planName}>
                  {planName} ({count})
                </option>
              );
            })}
            {planCounts['__sin_plan__'] > 0 && (
              <option value="SIN_PLAN">⚠️ Sin Plan Asignado ({planCounts['__sin_plan__']})</option>
            )}
          </select>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <input
              className="input"
              placeholder="📅 Fecha Instalación (ej: 14/09)..."
              style={{
                width: 'auto',
                minWidth: '200px',
                marginBottom: 0,
                fontSize: '0.82rem',
                height: '38px',
                padding: '4px 28px 4px 10px',
                background: 'var(--input-select-bg, #1e1b4b)',
                color: 'var(--text-main)',
                borderColor: fechaInstalacionFilter ? 'var(--primary, #6366f1)' : undefined
              }}
              value={fechaInstalacionFilter}
              onChange={(e) => setFechaInstalacionFilter(e.target.value)}
            />
            {fechaInstalacionFilter && (
              <button
                type="button"
                onClick={() => setFechaInstalacionFilter('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: 0
                }}
                title="Limpiar filtro de fecha de instalación"
              >
                ✖
              </button>
            )}
          </div>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <input
              className="input"
              placeholder="🌐 Filtrar por IP..."
              style={{
                width: 'auto',
                minWidth: '160px',
                marginBottom: 0,
                fontSize: '0.82rem',
                height: '38px',
                padding: '4px 28px 4px 10px',
                background: 'var(--input-select-bg, #1e1b4b)',
                color: 'var(--text-main)',
                borderColor: ipFilter ? 'var(--primary, #6366f1)' : undefined
              }}
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
            />
            {ipFilter && (
              <button
                type="button"
                onClick={() => setIpFilter('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: 0
                }}
                title="Limpiar filtro de IP"
              >
                ✖
              </button>
            )}
          </div>
          <input
            className="input"
            placeholder="Buscar por ID, Nombre, Cédula o IP..."
            style={{ width: 'auto', minWidth: '220px', maxWidth: '300px', flex: 1, marginBottom: 0, fontSize: '0.82rem', height: '38px', padding: '4px 10px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? <p>Cargando datos...</p> : (
        <div className="table-container" style={{ maxHeight: '72vh', overflow: 'auto', width: '100%' }}>
          <table style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--table-header-bg, rgba(15, 23, 42, 0.95))', backdropFilter: 'blur(10px)', zIndex: 20 }}>
              <tr>
                {allColumns.map(col => {
                  const isId = col === 'id';
                  const isNombre = col === 'nombre';
                  const isIp = col === 'ip';

                  // Posiciones sticky para ID, Nombre e IP
                  let stickyStyle = {};
                  if (isId) {
                    stickyStyle = {
                      position: 'sticky',
                      left: 0,
                      zIndex: 22,
                      background: 'var(--sticky-col-bg, #131526)'
                    };
                  } else if (isNombre) {
                    stickyStyle = {
                      position: 'sticky',
                      left: colWidths['id'] || 60,
                      zIndex: 22,
                      background: 'var(--sticky-col-bg, #131526)'
                    };
                  } else if (isIp) {
                    stickyStyle = {
                      position: 'sticky',
                      left: (colWidths['id'] || 60) + (colWidths['nombre'] || 220),
                      zIndex: 22,
                      background: 'var(--sticky-col-bg, #131526)',
                      borderRight: '2px solid var(--glass-border, rgba(255, 255, 255, 0.15))'
                    };
                  }

                  return (
                    <th key={col} style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--glass-border)',
                      borderRight: '1px solid var(--glass-border)',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                      width: colWidths[col] || 150,
                      minWidth: colWidths[col] || 150,
                      maxWidth: colWidths[col] || 150,
                      position: 'relative',
                      overflow: 'hidden',
                      ...stickyStyle
                    }}>
                      {col === 'internet_payment' ? 'INTERNET PAY' : col === 'total_pago' ? 'PENDIENTE' : col === 'plus' ? 'IPTV' : col === 'observaciones' ? 'OBSERVACIONES' : col === 'comentarios' ? 'COMENTARIO' : col === 'iptv_cuenta' ? 'CUENTA IPTV' : col === 'ubicacion_cliente' ? 'UBICACIÓN' : col === 'facturas' ? 'FACTURA' : col === 'cod' ? 'COD' : col.replace('_', ' ')}

                      {/* Control para redimensionar la columna */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, col)}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          cursor: 'col-resize',
                          background: 'rgba(255,255,255,0.05)',
                          zIndex: 25
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.4)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      />
                    </th>
                  );
                })}
                {selectedAction === 'ELIMINAR' && (
                  <th key="acciones-eliminar" style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--glass-border)',
                    borderRight: '1px solid var(--glass-border)',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    width: 120,
                    minWidth: 120,
                    maxWidth: 120,
                    position: 'sticky',
                    right: 0,
                    background: 'var(--sticky-col-bg, #131526)',
                    zIndex: 22,
                    borderLeft: '2px solid var(--glass-border, rgba(255, 255, 255, 0.15))'
                  }}>
                    Acción (Eliminar)
                  </th>
                )}
                {selectedAction === 'BORRAR' && (
                  <th key="acciones-borrar" style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--glass-border)',
                    borderRight: '1px solid var(--glass-border)',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    width: 130,
                    minWidth: 130,
                    maxWidth: 130,
                    position: 'sticky',
                    right: 0,
                    background: 'var(--sticky-col-bg, #131526)',
                    zIndex: 22,
                    borderLeft: '2px solid var(--glass-border, rgba(255, 255, 255, 0.15))'
                  }}>
                    Acción (Borrar Todo)
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => {
                const isFiniquito = c.estado?.toUpperCase() === 'FINIQUITO';
                return (
                <tr 
                  key={c.id} 
                  style={{ 
                    borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.05))',
                    opacity: isFiniquito ? 0.65 : 1,
                    background: isFiniquito ? 'rgba(15, 23, 42, 0.4)' : 'transparent',
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  {allColumns.map(col => {
                    const isEditing = editingCell?.id === c.id && editingCell?.col === col;
                    const isId = col === 'id';
                    const isNombre = col === 'nombre';
                    const isIp = col === 'ip';

                    // Posiciones sticky para ID, Nombre e IP
                    let stickyStyle = {};
                    if (isId) {
                      stickyStyle = {
                        position: 'sticky',
                        left: 0,
                        zIndex: 12,
                        background: isEditing ? 'rgba(99, 102, 241, 0.2)' : (isFiniquito ? '#0d111d' : 'var(--sticky-col-bg, #131526)')
                      };
                    } else if (isNombre) {
                      stickyStyle = {
                        position: 'sticky',
                        left: colWidths['id'] || 60,
                        zIndex: 12,
                        background: isEditing ? 'rgba(99, 102, 241, 0.2)' : (isFiniquito ? '#0d111d' : 'var(--sticky-col-bg, #131526)')
                      };
                    } else if (isIp) {
                      stickyStyle = {
                        position: 'sticky',
                        left: (colWidths['id'] || 60) + (colWidths['nombre'] || 220),
                        zIndex: 12,
                        background: isEditing ? 'rgba(99, 102, 241, 0.2)' : (isFiniquito ? '#0d111d' : 'var(--sticky-col-bg, #131526)'),
                        borderRight: '2px solid var(--glass-border, rgba(255, 255, 255, 0.15))'
                      };
                    }

                    const isLockedCol = ['id', 'id_port', 'service_port', 'mac'].includes(col);
                    const isCellEditable = !isFiniquito && canModifyTable && !isLockedCol && !(col === 'estado' && c[col]?.toLowerCase() === 'pendiente');

                    return (
                      <td
                        key={col}
                        onClick={() => {
                          if (!isCellEditable) return;
                          if (col === 'estado' || col === 'cedula_tipo' || col === 'facturas') {
                            const hasCod = c.cod && String(c.cod).trim() !== '' && String(c.cod).trim().toUpperCase() !== 'NONE';
                            const currentVal = col === 'facturas' ? (hasCod ? 'SI' : (c.facturas || 'NONE')) : c[col];
                            handleStartEdit(c.id, col, currentVal);
                          }
                        }}
                        onDoubleClick={() => {
                          if (!isCellEditable) return;
                          if (col !== 'estado') {
                            const hasCod = c.cod && String(c.cod).trim() !== '' && String(c.cod).trim().toUpperCase() !== 'NONE';
                            const currentVal = col === 'total' ? c.pago_mensual : (col === 'total_pago' ? c.total_pago : (col === 'facturas' ? (hasCod ? 'SI' : (c.facturas || 'NONE')) : c[col]));
                            handleStartEdit(c.id, col, currentVal);
                          }
                        }}
                        title={isCellEditable ? "Doble clic para editar" : (isLockedCol ? "Campo de sistema protegido" : undefined)}
                        style={{
                          padding: '6px 12px',
                          whiteSpace: 'nowrap',
                          width: colWidths[col] || 150,
                          minWidth: colWidths[col] || 150,
                          maxWidth: colWidths[col] || 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          background: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          cursor: isCellEditable ? 'pointer' : 'default',
                          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          ...stickyStyle
                        }}
                      >
                        {isEditing ? (
                          col === 'estado' ? (
                            <select
                              autoFocus
                              className="input"
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                height: '28px',
                                fontSize: '0.8rem',
                                background: '#1e1b4b',
                                border: '1px solid var(--primary)',
                                outline: 'none',
                                appearance: 'none'
                              }}
                              value={tempValue}
                              onChange={(e) => handleSaveDropdown(c.id, col, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                            >
                              {!['Activo', 'ACTIVO', 'Inactivo', 'INACTIVO', 'Finiquito', 'FINIQUITO'].includes(tempValue) && (
                                <option value={tempValue}>{tempValue}</option>
                              )}
                              <option value="Activo">Activo</option>
                              <option value="Inactivo">Inactivo</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Juridico">Juridico</option>
                              <option value="Finiquito">👻 Finiquito</option>
                            </select>
                          ) : col === 'facturas' ? (
                            <select
                              autoFocus
                              className="input"
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                height: '28px',
                                fontSize: '0.8rem',
                                background: '#1e1b4b',
                                border: '1px solid var(--primary)',
                                outline: 'none'
                              }}
                              value={tempValue || 'NONE'}
                              onChange={(e) => handleSaveDropdown(c.id, col, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                            >
                              <option value="NONE">NONE</option>
                              <option value="SI">SI</option>
                            </select>
                          ) : (
                            col === 'plan' ? (
                              <select
                                className="input"
                                style={{ width: '100%', padding: '4px 8px', height: '28px', fontSize: '0.8rem', background: '#1e1b4b', border: '1px solid var(--primary)' }}
                                value={tempValue}
                                onChange={(e) => {
                                  setTempValue(e.target.value);
                                  handleSaveDropdown(c.id, col, e.target.value);
                                }}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                              >
                                <option value="">- Seleccionar -</option>
                                {planesList.map(p => (
                                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                ))}
                              </select>
                            ) : col === 'cedula_tipo' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px', padding: '4px 0' }} onClick={(e) => e.stopPropagation()}>
                                <select
                                  className="input"
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    height: '28px',
                                    fontSize: '0.78rem',
                                    background: '#1e1b4b',
                                    border: '1px solid var(--primary)',
                                    color: (tempValue === 'Si' || tempValue === 'SI') ? '#4ade80' : '#ffffff',
                                    fontWeight: 'bold'
                                  }}
                                  value={(tempValue === 'Si' || tempValue === 'SI') ? 'Si' : 'No'}
                                  onChange={async (e) => {
                                    const val = e.target.value;
                                    setTempValue(val);
                                    try {
                                      await clienteService.actualizar(c.id, { cedula_tipo: val });
                                      showSuccess(`Cédula cambiada a: ${val}`);
                                      fetchData();
                                    } catch (err) {
                                      showError('Error al guardar estado de cédula');
                                    }
                                  }}
                                  autoFocus
                                >
                                  <option value="No">No</option>
                                  <option value="Si">Si</option>
                                </select>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <label className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '10px', flex: 1, textAlign: 'center', cursor: 'pointer', background: fileFrontal ? '#4ade80' : 'rgba(255,255,255,0.08)', color: fileFrontal ? '#000' : '#fff' }}>
                                    {fileFrontal ? '✅ Front.' : '📸 Front.'}
                                    <input type="file" style={{ display: 'none' }} onChange={e => setFileFrontal(e.target.files[0])} />
                                  </label>
                                  <label className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: '10px', flex: 1, textAlign: 'center', cursor: 'pointer', background: filePosterior ? '#4ade80' : 'rgba(255,255,255,0.08)', color: filePosterior ? '#000' : '#fff' }}>
                                    {filePosterior ? '✅ Post.' : '📸 Post.'}
                                    <input type="file" style={{ display: 'none' }} onChange={e => setFilePosterior(e.target.files[0])} />
                                  </label>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                  {(fileFrontal || filePosterior) && (
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      disabled={uploadingCedula}
                                      onClick={() => handleSaveCedulaTipo(c.id, tempValue || 'No', fileFrontal, filePosterior)}
                                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                      title="Subir Fotos Seleccionadas"
                                    >
                                      {uploadingCedula ? '⏳' : 'Subir Fotos'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCell(null);
                                      setFileFrontal(null);
                                      setFilePosterior(null);
                                      setTempValue('');
                                    }}
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    title="Cerrar"
                                  >
                                    ❌ Cerrar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <input
                                autoFocus
                                className="input"
                                placeholder={col === 'ip' ? 'Ej: 10.10.20.50' : (col === 'total' || col === 'total_pago' ? '0.00' : '')}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  height: '28px',
                                  fontSize: '0.8rem',
                                  background: '#1e1b4b',
                                  border: '1px solid var(--primary)',
                                  fontFamily: col === 'ip' ? 'monospace' : 'inherit'
                                }}
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onBlur={() => handleSaveEdit(c.id, col)}
                                onKeyDown={(e) => handleKeyDown(e, c.id, col)}
                              />
                            )
                          )
                        ) : (
                          <span style={{
                            color: col === 'estado' ? (
                              c[col]?.toUpperCase() === 'ACTIVO' ? '#4ade80' :
                                c[col]?.toUpperCase() === 'FINIQUITO' ? '#94a3b8' :
                                ['MOROSO', 'SUSPENDIDO'].includes(c[col]?.toUpperCase()) ? '#ef4444' :
                                  c[col]?.toUpperCase() === 'INACTIVO' ? '#f87171' :
                                    ['EN PROCESO', 'PROCESO'].includes(c[col]?.toUpperCase()) ? '#fbbf24' :
                                      c[col]?.toUpperCase() === 'JURIDICO' ? '#ec4899' : '#94a3b8'
                            ) : 'inherit',
                            fontWeight: col === 'id' ? '600' : 'normal'
                          }}>
                            {(() => {
                              if (col === 'id') {
                                if (isFiniquito) {
                                  return (
                                    <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Cliente en Finiquito (Registro Fantasma)">
                                      👻 {c.id}
                                    </span>
                                  );
                                }
                                return c.id;
                              }
                              if (col === 'estado') {
                                if (isFiniquito) {
                                  return (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      background: 'rgba(148, 163, 184, 0.15)',
                                      color: '#cbd5e1',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      border: '1px dashed #94a3b8'
                                    }}>
                                      👻 Finiquito
                                    </span>
                                  );
                                }
                                return c.estado || '-';
                              }
                              if (col === 'total') {
                                const totalPagado = parseFloat(c.pago_mensual || 0);
                                return <span style={{ color: totalPagado > 0 ? '#4ade80' : 'var(--text-muted)', fontWeight: 'bold' }}>${totalPagado.toFixed(2)}</span>;
                              }
                              if (col === 'internet_payment' || col === 'plus' || col === 'adicional') {
                                const valPagado = c[col];
                                const hasValue = valPagado && parseFloat(valPagado) > 0;
                                return <span style={{ fontWeight: '500', color: hasValue ? (col === 'plus' ? '#4ade80' : col === 'adicional' ? '#60a5fa' : '#fbbf24') : 'inherit' }}>{hasValue ? `$${parseFloat(valPagado).toFixed(2)}` : '-'}</span>;
                              }
                              if (col === 'total_pago') {
                                const saldoVal = (c.saldo !== null && c.saldo !== undefined) ? parseFloat(c.saldo || 0) : (c.mantenimiento ? 10.00 : (c.precio_plan_especial && parseFloat(c.precio_plan_especial) > 0 ? parseFloat(c.precio_plan_especial) : 0));
                                const plusVal = parseFloat(c.plus || 0);
                                const adicVal = parseFloat(c.adicional || 0);
                                const totalPendienteSum = (c.total_pago !== undefined && c.total_pago !== null) ? parseFloat(c.total_pago) : (saldoVal + plusVal + adicVal);
                                return <span style={{ color: totalPendienteSum <= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>${totalPendienteSum.toFixed(2)}</span>;
                              }
                              if (col === 'cedula_tipo') {
                                 const hasPhoto = (c.cedula_frontal && String(c.cedula_frontal).trim() !== '') || (c.cedula_posterior && String(c.cedula_posterior).trim() !== '');
                                 const isSi = hasPhoto || (c.cedula_tipo === 'Si' || c.cedula_tipo === 'SI');
                                 const displayVal = isSi ? 'Si' : 'No';
                                 return (
                                   <span style={{ color: isSi ? '#4ade80' : '#94a3b8', fontWeight: 'bold' }}>
                                     {displayVal}
                                   </span>
                                 );
                               }
                              if (col === 'plan') {
                                let precio = 0; let isSpecial = false; let isPromo = false;
                                if (c.mantenimiento) { precio = 10.00; isSpecial = true; }
                                else if (c.precio_plan_especial && parseFloat(c.precio_plan_especial) > 0) { precio = parseFloat(c.precio_plan_especial); isSpecial = true; isPromo = true; }
                                else if (c.tercera_edad && c.precio_plan_especial) { precio = parseFloat(c.precio_plan_especial); isSpecial = true; }
                                else { const plan = planesList.find(p => p.nombre.toLowerCase() === (c.plan || '').toLowerCase()); if (plan) precio = plan.precio; }
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: '600', color: c.plan ? 'var(--text-main, #ffffff)' : 'var(--text-muted)', fontSize: '0.78rem' }}>
                                      {c.plan || '-'}
                                    </span>
                                    {precio > 0 && (
                                      <span style={{ color: c.mantenimiento ? '#ec4899' : (isPromo ? '#fbbf24' : (isSpecial ? '#f59e0b' : '#38bdf8')), fontSize: '0.72rem', fontWeight: '500' }}>
                                        ${parseFloat(precio).toFixed(2)}
                                        {c.mantenimiento ? <small style={{ display: 'block', fontSize: '0.65rem', color: '#f472b6' }}>🛠️ MANTENIMIENTO</small> : (isPromo ? <small style={{ display: 'block', fontSize: '0.65rem', color: '#fbbf24' }}>🏷️ PLAN MODIFICADO</small> : (isSpecial && <small style={{ display: 'block', fontSize: '0.65rem' }}>TERCERA EDAD</small>))}
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                              if (col === 'fotos_cedula') {
                                return <div style={{ display: 'flex', gap: '8px' }}>
                                  {c.cedula_frontal && <a href={c.cedula_frontal} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>Front.</a>}
                                  {c.cedula_posterior && <a href={c.cedula_posterior} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>Post.</a>}
                                  {!c.cedula_frontal && !c.cedula_posterior && '-'}
                                </div>;
                              }
                              if (col === 'observaciones') {
                                return (
                                  <div style={{ fontStyle: 'italic', opacity: 0.8, color: '#a78bfa', whiteSpace: 'pre-line' }}>
                                    {c.observaciones ? c.observaciones.split('/').join('\n') : '-'}
                                  </div>
                                );
                              }
                              if (col === 'iptv_cuenta') {
                                // Mostrar credenciales IPTV si el cliente tiene IPTV activo
                                if ((c.tv_tipo === 'IPTV' || c.iptv_user) && c.iptv_user) {
                                  return (
                                    <div style={{ padding: '3px 6px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: '6px', fontSize: '0.7rem', color: '#a5b4fc', whiteSpace: 'nowrap' }}>
                                      <div><strong>👤</strong> {c.iptv_user}</div>
                                      <div><strong>🔑</strong> {c.iptv_pass}</div>
                                      {c.iptv_max_conn ? <div style={{ color: '#6ee7b7', fontSize: '0.65rem' }}>📺 {c.iptv_max_conn} pantallas</div> : null}
                                    </div>
                                  );
                                } else if (c.tv_tipo === 'CATV') {
                                  return <span style={{ color: '#fcd34d', fontSize: '0.7rem' }}>🔌 CATV</span>;
                                }
                                return <span style={{ color: 'var(--text-muted)' }}>-</span>;
                              }
                              if (col === 'ubicacion_cliente') {
                                // Mostrar ubicacion: primero del contrato, sino la dirección
                                const ubicacion = c.ubicacion || c.direccion || null;
                                if (!ubicacion) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
                                return (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.7rem', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    title={ubicacion}
                                  >
                                    📍 {ubicacion.length > 30 ? ubicacion.substring(0, 30) + '...' : ubicacion}
                                  </a>
                                );
                              }
                              if (col === 'comentarios') {
                                return (
                                  <div style={{ color: '#60a5fa', whiteSpace: 'pre-line', fontSize: '0.75rem' }}>
                                    {c.comentarios ? c.comentarios.split('/').join('\n') : '-'}
                                  </div>
                                );
                              }

                              if (col === 'facturas') {
                                const hasCod = c.cod && String(c.cod).trim() !== '' && String(c.cod).trim().toUpperCase() !== 'NONE';
                                const isSi = hasCod || (c.facturas && String(c.facturas).trim().toUpperCase() === 'SI');
                                const displayVal = isSi ? 'SI' : ((c.facturas && String(c.facturas).trim() !== '') ? c.facturas : 'NONE');
                                return (
                                  <span style={{ color: isSi ? '#4ade80' : 'inherit', fontWeight: isSi ? 'bold' : 'normal' }}>
                                    {displayVal}
                                  </span>
                                );
                              }

                              if (col === 'ip') {
                                return c.ip ? (
                                  <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: '600' }} title="IP del Cliente (Doble clic para editar)">
                                    {c.ip}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>-</span>
                                );
                              }

                              if (['fecha_firma', 'instalation_date', 'payment_date'].includes(col)) {
                                return formatToDMY(c[col]);
                              }
                              return c[col] !== undefined ? String(c[col] || '-') : '-';
                            })()}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {selectedAction === 'ELIMINAR' && (
                    <td key="acciones-eliminar" style={{
                      padding: '6px 12px',
                      whiteSpace: 'nowrap',
                      width: 120,
                      minWidth: 120,
                      maxWidth: 120,
                      textAlign: 'center',
                      position: 'sticky',
                      right: 0,
                      background: '#131526',
                      zIndex: 12,
                      borderLeft: '2px solid rgba(255, 255, 255, 0.15)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}>
                      <button
                        onClick={() => handleDeleteCliente(c)}
                        style={{
                          padding: '5px 12px',
                          background: 'rgba(239, 68, 68, 0.18)',
                          border: '1px solid rgba(239, 68, 68, 0.45)',
                          color: '#f87171',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ef4444';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                          e.currentTarget.style.color = '#f87171';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title={`Eliminar a ${c.nombre} únicamente del sistema`}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  )}
                  {selectedAction === 'BORRAR' && (
                    <td key="acciones-borrar" style={{
                      padding: '6px 12px',
                      whiteSpace: 'nowrap',
                      width: 130,
                      minWidth: 130,
                      maxWidth: 130,
                      textAlign: 'center',
                      position: 'sticky',
                      right: 0,
                      background: '#131526',
                      zIndex: 12,
                      borderLeft: '2px solid rgba(255, 255, 255, 0.15)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}>
                      <button
                        onClick={() => handleDeleteCompleto(c)}
                        style={{
                          padding: '5px 12px',
                          background: 'rgba(220, 38, 38, 0.25)',
                          border: '1px solid #ef4444',
                          color: '#fca5a5',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(220, 38, 38, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.25)';
                          e.currentTarget.style.color = '#fca5a5';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title={`Borrar a ${c.nombre} de OLT, MikroTik, LibreQoS, XUI y Sistema`}
                      >
                        💥 Borrar Todo
                      </button>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span>
          Total: {filteredClientes.length} clientes encontrados.
          {fechaInstalacionFilter && (
            <span style={{ color: '#818cf8', marginLeft: '8px', fontWeight: '500' }}>
              (Filtro fecha inst.: "{fechaInstalacionFilter}")
            </span>
          )}
          {ipFilter && (
            <span style={{ color: '#38bdf8', marginLeft: '8px', fontWeight: '500' }}>
              (Filtro IP: "{ipFilter}")
            </span>
          )}
        </span>
        <span>Presiona Enter para guardar / Esc para cancelar</span>
      </div>

      {showPinModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass"
            style={{ width: '100%', maxWidth: '320px', padding: '32px', borderRadius: '24px', textAlign: 'center' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔐</div>
            <h2 style={{ marginBottom: '8px' }}>PIN de Seguridad</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Confirmación requerida para modificar datos.
            </p>

            <input
              autoFocus
              type="password"
              className="input"
              placeholder="••••••"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', marginBottom: '24px' }}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') executePendingAction();
                if (e.key === 'Escape') setShowPinModal(false);
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowPinModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={executePendingAction}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {showProgressModal && deletionProgress && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass"
            style={{ width: '100%', maxWidth: '420px', padding: '32px', borderRadius: '24px', textAlign: 'left' }}
          >
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🗑️</span> Eliminando Cliente
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>1. Creación de Respaldo</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.database === 'PENDIENTE' ? '#fbbf24' : '#4ade80' }}>
                  {deletionProgress.database === 'PENDIENTE' ? '⏳ Procesando' : '✅ OK'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>2. Configuración OLT (Huawei)</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.olt === 'PENDIENTE' ? '#fbbf24' : deletionProgress.olt === 'ERROR' ? '#f87171' : deletionProgress.olt === 'OMITIDO' ? '#94a3b8' : '#4ade80' }}>
                  {deletionProgress.olt === 'PENDIENTE' ? '⏳ Procesando' : deletionProgress.olt === 'ERROR' ? '❌ Falló' : deletionProgress.olt === 'OMITIDO' ? '⚪ Omitido' : '✅ Removido'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>3. MikroTik (DHCP Lease)</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.mikrotik === 'PENDIENTE' ? '#fbbf24' : deletionProgress.mikrotik === 'ERROR' ? '#f87171' : deletionProgress.mikrotik === 'OMITIDO' ? '#94a3b8' : '#4ade80' }}>
                  {deletionProgress.mikrotik === 'PENDIENTE' ? '⏳ Procesando' : deletionProgress.mikrotik === 'ERROR' ? '❌ Falló' : deletionProgress.mikrotik === 'OMITIDO' ? '⚪ Omitido' : '✅ Removido'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>4. Configuración IPTV (XUI)</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.xui === 'PENDIENTE' ? '#fbbf24' : deletionProgress.xui === 'ERROR' ? '#f87171' : deletionProgress.xui === 'OMITIDO' ? '#94a3b8' : '#4ade80' }}>
                  {deletionProgress.xui === 'PENDIENTE' ? '⏳ Procesando' : deletionProgress.xui === 'ERROR' ? '❌ Falló' : deletionProgress.xui === 'OMITIDO' ? '⚪ Omitido' : '✅ Removido'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>5. Cola de QoS (LibreQoS)</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.libreqos === 'PENDIENTE' ? '#fbbf24' : deletionProgress.libreqos === 'ERROR' ? '#f87171' : deletionProgress.libreqos === 'OMITIDO' ? '#94a3b8' : '#4ade80' }}>
                  {deletionProgress.libreqos === 'PENDIENTE' ? '⏳ Procesando' : deletionProgress.libreqos === 'ERROR' ? '❌ Falló' : deletionProgress.libreqos === 'OMITIDO' ? '⚪ Omitido' : '✅ Removido'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>6. Base de Datos Local</span>
                <span style={{ fontWeight: 'bold', color: deletionProgress.database === 'PENDIENTE' ? '#94a3b8' : deletionProgress.database === 'ERROR' ? '#f87171' : '#4ade80' }}>
                  {deletionProgress.database === 'PENDIENTE' ? '⏳ Esperando' : deletionProgress.database === 'ERROR' ? '❌ Falló' : '✅ Eliminado'}
                </span>
              </div>
            </div>

            <p style={{
              fontSize: '0.85rem',
              padding: '12px',
              borderRadius: '8px',
              background: deletionProgress.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              border: deletionProgress.status === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
              color: deletionProgress.status === 'error' ? '#f87171' : '#e2e8f0',
              marginBottom: '20px',
              wordBreak: 'break-word'
            }}>
              {deletionProgress.message}
            </p>

            {deletionProgress.status !== 'processing' && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
                onClick={() => {
                  setShowProgressModal(false);
                  setDeletionProgress(null);
                }}
              >
                Entendido
              </button>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default General;
