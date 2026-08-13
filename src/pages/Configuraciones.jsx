import React, { useState, useEffect } from 'react';
import { configuracionService, oltService, libreqosService } from '../services/api';
import { motion } from 'framer-motion';

const Configuraciones = () => {

    // OLT States
    const [oltConfigs, setOltConfigs] = useState([]);
    const [newOlt, setNewOlt] = useState({ nombre: '', host: '', port: 22, username: 'root', password: 'admin', nodo_asociado: '', device_type: 'huawei' });
    const [isEditingOlt, setIsEditingOlt] = useState(null);
    const [oltSaving, setOltSaving] = useState(false);
    const [oltTestingId, setOltTestingId] = useState(null);
    const [oltTestingRaw, setOltTestingRaw] = useState(false);

    // LibreQoS States
    const [lqServers, setLqServers] = useState([]);
    const [lqJobs, setLqJobs] = useState([]);
    const [lqJobsTab, setLqJobsTab] = useState('pending');
    const [lqSaving, setLqSaving] = useState(false);
    const [lqTesting, setLqTesting] = useState(null);
    const [lqSyncing, setLqSyncing] = useState(null);
    const [lqEditing, setLqEditing] = useState(null);
    const [selectedOltForLq, setSelectedOltForLq] = useState(null);
    const [showLqModal, setShowLqModal] = useState(false);
    const [lqForm, setLqForm] = useState({
        name: '', host: '', ssh_port: 22, username: 'root',
        auth_method: 'password', password: '', private_key_path: '', passphrase: '',
        enabled: true, ssh_timeout: 30, ssh_retries: 3, max_concurrent_jobs: 5,
        libreqos_path: '/opt/libreqos',
        libreqos_apply_cmd: 'cd /opt/libreqos && sudo python3 src/rust_integration/generate_and_apply.sh',
        libreqos_list_cmd: 'sudo python3 /opt/libreqos/src/rust_integration/ispConfig.py --list-shaped-json',
        suspension_download_mbps: 1, suspension_upload_mbps: 1
    });

    // MikroTik Configuration Modal States
    const [selectedOltForMt, setSelectedOltForMt] = useState(null);
    const [showMtModal, setShowMtModal] = useState(false);
    const [mtConfig, setMtConfig] = useState({ host: '', port: 8728, username: '', password: '' });
    const [mtSaving, setMtSaving] = useState(false);
    const [mtTesting, setMtTesting] = useState(false);

    // States for data
    const [nodos, setNodos] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [puertos, setPuertos] = useState([]);
    const [parroquias, setParroquias] = useState([]);
    const [cajasNap, setCajasNap] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [finanzasBase, setFinanzasBase] = useState({ caja_chica: '0.00', pichincha: '0.00', jep: '0.00' });

    // Form states
    const [newNodo, setNewNodo] = useState({ nombre: '', base_ip: '' });
    const [newPlan, setNewPlan] = useState({ nombre: '', megas: '', precio: '', pantallas: 1 });
    const [newBanco, setNewBanco] = useState({ nombre: '' });
    const [newPuerto, setNewPuerto] = useState({ numero: '', nodo_id: '', limite_ip: '', limite_device: '', limite_service_port: '' });
    const [searchPuerto, setSearchPuerto] = useState('');
    const [newUsuario, setNewUsuario] = useState({ username: '', password: '', rol: 'tecnico' });
    const [isEditingUser, setIsEditingUser] = useState(null);
    const [isEditingNodo, setIsEditingNodo] = useState(null);
    const [isEditingPlan, setIsEditingPlan] = useState(null);
    const [isEditingBanco, setIsEditingBanco] = useState(null);
    const [isEditingPuerto, setIsEditingPuerto] = useState(null);
    const [newParroquia, setNewParroquia] = useState({ nombre: '' });
    const [isEditingParroquia, setIsEditingParroquia] = useState(null);
    const [newCajaNap, setNewCajaNap] = useState({ nombre: '' });
    const [isEditingCajaNap, setIsEditingCajaNap] = useState(null);
    const [passwordDeleteClientes, setPasswordDeleteClientes] = useState('');
    const [diasPermanencia, setDiasPermanencia] = useState(7);
    const [diasSaving, setDiasSaving] = useState(false);

    const fetchData = async () => {
        const user = configuracionService.getCurrentUser();
        const isAdmin = user && (user.rol === 'administrador' || user.rol === 'admin');

        try {
            const [paRes, plRes, baRes, puRes, ppRes, finRes, cnRes, diasRes] = await Promise.all([
                configuracionService.getNodos().catch(e => ({ data: [] })),
                configuracionService.getPlanes().catch(e => ({ data: [] })),
                configuracionService.getBancos().catch(e => ({ data: [] })),
                configuracionService.getPuertos().catch(e => ({ data: [] })),
                configuracionService.getParroquias().catch(e => ({ data: [] })),
                configuracionService.getFinanzasBase().catch(e => ({ data: { caja_chica: 0, pichincha: 0, jep: 0 } })),
                configuracionService.getCajasNap().catch(e => ({ data: [] })),
                configuracionService.getDiasPermanencia().catch(e => ({ data: { dias: 7 } }))
            ]);
            if (diasRes.data?.dias) setDiasPermanencia(diasRes.data.dias);
            
            setNodos(paRes.data);
            setPlanes(plRes.data);
            setBancos(baRes.data);
            setPuertos(puRes.data);
            setParroquias(ppRes.data);
            setCajasNap(cnRes.data);

            // OLT configs (admin only)
            if (isAdmin) {
                try {
                    const oltRes = await oltService.listConfigs();
                    setOltConfigs(oltRes.data?.configs || []);
                } catch (e) {
                    console.warn('No se pudieron cargar las OLTs', e);
                }
            }
            
            if (finRes.data) {
                setFinanzasBase({
                    caja_chica: String(finRes.data.caja_chica),
                    pichincha: String(finRes.data.pichincha),
                    jep: String(finRes.data.jep)
                });
            }

            // Solo intentar traer usuarios si el rol es administrador
            if (isAdmin) {
                try {
                    const usRes = await configuracionService.getUsuarios();
                    setUsuarios(usRes.data);
                } catch (error) {
                    console.warn("No se pudieron cargar los usuarios (posible falta de permisos o sesión expirada)", error);
                }
            } else {
                setUsuarios([]); // Limpiar usuarios si no es admin
            }
        } catch (error) {
            console.error("Error fetching configuraciones generales", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto-refresh cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    // Cargar datos de LibreQoS cuando se entra a esa pestaña
    const [activeTab, setActiveTab] = useState('Nodos');
    useEffect(() => {
        if (activeTab === 'LibreQoS') fetchLqData();
    }, [activeTab]);

    const handleCreate = async (type) => {
        try {
            if (type === 'Nodos') {
                if (!newNodo.nombre?.trim() || !newNodo.base_ip?.trim()) return alert('Todos los campos son obligatorios');
                if (isEditingNodo) {
                    await configuracionService.actualizarNodo(isEditingNodo, newNodo);
                    alert('Nodo actualizado');
                } else {
                    await configuracionService.crearNodo(newNodo);
                    alert('Nodo creado');
                }
                setNewNodo({ nombre: '', base_ip: '' });
                setIsEditingNodo(null);
                fetchData();
            } else if (type === 'Planes') {
                if (!newPlan.nombre?.trim() || !newPlan.megas || !newPlan.precio) return alert('Todos los campos son obligatorios');
                const planData = { 
                    nombre: newPlan.nombre, 
                    megas: parseInt(newPlan.megas) || 0,
                    precio: parseFloat(newPlan.precio),
                    pantallas: parseInt(newPlan.pantallas) === 0 ? 0 : (parseInt(newPlan.pantallas) || 1)
                };
                if (isEditingPlan) {
                    await configuracionService.actualizarPlan(isEditingPlan, planData);
                    alert('Plan actualizado');
                } else {
                    await configuracionService.crearPlan(planData);
                    alert('Plan creado');
                }
                setNewPlan({ nombre: '', megas: '', precio: '', pantallas: 1 });
                setIsEditingPlan(null);
                fetchData();
            } else if (type === 'Bancos') {
                if (!newBanco.nombre?.trim()) return alert('El nombre es obligatorio');
                if (isEditingBanco) {
                    await configuracionService.actualizarBanco(isEditingBanco, newBanco);
                    alert('Banco actualizado');
                } else {
                    await configuracionService.crearBanco(newBanco);
                    alert('Banco creado');
                }
                setNewBanco({ nombre: '' });
                setIsEditingBanco(null);
                fetchData();
            } else if (type === 'Puertos') {
                if (!newPuerto.numero || !newPuerto.nodo_id) return alert('Llene todos los campos');

                const nombreEsperado = 'Puerto ' + newPuerto.numero;
                const nodoId = parseInt(newPuerto.nodo_id);

                if (isEditingPuerto) {
                    await configuracionService.actualizarPuerto(isEditingPuerto, { nombre: nombreEsperado, nodo_id: nodoId, limite_ip: newPuerto.limite_ip, limite_device: newPuerto.limite_device, limite_service_port: newPuerto.limite_service_port });
                    alert('Puerto actualizado');
                } else {
                    // Verificar si ya existe un puerto con ese número en esa zona
                    const existePuerto = puertos.some(p => p.nombre.toLowerCase() === nombreEsperado.toLowerCase() && p.nodo_id === nodoId);
                    if (existePuerto) {
                        return alert(`¡Error! El ${nombreEsperado} ya se encuentra registrado en esa zona.`);
                    }
                    await configuracionService.crearPuerto({ nombre: nombreEsperado, nodo_id: nodoId, limite_ip: newPuerto.limite_ip, limite_device: newPuerto.limite_device, limite_service_port: newPuerto.limite_service_port });
                    alert('Puerto creado');
                }
                setNewPuerto({ numero: '', nodo_id: '', limite_ip: '', limite_device: '', limite_service_port: '' });
                setIsEditingPuerto(null);
                fetchData();
            } else if (type === 'Usuarios') {
                if (!newUsuario.username || (!isEditingUser && !newUsuario.password)) return alert('Llene todos los campos');
                
                if (isEditingUser) {
                    await configuracionService.actualizarUsuario(isEditingUser, newUsuario);
                    alert('Usuario actualizado');
                } else {
                    await configuracionService.crearUsuario(newUsuario);
                    alert('Usuario creado');
                }
                setNewUsuario({ username: '', password: '', rol: 'tecnico' });
                setIsEditingUser(null);
                fetchData();
            } else if (type === 'Finanzas Base') {
                const fData = {
                    caja_chica: parseFloat(finanzasBase.caja_chica) || 0,
                    pichincha: parseFloat(finanzasBase.pichincha) || 0,
                    jep: parseFloat(finanzasBase.jep) || 0,
                };
                await configuracionService.actualizarFinanzasBase(fData);
                alert('Finanzas base actualizadas correctamente');
            } else if (type === 'Parroquias') {
                if (!newParroquia.nombre?.trim()) return alert('El nombre es obligatorio');
                if (isEditingParroquia) {
                    await configuracionService.actualizarParroquia(isEditingParroquia, newParroquia);
                    alert('Parroquia actualizada');
                } else {
                    await configuracionService.crearParroquia(newParroquia);
                    alert('Parroquia creada');
                }
                setNewParroquia({ nombre: '' });
                setIsEditingParroquia(null);
            } else if (type === 'Cajas NAP') {
                if (!newCajaNap.nombre?.trim()) return alert('El nombre es obligatorio');
                if (isEditingCajaNap) {
                    await configuracionService.actualizarCajaNap(isEditingCajaNap, newCajaNap);
                    alert('Caja NAP actualizada');
                } else {
                    await configuracionService.crearCajaNap(newCajaNap);
                    alert('Caja NAP creada');
                }
                setNewCajaNap({ nombre: '' });
                setIsEditingCajaNap(null);
            }
            fetchData();
        } catch (error) {
            alert('Error al procesar: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
        try {
            if (type === 'Nodos') await configuracionService.eliminarNodo(id);
            if (type === 'Planes') await configuracionService.eliminarPlan(id);
            if (type === 'Bancos') await configuracionService.eliminarBanco(id);
            if (type === 'Puertos') await configuracionService.eliminarPuerto(id);
            if (type === 'Usuarios') await configuracionService.eliminarUsuario(id);
            if (type === 'Parroquias') await configuracionService.eliminarParroquia(id);
            if (type === 'Cajas NAP') await configuracionService.eliminarCajaNap(id);
            fetchData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handleEditUser = (user) => {
        setIsEditingUser(user.id);
        setNewUsuario({ username: user.username, password: '', rol: user.rol });
        setActiveTab('Usuarios');
    };

    const handleEditNodo = (nod) => {
        setIsEditingNodo(nod.id);
        setNewNodo({ nombre: nod.nombre, base_ip: nod.base_ip });
        setActiveTab('Nodos');
    };

    const handleEditPlan = (plan) => {
        setIsEditingPlan(plan.id);
        setNewPlan({ nombre: plan.nombre, megas: plan.megas || '', precio: plan.precio, pantallas: plan.pantallas ?? 1 });
        setActiveTab('Planes');
    };

    const handleEditBanco = (banco) => {
        setIsEditingBanco(banco.id);
        setNewBanco({ nombre: banco.nombre });
        setActiveTab('Bancos');
    };

    const handleEditPuerto = (puerto) => {
        setIsEditingPuerto(puerto.id);
        const numeroMatch = puerto.nombre.match(/\d+/);
        setNewPuerto({ 
            numero: numeroMatch ? numeroMatch[0] : '', 
            nodo_id: puerto.nodo_id,
            limite_ip: puerto.limite_ip || '',
            limite_device: puerto.limite_device || '',
            limite_service_port: puerto.limite_service_port || ''
        });
        setActiveTab('Puertos');
    };

    const handleEditParroquia = (parr) => {
        setIsEditingParroquia(parr.id);
        setNewParroquia({ nombre: parr.nombre });
        setActiveTab('Parroquias');
    };

    const handleEditCajaNap = (caja) => {
        setIsEditingCajaNap(caja.id);
        setNewCajaNap({ nombre: caja.nombre, nodo_id: caja.nodo_id || null });
        setActiveTab('Cajas NAP');
    };

    // =========== OLT HANDLERS ===========
    const handleOltSave = async () => {
        if (!newOlt.nombre?.trim() || !newOlt.host?.trim()) return alert('Nombre y Host son obligatorios');
        setOltSaving(true);
        try {
            const params = {
                nombre: newOlt.nombre,
                host: newOlt.host,
                port: parseInt(newOlt.port) || 22,
                username: newOlt.username || 'root',
                password: newOlt.password || 'admin',
                nodo_asociado: newOlt.nodo_asociado || null,
                device_type: newOlt.device_type || 'huawei',
            };
            if (isEditingOlt) {
                await oltService.updateConfig(isEditingOlt, params);
                alert('OLT actualizada correctamente');
            } else {
                await oltService.createConfig(params);
                alert('OLT registrada correctamente');
            }
            setNewOlt({ nombre: '', host: '', port: 22, username: 'root', password: 'admin', nodo_asociado: '', device_type: 'huawei' });
            setIsEditingOlt(null);
            const oltRes = await oltService.listConfigs();
            setOltConfigs(oltRes.data?.configs || []);
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message));
        } finally {
            setOltSaving(false);
        }
    };

    const handleOltDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta OLT? Las tareas asociadas quedarán sin OLT.')) return;
        try {
            await oltService.deleteConfig(id);
            const oltRes = await oltService.listConfigs();
            setOltConfigs(oltRes.data?.configs || []);
        } catch (e) {
            alert('Error eliminando OLT: ' + (e.response?.data?.detail || e.message));
        }
    };

    const handleOltToggle = async (olt) => {
        try {
            await oltService.updateConfig(olt.id, { active: !olt.active });
            const oltRes = await oltService.listConfigs();
            setOltConfigs(oltRes.data?.configs || []);
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message));
        }
    };

    const handleOltEdit = (olt) => {
        setIsEditingOlt(olt.id);
        setNewOlt({
            nombre: olt.nombre,
            host: olt.host,
            port: olt.port,
            username: olt.username || 'root',
            password: '',
            nodo_asociado: olt.nodo_asociado || '',
            device_type: olt.device_type || 'huawei',
        });
        setActiveTab('OLTs Huawei');
    };

    const handleOltTestRaw = async () => {
        if (!newOlt.host?.trim()) return alert('El Host es obligatorio para probar la conexión');
        setOltTestingRaw(true);
        try {
            const res = await oltService.testRawConfig({
                host: newOlt.host,
                port: parseInt(newOlt.port) || 22,
                username: newOlt.username || 'root',
                password: newOlt.password || 'admin',
                device_type: newOlt.device_type || 'huawei'
            });
            if (res.data?.success) {
                alert(res.data.message);
            } else {
                alert('Fallo de conexión: ' + res.data?.message);
            }
        } catch (e) {
            alert('Error al probar conexión: ' + (e.response?.data?.detail || e.message));
        } finally {
            setOltTestingRaw(false);
        }
    };

    const handleOltTestExisting = async (id) => {
        setOltTestingId(id);
        try {
            const res = await oltService.testConfig(id);
            if (res.data?.success) {
                alert(res.data.message);
            } else {
                alert('Fallo de conexión: ' + res.data?.message);
            }
        } catch (e) {
            alert('Error al probar conexión: ' + (e.response?.data?.detail || e.message));
        } finally {
            setOltTestingId(null);
        }
    };

    // Funciones para configurar MikroTik
    const handleOpenMtModal = (olt) => {
        setSelectedOltForMt(olt);
        setMtConfig({
            host: olt.mikrotik_host || '',
            port: olt.mikrotik_port || 8728,
            username: olt.mikrotik_username || '',
            password: olt.mikrotik_password || ''
        });
        setShowMtModal(true);
    };

    const handleSaveMtConfig = async () => {
        if (!selectedOltForMt) return;
        setMtSaving(true);
        try {
            await oltService.updateMikrotikConfig(selectedOltForMt.id, {
                mikrotik_host: mtConfig.host || null,
                mikrotik_port: parseInt(mtConfig.port) || 8728,
                mikrotik_username: mtConfig.username || null,
                mikrotik_password: mtConfig.password || null
            });
            alert('Configuración de MikroTik guardada correctamente');
            setShowMtModal(false);
            // Volver a listar las OLTs para ver los cambios reflejados
            const oltRes = await oltService.listConfigs();
            setOltConfigs(oltRes.data?.configs || []);
        } catch (e) {
            alert('Error al guardar configuración de MikroTik: ' + (e.response?.data?.detail || e.message));
        } finally {
            setMtSaving(false);
        }
    };

    const handleTestMtConnection = async () => {
        if (!selectedOltForMt) return;
        setMtTesting(true);
        try {
            // Guardar cambios primero temporalmente en base de datos para que el backend use las credenciales correctas
            await oltService.updateMikrotikConfig(selectedOltForMt.id, {
                mikrotik_host: mtConfig.host || null,
                mikrotik_port: parseInt(mtConfig.port) || 8728,
                mikrotik_username: mtConfig.username || null,
                mikrotik_password: mtConfig.password || null
            });
            const res = await oltService.testMikrotikConfig(selectedOltForMt.id);
            if (res.data?.success) {
                alert(res.data.message || '¡Conexión a MikroTik Exitosa!');
            } else {
                alert('Fallo de conexión a MikroTik: ' + res.data?.message);
            }
        } catch (e) {
            alert('Error al conectar a MikroTik: ' + (e.response?.data?.detail || e.message));
        } finally {
            setMtTesting(false);
        }
    };
    // ======================================

    const tabs = ['Nodos', 'Parroquias', 'Cajas NAP', 'Planes', 'Bancos', 'Puertos', 'Usuarios', 'OLTs Huawei', 'Finanzas Base', 'Administrar', 'Eliminar Clientes'];

    const fetchLqData = async () => {
        const user = configuracionService.getCurrentUser();
        if (!user || !['administrador', 'admin', 'tecnico'].includes(user.rol)) return;
        try {
            const [sRes, jRes] = await Promise.all([
                libreqosService.listServers().catch(() => ({ data: [] })),
                libreqosService.listJobs().catch(() => ({ data: [] })),
            ]);
            setLqServers(Array.isArray(sRes.data) ? sRes.data : []);
            setLqJobs(Array.isArray(jRes.data) ? jRes.data : []);
        } catch (e) { console.warn('LibreQoS load error', e); }
    };

    const handleOpenLqModal = async (olt) => {
        setSelectedOltForLq(olt);
        setLqSaving(false);
        setLqTesting(null);
        setLqSyncing(null);

        let existingServer = null;
        try {
            const res = await libreqosService.listServers();
            const servers = Array.isArray(res.data) ? res.data : [];
            setLqServers(servers);
            if (olt.libreqos_server_id) {
                existingServer = servers.find(s => s.id === olt.libreqos_server_id);
            }
        } catch (e) {
            console.warn('Error listando servidores', e);
        }

        if (existingServer) {
            setLqForm({
                name: existingServer.name,
                host: existingServer.host,
                ssh_port: existingServer.ssh_port,
                username: existingServer.username,
                auth_method: existingServer.auth_method || 'password',
                password: '',
                private_key_path: existingServer.private_key_path || '',
                passphrase: '',
                enabled: existingServer.enabled,
                ssh_timeout: existingServer.ssh_timeout,
                ssh_retries: existingServer.ssh_retries,
                max_concurrent_jobs: existingServer.max_concurrent_jobs,
                libreqos_path: existingServer.libreqos_path,
                libreqos_apply_cmd: existingServer.libreqos_apply_cmd,
                libreqos_list_cmd: existingServer.libreqos_list_cmd,
                suspension_download_mbps: existingServer.suspension_download_mbps,
                suspension_upload_mbps: existingServer.suspension_upload_mbps
            });
        } else {
            setLqForm({
                name: `LibreQoS-${olt.nombre}`,
                host: '',
                ssh_port: 22,
                username: 'root',
                auth_method: 'password',
                password: '',
                private_key_path: '',
                passphrase: '',
                enabled: true,
                ssh_timeout: 30,
                ssh_retries: 3,
                max_concurrent_jobs: 5,
                libreqos_path: '/opt/libreqos',
                libreqos_apply_cmd: 'cd /opt/libreqos && sudo python3 src/rust_integration/generate_and_apply.sh',
                libreqos_list_cmd: 'sudo python3 /opt/libreqos/src/rust_integration/ispConfig.py --list-shaped-json',
                suspension_download_mbps: 1,
                suspension_upload_mbps: 1
            });
        }
        setShowLqModal(true);
    };

    const handleSaveLqConfig = async () => {
        if (!selectedOltForLq) return;
        if (!lqForm.name.trim() || !lqForm.host.trim()) {
            return alert('El nombre y el host de LibreQoS son obligatorios.');
        }
        setLqSaving(true);
        try {
            const payload = { ...lqForm, ssh_port: parseInt(lqForm.ssh_port) || 22 };
            let serverId = selectedOltForLq.libreqos_server_id;

            if (serverId) {
                await libreqosService.updateServer(serverId, payload);
            } else {
                const res = await libreqosService.createServer(payload);
                serverId = res.data.id;
                await oltService.updateConfig(selectedOltForLq.id, { libreqos_server_id: serverId });
            }

            alert('✅ Configuración de LibreQoS guardada y vinculada a la OLT.');
            setShowLqModal(false);
            const oltRes = await oltService.listConfigs();
            setOltConfigs(oltRes.data?.configs || []);
        } catch (e) {
            alert('Error al guardar configuración de LibreQoS: ' + (e.response?.data?.detail || e.message));
        } finally {
            setLqSaving(false);
        }
    };

    const handleTestLqConnection = async () => {
        if (!selectedOltForLq) return;
        let serverId = selectedOltForLq.libreqos_server_id;
        if (!serverId) {
            return alert('Por favor, guarde la configuración primero para poder probar la conexión.');
        }

        setLqTesting(serverId);
        try {
            const res = await libreqosService.testServer(serverId);
            alert(res.data?.success ? '✅ ' + res.data.message : '❌ ' + res.data?.message);
        } catch (e) {
            alert('Error de conexión: ' + (e.response?.data?.detail || e.message));
        } finally {
            setLqTesting(null);
        }
    };

    const handleSyncLqServer = async () => {
        if (!selectedOltForLq || !selectedOltForLq.libreqos_server_id) return;
        setLqSyncing(selectedOltForLq.libreqos_server_id);
        try {
            await libreqosService.syncServer(selectedOltForLq.libreqos_server_id);
            alert('🔄 Reconciliación manual de LibreQoS iniciada en segundo plano.');
        } catch (e) {
            alert('Error al iniciar sincronización: ' + (e.response?.data?.detail || e.message));
        } finally {
            setLqSyncing(null);
        }
    };

    const handleLqRetryJob = async (jobId) => {
        try {
            await libreqosService.retryJob(jobId);
            fetchLqData();
        } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)); }
    };

    const handleSaveDiasPermanencia = async () => {
        setDiasSaving(true);
        try {
            await configuracionService.setDiasPermanencia(diasPermanencia);
            alert('✅ Configuración guardada correctamente');
        } catch (error) {
            alert('Error al guardar: ' + (error.response?.data?.detail || error.message));
        } finally {
            setDiasSaving(false);
        }
    };

    const renderTable = (data, columns, type) => (
        <div className="table-container" style={{ marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        {columns.map(col => (
                            <th key={col} style={{ padding: '12px' }}>
                                {col === 'nodo_id' ? 'Nodo / Zona' : col.toUpperCase()}
                            </th>
                        ))}
                        <th style={{ padding: '12px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {columns.map(col => (
                                <td key={col} style={{ padding: '12px' }}>
                                    {col === 'nodo_id' 
                                        ? (nodos.find(p => p.id === row[col])?.nombre || <span style={{ color: '#ef4444' }}>⚠️ SIN ASIGNAR</span>) 
                                        : row[col]}
                                </td>
                            ))}
                            <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                {type === 'Usuarios' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditUser(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Nodos' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditNodo(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Parroquias' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditParroquia(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Cajas NAP' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditCajaNap(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Planes' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditPlan(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Bancos' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditBanco(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                {type === 'Puertos' && (
                                    <button className="btn btn-secondary" onClick={() => handleEditPuerto(row)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                )}
                                <button className="btn btn-secondary" onClick={() => handleDelete(type, row.id)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#ef444455', color: '#fca5a5', border: 'none' }}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan={columns.length + 1} style={{ padding: '12px', textAlign: 'center' }}>No hay registros</td></tr>}
                </tbody>
            </table>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card glass" style={{ minHeight: '80vh' }}>
            <div className="page-header">
                <div className="page-header-info">
                    <h1 style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Configuraciones del Sistema
                    </h1>
                </div>
            </div>

            <div className="page-actions" style={{ gap: '10px', marginBottom: '20px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ padding: '8px 16px' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
                {activeTab === 'Nodos' && (
                    <div>
                        <h3>Añadir Nodo</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre</label>
                                <input className="input" style={{ margin: 0 }} value={newNodo.nombre} onChange={e => setNewNodo({ ...newNodo, nombre: e.target.value.toUpperCase() })} placeholder="Ej. SAYAUSÍ" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Base IP</label>
                                <input className="input" style={{ margin: 0 }} value={newNodo.base_ip} onChange={e => setNewNodo({ ...newNodo, base_ip: e.target.value })} placeholder="Ej. 172.16" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Nodos')}>{isEditingNodo ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingNodo && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingNodo(null); setNewNodo({ nombre: '', base_ip: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(nodos, ['id', 'nombre', 'base_ip'], 'Nodos')}
                    </div>
                )}

                {activeTab === 'Parroquias' && (
                    <div>
                        <h3>Añadir Parroquia</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre de la Parroquia</label>
                                <input className="input" style={{ margin: 0 }} value={newParroquia.nombre} onChange={e => setNewParroquia({ nombre: e.target.value.toUpperCase() })} placeholder="Ej. BAÑOS" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Parroquias')}>{isEditingParroquia ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingParroquia && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingParroquia(null); setNewParroquia({ nombre: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(parroquias, ['id', 'nombre'], 'Parroquias')}
                    </div>
                )}

                {activeTab === 'Cajas NAP' && (
                    <div>
                        <h3>Añadir Caja NAP</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre de la Caja NAP</label>
                                <input className="input" style={{ margin: 0 }} value={newCajaNap.nombre} onChange={e => setNewCajaNap({ ...newCajaNap, nombre: e.target.value.toUpperCase() })} placeholder="Ej. CAJA 1804" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nodo / Zona</label>
                                <select
                                    className="input"
                                    style={{ margin: 0, background: 'rgba(255,255,255,0.03)', color: 'var(--text-main)' }}
                                    value={newCajaNap.nodo_id || ''}
                                    onChange={e => setNewCajaNap({ ...newCajaNap, nodo_id: e.target.value ? parseInt(e.target.value) : null })}
                                >
                                    <option value="">Sin nodo asignado</option>
                                    {nodos.map(n => (
                                        <option key={n.id} value={n.id}>{n.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Cajas NAP')}>{isEditingCajaNap ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingCajaNap && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingCajaNap(null); setNewCajaNap({ nombre: '', nodo_id: null }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(cajasNap, ['id', 'nombre', 'nodo_nombre'], 'Cajas NAP')}
                    </div>
                )}

                {activeTab === 'Planes' && (
                    <div>
                        <h3>Añadir Plan</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre del Plan</label>
                                <input className="input" style={{ margin: 0 }} value={newPlan.nombre} onChange={e => setNewPlan({ ...newPlan, nombre: e.target.value })} placeholder="Ej. 1GB" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Megas</label>
                                <input type="number" className="input" style={{ margin: 0 }} value={newPlan.megas} onChange={e => setNewPlan({ ...newPlan, megas: e.target.value })} placeholder="Ej. 100" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Precio ($)</label>
                                <input type="number" step="0.01" className="input" style={{ margin: 0 }} value={newPlan.precio} onChange={e => setNewPlan({ ...newPlan, precio: e.target.value })} placeholder="0.00" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Pantallas IPTV</label>
                                <input type="number" className="input" style={{ margin: 0 }} value={newPlan.pantallas} onChange={e => setNewPlan({ ...newPlan, pantallas: e.target.value })} min="0" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Planes')}>{isEditingPlan ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingPlan && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingPlan(null); setNewPlan({ nombre: '', megas: '', precio: '', pantallas: 1 }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable([...planes].sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio)), ['id', 'nombre', 'megas', 'precio', 'pantallas'], 'Planes')}
                    </div>
                )}

                {activeTab === 'Bancos' && (
                    <div>
                        <h3>Añadir Banco</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nombre</label>
                                <input className="input" style={{ margin: 0 }} value={newBanco.nombre} onChange={e => setNewBanco({ nombre: e.target.value })} placeholder="Ej. PICHINCHA" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Bancos')}>{isEditingBanco ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingBanco && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingBanco(null); setNewBanco({ nombre: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(bancos, ['id', 'nombre'], 'Bancos')}
                    </div>
                )}

                {activeTab === 'Puertos' && (
                    <div>
                        <h3>Añadir Puerto por Nodo</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Nodo</label>
                                <select className="input" style={{ margin: 0 }} value={newPuerto.nodo_id} onChange={e => setNewPuerto({ ...newPuerto, nodo_id: e.target.value })}>
                                    <option value="">Seleccione...</option>
                                    {nodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Número</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '8px', color: 'var(--text-muted)' }}>Puerto</span>
                                    <input type="number" min="0" className="input" style={{ margin: 0, width: '100px' }} value={newPuerto.numero} onChange={e => {
                                        const val = e.target.value;
                                        const num = parseInt(val);
                                        let lim = '';
                                        if (!isNaN(num)) {
                                            const start = num * 128;
                                            const end = start + 127;
                                            lim = `${start} al ${end}`;
                                        }
                                        setNewPuerto({ ...newPuerto, numero: val, limite_ip: lim, limite_device: lim, limite_service_port: lim });
                                    }} placeholder="Ej. 1" />
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Puertos')}>{isEditingPuerto ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingPuerto && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingPuerto(null); setNewPuerto({ numero: '', nodo_id: '', limite_ip: '', limite_device: '', limite_service_port: '' }); }}>Cancelar</button>
                            )}
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <input
                                className="input"
                                placeholder="🔍 Buscar por nombre, ID o Nodo..."
                                value={searchPuerto}
                                onChange={(e) => setSearchPuerto(e.target.value)}
                                style={{ width: '100%', maxWidth: '350px' }}
                            />
                        </div>
                        {renderTable(
                            puertos.filter(p => {
                                const nodoName = nodos.find(nod => nod.id === p.nodo_id)?.nombre || '';
                                const search = searchPuerto.toLowerCase();
                                return (
                                    p.id.toString().includes(search) ||
                                    p.nombre.toLowerCase().includes(search) ||
                                    nodoName.toLowerCase().includes(search)
                                );
                            }),
                            ['id', 'nombre', 'nodo_id', 'limite_ip', 'limite_device', 'limite_service_port'], 'Puertos'
                        )}
                    </div>
                )}

                {activeTab === 'Usuarios' && (
                    <div>
                        <h3>{isEditingUser ? 'Editar Usuario' : 'Añadir Usuario'}</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Username</label>
                                <input className="input" style={{ margin: 0 }} value={newUsuario.username} onChange={e => setNewUsuario({ ...newUsuario, username: e.target.value })} placeholder="Ej. juanperez" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">{isEditingUser ? 'Nueva Password (opcional)' : 'Password'}</label>
                                <input type="password" className="input" style={{ margin: 0 }} value={newUsuario.password} onChange={e => setNewUsuario({ ...newUsuario, password: e.target.value })} />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Rol</label>
                                <select className="input" style={{ margin: 0 }} value={newUsuario.rol} onChange={e => setNewUsuario({ ...newUsuario, rol: e.target.value })}>
                                    <option value="administrador">Administrador</option>
                                    <option value="secretario">Secretario</option>
                                    <option value="tecnico">Técnico</option>
                                    <option value="instalador">Instalador</option>
                                </select>

                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Usuarios')}>{isEditingUser ? 'Actualizar' : 'Guardar'}</button>
                            {isEditingUser && (
                                <button className="btn btn-secondary" onClick={() => { setIsEditingUser(null); setNewUsuario({ username: '', password: '', rol: 'tecnico' }); }}>Cancelar</button>
                            )}
                        </div>
                        {renderTable(usuarios, ['id', 'username', 'rol'], 'Usuarios')}
                    </div>
                )}

                {activeTab === 'Finanzas Base' && (
                    <div>
                        <h3>Configurar Montos Establecidos de Cuentas</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                            Estos valores se utilizarán como base para sumar y reflejar en las estadísticas del Dashboard global de finanzas.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Caja Chica (Efectivo)</label>
                                <input type="number" step="0.01" className="input" style={{ margin: 0 }} value={finanzasBase.caja_chica} onChange={e => setFinanzasBase({ ...finanzasBase, caja_chica: e.target.value })} placeholder="Ej. 100.00" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">Pichincha</label>
                                <input type="number" step="0.01" className="input" style={{ margin: 0 }} value={finanzasBase.pichincha} onChange={e => setFinanzasBase({ ...finanzasBase, pichincha: e.target.value })} placeholder="Ej. 50.00" />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label className="label">JEP</label>
                                <input type="number" step="0.01" className="input" style={{ margin: 0 }} value={finanzasBase.jep} onChange={e => setFinanzasBase({ ...finanzasBase, jep: e.target.value })} placeholder="Ej. 50.00" />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleCreate('Finanzas Base')}>Guardar Valores Base</button>
                        </div>
                    </div>
                )}

                {activeTab === 'Administrar' && (
                    <div>
                        <h3 style={{ marginBottom: '8px' }}>⚙️ Configuración de Administrar Recientes</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                            Define cuántos días atrás se consideran "recientes" para mostrar clientes en el módulo <strong>Administrar</strong>.
                        </p>
                        <div style={{
                            background: 'rgba(56,189,248,0.06)',
                            border: '1px solid rgba(56,189,248,0.2)',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '420px'
                        }}>
                            <div className="input-group" style={{ margin: 0, marginBottom: '20px' }}>
                                <label className="label" style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>
                                    🗓️ Días de permanencia de clientes
                                </label>
                                <select
                                    id="select-dias-permanencia"
                                    className="input"
                                    style={{ margin: 0, maxWidth: '200px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}
                                    value={diasPermanencia}
                                    onChange={e => setDiasPermanencia(parseInt(e.target.value))}
                                >
                                    {[1,2,3,4,5,6,7,8,9,10].map(d => (
                                        <option key={d} value={d} style={{ background: '#1e1b4b' }}>
                                            {d} {d === 1 ? 'día' : 'días'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Actualmente se muestran clientes activos creados en los últimos <strong style={{ color: '#38bdf8' }}>{diasPermanencia} {diasPermanencia === 1 ? 'día' : 'días'}</strong>.
                            </p>
                            <button
                                id="btn-guardar-dias-permanencia"
                                className="btn btn-primary"
                                onClick={handleSaveDiasPermanencia}
                                disabled={diasSaving}
                                style={{ padding: '10px 24px' }}
                            >
                                {diasSaving ? '⏳ Guardando...' : '💾 Guardar'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'Eliminar Clientes' && (
                    <div>
                        <h3 style={{ color: '#ef4444', marginBottom: '20px' }}>⚠️ Eliminar Todos los Clientes</h3>
                        <p style={{ color: '#fca5a5', marginBottom: '20px', fontSize: '0.95rem' }}>
                            Esta acción es <strong>IRREVERSIBLE</strong>. Se eliminarán TODOS los clientes de la base de datos.
                            Se requiere contraseña de administrador para confirmar.
                        </p>
                        <div style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '20px',
                            borderRadius: '8px',
                            maxWidth: '400px'
                        }}>
                            <div className="input-group">
                                <label className="label" style={{ color: '#fca5a5' }}>Contraseña de Administrador</label>
                                <input 
                                    type="password" 
                                    className="input" 
                                    value={passwordDeleteClientes} 
                                    onChange={e => setPasswordDeleteClientes(e.target.value)}
                                    placeholder="Ingrese la contraseña"
                                    style={{ marginTop: '8px' }}
                                />
                            </div>
                            <button 
                                className="btn" 
                                onClick={async () => {
                                    if (passwordDeleteClientes !== 'admin1.@') {
                                        alert('❌ Contraseña incorrecta');
                                        return;
                                    }
                                    if (!window.confirm('⚠️ ¿ESTÁS SEGURO? Esta acción eliminará TODOS los clientes del sistema.\n\nEsta acción NO se puede deshacer.')) {
                                        return;
                                    }
                                    if (!window.confirm('CONFIRMACIÓN FINAL: ¿Eliminar TODOS los clientes?')) {
                                        return;
                                    }
                                    try {
                                        await configuracionService.deleteAllClientes();
                                        alert('✅ Todos los clientes han sido eliminados exitosamente.');
                                        setPasswordDeleteClientes('');
                                        fetchData();
                                    } catch (error) {
                                        alert('❌ Error: ' + (error.response?.data?.detail || error.message));
                                    }
                                }}
                                style={{
                                    marginTop: '15px',
                                    background: passwordDeleteClientes === 'admin1.@' ? '#ef4444' : '#9ca3af',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: passwordDeleteClientes === 'admin1.@' ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold',
                                    width: '100%',
                                    opacity: passwordDeleteClientes === 'admin1.@' ? 1 : 0.6
                                }}
                                disabled={passwordDeleteClientes !== 'admin1.@'}
                            >
                                🗑️ Eliminar Todos los Clientes
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'OLTs Huawei' && (
                    <div>
                        <h3 style={{ marginBottom: 4 }}>🌐 OLTs Huawei Registradas</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                            Registra aquí las OLTs con sus credenciales SSH. El sistema usará estas credenciales para ejecutar <code>display ont autofind all</code> y activar terminales ópticas.
                        </p>

                        {/* Formulario */}
                        <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                            <h4 style={{ marginBottom: 12, color: '#38bdf8' }}>{isEditingOlt ? '✏️ Editar OLT' : '➕ Nueva OLT'}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Nombre</label>
                                    <input className="input" style={{ margin: 0 }} value={newOlt.nombre} onChange={e => setNewOlt({ ...newOlt, nombre: e.target.value.toUpperCase() })} placeholder="Ej. OLT-BAÑOS" />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Host / IP</label>
                                    <input className="input" style={{ margin: 0 }} value={newOlt.host} onChange={e => setNewOlt({ ...newOlt, host: e.target.value })} placeholder="172.25.0.2" />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Puerto SSH</label>
                                    <input type="number" className="input" style={{ margin: 0 }} value={newOlt.port} onChange={e => setNewOlt({ ...newOlt, port: e.target.value })} placeholder="22" />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Usuario</label>
                                    <input className="input" style={{ margin: 0 }} value={newOlt.username} onChange={e => setNewOlt({ ...newOlt, username: e.target.value })} placeholder="root" />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Password</label>
                                    <input type="password" className="input" style={{ margin: 0 }} value={newOlt.password} onChange={e => setNewOlt({ ...newOlt, password: e.target.value })} placeholder={isEditingOlt ? '(sin cambio)' : 'admin'} />
                                </div>
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="label">Nodo Asociado</label>
                                    <select className="input" style={{ margin: 0 }} value={newOlt.nodo_asociado} onChange={e => setNewOlt({ ...newOlt, nodo_asociado: e.target.value })}>
                                        <option value="">— Todas las zonas —</option>
                                        {nodos.map(n => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                                <button className="btn btn-primary" onClick={handleOltSave} disabled={oltSaving}>
                                    {oltSaving ? 'Guardando...' : isEditingOlt ? 'Actualizar OLT' : 'Registrar OLT'}
                                </button>
                                <button className="btn btn-secondary" onClick={handleOltTestRaw} disabled={oltTestingRaw} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    {oltTestingRaw ? 'Probando...' : '⚡ Probar Conexión'}
                                </button>
                                {isEditingOlt && (
                                    <button className="btn btn-secondary" onClick={() => { setIsEditingOlt(null); setNewOlt({ nombre: '', host: '', port: 22, username: 'root', password: 'admin', nodo_asociado: '', device_type: 'huawei' }); }}>Cancelar</button>
                                )}
                            </div>
                        </div>

                        {/* Tabla de OLTs */}
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                        {['ID', 'Nombre', 'Host', 'Puerto', 'Usuario', 'Nodo', 'Estado', 'Acciones'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {oltConfigs.length === 0 && (
                                        <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#ef4444' }}>
                                            ⚠️ No hay OLTs registradas. Registra la OLT para poder detectar terminales ópticas.
                                        </td></tr>
                                    )}
                                    {oltConfigs.map(olt => (
                                        <tr key={olt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '10px 12px' }}>{olt.id}</td>
                                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{olt.nombre}</td>
                                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8' }}>{olt.host}</td>
                                            <td style={{ padding: '10px 12px' }}>{olt.port}</td>
                                            <td style={{ padding: '10px 12px' }}>{olt.username}</td>
                                            <td style={{ padding: '10px 12px', color: olt.nodo_asociado ? '#a78bfa' : '#6b7280' }}>{olt.nodo_asociado || 'Todas'}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.8rem', background: olt.active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: olt.active ? '#4ade80' : '#f87171' }}>
                                                    {olt.active ? '● Activa' : '○ Inactiva'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <button className="btn btn-secondary" onClick={() => handleOltEdit(olt)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f655', color: '#93c5fd', border: 'none' }}>Editar</button>
                                                <button className="btn btn-secondary" onClick={() => handleOltToggle(olt)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: olt.active ? '#92400e55' : '#14532d55', color: olt.active ? '#fbbf24' : '#4ade80', border: 'none' }}>
                                                    {olt.active ? 'Desactivar' : 'Activar'}
                                                </button>
                                                <button className="btn btn-secondary" onClick={() => handleOpenMtModal(olt)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#8b5cf655', color: '#c084fc', border: 'none' }}>⚙️ MikroTik</button>
                                                <button className="btn btn-secondary" onClick={() => handleOpenLqModal(olt)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: 'none' }}>🚀 LibreQoS</button>
                                                <button className="btn btn-secondary" onClick={() => handleOltTestExisting(olt.id)} disabled={oltTestingId === olt.id} style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'none' }}>
                                                    {oltTestingId === olt.id ? 'Probando...' : '⚡ Ping'}
                                                </button>
                                                <button className="btn btn-secondary" onClick={() => handleOltDelete(olt.id)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#ef444455', color: '#fca5a5', border: 'none' }}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Modal emergente para configurar MikroTik */}
                        {showMtModal && selectedOltForMt && (
                            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                                <div className="modal" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: 24, borderRadius: 12, width: '450px', maxWidth: '90%' }}>
                                    <h3 style={{ color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>⚙️ Configurar MikroTik para: {selectedOltForMt.nombre}</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 20 }}>Configure las credenciales de la API de RouterOS de su MikroTik asociado a esta OLT.</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                                        <div className="input-group" style={{ margin: 0 }}>
                                            <label className="label" style={{ color: '#cbd5e1' }}>Host / IP MikroTik</label>
                                            <input 
                                                className="input" 
                                                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
                                                value={mtConfig.host} 
                                                onChange={e => setMtConfig({ ...mtConfig, host: e.target.value })} 
                                                placeholder="Ej. 172.25.0.2" 
                                            />
                                        </div>
                                        <div className="input-group" style={{ margin: 0 }}>
                                            <label className="label" style={{ color: '#cbd5e1' }}>Puerto API MikroTik</label>
                                            <input 
                                                type="number" 
                                                className="input" 
                                                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
                                                value={mtConfig.port} 
                                                onChange={e => setMtConfig({ ...mtConfig, port: e.target.value })} 
                                                placeholder="8728" 
                                            />
                                        </div>
                                        <div className="input-group" style={{ margin: 0 }}>
                                            <label className="label" style={{ color: '#cbd5e1' }}>Usuario API</label>
                                            <input 
                                                className="input" 
                                                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
                                                value={mtConfig.username} 
                                                onChange={e => setMtConfig({ ...mtConfig, username: e.target.value })} 
                                                placeholder="admin" 
                                            />
                                        </div>
                                        <div className="input-group" style={{ margin: 0 }}>
                                            <label className="label" style={{ color: '#cbd5e1' }}>Password API</label>
                                            <input 
                                                type="password" 
                                                className="input" 
                                                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
                                                value={mtConfig.password} 
                                                onChange={e => setMtConfig({ ...mtConfig, password: e.target.value })} 
                                                placeholder="Dejar vacío si no usa password" 
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={handleTestMtConnection} 
                                            disabled={mtTesting}
                                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                        >
                                            {mtTesting ? 'Probando...' : '⚡ Probar Conexión'}
                                        </button>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => setShowMtModal(false)}
                                            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={handleSaveMtConfig} 
                                            disabled={mtSaving}
                                            style={{ background: '#3b82f6', color: '#fff', border: 'none' }}
                                        >
                                            {mtSaving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal emergente para configurar LibreQoS */}
                        {showLqModal && selectedOltForLq && (
                            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                                <div className="modal" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: 24, borderRadius: 12, width: '550px', maxWidth: '95%' }}>
                                    <h3 style={{ color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>🚀 Configurar LibreQoS para: {selectedOltForLq.nombre}</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16 }}>Establece la conexión SSH para el shaper de esta OLT.</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto', paddingRight: 8, marginBottom: 20 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div className="input-group" style={{ margin: 0 }}>
                                                <label className="label" style={{ color: '#cbd5e1' }}>Nombre Servidor</label>
                                                <input className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.name} onChange={e => setLqForm({ ...lqForm, name: e.target.value })} />
                                            </div>
                                            <div className="input-group" style={{ margin: 0 }}>
                                                <label className="label" style={{ color: '#cbd5e1' }}>Host / IP LibreQoS</label>
                                                <input className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.host} onChange={e => setLqForm({ ...lqForm, host: e.target.value })} placeholder="Ej. 172.28.0.4" />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div className="input-group" style={{ margin: 0 }}>
                                                <label className="label" style={{ color: '#cbd5e1' }}>Puerto SSH</label>
                                                <input type="number" className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.ssh_port} onChange={e => setLqForm({ ...lqForm, ssh_port: e.target.value })} />
                                            </div>
                                            <div className="input-group" style={{ margin: 0 }}>
                                                <label className="label" style={{ color: '#cbd5e1' }}>Usuario SSH</label>
                                                <input className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.username} onChange={e => setLqForm({ ...lqForm, username: e.target.value })} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div className="input-group" style={{ margin: 0 }}>
                                                <label className="label" style={{ color: '#cbd5e1' }}>Método Auth</label>
                                                <select className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.auth_method} onChange={e => setLqForm({ ...lqForm, auth_method: e.target.value })}>
                                                    <option value="password">Contraseña</option>
                                                    <option value="key">Clave Privada</option>
                                                </select>
                                            </div>
                                            {lqForm.auth_method === 'password' ? (
                                                <div className="input-group" style={{ margin: 0 }}>
                                                    <label className="label" style={{ color: '#cbd5e1' }}>Password SSH</label>
                                                    <input type="password" className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.password} onChange={e => setLqForm({ ...lqForm, password: e.target.value })} placeholder="••••••••" />
                                                </div>
                                            ) : (
                                                <div className="input-group" style={{ margin: 0 }}>
                                                    <label className="label" style={{ color: '#cbd5e1' }}>Ruta Clave Privada</label>
                                                    <input className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.private_key_path} onChange={e => setLqForm({ ...lqForm, private_key_path: e.target.value })} placeholder="/root/.ssh/id_rsa" />
                                                </div>
                                            )}
                                        </div>

                                        <details>
                                            <summary style={{ color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', margin: '4px 0 10px 0' }}>⚙️ Ajustes avanzados de LibreQoS</summary>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    <div className="input-group" style={{ margin: 0 }}>
                                                        <label className="label" style={{ color: '#cbd5e1' }}>Ruta de Instalación</label>
                                                        <input className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.libreqos_path} onChange={e => setLqForm({ ...lqForm, libreqos_path: e.target.value })} />
                                                    </div>
                                                    <div className="input-group" style={{ margin: 0 }}>
                                                        <label className="label" style={{ color: '#cbd5e1' }}>Jobs concurrentes</label>
                                                        <input type="number" className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.max_concurrent_jobs} onChange={e => setLqForm({ ...lqForm, max_concurrent_jobs: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    <div className="input-group" style={{ margin: 0 }}>
                                                        <label className="label" style={{ color: '#cbd5e1' }}>Velocidad Suspensión ↓ (Mbps)</label>
                                                        <input type="number" className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.suspension_download_mbps} onChange={e => setLqForm({ ...lqForm, suspension_download_mbps: e.target.value })} />
                                                    </div>
                                                    <div className="input-group" style={{ margin: 0 }}>
                                                        <label className="label" style={{ color: '#cbd5e1' }}>Velocidad Suspensión ↑ (Mbps)</label>
                                                        <input type="number" className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} value={lqForm.suspension_upload_mbps} onChange={e => setLqForm({ ...lqForm, suspension_upload_mbps: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="input-group" style={{ margin: 0 }}>
                                                    <label className="label" style={{ color: '#cbd5e1' }}>Comando APPLY</label>
                                                    <input className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'monospace', fontSize: '0.8rem' }} value={lqForm.libreqos_apply_cmd} onChange={e => setLqForm({ ...lqForm, libreqos_apply_cmd: e.target.value })} />
                                                </div>
                                                <div className="input-group" style={{ margin: 0 }}>
                                                    <label className="label" style={{ color: '#cbd5e1' }}>Comando LIST (JSON)</label>
                                                    <input className="input" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'monospace', fontSize: '0.8rem' }} value={lqForm.libreqos_list_cmd} onChange={e => setLqForm({ ...lqForm, libreqos_list_cmd: e.target.value })} />
                                                </div>
                                            </div>
                                        </details>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {selectedOltForLq.libreqos_server_id && (
                                                <>
                                                    <button className="btn btn-secondary" onClick={handleTestLqConnection} disabled={lqTesting} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 14px', fontSize: '0.85rem' }}>
                                                        {lqTesting ? 'Probando...' : '⚡ Test SSH'}
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={handleSyncLqServer} disabled={lqSyncing} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '8px 14px', fontSize: '0.85rem' }}>
                                                        {lqSyncing ? 'Syncing...' : '🔄 Sync'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn btn-secondary" onClick={() => setShowLqModal(false)} style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
                                            <button className="btn btn-primary" onClick={handleSaveLqConfig} disabled={lqSaving} style={{ background: '#3b82f6', color: '#fff', border: 'none' }}>
                                                {lqSaving ? 'Guardando...' : 'Guardar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: 8, fontSize: '0.82rem', color: '#6b7280' }}>
                            💡 <strong style={{ color: '#38bdf8' }}>Credenciales para tu OLT:</strong> Host <code style={{ color: '#f472b6' }}>172.25.0.2</code> · Puerto <code style={{ color: '#f472b6' }}>22</code> · Usuario <code style={{ color: '#f472b6' }}>root</code> · Password <code style={{ color: '#f472b6' }}>admin</code>
                        </div>
                    </div>
                )}

            </div>
        </motion.div>
    );
};

export default Configuraciones;
