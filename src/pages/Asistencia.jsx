import React, { useState, useEffect } from 'react';
import { asistenciaService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [activeTab, setActiveTab] = useState('registrar');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, checking, out_of_range, ready, success, error, success_exit
  const [distance, setDistance] = useState(null);
  const [coords, setCoords] = useState(null);
  
  const [dailyStatus, setDailyStatus] = useState({
    ha_entrado: false,
    ha_salido: false,
    puede_salir: false,
    mensaje_restriccion: null
  });

  // Estados para Admin
  const [asistencias, setAsistencias] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'admin' && user?.rol === 'administrador') {
      fetchAsistencias();
    }
  }, [activeTab, filtroFecha]);

  const fetchStatus = async () => {
    try {
      const res = await asistenciaService.getEstadoHoy();
      setDailyStatus(res.data);
      if (res.data.ha_salido) {
        setStatus('success_exit');
      } else if (res.data.ha_entrado) {
        setStatus('idle'); // Reutilizamos idle pero el texto cambiará según dailyStatus
      }
    } catch (err) {
      console.error("Error al obtener estado:", err);
    }
  };

  const fetchAsistencias = async () => {
    try {
      setLoading(true);
      const res = await asistenciaService.listar(filtroFecha, filtroFecha);
      setAsistencias(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
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
        alert("Error al obtener ubicación. Asegúrate de dar permisos de GPS.");
      },
      { enableHighAccuracy: true }
    );
  };

  const registrarAccion = async () => {
    try {
      setLoading(true);
      
      let biometriaOk = false;
      if (window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const options = {
            publicKey: {
              challenge,
              rp: { name: "Opsatel" },
              user: {
                id: new Uint8Array(16),
                name: user.username,
                displayName: user.username
              },
              pubKeyCredParams: [{ type: "public-key", alg: -7 }],
              timeout: 60000,
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
              }
            }
          };
          await navigator.credentials.create(options);
          biometriaOk = true;
        } catch (e) {
          alert("❌ Error de validación biométrica.");
          setLoading(false);
          return;
        }
      }

      const payload = {
        ubicacion: `${coords.lat}, ${coords.lng}`,
        distancia_metros: distance,
        dispositivo_info: navigator.userAgent,
        biometria_validada: biometriaOk,
        hora_dispositivo: new Date().toLocaleTimeString('es-EC', { hour12: false })
      };

      if (!dailyStatus.ha_entrado) {
        await asistenciaService.registrar(payload);
        alert("✅ Entrada registrada correctamente");
      } else {
        await asistenciaService.registrarSalida(payload);
        alert("✅ Salida registrada correctamente");
      }
      
      fetchStatus(); // Actualizar estado después de registrar
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || "No se pudo procesar"));
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card glass asistencia-container" style={{ minHeight: '80vh', padding: '24px' }}>
      <div className="asistencia-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Control de Asistencia</h1>
          <p style={{ color: 'var(--text-muted)' }}>Registro de entrada y salida basado en ubicación y biometría.</p>
        </div>
        
        {user?.rol === 'administrador' && (
          <div className="glass asistencia-tabs" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px' }}>
            <button 
              onClick={() => setActiveTab('registrar')}
              className={`btn ${activeTab === 'registrar' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem', flex: 1 }}
            >
              Registrar
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem', flex: 1 }}
            >
              Reportes
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'registrar' ? (
          <motion.div 
            key="registrar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="asistencia-card-wrapper"
            style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}
          >
            <div className="glass asistencia-main-card" style={{ padding: '40px 20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                {status === 'idle' && (dailyStatus.ha_entrado ? '🏠' : '📍')}
                {status === 'checking' && '⏳'}
                {status === 'ready' && '🔓'}
                {status === 'out_of_range' && '🚫'}
                {status === 'success' && '✅'}
                {status === 'success_exit' && '👋'}
                {status === 'error' && '❌'}
              </div>

              {status === 'idle' && (
                <>
                  {!dailyStatus.ha_entrado ? (
                    <>
                      <h3>Listo para registrar Entrada</h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Debes estar en la oficina para activar tu asistencia.</p>
                      <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={checkLocation}>
                        Verificar Ubicación
                      </button>
                    </>
                  ) : !dailyStatus.ha_salido ? (
                    <>
                      <h3>Listo para registrar Salida</h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>Entrada registrada a las: <b>{dailyStatus.hora_entrada}</b></p>
                      
                      {!dailyStatus.puede_salir ? (
                        <div className="glass" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
                          <p style={{ color: '#f87171', margin: 0, fontSize: '0.9rem' }}>{dailyStatus.mensaje_restriccion}</p>
                        </div>
                      ) : (
                        <p style={{ color: '#4ade80', marginBottom: '24px' }}>Cumpliste el tiempo mínimo. Ya puedes registrar tu salida.</p>
                      )}

                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '16px' }} 
                        onClick={checkLocation}
                        disabled={!dailyStatus.puede_salir}
                      >
                        Verificar Ubicación para Salida
                      </button>
                    </>
                  ) : null}
                </>
              )}

              {status === 'checking' && (
                <p>Obteniendo ubicación precisa...</p>
              )}

              {status === 'out_of_range' && (
                <>
                  <h3 style={{ color: '#f87171' }}>Fuera de Rango</h3>
                  <p style={{ marginBottom: '8px' }}>Te encuentras a <b>{Math.round(distance)} metros</b> de la oficina.</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>El rango máximo es de {MAX_DISTANCE} metros.</p>
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={checkLocation}>Reintentar</button>
                </>
              )}

              {status === 'ready' && (
                <>
                  <h3 style={{ color: '#4ade80' }}>Ubicación Validada</h3>
                  <p style={{ marginBottom: '24px' }}>Estás a {Math.round(distance)}m. Procede con la validación de huella.</p>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }} 
                    onClick={registrarAccion}
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : (dailyStatus.ha_entrado ? 'Registrar Salida' : 'Registrar Entrada')}
                  </button>
                </>
              )}

              {status === 'success' && (
                <>
                  <h3 style={{ color: '#4ade80' }}>Entrada Completada</h3>
                  <p>Has registrado tu entrada correctamente hoy.</p>
                </>
              )}

              {status === 'success_exit' && (
                <>
                  <h3 style={{ color: '#4ade80' }}>Salida Completada</h3>
                  <p>Has registrado tu jornada de hoy. ¡Hasta pronto!</p>
                </>
              )}
            </div>

            <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Ubicación requerida: 2°55'19.2"S 79°03'59.2"W (Oficina Central)
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="admin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="asistencia-filters" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                className="input"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                style={{ flex: '1', minWidth: '150px', maxWidth: '300px', marginBottom: 0 }}
              />
              <button className="btn btn-secondary" onClick={fetchAsistencias} style={{ flex: '1', maxWidth: '120px' }}>Actualizar</button>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Distancia</th>
                    <th>Biometría</th>
                    <th>Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No hay registros para este día.</td></tr>
                  ) : asistencias.map(a => (
                    <tr key={a.id}>
                      <td><div style={{ fontWeight: 'bold' }}>{a.nombre_usuario}</div></td>
                      <td>{a.hora_entrada}</td>
                      <td>{a.hora_salida || '--:--'}</td>
                      <td>{Math.round(a.distance_meters || a.distancia_metros)}m</td>
                      <td>{a.biometria_validada && (a.hora_salida ? a.biometria_salida_validada : true) ? '✅' : '❌'}</td>
                      <td style={{ fontSize: '0.7rem', opacity: 0.6, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.dispositivo_info}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 600px) {
          .asistencia-header {
            flex-direction: column;
            text-align: center;
            align-items: center !important;
          }
          .asistencia-tabs {
            width: 100%;
          }
          .asistencia-main-card {
            padding: 30px 15px !important;
          }
          .asistencia-filters {
            flex-direction: column;
          }
          .asistencia-filters input, .asistencia-filters button {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Asistencia;
