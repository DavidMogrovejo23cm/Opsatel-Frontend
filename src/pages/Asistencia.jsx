import React, { useState, useEffect } from 'react';
import { asistenciaService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_LAT = -2.922000;
const TARGET_LNG = -79.066444;
const MAX_DISTANCE = 10; // 10 metros exactos según requerimiento

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
  const [status, setStatus] = useState('idle'); // idle, checking, out_of_range, ready, success, error
  const [distance, setDistance] = useState(null);
  const [coords, setCoords] = useState(null);
  
  // Estados para Admin
  const [asistencias, setAsistencias] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (activeTab === 'admin' && user?.rol === 'administrador') {
      fetchAsistencias();
    }
  }, [activeTab, filtroFecha]);

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

  const registrarAsistencia = async () => {
    try {
      setLoading(true);
      
      let biometriaOk = false;

      // Intentar validación biométrica real
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
          console.error("Error en biometría:", e);
          // Si el usuario cancela o el dispositivo no soporta, biometriaOk sigue en false
          // pero igual permitimos el registro si el admin lo desea, o podemos bloquearlo.
          // El usuario pidió que pida permiso de huella, así que si falla lanzamos error.
          alert("❌ Error de validación biométrica. Asegúrate de usar tu huella o reconocimiento facial.");
          setLoading(false);
          return;
        }
      }

      const payload = {
        ubicacion: `${coords.lat}, ${coords.lng}`,
        distancia_metros: distance,
        dispositivo_info: navigator.userAgent,
        biometria_validada: biometriaOk
      };

      await asistenciaService.registrar(payload);
      setStatus('success');
      alert("✅ Asistencia registrada correctamente");
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || "No se pudo registrar"));
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
          <p style={{ color: 'var(--text-muted)' }}>Registro de entrada basado en ubicación y biometría.</p>
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
                {status === 'idle' && '📍'}
                {status === 'checking' && '⏳'}
                {status === 'ready' && '🔓'}
                {status === 'out_of_range' && '🚫'}
                {status === 'success' && '✅'}
                {status === 'error' && '❌'}
              </div>

              {status === 'idle' && (
                <>
                  <h3>Listo para registrar</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Debes estar en la oficina para activar tu asistencia.</p>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={checkLocation}>
                    Verificar Ubicación
                  </button>
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
                    onClick={registrarAsistencia}
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : 'Registrar con Huella'}
                  </button>
                </>
              )}

              {status === 'success' && (
                <>
                  <h3 style={{ color: '#4ade80' }}>Asistencia Completada</h3>
                  <p>Has registrado tu entrada correctamente hoy.</p>
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
                    <th>Hora Entrada</th>
                    <th>Distancia</th>
                    <th>Biometría</th>
                    <th>Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No hay registros para este día.</td></tr>
                  ) : asistencias.map(a => (
                    <tr key={a.id}>
                      <td><div style={{ fontWeight: 'bold' }}>{a.nombre_usuario}</div></td>
                      <td>{a.hora_entrada}</td>
                      <td>{Math.round(a.distance_meters || a.distancia_metros)}m</td>
                      <td>{a.biometria_validada ? '✅' : '❌'}</td>
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
