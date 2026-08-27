import React, { useState, useEffect } from 'react';
import { asistenciaService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError, showWarning } from '../utils/alerts';

const TARGET_LAT = -2.922000;
const TARGET_LNG = -79.066444;
const MAX_DISTANCE = 30; // 30 metros exactos según requerimiento

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const Asistencia = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('registrar'); // 'registrar', 'reporte', 'horarios'
  const [loading, setLoading] = useState(false);
  
  // Estado Marcación
  const [status, setStatus] = useState('idle'); // idle, checking, out_of_range, ready, success, error
  const [distance, setDistance] = useState(null);
  const [coords, setCoords] = useState(null);

  const [dailyStatus, setDailyStatus] = useState({
    ha_entrado: false,
    ha_salido: false,
    puede_salir: true,
    mensaje_restriccion: null,
    horario: null,
    punches_today: []
  });

  // Estado Reporte Mensual
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [filtroMes, setFiltroMes] = useState(currentMonthStr);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [reporteMensual, setReporteMensual] = useState(null);
  const [empleadoSeleccionadoModal, setEmpleadoSeleccionadoModal] = useState(null);

  // Estado Horarios (Admin)
  const [horariosList, setHorariosList] = useState([]);
  const [modalHorarioOpen, setModalHorarioOpen] = useState(false);
  const [horarioEdit, setHorarioEdit] = useState({
    usuario_id: null,
    nombre_usuario: '',
    hora_entrada_1: '08:00',
    hora_salida_1: '13:00',
    hora_entrada_2: '14:00',
    hora_salida_2: '18:00',
    horas_diarias_esperadas: 8.0,
    dias_laborables: '1,2,3,4,5',
    tolerancia_minutos: 15
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'reporte') {
      fetchReporteMensual();
    } else if (activeTab === 'horarios' && user?.rol === 'administrador') {
      fetchHorarios();
    }
  }, [activeTab, filtroMes, filtroUsuario]);

  const fetchStatus = async () => {
    try {
      const res = await asistenciaService.getEstadoHoy();
      setDailyStatus(res.data);
      setStatus('idle');
    } catch (err) {
      console.error("Error al obtener estado:", err);
    }
  };

  const fetchReporteMensual = async () => {
    try {
      setLoading(true);
      const res = await asistenciaService.getReporteMensual(filtroMes, filtroUsuario);
      setReporteMensual(res.data);
    } catch (err) {
      console.error("Error al obtener reporte mensual:", err);
      showError("No se pudo cargar el reporte mensual.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHorarios = async () => {
    try {
      setLoading(true);
      const res = await asistenciaService.getHorarios();
      setHorariosList(res.data);
    } catch (err) {
      console.error("Error al cargar horarios:", err);
      showError("No se pudieron cargar los horarios.");
    } finally {
      setLoading(false);
    }
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      showError("Tu navegador no soporta geolocalización");
      return;
    }

    setStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = getDistance(latitude, longitude, TARGET_LAT, TARGET_LNG);
        setDistance(dist);
        setCoords({ lat: latitude, lng: longitude });

        if (dist <= MAX_DISTANCE) {
          setStatus('ready');
        } else {
          setStatus('out_of_range');
        }
      },
      (err) => {
        console.error(err);
        setStatus('error');
        showError("Error al obtener ubicación. Asegúrate de dar permisos de GPS.");
      },
      { enableHighAccuracy: true }
    );
  };

  const registrarAccion = async () => {
    if (!coords || distance === null || distance > MAX_DISTANCE) {
      showWarning("No te encuentras dentro del rango permitido para registrar asistencia.");
      setStatus('out_of_range');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ubicacion: `${coords.lat}, ${coords.lng}`,
        distancia_metros: distance,
        dispositivo_info: navigator.userAgent,
        biometria_validada: true,
        hora_dispositivo: new Date().toLocaleTimeString('es-EC', { hour12: false })
      };

      if (!dailyStatus.ha_entrado) {
        await asistenciaService.registrar(payload);
        showSuccess("Entrada registrada correctamente");
      } else {
        await asistenciaService.registrarSalida(payload);
        showSuccess("Salida registrada correctamente");
      }

      await fetchStatus();
    } catch (err) {
      showError("Error: " + (err.response?.data?.detail || "No se pudo procesar la marcación"));
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = async () => {
    try {
      setLoading(true);
      const response = await asistenciaService.descargarReporteExcel(filtroMes);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Asistencia_${filtroMes}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess("Reporte de Excel descargado correctamente");
    } catch (err) {
      console.error(err);
      showError("Error al descargar reporte de Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditHorario = (h) => {
    setHorarioEdit({
      usuario_id: h.usuario_id,
      nombre_usuario: h.nombre_usuario,
      hora_entrada_1: h.hora_entrada_1 || '08:00',
      hora_salida_1: h.hora_salida_1 || '13:00',
      hora_entrada_2: h.hora_entrada_2 || '14:00',
      hora_salida_2: h.hora_salida_2 || '18:00',
      horas_diarias_esperadas: h.horas_diarias_esperadas || 8.0,
      dias_laborables: h.dias_laborables || '1,2,3,4,5',
      tolerancia_minutos: h.tolerancia_minutos || 15
    });
    setModalHorarioOpen(true);
  };

  const handleSaveHorario = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await asistenciaService.guardarHorario(horarioEdit.usuario_id, horarioEdit);
      showSuccess(`Horario de ${horarioEdit.nombre_usuario} actualizado correctamente`);
      setModalHorarioOpen(false);
      fetchHorarios();
    } catch (err) {
      showError("Error al guardar horario: " + (err.response?.data?.detail || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  // Helper para días laborables checkboxes
  const isDiaLaborable = (dayNum) => {
    return (horarioEdit.dias_laborables || '').split(',').map(d => d.strip ? d.strip() : d.trim()).includes(String(dayNum));
  };

  const toggleDiaLaborable = (dayNum) => {
    let list = (horarioEdit.dias_laborables || '').split(',').map(d => d.trim()).filter(Boolean);
    const dayStr = String(dayNum);
    if (list.includes(dayStr)) {
      list = list.filter(d => d !== dayStr);
    } else {
      list.push(dayStr);
    }
    list.sort();
    setHorarioEdit({ ...horarioEdit, dias_laborables: list.join(',') });
  };

  return (
    <div className="glass-card glass asistencia-container" style={{ minHeight: '80vh', padding: '24px' }}>
      {/* HEADER */}
      <div className="asistencia-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Control de Asistencia</h1>
          <p style={{ color: 'var(--text-muted)' }}>Registro de jornada laboral, horarios y reporte de horas extras.</p>
        </div>

        {/* TABS DE NAVEGACIÓN */}
        <div className="glass asistencia-tabs" style={{ display: 'flex', gap: '6px', padding: '4px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setActiveTab('registrar')}
            className={`btn ${activeTab === 'registrar' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            ⏰ Marcación
          </button>
          <button
            onClick={() => setActiveTab('reporte')}
            className={`btn ${activeTab === 'reporte' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            📊 Reporte Mensual
          </button>
          {user?.rol === 'administrador' && (
            <button
              onClick={() => setActiveTab('horarios')}
              className={`btn ${activeTab === 'horarios' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              ⚙️ Config. Horarios
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* TAB 1: MARCACIÓN */}
        {/* ========================================================================= */}
        {activeTab === 'registrar' && (
          <motion.div
            key="registrar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="asistencia-card-wrapper"
            style={{ maxWidth: '650px', margin: '0 auto' }}
          >
            {/* HORARIO ASIGNADO BADGE */}
            {dailyStatus.horario && (
              <div className="glass" style={{ padding: '12px 20px', borderRadius: '14px', marginBottom: '20px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
                  🕒 <b>Tu Horario Asignado:</b> {dailyStatus.horario.hora_entrada_1} - {dailyStatus.horario.hora_salida_1} | {dailyStatus.horario.hora_entrada_2} - {dailyStatus.horario.hora_salida_2} ({dailyStatus.horario.horas_diarias_esperadas}h esperadas)
                </span>
              </div>
            )}

            <div className="glass asistencia-main-card" style={{ padding: '40px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
                {status === 'idle' && (dailyStatus.ha_entrado ? '🟢' : '📍')}
                {status === 'checking' && '⏳'}
                {status === 'ready' && '🔓'}
                {status === 'out_of_range' && '🚫'}
                {status === 'error' && '❌'}
              </div>

              {status === 'idle' && (
                <>
                  {!dailyStatus.ha_entrado ? (
                    <>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '8px' }}>Listo para registrar Entrada</h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Debes encontrarte en la oficina para habilitar el registro.</p>
                      <button className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 'bold' }} onClick={checkLocation}>
                        📍 Verificar Ubicación GPS
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#60a5fa', marginBottom: '8px' }}>Jornada Activa</h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Última entrada registrada a las: <b>{dailyStatus.hora_entrada}</b>
                      </p>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                        onClick={checkLocation}
                      >
                        👋 Verificar Ubicación para Registrar Salida
                      </button>
                    </>
                  )}
                </>
              )}

              {status === 'checking' && (
                <div>
                  <h3 style={{ marginBottom: '8px' }}>Verificando Coordenadas GPS...</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Por favor espera un momento.</p>
                </div>
              )}

              {status === 'out_of_range' && (
                <>
                  <h3 style={{ color: '#f87171', marginBottom: '8px' }}>Fuera de Rango de la Oficina</h3>
                  <p style={{ marginBottom: '8px' }}>Distancia detectada: <b>{Math.round(distance)} metros</b>.</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>El rango permitido es de hasta {MAX_DISTANCE} metros.</p>
                  <button className="btn btn-secondary" style={{ width: '100%', padding: '12px' }} onClick={checkLocation}>Reintentar Verificación</button>
                </>
              )}

              {status === 'ready' && (
                <>
                  <h3 style={{ color: '#4ade80', marginBottom: '8px' }}>Ubicación Validada Correctamente</h3>
                  <p style={{ marginBottom: '24px' }}>Te encuentras a {Math.round(distance)}m de la oficina.</p>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    onClick={registrarAccion}
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : (dailyStatus.ha_entrado ? '✅ Confirmar Registro de Salida' : '✅ Confirmar Registro de Entrada')}
                  </button>
                </>
              )}
            </div>

            {/* RESUMEN DE MARCACIONES DEL DÍA */}
            {dailyStatus.punches_today && dailyStatus.punches_today.length > 0 && (
              <div className="glass" style={{ marginTop: '20px', padding: '16px 20px', borderRadius: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-muted)' }}>Marcaciones de Hoy:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dailyStatus.punches_today.map((p, idx) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Turno #{idx + 1}</span>
                      <span style={{ fontSize: '0.85rem' }}>
                        Entrada: <b>{p.hora_entrada}</b> | Salida: <b>{p.hora_salida || 'En progreso...'}</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REPORTE MENSUAL */}
        {/* ========================================================================= */}
        {activeTab === 'reporte' && (
          <motion.div
            key="reporte"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* FILTROS Y BOTÓN EXCEL */}
            <div className="glass" style={{ padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Seleccionar Mes:</label>
                  <input
                    type="month"
                    className="input"
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                    style={{ marginBottom: 0, width: '180px' }}
                  />
                </div>

                {user?.rol === 'administrador' && reporteMensual?.resumen_empleados && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Filtrar Empleado:</label>
                    <select
                      className="input"
                      value={filtroUsuario}
                      onChange={(e) => setFiltroUsuario(e.target.value)}
                      style={{ marginBottom: 0, minWidth: '180px' }}
                    >
                      <option value="">Todos los Empleados</option>
                      {reporteMensual.resumen_empleados.map(e => (
                        <option key={e.usuario_id} value={e.usuario_id}>{e.nombre_usuario}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {user?.rol === 'administrador' && (
                <button className="btn btn-primary" onClick={handleDescargarExcel} disabled={loading} style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '10px 20px' }}>
                  📥 Exportar Reporte a Excel (.xlsx)
                </button>
              )}
            </div>

            {/* MÉTRICAS GENERALES */}
            {reporteMensual && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass" style={{ padding: '18px', borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Horas Trabajadas</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#60a5fa' }}>{reporteMensual.total_horas_trabajadas}h</div>
                </div>

                <div className="glass" style={{ padding: '18px', borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Horas Extras</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#34d399' }}>{reporteMensual.total_horas_extras}h</div>
                </div>

                <div className="glass" style={{ padding: '18px', borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Empleados Evaluados</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#c084fc' }}>{reporteMensual.total_empleados}</div>
                </div>
              </div>
            )}

            {/* TABLA RESUMEN */}
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Rol</th>
                    <th style={{ textAlign: 'center' }}>Días Trabajados</th>
                    <th style={{ textAlign: 'center' }}>Horas Esperadas</th>
                    <th style={{ textAlign: 'center' }}>Horas Trabajadas</th>
                    <th style={{ textAlign: 'center' }}>Horas Extras</th>
                    <th style={{ textAlign: 'center' }}>Atrasos (min)</th>
                    <th style={{ textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {!reporteMensual || reporteMensual.resumen_empleados.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>No hay información para el mes seleccionado.</td></tr>
                  ) : (
                    reporteMensual.resumen_empleados.map(emp => (
                      <tr key={emp.usuario_id}>
                        <td><b style={{ color: '#f3f4f6' }}>{emp.nombre_usuario}</b></td>
                        <td><span className="badge" style={{ textTransform: 'capitalize' }}>{emp.rol}</span></td>
                        <td style={{ textAlign: 'center' }}>{emp.dias_trabajados}</td>
                        <td style={{ textAlign: 'center' }}>{emp.horas_esperadas}h</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#93c5fd' }}>{emp.horas_trabajadas}h</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: emp.horas_extras > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                          {emp.horas_extras > 0 ? `+${emp.horas_extras}h` : '0h'}
                        </td>
                        <td style={{ textAlign: 'center', color: emp.atraso_minutos > 0 ? '#f87171' : 'var(--text-muted)' }}>
                          {emp.atraso_minutos > 0 ? `${emp.atraso_minutos} min` : '0 min'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setEmpleadoSeleccionadoModal(emp)}>
                            📋 Ver Días
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MODAL DETALLE DE DÍAS POR EMPLEADO */}
            {empleadoSeleccionadoModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <div className="glass" style={{ background: '#111827', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '20px', padding: '24px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>Detalle Diario: {empleadoSeleccionadoModal.nombre_usuario}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mes: {filtroMes}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setEmpleadoSeleccionadoModal(null)}>✖ Cerrar</button>
                  </div>

                  <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Día</th>
                          <th>Entrada</th>
                          <th>Salida</th>
                          <th style={{ textAlign: 'center' }}>Trabajado</th>
                          <th style={{ textAlign: 'center' }}>Extras</th>
                          <th style={{ textAlign: 'center' }}>Atraso</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empleadoSeleccionadoModal.detalles_dias.map((d, i) => (
                          <tr key={i} style={{ background: d.estado === 'Ausente' ? 'rgba(239,68,68,0.05)' : d.estado === 'Descanso' ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            <td>{d.fecha}</td>
                            <td>{d.dia_nombre}</td>
                            <td>{d.hora_entrada || '--:--'}</td>
                            <td>{d.hora_salida || '--:--'}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{d.horas_trabajadas}h</td>
                            <td style={{ textAlign: 'center', color: d.horas_extras > 0 ? '#4ade80' : 'inherit' }}>{d.horas_extras > 0 ? `+${d.horas_extras}h` : '0h'}</td>
                            <td style={{ textAlign: 'center', color: d.atraso_minutos > 0 ? '#f87171' : 'inherit' }}>{d.atraso_minutos > 0 ? `${d.atraso_minutos}m` : '0m'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                background: d.estado === 'Presente' ? 'rgba(74, 222, 128, 0.15)' : d.estado === 'Atraso' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                                color: d.estado === 'Presente' ? '#4ade80' : d.estado === 'Atraso' ? '#f87171' : '#9ca3af'
                              }}>
                                {d.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONFIGURACIÓN DE HORARIOS (ADMIN) */}
        {/* ========================================================================= */}
        {activeTab === 'horarios' && user?.rol === 'administrador' && (
          <motion.div
            key="horarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Entrada 1 (Mañana)</th>
                    <th>Salida 1 (Almuerzo)</th>
                    <th>Entrada 2 (Tarde)</th>
                    <th>Salida 2 (Jornada)</th>
                    <th style={{ textAlign: 'center' }}>Horas/Día</th>
                    <th style={{ textAlign: 'center' }}>Tolerancia</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {horariosList.map(h => (
                    <tr key={h.usuario_id}>
                      <td><b style={{ color: '#f3f4f6' }}>{h.nombre_usuario}</b></td>
                      <td><span className="badge">{h.hora_entrada_1}</span></td>
                      <td><span className="badge">{h.hora_salida_1}</span></td>
                      <td><span className="badge">{h.hora_entrada_2}</span></td>
                      <td><span className="badge">{h.hora_salida_2}</span></td>
                      <td style={{ textAlign: 'center' }}>{h.horas_diarias_esperadas}h</td>
                      <td style={{ textAlign: 'center' }}>{h.tolerancia_minutos} min</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleOpenEditHorario(h)}>
                          ✏️ Configurar Horario
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MODAL EDITAR HORARIO */}
            {modalHorarioOpen && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <div className="glass" style={{ background: '#111827', width: '100%', maxWidth: '550px', borderRadius: '20px', padding: '28px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px' }}>
                    Configurar Horario de: <span style={{ color: '#60a5fa' }}>{horarioEdit.nombre_usuario}</span>
                  </h3>

                  <form onSubmit={handleSaveHorario}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Entrada Mañana:</label>
                        <input
                          type="time"
                          className="input"
                          value={horarioEdit.hora_entrada_1}
                          onChange={(e) => setHorarioEdit({ ...horarioEdit, hora_entrada_1: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Salida Almuerzo:</label>
                        <input
                          type="time"
                          className="input"
                          value={horarioEdit.hora_salida_1}
                          onChange={(e) => setHorarioEdit({ ...horarioEdit, hora_salida_1: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Entrada Tarde:</label>
                        <input
                          type="time"
                          className="input"
                          value={horarioEdit.hora_entrada_2}
                          onChange={(e) => setHorarioEdit({ ...horarioEdit, hora_entrada_2: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Salida Jornada:</label>
                        <input
                          type="time"
                          className="input"
                          value={horarioEdit.hora_salida_2}
                          onChange={(e) => setHorarioEdit({ ...horarioEdit, hora_salida_2: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Horas Esperadas/Día:</label>
                        <input
                          type="number"
                          step="0.5"
                          className="input"
                          value={horarioEdit.horas_diarias_esperadas}
                          onChange={(e) => setHorarioEdit({ ...horarioEdit, horas_diarias_esperadas: parseFloat(e.target.value) || 8 })}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tolerancia Atraso (min):</label>
                        <input
                          type="number"
                          className="input"
                          value={horarioEdit.tolerancia_minutos}
                          onChange={(e) => setHorarioEdit({ ...horarioEdit, tolerancia_minutos: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Días Laborables:</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                          { num: 1, label: 'Lun' },
                          { num: 2, label: 'Mar' },
                          { num: 3, label: 'Mié' },
                          { num: 4, label: 'Jue' },
                          { num: 5, label: 'Vie' },
                          { num: 6, label: 'Sáb' },
                          { num: 7, label: 'Dom' },
                        ].map(d => (
                          <button
                            key={d.num}
                            type="button"
                            onClick={() => toggleDiaLaborable(d.num)}
                            className={`btn ${isDiaLaborable(d.num) ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setModalHorarioOpen(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>Guardar Horario</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Asistencia;
