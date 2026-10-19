/**
 * @file ExtrasGeneral.jsx
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.‍​‌​​​‌​​​‌‌​​​​‌​‌‌‌​‌‌​​‌‌​‌​​‌​‌‌​​‌​​​​‌​​​​​​‌​​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌​​​​​​​‌​‌​​​​‌‌​​​‌‌​​‌​‌​​‌​​‌​​​​​​​‌‌​​‌​​​‌‌​​​​​​‌‌​​‌​​​‌‌​‌‌​​​‌​‌‌‌​​​‌​​​​​​‌​​​​​‌​‌‌​‌‌​​​‌‌​‌‌​​​​‌​​​​​​‌​‌​​‌​​‌‌​‌​​‌​‌‌​​‌‌‌​‌‌​‌​​​​‌‌‌​‌​​​‌‌‌​​‌‌​​‌​​​​​​‌​‌​​‌​​‌‌​​‌​‌​‌‌‌​​‌‌​‌‌​​‌​‌​‌‌‌​​‌​​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​​​​‌​‌‌‌​​​‌​​​​​​‌​​​‌​​​‌‌​​‌​‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌‌​​​‌‌​‌‌‌‌​‌‌‌​​​​​‌‌​​‌​‌​‌‌​​‌​​​​‌​​​​​​‌‌‌​‌‌‌​‌‌​‌​​‌​‌‌‌​‌​​​‌‌​‌​​​​​‌​​​​​​‌​​​​​‌​‌​​‌​​‌​​‌​​​​​​‌‌​​​​‌​‌‌‌​​‌‌​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌‌​​‌‌​‌‌‌​‌​​​‌‌​​​​‌​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌‌​​‌‌‌​‌​​​‌‌​​​​‌​‌‌​​​‌‌​‌‌‌​‌​​​​‌‌‌​‌​​​‌​​​​​​‌‌​​‌​​​‌‌​‌‌​‌​‌‌​‌‌‌‌​‌‌​​‌‌‌​‌‌‌​​‌​​‌‌​‌‌‌‌​‌‌‌​‌‌​​‌‌​​‌​‌​‌‌​‌​‌​​‌‌​‌‌‌‌​​‌‌‌​​​​​‌‌​‌‌‌​‌​​​​​​​‌‌​​‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​‌‌​‌​​‌​‌‌​‌‌​​​​‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​​‌​‌‌‌​​​‌​​​​​​‌​​​‌‌​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌‌​​‌​‌​‌‌​‌‌‌​​‌‌‌​​‌‌​‌‌​‌​​‌​‌‌​​​‌‌​​‌​​​​​​‌​‌​​‌‌​‌‌​‌​​‌​‌‌​​‌‌‌​​‌‌‌​‌​​​‌​​​​​​‌‌​​​‌​​‌‌​​‌‌​​​‌‌​​‌​​​‌‌​‌‌​​‌‌​​‌​‌​‌‌​​‌​‌​​‌‌​​​​​​‌‌​​‌‌​​‌‌​​‌‌​​‌‌​‌​​​​‌‌​​​‌​​‌‌‌​​​​‌‌​​‌​​​​‌‌​‌​‌​‌‌​​‌​​​‌‌​​​‌‌‍
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 */
import React, { useEffect, useState, useMemo } from 'react';
import { extrasService, configuracionService } from '../services/api';
import { formatToDMY, normalizeDateInput, toISODate } from '../services/dateUtils';
import { showAlert, showSuccess, showError, showConfirm, showToast } from '../utils/alerts';


const ExtrasGeneral = () => {
    const [extras, setExtras] = useState([]);
    const [bancosList, setBancosList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEstado, setSelectedEstado] = useState('TODOS');

    const [showModal, setShowModal] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadModo, setUploadModo] = useState('merge');
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' o 'pagos'
    const [selectedForPago, setSelectedForPago] = useState(null);
    const [pagoData, setPagoData] = useState({ monto: 0, mes: 'ENERO', metodo: 'EFECTIVO', factura: '', referencia: '' });

    // Estados para Edición en Vivo (Inline Editing) de toda la tabla
    const [editingCell, setEditingCell] = useState(null); // { id: extra.id, field: string }
    const [tempValue, setTempValue] = useState('');
    const [savingCellKey, setSavingCellKey] = useState(null);
    const isSavingRef = React.useRef(false);

    const estadoOptions = ['30 DÍAS', 'INFINITO', 'FIJO', 'SEMIFIJO', 'CORTE', 'EN CORTE', 'ELIMINADO'];
    const activoOptions = ['SI', 'NO'];

    const availableEstados = useMemo(() => {
        const base = ['TODOS', '30 DÍAS', 'INFINITO', 'FIJO', 'SEMIFIJO', 'CORTE', 'EN CORTE', 'ELIMINADO'];
        const fromData = extras.map(e => (e.estado || '').trim().toUpperCase()).filter(Boolean);
        return Array.from(new Set([...base, ...fromData]));
    }, [extras]);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const allBankOptions = useMemo(() => {
        const base = ['EFECTIVO', 'PICHINCHA', 'JEP', 'BANCO GUAYAQUIL', 'BANCO PACIFICO', 'PRODUBANCO'];
        const fromDb = (bancosList || []).map(b => (b.nombre || '').trim().toUpperCase()).filter(Boolean);
        return Array.from(new Set([...base, ...fromDb]));
    }, [bancosList]);

    const handleStartEdit = (extra, field, val) => {
        setEditingCell({ id: extra.id, field });
        setTempValue(val !== undefined && val !== null ? String(val) : '');
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
        setTempValue('');
    };

    const handleKeyDown = (e, extra, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelEdit();
        }
    };

    const handleSaveCell = async (extra, field, overrideVal = null) => {
        if (isSavingRef.current) return;
        const rawVal = overrideVal !== null ? overrideVal : tempValue;
        let valToSave = typeof rawVal === 'string' ? rawVal.trim() : rawVal;

        let original = extra[field];
        if (field === 'saldo') {
            original = calculateDebe(extra);
        }
        if (String(original ?? '') === String(valToSave ?? '')) {
            setEditingCell(null);
            return;
        }

        const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        let payload = {};

        if (field === 'valor') {
            const numVal = parseFloat(valToSave) || 0;
            payload = { valor: numVal };
            let running = 0;
            for (let j = 0; j < 12; j++) {
                const curM = listMonths[j];
                const curPago = parseFloat(extra[`${curM}_pago`] || 0);
                running = Math.round((running + numVal - curPago) * 100) / 100;
                payload[`${curM}_saldo`] = running;
            }
            const currentMonthIdx = new Date().getMonth();
            const currKey = listMonths[currentMonthIdx];
            payload.saldo_pendiente = Math.max(0, payload[`${currKey}_saldo`] ?? running);
        } else if (field === 'saldo') {
            const numVal = parseFloat(valToSave) || 0;
            const currentMonthKey = listMonths[new Date().getMonth()];
            payload = {
                [`${currentMonthKey}_saldo`]: numVal,
                saldo_pendiente: Math.max(0, numVal)
            };
        } else if (field.endsWith('_pago')) {
            const numVal = parseFloat(valToSave) || 0;
            const m = field.replace('_pago', '');
            const mIdx = listMonths.indexOf(m);
            payload[field] = numVal;

            if (!extra[`${m}_fecha_pago`] && numVal > 0) {
                const now = new Date();
                const d = String(now.getDate()).padStart(2, '0');
                const mon = String(now.getMonth() + 1).padStart(2, '0');
                const y = now.getFullYear();
                payload[`${m}_fecha_pago`] = `${d}/${mon}/${y}`;
            }
            if (!extra[`${m}_banco`] && numVal > 0) {
                payload[`${m}_banco`] = 'EFECTIVO';
            }
            const baseVal = parseFloat(extra.valor || 0);
            const prevM = mIdx > 0 ? listMonths[mIdx - 1] : null;
            const prevSaldo = prevM ? parseFloat(extra[`${prevM}_saldo`] ?? 0) : 0;
            const newSaldo = Math.round((prevSaldo + baseVal - numVal) * 100) / 100;
            payload[`${m}_saldo`] = newSaldo;

            // Arrastrar el saldo acumulado a los meses posteriores
            let running = newSaldo;
            for (let j = mIdx + 1; j < 12; j++) {
                const nextM = listMonths[j];
                const nextPago = parseFloat(extra[`${nextM}_pago`] || 0);
                running = Math.round((running + baseVal - nextPago) * 100) / 100;
                payload[`${nextM}_saldo`] = running;
            }
            const currentMonthIdx = new Date().getMonth();
            const currKey = listMonths[currentMonthIdx];
            payload.saldo_pendiente = Math.max(0, payload[`${currKey}_saldo`] ?? running);
        } else if (field.endsWith('_saldo')) {
            const numVal = parseFloat(valToSave) || 0;
            const m = field.replace('_saldo', '');
            const mIdx = listMonths.indexOf(m);
            payload[field] = numVal;

            // Arrastrar el saldo modificado a los meses posteriores
            const baseVal = parseFloat(extra.valor || 0);
            let running = numVal;
            for (let j = mIdx + 1; j < 12; j++) {
                const nextM = listMonths[j];
                const nextPago = parseFloat(extra[`${nextM}_pago`] || 0);
                running = Math.round((running + baseVal - nextPago) * 100) / 100;
                payload[`${nextM}_saldo`] = running;
            }
            const currentMonthIdx = new Date().getMonth();
            const currKey = listMonths[currentMonthIdx];
            payload.saldo_pendiente = Math.max(0, payload[`${currKey}_saldo`] ?? running);
        } else if (field === 'estado') {
            payload[field] = valToSave;
            if (valToSave === 'ELIMINADO') {
                payload.saldo_pendiente = 0;
                listMonths.forEach(m => { payload[`${m}_saldo`] = 0; });
            }
        } else if (field.endsWith('_fecha_pago') || field.endsWith('_fecha_a_pagar') || field === 'fecha_ingreso') {
            payload[field] = valToSave ? normalizeDateInput(valToSave) : '';
        } else {
            payload[field] = valToSave;
        }

        const cellKey = `${extra.id}_${field}`;
        setEditingCell(null);
        setSavingCellKey(cellKey);
        isSavingRef.current = true;

        // Actualización optimista inmediata
        setExtras(prev => prev.map(item => item.id === extra.id ? { ...item, ...payload } : item));

        try {
            const res = await extrasService.actualizar(extra.id, payload);
            if (res.data) {
                setExtras(prev => prev.map(item => item.id === extra.id ? { ...item, ...res.data } : item));
            }
            showToast(`Campo actualizado`, 'success', 1800);
        } catch (err) {
            console.error("Error al actualizar campo inline:", err);
            setExtras(prev => prev.map(item => item.id === extra.id ? extra : item));
            showError("Error al guardar: " + (err.response?.data?.detail || err.message));
        } finally {
            setSavingCellKey(null);
            isSavingRef.current = false;
        }
    };

    const [showAllMonths, setShowAllMonths] = useState(false);
    const currentMonthIdx = new Date().getMonth(); // 9 para Octubre

    const displayMonths = useMemo(() => {
        if (showAllMonths) return months;
        return months.filter((_, idx) => idx <= currentMonthIdx);
    }, [showAllMonths, currentMonthIdx]);

    const initialForm = {
        cod: '',
        nombre_cliente: '',
        contacto: '',
        proveedor: 'OPSATEL',
        usuario: '',
        contrasena: 'TV2026.@',
        cuentas: '1',
        mac_smart_one: '',
        observaciones: '',
        estado: '30 DÍAS',
        valor: 0,
        activo: 'SI',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        // Inicializar campos mensuales en el form
        ...Object.fromEntries(
            ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"].flatMap(m => [
                [`${m}_factura`, ''],
                [`${m}_fecha_pago`, ''],
                [`${m}_pago`, 0],
                [`${m}_banco`, ''],
                [`${m}_cod`, ''],
                [`${m}_saldo`, 0]
            ])
        )
    };

    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        if (!isEditing && formData.nombre_cliente && formData.cod) {
            const nameParts = formData.nombre_cliente.trim().split(' ').filter(p => p.length > 0);
            
            if (nameParts.length > 0) {
                const apellido = nameParts[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
                const nombreLetra = nameParts[1] ? nameParts[1][0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '') : '';
                
                setFormData(prev => ({
                    ...prev,
                    usuario: `${formData.cod}${apellido}${nombreLetra}`
                }));
            }
        }
    }, [formData.nombre_cliente, formData.cod, isEditing]);

    const getStartMonthIdx = (fechaIngreso) => {
        if (!fechaIngreso) return 0;
        try {
            const str = String(fechaIngreso).trim();
            if (str.includes('-')) {
                const parts = str.split('-');
                const m = parseInt(parts[0].length === 4 ? parts[1] : parts[1], 10);
                if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
            } else if (str.includes('/')) {
                const parts = str.split('/');
                const m = parseInt(parts[1], 10);
                if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
            }
        } catch (e) {
            console.error("Error parsing fecha_ingreso:", e);
        }
        return 0;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await extrasService.listar();
            const banksResp = await configuracionService.getBancos();
            setExtras(res.data || []);
            setBancosList(banksResp.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getNextCod = () => {
        if (!extras || extras.length === 0) return '1C';
        const numbers = extras
            .map(e => parseInt(e.cod?.replace('C', '') || '0'))
            .filter(n => !isNaN(n));
        const max = Math.max(0, ...numbers);
        return `${max + 1}C`;
    };

    const getMonthSaldo = (e, mIdx) => {
        if (!e) return 0;
        if ((e.estado || '').trim().toUpperCase() === 'ELIMINADO') return 0;

        const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const m = listMonths[mIdx];

        // Si el saldo está guardado explícitamente en el objeto, retornar exactamente ese valor
        const saldoGuardado = e[`${m}_saldo`];
        if (saldoGuardado !== undefined && saldoGuardado !== null && String(saldoGuardado).trim() !== '') {
            return parseFloat(saldoGuardado);
        }

        // Si no está registrado explícitamente, calcular arrastre acumulado
        const valorBase = parseFloat(e.valor || 0);
        const pagoMes = parseFloat(e[`${m}_pago`] || 0);
        const prevM = mIdx > 0 ? listMonths[mIdx - 1] : null;
        const prevSaldo = prevM ? getMonthSaldo(e, mIdx - 1) : 0;

        return Math.round((prevSaldo + valorBase - pagoMes) * 100) / 100;
    };

    const calculateDebe = (e) => {
        if (!e) return 0;
        if ((e.estado || '').trim().toUpperCase() === 'ELIMINADO') return 0;
        const currentMonthIdx = new Date().getMonth();
        return getMonthSaldo(e, currentMonthIdx);
    };

    const stats = useMemo(() => {
        let pend = 0;
        let excedentes = 0;
        extras.forEach(e => {
            // En saldo pendiente no cuentan los que tengan estado eliminado
            if ((e.estado || '').trim().toUpperCase() === 'ELIMINADO') return;
            const d = calculateDebe(e);
            if (d > 0) pend += d;
            else if (d < 0) excedentes += Math.abs(d);
        });
        return { 
            pend, 
            excedentes,
            total: extras.length, 
            activos: extras.filter(x => x.activo === 'SI' && (x.estado || '').trim().toUpperCase() !== 'ELIMINADO').length 
        };
    }, [extras]);

    const handleOpenModal = () => {
        setIsEditing(false);
        setActiveTab('general');
        setFormData({
            ...initialForm,
            cod: getNextCod()
        });
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setActiveTab('general');
        setCurrentId(item.id);
        
        // Mapear item a formData asegurando que los nulos sean strings vacios
        const mapped = { ...item };
        Object.keys(item).forEach(key => {
            if (item[key] === null) mapped[key] = '';
        });
        
        setFormData(mapped);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = {
                ...formData,
                valor: parseFloat(formData.valor) || 0,
                fecha_ingreso: normalizeDateInput(formData.fecha_ingreso)
            };
            
            // Asegurar que los pagos y saldos mensuales sean números
            ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"].forEach(m => {
                data[`${m}_pago`] = parseFloat(data[`${m}_pago`] || 0);
                data[`${m}_saldo`] = parseFloat(data[`${m}_saldo`] || 0);
                if (data[`${m}_fecha_pago`]) {
                    data[`${m}_fecha_pago`] = normalizeDateInput(data[`${m}_fecha_pago`]);
                }
            });

            if (isEditing) {
                await extrasService.actualizar(currentId, data);
            } else {
                await extrasService.crear(data);
            }

            setShowModal(false);
            showSuccess("Procesado correctamente");
            fetchData();
        } catch (err) {
            showError("Error al procesar: " + (err.response?.data?.detail || "Error desconocido"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmado = await showConfirm("¿Eliminar servicio?", "¿Deseas eliminar definitivamente este servicio?", "Sí, eliminar", "Cancelar");
        if (!confirmado) return;
        try {
            await extrasService.eliminar(id);
            showSuccess("Servicio eliminado correctamente");
            fetchData();
        } catch (err) {
            showError("Error al eliminar el registro.");
        }
    };

    const filtered = extras.filter(e => {
        const s = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            e.nombre_cliente?.toLowerCase().includes(s) ||
            e.cod?.toLowerCase().includes(s) ||
            e.usuario?.toLowerCase().includes(s) ||
            e.contacto?.toLowerCase().includes(s);

        const eEstado = (e.estado || '').trim().toUpperCase();
        const matchesEstado = selectedEstado === 'TODOS' || eEstado === selectedEstado.toUpperCase();

        return matchesSearch && matchesEstado;
    });

    const handleOpenPago = (extra) => {
        if ((extra.estado || '').trim().toUpperCase() === 'ELIMINADO') {
            showError("El servicio tiene estado ELIMINADO y no registra saldo pendiente.");
            return;
        }
        const currentMonthIdx = new Date().getMonth();
        setSelectedForPago(extra);
        const debeCalculado = calculateDebe(extra);
        const montoCobro = debeCalculado > 0 ? debeCalculado : (extra.valor || 0);
        setPagoData({
            monto: montoCobro,
            mes: months[currentMonthIdx].toUpperCase(),
            metodo: 'EFECTIVO',
            factura: '',
            referencia: ''
        });
        setShowPagoModal(true);
    };

    const handleConfirmPago = async () => {
        try {
            await extrasService.pagar(selectedForPago.id, {
                monto: parseFloat(pagoData.monto),
                metodo_pago: pagoData.metodo,
                mes_correspondiente: pagoData.mes,
                referencia: pagoData.referencia || `Pago EXTRA - ${pagoData.mes}`,
                factura: pagoData.factura
            });
            setShowPagoModal(false);
            showSuccess("Pago registrado correctamente");
            fetchData();
        } catch (err) {
            showError("Error al registrar pago: " + (err.response?.data?.detail || "Error desconocido"));
        }
    };

    const handleUploadExcel = async (e) => {
        if (e) e.preventDefault();
        if (!uploadFile) {
            showError("Por favor selecciona un archivo Excel (.xlsx o .xls)");
            return;
        }
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", uploadFile);
            formData.append("modo", uploadModo);

            const resp = await extrasService.uploadDatabase(formData);
            showSuccess(resp.data?.message || "Base de datos de Extras importada exitosamente");
            setShowUploadModal(false);
            setUploadFile(null);
            const fileInput = document.getElementById('excel-extras-input');
            if (fileInput) fileInput.value = '';
            fetchData();
        } catch (err) {
            showError(err.response?.data?.detail || "Error al subir la base de datos de extras");
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            setDownloading(true);
            const resp = await extrasService.downloadDatabase();
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Base_Datos_Extras_General_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            showSuccess("Archivo Excel de Extras descargado correctamente");
        } catch (err) {
            showError("Error al descargar la base de datos de extras");
        } finally {
            setDownloading(false);
        }
    };

    const filteredMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const inlineInputStyle = {
        width: '100%',
        height: '28px',
        background: '#090d16',
        color: '#ffffff',
        border: '1px solid #3b82f6',
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '0.78rem',
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box'
    };

    const inlineSelectStyle = {
        width: '100%',
        height: '28px',
        background: '#090d16',
        color: '#ffffff',
        border: '1px solid #3b82f6',
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: '0.75rem',
        fontFamily: 'inherit',
        outline: 'none',
        cursor: 'pointer',
        boxSizing: 'border-box'
    };

    const handleModalPagoChange = (mKey, valStr) => {
        const val = parseFloat(valStr) || 0;
        const base = parseFloat(formData.valor) || 0;
        const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const mIdx = listMonths.indexOf(mKey);

        const prevM = mIdx > 0 ? listMonths[mIdx - 1] : null;
        const prevSaldo = prevM ? parseFloat(formData[`${prevM}_saldo`] || 0) : 0;
        const newSaldo = Math.round((prevSaldo + base - val) * 100) / 100;

        let updated = {
            ...formData,
            [`${mKey}_pago`]: valStr,
            [`${mKey}_saldo`]: newSaldo
        };

        let running = newSaldo;
        for (let j = mIdx + 1; j < 12; j++) {
            const nextM = listMonths[j];
            const nextPago = parseFloat(updated[`${nextM}_pago`] || 0);
            running = Math.round((running + base - nextPago) * 100) / 100;
            updated[`${nextM}_saldo`] = running;
        }
        setFormData(updated);
    };

    const handleModalSaldoChange = (mKey, valStr) => {
        const val = parseFloat(valStr) || 0;
        const base = parseFloat(formData.valor) || 0;
        const listMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const mIdx = listMonths.indexOf(mKey);

        let updated = {
            ...formData,
            [`${mKey}_saldo`]: valStr
        };

        let running = val;
        for (let j = mIdx + 1; j < 12; j++) {
            const nextM = listMonths[j];
            const nextPago = parseFloat(updated[`${nextM}_pago`] || 0);
            running = Math.round((running + base - nextPago) * 100) / 100;
            updated[`${nextM}_saldo`] = running;
        }
        setFormData(updated);
    };

    return (
        <div style={{ padding: '10px' }}>
            <style>{`
                .editable-td {
                    cursor: pointer;
                    position: relative;
                    transition: background 0.15s ease, outline 0.15s ease;
                }
                .editable-td:hover {
                    background: rgba(59, 130, 246, 0.15) !important;
                    outline: 1px dashed rgba(96, 165, 250, 0.5) !important;
                    outline-offset: -1px;
                }
                .editable-td-active {
                    background: rgba(15, 23, 42, 0.98) !important;
                    outline: 2px solid #3b82f6 !important;
                    outline-offset: -2px;
                    padding: 3px !important;
                }
            `}</style>

            {/* HEADER */}
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div className="page-header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontWeight: '900', margin: 0 }}>Extras General</h1>
                        <span style={{ 
                            fontSize: '0.78rem', 
                            background: 'rgba(59, 130, 246, 0.12)', 
                            color: '#60a5fa', 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            ⚡ Toda la tabla es modificable en vivo (clic en cualquier celda para editar)
                        </span>
                    </div>
                    <p style={{ marginTop: '4px' }}>Control administrativo de servicios y cobranzas. Modifica cualquier campo directamente; los pagos impactan en Balance y Finanzas según el mes.</p>
                </div>
                <div className="page-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        className="input"
                        style={{ width: '100%', maxWidth: '220px', marginBottom: 0 }}
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="input"
                        value={selectedEstado}
                        onChange={e => setSelectedEstado(e.target.value)}
                        style={{
                            width: 'auto',
                            minWidth: '175px',
                            marginBottom: 0,
                            background: '#1e1b4b',
                            color: selectedEstado === 'TODOS' ? '#94a3b8' : '#38bdf8',
                            border: selectedEstado === 'TODOS' ? '1px solid #4f46e5' : '1px solid #38bdf8',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            padding: '8px 12px',
                            cursor: 'pointer'
                        }}
                        title="Filtrar por Estado"
                    >
                        {availableEstados.map(est => {
                            const count = est === 'TODOS'
                                ? extras.length
                                : extras.filter(x => (x.estado || '').trim().toUpperCase() === est.toUpperCase()).length;
                            return (
                                <option key={est} value={est} style={{ background: '#0f172a', color: 'white' }}>
                                    {est === 'TODOS' ? '🏷️ Todos los Estados' : est} ({count})
                                </option>
                            );
                        })}
                    </select>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowAllMonths(!showAllMonths)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            border: showAllMonths ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)'
                        }}
                        title={showAllMonths ? "Mostrar únicamente hasta el mes actual" : "Ver cuadrícula completa de todos los meses"}
                    >
                        <span>{showAllMonths ? '🔒' : '🔓'}</span>
                        {showAllMonths ? `Hasta ${months[currentMonthIdx]}` : 'Desbloquear todos'}
                    </button>
                    <button
                        className="btn"
                        onClick={() => setShowUploadModal(true)}
                        style={{
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: 'white',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                        title="Subir archivo Excel exclusivo de Extras"
                    >
                        <span>📤</span> Subir Excel Extras
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleDownloadExcel}
                        disabled={downloading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap'
                        }}
                        title="Descargar base de datos actual de extras en Excel"
                    >
                        <span>📥</span> {downloading ? 'Descargando...' : 'Descargar Excel'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleOpenModal}
                        style={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}
                    >
                        + Nuevo Servicio
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div className="grid-responsive" style={{ marginBottom: '32px' }}>
                {[
                    { label: 'Saldo Pendiente (Deuda)', val: `$${stats.pend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, color: '#f87171' },
                    { label: 'Total Excedentes (A Favor)', val: `-$${stats.excedentes.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, color: '#34d399' },
                    { label: 'Servicios Activos', val: stats.activos, color: '#38bdf8' },
                    { label: 'Total Clientes', val: stats.total, color: '#818cf8' }
                ].map((s, i) => (
                    <div key={i} className="glass-card glass" style={{ padding: '24px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: s.color }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* TABLE */}
            <div className="table-container">
                <div style={{ maxHeight: '65vh', overflow: 'auto' }}>
                    <table style={{ tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ background: 'var(--table-header-bg, #1e293b)', borderBottom: '1px solid var(--table-border, rgba(255,255,255,0.1))' }}>
                                <th rowSpan="2" style={{ width: '80px', zIndex: 11, position: 'sticky', left: 0, background: 'var(--sticky-col-bg, #1e293b)', padding: '15px', borderRight: '1px solid var(--table-border, rgba(255,255,255,0.1))' }}>COD</th>
                                <th rowSpan="2" style={{ width: '220px', zIndex: 11, position: 'sticky', left: '80px', background: 'var(--sticky-col-bg, #1e293b)', padding: '15px', borderRight: '2px solid #3b82f6' }}>NOMBRE CLIENTE</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>CONTACTO</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>PROVEEDOR</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>USUARIO</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>CONTRASEÑA</th>
                                <th rowSpan="2" style={{ width: '80px', padding: '15px' }}>CUENTAS</th>
                                <th rowSpan="2" style={{ width: '160px', padding: '15px' }}>MAC SMART ONE</th>
                                <th rowSpan="2" style={{ width: '180px', padding: '15px' }}>OBSERVACIONES</th>
                                <th rowSpan="2" style={{ width: '130px', padding: '15px' }}>VALOR</th>
                                <th rowSpan="2" style={{ width: '120px', padding: '15px' }}>ESTADO</th>
                                <th rowSpan="2" style={{ width: '120px', padding: '15px' }}>SALDO</th>
                                <th rowSpan="2" style={{ width: '100px', padding: '15px' }}>ACTIVO</th>
                                <th rowSpan="2" style={{ width: '120px', padding: '15px', textAlign: 'center' }}>ACCIONES</th>
                                {displayMonths.map(m => (
                                    <th key={m} style={{ width: '600px', textAlign: 'center', borderLeft: '1px solid var(--table-border, rgba(255,255,255,0.1))', padding: '10px', background: 'var(--table-header-bg, #1e1b4b)' }} colSpan="6">
                                        {m.toUpperCase()}
                                    </th>
                                ))}
                            </tr>
                            <tr style={{ background: 'var(--sticky-sub-bg, #0f172a)', fontSize: '0.7rem' }}>
                                {displayMonths.map(m => (
                                    <React.Fragment key={m + '_sub'}>
                                        <th style={{ width: '100px', padding: '8px', borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.1))' }}>Factura</th>
                                        <th style={{ width: '100px', padding: '8px' }}>Fecha</th>
                                        <th style={{ width: '100px', padding: '8px', color: '#34d399' }}>Pago</th>
                                        <th style={{ width: '100px', padding: '8px' }}>Banco</th>
                                        <th style={{ width: '100px', padding: '8px' }}>Ref</th>
                                        <th style={{ width: '100px', padding: '8px', color: '#f87171' }}>Saldo</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(e => {
                                const startMonthIdx = getStartMonthIdx(e.fecha_ingreso);
                                const debeVal = calculateDebe(e);

                                return (
                                    <tr key={e.id} style={{ borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.05))' }}>
                                        {/* COD */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'cod' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'cod', e.cod)}
                                            style={{ position: 'sticky', left: 0, zIndex: 5, width: '80px', background: 'var(--sticky-col-bg, #0f172a)', padding: editingCell?.id === e.id && editingCell?.field === 'cod' ? '3px' : '14px', color: '#a855f7', fontWeight: 'bold', borderRight: '1px solid var(--glass-border, rgba(255,255,255,0.1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title="Clic para editar CÓDIGO"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'cod' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'cod')}
                                                    onBlur={ev => handleSaveCell(e, 'cod', ev.target.value)}
                                                />
                                            ) : (
                                                e.cod || '-'
                                            )}
                                        </td>

                                        {/* NOMBRE CLIENTE */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'nombre_cliente' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'nombre_cliente', e.nombre_cliente)}
                                            style={{ position: 'sticky', left: '80px', zIndex: 5, width: '220px', background: 'var(--sticky-col-bg, #0f172a)', padding: editingCell?.id === e.id && editingCell?.field === 'nombre_cliente' ? '3px' : '14px', fontWeight: 'bold', borderRight: '2px solid #3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title="Clic para editar Nombre"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'nombre_cliente' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'nombre_cliente')}
                                                    onBlur={ev => handleSaveCell(e, 'nombre_cliente', ev.target.value)}
                                                />
                                            ) : (
                                                e.nombre_cliente || '-'
                                            )}
                                        </td>

                                        {/* CONTACTO */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'contacto' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'contacto', e.contacto)}
                                            style={{ width: '130px', padding: editingCell?.id === e.id && editingCell?.field === 'contacto' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title="Clic para editar Contacto"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'contacto' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'contacto')}
                                                    onBlur={ev => handleSaveCell(e, 'contacto', ev.target.value)}
                                                />
                                            ) : (
                                                e.contacto || '-'
                                            )}
                                        </td>

                                        {/* PROVEEDOR */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'proveedor' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'proveedor', e.proveedor)}
                                            style={{ width: '130px', padding: editingCell?.id === e.id && editingCell?.field === 'proveedor' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title="Clic para editar Proveedor"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'proveedor' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'proveedor')}
                                                    onBlur={ev => handleSaveCell(e, 'proveedor', ev.target.value)}
                                                />
                                            ) : (
                                                e.proveedor || '-'
                                            )}
                                        </td>

                                        {/* USUARIO */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'usuario' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'usuario', e.usuario)}
                                            style={{ width: '130px', padding: editingCell?.id === e.id && editingCell?.field === 'usuario' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title="Clic para editar Usuario"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'usuario' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'usuario')}
                                                    onBlur={ev => handleSaveCell(e, 'usuario', ev.target.value)}
                                                />
                                            ) : (
                                                e.usuario || '-'
                                            )}
                                        </td>

                                        {/* CONTRASEÑA */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'contrasena' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'contrasena', e.contrasena)}
                                            style={{ width: '130px', padding: editingCell?.id === e.id && editingCell?.field === 'contrasena' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title="Clic para editar Contraseña"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'contrasena' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'contrasena')}
                                                    onBlur={ev => handleSaveCell(e, 'contrasena', ev.target.value)}
                                                />
                                            ) : (
                                                e.contrasena || '-'
                                            )}
                                        </td>

                                        {/* CUENTAS */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'cuentas' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'cuentas', e.cuentas)}
                                            style={{ width: '80px', padding: editingCell?.id === e.id && editingCell?.field === 'cuentas' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}
                                            title="Clic para editar Cuentas"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'cuentas' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    style={{ ...inlineInputStyle, textAlign: 'center' }}
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'cuentas')}
                                                    onBlur={ev => handleSaveCell(e, 'cuentas', ev.target.value)}
                                                />
                                            ) : (
                                                e.cuentas || '1'
                                            )}
                                        </td>

                                        {/* MAC SMART ONE */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'mac_smart_one' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'mac_smart_one', e.mac_smart_one)}
                                            style={{ width: '160px', padding: editingCell?.id === e.id && editingCell?.field === 'mac_smart_one' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title="Clic para editar MAC Smart One"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'mac_smart_one' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'mac_smart_one')}
                                                    onBlur={ev => handleSaveCell(e, 'mac_smart_one', ev.target.value)}
                                                />
                                            ) : (
                                                e.mac_smart_one || '-'
                                            )}
                                        </td>

                                        {/* OBSERVACIONES */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'observaciones' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'observaciones', e.observaciones)}
                                            style={{ width: '180px', padding: editingCell?.id === e.id && editingCell?.field === 'observaciones' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title={e.observaciones || "Clic para editar Observaciones"}
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'observaciones' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="inline-cell-input"
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'observaciones')}
                                                    onBlur={ev => handleSaveCell(e, 'observaciones', ev.target.value)}
                                                />
                                            ) : (
                                                e.observaciones || '-'
                                            )}
                                        </td>

                                        {/* VALOR */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'valor' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'valor', e.valor)}
                                            style={{ width: '130px', padding: editingCell?.id === e.id && editingCell?.field === 'valor' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold' }}
                                            title="Clic para editar Valor Mensual"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'valor' ? (
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    step="0.01"
                                                    className="inline-cell-input"
                                                    style={{ ...inlineInputStyle, fontWeight: 'bold', color: '#60a5fa' }}
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'valor')}
                                                    onBlur={ev => handleSaveCell(e, 'valor', ev.target.value)}
                                                />
                                            ) : (
                                                <span style={{ color: '#60a5fa' }}>${parseFloat(e.valor || 0).toFixed(2)}</span>
                                            )}
                                        </td>

                                        {/* ESTADO */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'estado' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'estado', e.estado)}
                                            style={{ width: '120px', padding: editingCell?.id === e.id && editingCell?.field === 'estado' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title="Clic para cambiar Estado"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'estado' ? (
                                                <select
                                                    autoFocus
                                                    className="inline-cell-select"
                                                    value={tempValue || '30 DÍAS'}
                                                    onChange={ev => handleSaveCell(e, 'estado', ev.target.value)}
                                                    onBlur={handleCancelEdit}
                                                >
                                                    {estadoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    background: e.estado === '30 DÍAS' ? 'rgba(59, 130, 246, 0.15)' : (e.estado === 'FIJO' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                                                    color: e.estado === '30 DÍAS' ? '#60a5fa' : (e.estado === 'FIJO' ? '#34d399' : '#e2e8f0'),
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    {e.estado || '30 DÍAS'}
                                                </span>
                                            )}
                                        </td>

                                        {/* SALDO (GLOBAL / NETO) */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'saldo' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'saldo', debeVal)}
                                            style={{ 
                                                width: '120px',
                                                padding: editingCell?.id === e.id && editingCell?.field === 'saldo' ? '3px' : '14px', 
                                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                                color: debeVal > 0 ? '#f87171' : (debeVal < 0 ? '#34d399' : '#94a3b8'),
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                background: debeVal < 0 ? 'rgba(52, 211, 153, 0.08)' : (debeVal > 0 ? 'rgba(248, 113, 113, 0.05)' : 'transparent')
                                            }} 
                                            title={debeVal < 0 ? `Excedente a favor: $${Math.abs(debeVal).toFixed(2)} (Clic para editar)` : 'Clic para editar Saldo'}
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'saldo' ? (
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    step="0.01"
                                                    className="inline-cell-input"
                                                    style={{ ...inlineInputStyle, textAlign: 'center', fontWeight: 'bold' }}
                                                    value={tempValue}
                                                    onChange={ev => setTempValue(ev.target.value)}
                                                    onKeyDown={ev => handleKeyDown(ev, e, 'saldo')}
                                                    onBlur={ev => handleSaveCell(e, 'saldo', ev.target.value)}
                                                />
                                            ) : (
                                                <>
                                                    ${debeVal.toFixed(2)}
                                                    {debeVal < 0 && (
                                                        <span style={{ fontSize: '0.65rem', display: 'block', color: '#34d399', fontWeight: 'normal' }}>
                                                            A Favor
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </td>

                                        {/* ACTIVO */}
                                        <td 
                                            className={`editable-td ${editingCell?.id === e.id && editingCell?.field === 'activo' ? 'editable-td-active' : ''}`}
                                            onClick={() => handleStartEdit(e, 'activo', e.activo)}
                                            style={{ width: '100px', padding: editingCell?.id === e.id && editingCell?.field === 'activo' ? '3px' : '14px', borderRight: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}
                                            title="Clic para cambiar Activo (SI/NO)"
                                        >
                                            {editingCell?.id === e.id && editingCell?.field === 'activo' ? (
                                                <select
                                                    autoFocus
                                                    className="inline-cell-select"
                                                    value={tempValue || 'SI'}
                                                    onChange={ev => handleSaveCell(e, 'activo', ev.target.value)}
                                                    onBlur={handleCancelEdit}
                                                >
                                                    {activoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (
                                                <span style={{ 
                                                    fontWeight: 'bold', 
                                                    color: e.activo === 'SI' ? '#34d399' : '#f87171',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: e.activo === 'SI' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)'
                                                }}>
                                                    {e.activo || 'SI'}
                                                </span>
                                            )}
                                        </td>

                                        {/* ACCIONES */}
                                        <td style={{ width: '120px', padding: '14px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button className="btn" onClick={() => handleEdit(e)} title="Editar en modal completo" style={{ padding: '6px', minWidth: 'auto', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button className="btn" onClick={() => handleOpenPago(e)} title="Cobrar rápido" style={{ padding: '6px', minWidth: 'auto', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a4.5 4.5 0 1 0 0 9h5a4.5 4.5 0 1 1 0 9H6"></path></svg>
                                                </button>
                                                <button className="btn" onClick={() => handleDelete(e.id)} title="Eliminar servicio" style={{ padding: '6px', minWidth: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </div>
                                        </td>

                                        {/* MESES */}
                                        {displayMonths.map((m, mIdx) => {
                                            const l = m.toLowerCase();
                                            const pagoMes = parseFloat(e[l + '_pago'] || 0);
                                            const saldoAMostrar = getMonthSaldo(e, mIdx);
                                            const hasPaid = pagoMes > 0;
                                            const isPriorToIngreso = mIdx < startMonthIdx && !hasPaid && !e[l + '_factura'] && (saldoAMostrar === 0);

                                            const isExcedente = saldoAMostrar < 0;
                                            const isDeuda = saldoAMostrar > 0;

                                            return (
                                                <React.Fragment key={m}>
                                                    {/* Factura */}
                                                    <td 
                                                        className={`editable-td ${editingCell?.id === e.id && editingCell?.field === `${l}_factura` ? 'editable-td-active' : ''}`}
                                                        onClick={() => handleStartEdit(e, `${l}_factura`, e[`${l}_factura`])}
                                                        style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: editingCell?.id === e.id && editingCell?.field === `${l}_factura` ? '2px' : '8px', fontSize: '0.75rem', opacity: (!e[`${l}_factura`] && isPriorToIngreso) ? 0.4 : 1 }}
                                                        title={`Clic para editar Factura de ${m}`}
                                                    >
                                                        {editingCell?.id === e.id && editingCell?.field === `${l}_factura` ? (
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                className="inline-cell-input"
                                                                placeholder="Factura"
                                                                value={tempValue}
                                                                onChange={ev => setTempValue(ev.target.value)}
                                                                onKeyDown={ev => handleKeyDown(ev, e, `${l}_factura`)}
                                                                onBlur={ev => handleSaveCell(e, `${l}_factura`, ev.target.value)}
                                                            />
                                                        ) : (
                                                            e[l + '_factura'] || '-'
                                                        )}
                                                    </td>

                                                    {/* Fecha de Pago */}
                                                    <td 
                                                        className={`editable-td ${editingCell?.id === e.id && editingCell?.field === `${l}_fecha_pago` ? 'editable-td-active' : ''}`}
                                                        onClick={() => handleStartEdit(e, `${l}_fecha_pago`, e[`${l}_fecha_pago`])}
                                                        style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: editingCell?.id === e.id && editingCell?.field === `${l}_fecha_pago` ? '2px' : '8px', fontSize: '0.7rem', opacity: (!e[`${l}_fecha_pago`] && isPriorToIngreso) ? 0.4 : 0.85 }}
                                                        title={`Clic para editar Fecha de Pago de ${m}`}
                                                    >
                                                        {editingCell?.id === e.id && editingCell?.field === `${l}_fecha_pago` ? (
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                className="inline-cell-input"
                                                                placeholder="DD/MM/YYYY"
                                                                value={tempValue}
                                                                onChange={ev => setTempValue(ev.target.value)}
                                                                onKeyDown={ev => handleKeyDown(ev, e, `${l}_fecha_pago`)}
                                                                onBlur={ev => handleSaveCell(e, `${l}_fecha_pago`, ev.target.value)}
                                                            />
                                                        ) : (
                                                            e[l + '_fecha_pago'] ? formatToDMY(e[l + '_fecha_pago']) : '-'
                                                        )}
                                                    </td>

                                                    {/* Monto Pago */}
                                                    <td 
                                                        className={`editable-td ${editingCell?.id === e.id && editingCell?.field === `${l}_pago` ? 'editable-td-active' : ''}`}
                                                        onClick={() => handleStartEdit(e, `${l}_pago`, e[`${l}_pago`])}
                                                        style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: editingCell?.id === e.id && editingCell?.field === `${l}_pago` ? '2px' : '8px', color: '#10b981', fontWeight: 'bold', textAlign: 'center', opacity: (!hasPaid && isPriorToIngreso) ? 0.4 : 1 }}
                                                        title={`Clic para registrar Pago de ${m} (Afecta Balance y Finanzas)`}
                                                    >
                                                        {editingCell?.id === e.id && editingCell?.field === `${l}_pago` ? (
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                step="0.01"
                                                                className="inline-cell-input"
                                                                style={{ ...inlineInputStyle, textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}
                                                                placeholder="0.00"
                                                                value={tempValue}
                                                                onChange={ev => setTempValue(ev.target.value)}
                                                                onKeyDown={ev => handleKeyDown(ev, e, `${l}_pago`)}
                                                                onBlur={ev => handleSaveCell(e, `${l}_pago`, ev.target.value)}
                                                            />
                                                        ) : (
                                                            hasPaid ? `$${pagoMes.toFixed(2)}` : '-'
                                                        )}
                                                    </td>

                                                    {/* Banco / Método */}
                                                    <td 
                                                        className={`editable-td ${editingCell?.id === e.id && editingCell?.field === `${l}_banco` ? 'editable-td-active' : ''}`}
                                                        onClick={() => handleStartEdit(e, `${l}_banco`, e[`${l}_banco`])}
                                                        style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: editingCell?.id === e.id && editingCell?.field === `${l}_banco` ? '2px' : '8px', fontSize: '0.75rem', opacity: (!e[`${l}_banco`] && isPriorToIngreso) ? 0.4 : 1 }}
                                                        title={`Clic para cambiar Banco de ${m}`}
                                                    >
                                                        {editingCell?.id === e.id && editingCell?.field === `${l}_banco` ? (
                                                            <select
                                                                autoFocus
                                                                className="inline-cell-select"
                                                                value={tempValue || 'EFECTIVO'}
                                                                onChange={ev => handleSaveCell(e, `${l}_banco`, ev.target.value)}
                                                                onBlur={handleCancelEdit}
                                                            >
                                                                <option value="">-- Banco --</option>
                                                                {allBankOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        ) : (
                                                            e[l + '_banco'] || '-'
                                                        )}
                                                    </td>

                                                    {/* Ref / COD */}
                                                    <td 
                                                        className={`editable-td ${editingCell?.id === e.id && editingCell?.field === `${l}_cod` ? 'editable-td-active' : ''}`}
                                                        onClick={() => handleStartEdit(e, `${l}_cod`, e[`${l}_cod`])}
                                                        style={{ width: '100px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: editingCell?.id === e.id && editingCell?.field === `${l}_cod` ? '2px' : '8px', fontSize: '0.7rem', opacity: (!e[`${l}_cod`] && isPriorToIngreso) ? 0.4 : 1 }}
                                                        title={`Clic para editar Referencia de ${m}`}
                                                    >
                                                        {editingCell?.id === e.id && editingCell?.field === `${l}_cod` ? (
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                className="inline-cell-input"
                                                                placeholder="Ref"
                                                                value={tempValue}
                                                                onChange={ev => setTempValue(ev.target.value)}
                                                                onKeyDown={ev => handleKeyDown(ev, e, `${l}_cod`)}
                                                                onBlur={ev => handleSaveCell(e, `${l}_cod`, ev.target.value)}
                                                            />
                                                        ) : (
                                                            e[l + '_cod'] || '-'
                                                        )}
                                                    </td>

                                                    {/* Saldo de este mes */}
                                                    <td 
                                                        className={`editable-td ${editingCell?.id === e.id && editingCell?.field === `${l}_saldo` ? 'editable-td-active' : ''}`}
                                                        onClick={() => handleStartEdit(e, `${l}_saldo`, saldoAMostrar)}
                                                        style={{ 
                                                            width: '100px', 
                                                            borderLeft: '1px solid rgba(255,255,255,0.05)', 
                                                            padding: editingCell?.id === e.id && editingCell?.field === `${l}_saldo` ? '2px' : '8px', 
                                                            color: isDeuda ? '#f87171' : (isExcedente ? '#34d399' : '#94a3b8'), 
                                                            fontWeight: 'bold', 
                                                            textAlign: 'center',
                                                            background: isExcedente ? 'rgba(52, 211, 153, 0.08)' : (isDeuda ? 'rgba(248, 113, 113, 0.05)' : 'transparent'),
                                                            opacity: (saldoAMostrar === 0 && isPriorToIngreso) ? 0.4 : 1
                                                        }} 
                                                        title={isExcedente ? `Excedente a favor: $${Math.abs(saldoAMostrar).toFixed(2)} (Clic para editar)` : `Clic para editar Saldo de ${m}`}
                                                    >
                                                        {editingCell?.id === e.id && editingCell?.field === `${l}_saldo` ? (
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                step="0.01"
                                                                className="inline-cell-input"
                                                                style={{ ...inlineInputStyle, textAlign: 'center', fontWeight: 'bold' }}
                                                                placeholder="0.00"
                                                                value={tempValue}
                                                                onChange={ev => setTempValue(ev.target.value)}
                                                                onKeyDown={ev => handleKeyDown(ev, e, `${l}_saldo`)}
                                                                onBlur={ev => handleSaveCell(e, `${l}_saldo`, ev.target.value)}
                                                            />
                                                        ) : (
                                                            <>
                                                                ${saldoAMostrar.toFixed(2)}
                                                                {isExcedente && (
                                                                    <span style={{ fontSize: '0.62rem', display: 'block', color: '#34d399', fontWeight: 'normal' }}>
                                                                        Excedente
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL TABS */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(2, 6, 23, 0.95)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card glass" style={{ width: '100%', maxWidth: '900px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="page-header" style={{ marginBottom: '24px' }}>
                            <div className="page-header-info">
                                <h2 style={{ fontWeight: '900', margin: 0 }}>{isEditing ? 'Editar' : 'Registrar'} Servicio</h2>
                            </div>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ minWidth: 'auto', padding: '4px 12px', fontSize: '1.5rem' }}>&times;</button>
                        </div>

                        {/* TABS SELECTOR */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto', paddingBottom: '4px' }}>
                            <button 
                                onClick={() => setActiveTab('general')}
                                style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'general' ? '2px solid #3b82f6' : 'none', color: activeTab === 'general' ? '#3b82f6' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                DATOS GENERALES
                            </button>
                            <button 
                                onClick={() => setActiveTab('pagos')}
                                style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'pagos' ? '2px solid #3b82f6' : 'none', color: activeTab === 'pagos' ? '#3b82f6' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                PAGOS MENSUALES
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {activeTab === 'general' ? (
                                <div className="grid-responsive">
                                    <div className="form-group">
                                        <label className="label">CÓDIGO (COD)</label>
                                        <input className="input" name="cod" value={formData.cod} disabled style={{ background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed' }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">PROVEEDOR</label>
                                        <input className="input" name="proveedor" value={formData.proveedor} onChange={e => setFormData({ ...formData, proveedor: e.target.value })} />
                                    </div>
                                    <div className="form-group grid-span-2">
                                        <label className="label">NOMBRE DEL CLIENTE</label>
                                        <input className="input" name="nombre_cliente" value={formData.nombre_cliente} onChange={e => setFormData({ ...formData, nombre_cliente: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">CONTACTO / CELULAR</label>
                                        <input className="input" name="contacto" value={formData.contacto} onChange={e => setFormData({ ...formData, contacto: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">USUARIO</label>
                                        <input className="input" name="usuario" value={formData.usuario} onChange={e => setFormData({ ...formData, usuario: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">CONTRASEÑA</label>
                                        <input className="input" type="text" name="contrasena" value={formData.contrasena} onChange={e => setFormData({ ...formData, contrasena: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">CUENTAS</label>
                                        <input className="input" name="cuentas" value={formData.cuentas} onChange={e => setFormData({ ...formData, cuentas: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">MAC SMART ONE</label>
                                        <input className="input" name="mac_smart_one" value={formData.mac_smart_one} onChange={e => setFormData({ ...formData, mac_smart_one: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">VALOR MENSUAL ($)</label>
                                        <input className="input" type="number" step="0.01" name="valor" value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">ESTADO</label>
                                        <select className="input" name="estado" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} style={{ background: '#1e293b' }}>
                                            <option value="30 DÍAS">30 DÍAS</option>
                                            <option value="INFINITO">INFINITO</option>
                                            <option value="FIJO">FIJO</option>
                                            <option value="SEMIFIJO">SEMIFIJO</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">ACTIVO (SI/NO)</label>
                                        <select className="input" name="activo" value={formData.activo} onChange={e => setFormData({ ...formData, activo: e.target.value })} style={{ background: '#1e293b' }}>
                                            <option value="SI">SÍ</option>
                                            <option value="NO">NO</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">FECHA DE INGRESO</label>
                                        <input className="input" type="date" name="fecha_ingreso" value={toISODate(formData.fecha_ingreso)} onChange={e => setFormData({ ...formData, fecha_ingreso: e.target.value })} />
                                    </div>
                                    <div className="form-group grid-span-2">
                                        <label className="label">OBSERVACIONES</label>
                                        <textarea className="input" name="observaciones" value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} rows="3" style={{ resize: 'none' }}></textarea>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {filteredMonths.map(m => {
                                        const l = m.toLowerCase();
                                        return (
                                            <div key={m} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <h4 style={{ margin: '0 0 15px 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '0.9rem' }}>{m}</h4>
                                                <div className="grid-responsive" style={{ gap: '15px' }}>
                                                    <div>
                                                        <label className="label">Factura</label>
                                                        <input className="input" value={formData[`${l}_factura`]} onChange={e => setFormData({...formData, [`${l}_factura`]: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <label className="label">Fecha Pago</label>
                                                        <input className="input" value={formData[`${l}_fecha_pago`]} onChange={e => setFormData({...formData, [`${l}_fecha_pago`]: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <label className="label">Monto Pago ($)</label>
                                                        <input 
                                                            className="input" 
                                                            type="number" 
                                                            step="0.01" 
                                                            value={formData[`${l}_pago`]} 
                                                            onChange={e => handleModalPagoChange(l, e.target.value)} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="label">Banco/Método</label>
                                                        <input className="input" value={formData[`${l}_banco`]} onChange={e => setFormData({...formData, [`${l}_banco`]: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <label className="label">COD Referencia</label>
                                                        <input className="input" value={formData[`${l}_cod`]} onChange={e => setFormData({...formData, [`${l}_cod`]: e.target.value})} />
                                                    </div>
                                                    <div>
                                                        <label className="label">Saldo Restante ($)</label>
                                                        <input 
                                                            className="input" 
                                                            type="number" 
                                                            step="0.01" 
                                                            value={formData[`${l}_saldo`]} 
                                                            onChange={e => handleModalSaldoChange(l, e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '30px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Registrando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Servicio')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PAGO RÁPIDO */}
            {showPagoModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(2, 6, 23, 0.95)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card glass" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
                        <h2 style={{ marginBottom: '4px', fontWeight: '900', color: '#34d399' }}>💳 Registrar Pago Extra</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '0.9rem' }}>
                            Cliente: <b>{selectedForPago?.nombre_cliente}</b> ({selectedForPago?.cod})
                        </p>

                        <div style={{ 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            border: '1px solid rgba(59, 130, 246, 0.2)', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            marginBottom: '20px',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>VALOR MENSUAL</span>
                                <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>${parseFloat(selectedForPago?.valor || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>
                                    {calculateDebe(selectedForPago) < 0 ? 'EXCEDENTE A FAVOR' : 'DEUDA ACUMULADA'}
                                </span>
                                <span style={{ fontWeight: 'bold', color: calculateDebe(selectedForPago) > 0 ? '#f87171' : (calculateDebe(selectedForPago) < 0 ? '#34d399' : '#94a3b8') }}>
                                    ${calculateDebe(selectedForPago).toFixed(2)} {calculateDebe(selectedForPago) < 0 ? '(A favor)' : ''}
                                </span>
                            </div>
                        </div>

                        <div className="grid-responsive" style={{ gap: '16px' }}>
                            <div className="form-group">
                                <label className="label">Mes de inicio del pago</label>
                                <select className="input" value={pagoData.mes} onChange={e => setPagoData({...pagoData, mes: e.target.value})} style={{ background: '#1e293b' }}>
                                    {months.map(m => <option key={m} value={m.toUpperCase()}>{m.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Monto a pagar ($)</label>
                                <input className="input" type="number" step="0.01" value={pagoData.monto} onChange={e => setPagoData({...pagoData, monto: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="label">Banco / Método</label>
                                <select className="input" value={pagoData.metodo} onChange={e => setPagoData({...pagoData, metodo: e.target.value})} style={{ background: '#1e293b' }}>
                                    {Array.from(new Set(['EFECTIVO', ...(bancosList || []).map(b => (b.nombre || '').trim()).filter(n => n && n.toUpperCase() !== 'EFECTIVO')])).map(metodo => (
                                        <option key={metodo} value={metodo}>{metodo}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Factura #</label>
                                <input className="input" placeholder="Ej: 001-001-0001" value={pagoData.factura} onChange={e => setPagoData({...pagoData, factura: e.target.value})} />
                            </div>
                            <div className="form-group grid-span-2">
                                <label className="label">Referencia / Comprobante (Opcional)</label>
                                <input className="input" placeholder="Referencia bancaria" value={pagoData.referencia} onChange={e => setPagoData({...pagoData, referencia: e.target.value})} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowPagoModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={handleConfirmPago}>Confirmar Pago</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: SUBIR EXCEL EXTRAS (COMPLETAMENTE SEPARADO) */}
            {showUploadModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000, padding: '20px'
                }}>
                    <div className="glass-card glass" style={{ width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.8rem' }}>📤</span>
                            <h2 style={{ margin: 0, fontWeight: '900', color: '#818cf8' }}>Importar Excel Extras</h2>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
                            Carga masiva de base de datos de clientes extras (Extra General / Plataforma).
                        </p>

                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '20px',
                            fontSize: '0.85rem',
                            lineHeight: '1.5',
                            color: '#c7d2fe'
                        }}>
                            🔒 <b>Sección Totalmente Independiente:</b> Esta subida es <b>exclusiva</b> para Extras y no modifica ni altera en lo absoluto la base de datos principal de clientes. Cuadra automáticamente precios, estados y cuadrícula mensual (Enero a Diciembre).
                        </div>

                        <form onSubmit={handleUploadExcel}>
                            <div className="form-group" style={{ marginBottom: '18px' }}>
                                <label className="label" style={{ fontWeight: 'bold' }}>Archivo Excel (.xlsx o .xls)</label>
                                <input
                                    id="excel-extras-input"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                    className="input"
                                    style={{
                                        padding: '10px',
                                        background: 'rgba(30, 41, 59, 0.8)',
                                        border: '1px dashed #6366f1',
                                        cursor: 'pointer'
                                    }}
                                />
                                {uploadFile && (
                                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#34d399', fontWeight: 'bold' }}>
                                        ✓ Seleccionado: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label className="label" style={{ fontWeight: 'bold' }}>Modo de Importación</label>
                                <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input
                                            type="radio"
                                            name="modo"
                                            value="merge"
                                            checked={uploadModo === 'merge'}
                                            onChange={() => setUploadModo('merge')}
                                        />
                                        <span>Actualizar y fusionar</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input
                                            type="radio"
                                            name="modo"
                                            value="replace"
                                            checked={uploadModo === 'replace'}
                                            onChange={() => setUploadModo('replace')}
                                        />
                                        <span style={{ color: '#f87171' }}>Reemplazar completa</span>
                                    </label>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                                    {uploadModo === 'merge' 
                                        ? 'Conserva los datos actuales y actualiza/agrega los clientes del archivo.' 
                                        : '⚠️ Borra los clientes extras actuales y carga desde cero con este archivo.'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
                                    disabled={uploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={uploading || !uploadFile}
                                    style={{
                                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {uploading ? (
                                        <>
                                            <span style={{ display: 'inline-block', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}></span>
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🚀</span> Importar Base de Extras
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtrasGeneral;
