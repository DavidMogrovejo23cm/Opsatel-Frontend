import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, LabelList, AreaChart, Area, Legend,
  PieChart, Pie
} from 'recharts';
import { balanceService } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// PALETA
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  ingreso: '#10b981', egreso: '#f43f5e', proyecto: '#f59e0b',
  internet: '#0ea5e9', iptv: '#ec4899', extras: '#8b5cf6',
  adic: '#14b8a6', balance: '#6366f1',
  cat: { operacional: '#f59e0b', nomina: '#0ea5e9', proyecto: '#8b5cf6', otro: '#94a3b8' }
};

const CATEGORIAS    = ['operacional', 'nomina', 'proyecto', 'otro'];
const CAT_LABELS    = { operacional: '⚙️ Operacional', nomina: '👔 Nómina', proyecto: '🏗️ Proyecto', otro: '📦 Otro' };
const METODOS       = ['Efectivo', 'Pichincha', 'JEP', 'Datatfast', 'Otro'];
const ESTADOS_PROY  = ['En progreso', 'Completado', 'Pausado'];

// Subcategorías predefinidas para proyectos (editable como texto libre)
const SUBCATS_PROY  = ['VIATICOS', 'CONSTRUCCION', 'COMPRAS', 'HERRAJERIA', 'VARIOS', 'INVERSIONISTA', 'TECNICO CAMPO', 'ADMINISTRATIVO'];
// Subcategorías predefinidas para egresos generales
const SUBCATS_EGR   = ['VIATICOS', 'NOMINA', 'SERVICIOS', 'EQUIPOS', 'MANTENIMIENTO', 'CONSTRUCCION', 'COMPRAS', 'ADMINISTRATIVO', 'OTROS'];

const now         = new Date();
const DEFAULT_MES = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const DEFAULT_ANIO = now.getFullYear();

const fmt   = n   => `$${Number(n || 0).toFixed(2)}`;
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES UI
// ─────────────────────────────────────────────────────────────────────────────
function Card({ title, value, icon, color, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}44`,
        borderLeft: `4px solid ${color}`, borderRadius: 16, padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.6rem' }}>{icon}</span>
        <span style={{ color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </motion.div>
  );
}

function SectionTitle({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 32 }}>
      <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'white' }}>{text}</h3>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)', marginLeft: 12 }} />
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}22`, color, border: `1px solid ${color}44` }}>{text}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL GENÉRICO
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, maxWidth = 560, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'linear-gradient(145deg,#1a1040,#1e1550)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 28,
          width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// Estilos de input reutilizables
const IS = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'white', fontSize: '0.9rem', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'Outfit, sans-serif',
};

// ─────────────────────────────────────────────────────────────────────────────
// EGRESO FORM  (con campo "en qué se gastó")
// ─────────────────────────────────────────────────────────────────────────────
function EgresoForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    descripcion: '', categoria: 'operacional', subcategoria: '',
    monto: '', fecha: DEFAULT_MES + '-01', mes: DEFAULT_MES,
    metodo_pago: 'Efectivo', notas: ''
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.descripcion || !form.monto) return alert('Completa descripción y monto.');
    const mes = form.fecha?.slice(0, 7) || DEFAULT_MES;
    await onSave({ ...form, monto: parseFloat(form.monto), mes });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Descripción</label>
        <input style={IS} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required placeholder="Ej: Compra de cables…" />
      </div>

      {/* Subcategoría — EN QUÉ SE GASTÓ */}
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>
          📌 En qué se gastó (subcategoría)
        </label>
        <input
          style={IS} list="subcats-egr"
          value={form.subcategoria}
          onChange={e => set('subcategoria', e.target.value)}
          placeholder="Ej: VIATICOS, NOMINA, EQUIPOS…"
        />
        <datalist id="subcats-egr">
          {SUBCATS_EGR.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Categoría</label>
          <select style={IS} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Monto ($)</label>
          <input style={IS} type="number" step="0.01" min="0" value={form.monto} onChange={e => set('monto', e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha</label>
          <input style={IS} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Método de Pago</label>
          <select style={IS} value={form.metodo_pago} onChange={e => set('metodo_pago', e.target.value)}>
            {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Notas (opcional)</label>
        <textarea style={{ ...IS, resize: 'vertical', minHeight: 56 }} value={form.notas} onChange={e => set('notas', e.target.value)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROYECTO FORM
// ─────────────────────────────────────────────────────────────────────────────
function ProyectoForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    nombre: '', descripcion: '', monto_total: '', monto_invertido: '0',
    estado: 'En progreso', fecha_inicio: DEFAULT_MES + '-01', fecha_fin: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nombre || !form.monto_total) return alert('Completa nombre y monto total.');
    await onSave({ ...form, monto_total: parseFloat(form.monto_total), monto_invertido: parseFloat(form.monto_invertido || 0) });
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Nombre del Proyecto</label>
        <input style={IS} value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
      </div>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Descripción</label>
        <textarea style={{ ...IS, resize: 'vertical', minHeight: 56 }} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Monto Total ($)</label>
          <input style={IS} type="number" step="0.01" min="0" value={form.monto_total} onChange={e => set('monto_total', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Invertido hasta ahora ($)</label>
          <input style={IS} type="number" step="0.01" min="0" value={form.monto_invertido} onChange={e => set('monto_invertido', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Estado</label>
          <select style={IS} value={form.estado} onChange={e => set('estado', e.target.value)}>
            {ESTADOS_PROY.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha Inicio</label>
          <input style={IS} type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha Fin</label>
          <input style={IS} type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGO PROYECTO FORM (cuotas / aportes)
// ─────────────────────────────────────────────────────────────────────────────
function PagoProyectoForm({ initial, proyId, onSave, onClose }) {
  const [form, setForm] = useState(initial || { item: 1, descripcion: '', fecha: '', tipo_pago: 'Pichincha', valor: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.descripcion || !form.valor) return alert('Completa descripción y valor.');
    await onSave({ ...form, valor: parseFloat(form.valor), item: parseInt(form.item) });
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>N° Pago</label>
          <input style={IS} type="number" min="1" value={form.item} onChange={e => set('item', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Descripción</label>
          <input style={IS} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required placeholder="1ER PAGO, 2DO PAGO…" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha</label>
          <input style={IS} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Tipo de Pago</label>
          <select style={IS} value={form.tipo_pago} onChange={e => set('tipo_pago', e.target.value)}>
            {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Valor ($)</label>
          <input style={IS} type="number" step="0.01" min="0" value={form.valor} onChange={e => set('valor', e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GASTO PROYECTO FORM (nóminas internas por subcategoría)
// ─────────────────────────────────────────────────────────────────────────────
function GastoProyectoForm({ initial, proyId, onSave, onClose }) {
  const [form, setForm] = useState(initial || { subcategoria: 'VIATICOS', item: 1, descripcion: '', fecha: '', tipo_pago: 'Pichincha', valor: '', pendiente: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.descripcion || !form.valor) return alert('Completa descripción y valor.');
    await onSave({ ...form, valor: parseFloat(form.valor), item: parseInt(form.item) });
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Subcategoría (en qué se gastó)</label>
          <input style={IS} list="subcats-proy" value={form.subcategoria} onChange={e => set('subcategoria', e.target.value)} required />
          <datalist id="subcats-proy">
            {SUBCATS_PROY.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Ítem</label>
          <input style={IS} type="number" min="1" value={form.item} onChange={e => set('item', e.target.value)} />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Descripción</label>
        <input style={IS} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required placeholder="Ej: Almuerzos técnicos con gasolina…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha</label>
          <input style={IS} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Tipo de Pago</label>
          <input style={IS} list="tipos-pago-proy" value={form.tipo_pago} onChange={e => set('tipo_pago', e.target.value)} />
          <datalist id="tipos-pago-proy">
            {METODOS.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Valor ($)</label>
          <input style={IS} type="number" step="0.01" min="0" value={form.valor} onChange={e => set('valor', e.target.value)} required />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', marginTop: 2 }}>
        <input type="checkbox" checked={form.pendiente} onChange={e => set('pendiente', e.target.checked)}
          style={{ width: 16, height: 16, accentColor: P.egreso }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>Pendiente de pago</span>
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROYECTO DETALLE (modal con nóminas internas)
// ─────────────────────────────────────────────────────────────────────────────
function ProyectoDetalle({ proyecto, onClose }) {
  const [tab, setTab]             = useState('pagos');   // 'pagos' | 'gastos'
  const [pagos, setPagos]         = useState([]);
  const [gastos, setGastos]       = useState({ grupos: {}, total: 0, flat: [] });
  const [modalPago, setModalPago] = useState(null);
  const [modalGasto, setModalGasto] = useState(null);
  const [loadingP, setLoadingP]   = useState(false);
  const [loadingG, setLoadingG]   = useState(false);

  const fetchPagos = useCallback(async () => {
    setLoadingP(true);
    try { const r = await balanceService.listarPagosProyecto(proyecto.id); setPagos(r.data); }
    catch(e){ console.error(e); }
    setLoadingP(false);
  }, [proyecto.id]);

  const fetchGastos = useCallback(async () => {
    setLoadingG(true);
    try { const r = await balanceService.listarGastosProyecto(proyecto.id); setGastos(r.data); }
    catch(e){ console.error(e); }
    setLoadingG(false);
  }, [proyecto.id]);

  useEffect(() => { fetchPagos(); fetchGastos(); }, [fetchPagos, fetchGastos]);

  const savePago = async data => {
    if (data.id) await balanceService.actualizarPagoProyecto(proyecto.id, data.id, data);
    else          await balanceService.crearPagoProyecto(proyecto.id, data);
    fetchPagos();
  };
  const deletePago = async id => {
    if (!window.confirm('¿Eliminar este pago?')) return;
    await balanceService.eliminarPagoProyecto(proyecto.id, id);
    fetchPagos();
  };

  const saveGasto = async data => {
    if (data.id) await balanceService.actualizarGastoProyecto(proyecto.id, data.id, data);
    else          await balanceService.crearGastoProyecto(proyecto.id, data);
    fetchGastos();
  };
  const deleteGasto = async id => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    await balanceService.eliminarGastoProyecto(proyecto.id, id);
    fetchGastos();
  };

  const totalPagos  = pagos.reduce((s, p) => s + parseFloat(p.valor || 0), 0);
  const estadoColor = proyecto.estado === 'Completado' ? P.ingreso : proyecto.estado === 'Pausado' ? P.egreso : P.proyecto;
  const pct         = proyecto.monto_total > 0 ? Math.min(100, (proyecto.monto_invertido / proyecto.monto_total) * 100) : 0;

  const th = (label, right = false) => (
    <th style={{ padding: '10px 12px', textAlign: right ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{label}</th>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px', overflowY: 'auto' }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'linear-gradient(145deg,#130d35,#1a1040)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24,
          width: '100%', maxWidth: 900, padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: '1.4rem' }}>🏗️</span>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{proyecto.nombre}</h2>
              <Badge text={proyecto.estado} color={estadoColor} />
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{proyecto.descripcion || 'Sin descripción'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1.3rem', cursor: 'pointer', borderRadius: 10, padding: '6px 12px', lineHeight: 1 }}>&times;</button>
        </div>

        {/* KPIs del proyecto */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Presupuesto',   value: fmt(proyecto.monto_total),     color: P.balance },
            { label: 'Total Aportes', value: fmt(totalPagos),               color: P.ingreso },
            { label: 'Costo Gastos',  value: fmt(gastos.total),             color: P.egreso },
            { label: 'Avance',        value: `${pct.toFixed(1)}%`,          color: P.proyecto },
          ].map(k => (
            <div key={k.label} style={{ background: `${k.color}12`, border: `1px solid ${k.color}33`, borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
        {/* Barra de progreso */}
        <div style={{ height: 7, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 24 }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
            style={{ height: '100%', background: `linear-gradient(90deg,${P.proyecto},#d97706)`, borderRadius: 99 }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['pagos','💳 Pagos al Proyecto'],['gastos','📊 Gastos Generales']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', fontWeight: 600,
              border: tab === id ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.06)',
              background: tab === id ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.03)',
              color: tab === id ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        {/* ── TAB PAGOS ── */}
        {tab === 'pagos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cuotas / aportes registrados</span>
              <button onClick={() => setModalPago('crear')} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}>＋ Agregar Pago</button>
            </div>
            {loadingP ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Cargando…</p> : (
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {[['Ítem'],['Descripción'],['Fecha'],['Tipo de Pago'],['Valor','right'],['',]].map(([h, r], i) => (
                        <th key={i} style={{ padding: '10px 12px', textAlign: r ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No hay pagos registrados.</td></tr>
                    ) : pagos.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '9px 12px', color: P.balance, fontWeight: 700 }}>{p.item}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600 }}>{p.descripcion}</td>
                        <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{p.fecha || '—'}</td>
                        <td style={{ padding: '9px 12px' }}><Badge text={p.tipo_pago} color="#fbbf24" /></td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: P.ingreso, fontWeight: 800 }}>{fmt(p.valor)}</td>
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => setModalPago(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginRight: 6 }}>✏️</button>
                          <button onClick={() => deletePago(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(99,102,241,0.07)', borderTop: '2px solid rgba(99,102,241,0.3)' }}>
                      <td colSpan={4} style={{ padding: '11px 12px', fontWeight: 800, color: P.balance }}>TOTAL PICHINCHA</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 900, color: P.ingreso, fontSize: '1rem' }}>{fmt(totalPagos)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB GASTOS ── */}
        {tab === 'gastos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gastos generales agrupados por categoría</span>
              <button onClick={() => setModalGasto('crear')} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}>＋ Agregar Gasto</button>
            </div>
            {loadingG ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Cargando…</p> : (
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Subcategoría</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Ítem</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Descripción</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Fecha</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Tipo Pago</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastos.flat.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No hay gastos registrados.</td></tr>
                    ) : (() => {
                      // Renderizar filas con separadores por subcategoría
                      const rows = [];
                      let lastSubcat = null;
                      let subcatTotal = 0;
                      let subcatItems = [];

                      const flushSubcat = () => {
                        if (lastSubcat !== null) {
                          rows.push(
                            <tr key={`sub-${lastSubcat}`} style={{ background: 'rgba(245,158,11,0.08)', borderTop: '1px solid rgba(245,158,11,0.2)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
                              <td colSpan={5} style={{ padding: '7px 12px', fontWeight: 800, color: P.proyecto, fontSize: '0.8rem' }}>SUBTOTAL {lastSubcat}</td>
                              <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 900, color: P.proyecto }}>{fmt(subcatTotal)}</td>
                              <td />
                            </tr>
                          );
                        }
                      };

                      gastos.flat.forEach((g, i) => {
                        if (g.subcategoria !== lastSubcat) {
                          flushSubcat();
                          lastSubcat = g.subcategoria;
                          subcatTotal = 0;
                          rows.push(
                            <tr key={`hdr-${g.subcategoria}-${i}`} style={{ background: 'rgba(99,102,241,0.08)' }}>
                              <td colSpan={7} style={{ padding: '8px 12px', fontWeight: 900, color: P.balance, fontSize: '0.82rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                                ▶ {g.subcategoria}
                              </td>
                            </tr>
                          );
                        }
                        if (!g.pendiente) subcatTotal += parseFloat(g.valor || 0);
                        rows.push(
                          <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '8px 12px' }}>
                              {g.pendiente && <Badge text="PENDIENTE" color={P.egreso} />}
                            </td>
                            <td style={{ padding: '8px 12px', color: P.balance, fontWeight: 700 }}>{g.item}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 500 }}>{g.descripcion}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{g.fecha || '—'}</td>
                            <td style={{ padding: '8px 12px' }}><Badge text={g.tipo_pago || '—'} color="#fbbf24" /></td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: g.pendiente ? 'var(--text-muted)' : P.egreso, fontWeight: 700, textDecoration: g.pendiente ? 'line-through' : 'none' }}>
                              {fmt(g.valor)}
                            </td>
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              <button onClick={() => setModalGasto(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginRight: 6 }}>✏️</button>
                              <button onClick={() => deleteGasto(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
                            </td>
                          </tr>
                        );
                      });
                      flushSubcat();
                      return rows;
                    })()}
                    <tr style={{ background: 'rgba(244,63,94,0.07)', borderTop: '2px solid rgba(244,63,94,0.3)' }}>
                      <td colSpan={5} style={{ padding: '12px', fontWeight: 900, color: P.egreso }}>TOTAL PICHINCHA</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: P.egreso, fontSize: '1rem' }}>{fmt(gastos.total)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Sub-modales */}
      {modalPago !== null && (
        <Modal title={modalPago === 'crear' ? '➕ Nuevo Pago' : '✏️ Editar Pago'} onClose={() => setModalPago(null)}>
          <PagoProyectoForm initial={modalPago !== 'crear' ? { ...modalPago } : null}
            proyId={proyecto.id} onSave={savePago} onClose={() => setModalPago(null)} />
        </Modal>
      )}
      {modalGasto !== null && (
        <Modal title={modalGasto === 'crear' ? '➕ Nuevo Gasto' : '✏️ Editar Gasto'} onClose={() => setModalGasto(null)}>
          <GastoProyectoForm initial={modalGasto !== 'crear' ? { ...modalGasto } : null}
            proyId={proyecto.id} onSave={saveGasto} onClose={() => setModalGasto(null)} />
        </Modal>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const Balance = () => {
  const [vista, setVista]           = useState('mensual');
  const [mes, setMes]               = useState(DEFAULT_MES);
  const [anio, setAnio]             = useState(DEFAULT_ANIO);
  const [report, setReport]         = useState(null);
  const [reportAnual, setReportAnual] = useState(null);
  const [egresos, setEgresos]       = useState([]);
  const [proyectos, setProyectos]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [modalEgreso, setModalEgreso] = useState(null);
  const [modalProy, setModalProy]   = useState(null);
  const [proyDetalle, setProyDetalle] = useState(null);   // proyecto seleccionado para detalle

  // ── FETCH ──
  const fetchMensual  = useCallback(async () => { setLoading(true); try { const r = await balanceService.reporteMensual(mes); setReport(r.data); } catch(e){} setLoading(false); }, [mes]);
  const fetchAnual    = useCallback(async () => { setLoading(true); try { const r = await balanceService.reporteAnual(anio); setReportAnual(r.data); } catch(e){} setLoading(false); }, [anio]);
  const fetchEgresos  = useCallback(async () => { try { const r = await balanceService.listarEgresos(); setEgresos(r.data); } catch(e){} }, []);
  const fetchProyectos = useCallback(async () => { try { const r = await balanceService.listarProyectos(); setProyectos(r.data); } catch(e){} }, []);

  useEffect(() => { if (vista==='mensual')  fetchMensual();  }, [vista, fetchMensual]);
  useEffect(() => { if (vista==='anual')    fetchAnual();    }, [vista, fetchAnual]);
  useEffect(() => { if (vista==='egresos')  fetchEgresos();  }, [vista, fetchEgresos]);
  useEffect(() => { if (vista==='proyectos') fetchProyectos(); }, [vista, fetchProyectos]);

  const handleSaveEgreso = async data => {
    if (data.id) await balanceService.actualizarEgreso(data.id, data);
    else          await balanceService.crearEgreso(data);
    fetchEgresos(); if (vista==='mensual') fetchMensual();
  };
  const handleDeleteEgreso = async id => {
    if (!window.confirm('¿Eliminar este egreso?')) return;
    await balanceService.eliminarEgreso(id);
    fetchEgresos(); if (vista==='mensual') fetchMensual();
  };
  const handleSaveProy = async data => {
    if (data.id) await balanceService.actualizarProyecto(data.id, data);
    else          await balanceService.crearProyecto(data);
    fetchProyectos();
  };
  const handleDeleteProy = async id => {
    if (!window.confirm('¿Eliminar este proyecto y todos sus datos?')) return;
    await balanceService.eliminarProyecto(id);
    fetchProyectos();
  };

  const Tab = ({ id, label, icon }) => (
    <button id={`tab-balance-${id}`} onClick={() => setVista(id)} style={{
      padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
      fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', fontWeight: 600,
      border: vista===id ? '1px solid rgba(255,255,255,0.22)' : '1px solid transparent',
      background: vista===id ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.03)',
      color: vista===id ? '#fff' : 'rgba(255,255,255,0.55)',
      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7,
    }}>
      <span>{icon}</span>{label}
    </button>
  );

  const tooltipStyle = {
    contentStyle: { background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 },
    itemStyle: { color: '#e2e8f0' }, labelStyle: { color: '#94a3b8', fontWeight: 700 },
  };

  // ─────────────────────────────────────────────────────────────────
  // VISTA MENSUAL
  // ─────────────────────────────────────────────────────────────────
  const renderMensual = () => {
    if (!report) return null;
    const { ingresos, egresos: egData, proyectos: proyData, balance_neto } = report;
    const pieIngr = [
      { name: 'Internet', value: ingresos.internet.total, color: P.internet },
      { name: 'IP TV',    value: ingresos.iptv.total,    color: P.iptv },
      { name: 'Adicional',value: ingresos.adicional,     color: P.adic },
      { name: 'Extras',   value: ingresos.extras.total,  color: P.extras },
    ].filter(x => x.value > 0);
    const barData = [
      { name:'Ingresos', total: ingresos.total,   fill: P.ingreso },
      { name:'Egresos',  total: egData.total,     fill: P.egreso },
      { name:'Proyectos',total: proyData.total,   fill: P.proyecto },
      { name:'Balance',  total: Math.abs(balance_neto), fill: balance_neto>=0 ? P.ingreso : P.egreso },
    ];
    const [mesNum, anioStr] = mes.split('-');
    const mesLabel = MONTH_NAMES[parseInt(mesNum,10)-1] + ' ' + anioStr;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Mes:</label>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', outline: 'none' }} />
          <button onClick={fetchMensual} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem' }}>Cargar</button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📅 {mesLabel}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
          <Card icon="📥" title="Ingresos" color={P.ingreso} value={fmt(ingresos.total)} />
          <Card icon="📤" title="Egresos"  color={P.egreso}  value={fmt(egData.total)} />
          <Card icon="🏗️" title="Proyectos" color={P.proyecto} value={fmt(proyData.total)} />
          <Card icon={balance_neto>=0?'💚':'🔴'} title="Balance Neto"
            color={balance_neto>=0?P.ingreso:P.egreso} value={fmt(balance_neto)}
            sub={balance_neto>=0?'Superávit':'Déficit'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
            <h4 style={{ margin: '0 0 18px', fontSize: '0.95rem' }}>📊 Resumen Financiero</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 16, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => '$'+v} />
                <ReTooltip {...tooltipStyle} formatter={v => fmt(v)} />
                <Bar dataKey="total" radius={[8,8,0,0]} barSize={38}>
                  {barData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                  <LabelList dataKey="total" position="top" fill="#e2e8f0" fontSize={12} formatter={fmt} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
            <h4 style={{ margin: '0 0 18px', fontSize: '0.95rem' }}>🥧 Desglose de Ingresos</h4>
            {pieIngr.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieIngr} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {pieIngr.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <ReTooltip {...tooltipStyle} formatter={v => fmt(v)} />
                  <Legend iconType="circle" iconSize={10} formatter={(v,e) => <span style={{ color:'#e2e8f0', fontSize:'0.8rem' }}>{v}: {fmt(e.payload.value)}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60 }}>Sin ingresos este mes</div>}
          </div>
        </div>

        {/* Ingresos desglosados */}
        <SectionTitle icon="💰" text="Desglose de Ingresos" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: '🌐 Internet', total: ingresos.internet.total, color: P.internet, rows: [['Efectivo',ingresos.internet.efectivo,P.ingreso],['Pichincha',ingresos.internet.pichincha,'#fbbf24'],['JEP',ingresos.internet.jep,P.balance]] },
            { label: '📺 IP TV',    total: ingresos.iptv.total,    color: P.iptv,     rows: [['Efectivo',ingresos.iptv.efectivo,P.ingreso],['Pichincha',ingresos.iptv.pichincha,'#fbbf24']] },
            { label: '🌍 Extras',   total: ingresos.extras.total,  color: P.extras,   rows: [['Efectivo',ingresos.extras.efectivo,P.ingreso],['Pichincha',ingresos.extras.pichincha,'#fbbf24'],['JEP',ingresos.extras.jep,P.balance]] },
          ].map(({ label, total, color, rows }) => (
            <div key={label} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 14, padding: 18 }}>
              <div style={{ color, fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>{label} — {fmt(total)}</div>
              {rows.map(([l,v,c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                  <span style={{ color: c, fontWeight: 700 }}>{fmt(v)}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ background: `${P.adic}0d`, border: `1px solid ${P.adic}33`, borderRadius: 14, padding: 18 }}>
            <div style={{ color: P.adic, fontWeight: 700, fontSize: '0.9rem', marginBottom: 8 }}>➕ Adicional — {fmt(ingresos.adicional)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Servicios adicionales cobrados a clientes principales.</div>
          </div>
        </div>

        {/* Egresos del mes */}
        <SectionTitle icon="📤" text="Egresos del Mes" />
        {egData.lista.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 14 }}>
            Sin egresos registrados. <button onClick={() => setVista('egresos')} style={{ background:'none',border:'none',color:P.egreso,cursor:'pointer',fontWeight:700 }}>Agregar uno</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                  {['Descripción','En qué se gastó','Categoría','Fecha','Método','Monto'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {egData.lista.map(eg => (
                  <tr key={eg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{eg.descripcion}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {eg.subcategoria ? <Badge text={eg.subcategoria} color={P.proyecto} /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}><Badge text={CAT_LABELS[eg.categoria] || eg.categoria} color={P.cat[eg.categoria]||'#94a3b8'} /></td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{eg.fecha}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{eg.metodo_pago}</td>
                    <td style={{ padding: '10px 14px', color: P.egreso, fontWeight: 800 }}>{fmt(eg.monto)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(244,63,94,0.05)', fontWeight: 800 }}>
                  <td colSpan={5} style={{ padding: '12px 14px', color: P.egreso }}>TOTAL EGRESOS</td>
                  <td style={{ padding: '12px 14px', color: P.egreso, fontSize: '1rem' }}>{fmt(egData.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Proyectos activos */}
        {proyData.lista.length > 0 && (
          <>
            <SectionTitle icon="🏗️" text="Proyectos Activos" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))', gap: 14 }}>
              {proyData.lista.map(p => {
                const pct = p.monto_total > 0 ? Math.min(100, (p.monto_invertido / p.monto_total) * 100) : 0;
                const ec  = p.estado === 'Completado' ? P.ingreso : p.estado === 'Pausado' ? P.egreso : P.proyecto;
                return (
                  <div key={p.id} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                      <Badge text={p.estado} color={ec} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Invertido:</span>
                      <span style={{ color: P.proyecto, fontWeight: 700 }}>{fmt(p.monto_invertido)} / {fmt(p.monto_total)}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${P.proyecto},#d97706)`, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{pct.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // VISTA ANUAL
  // ─────────────────────────────────────────────────────────────────
  const renderAnual = () => {
    if (!reportAnual) return null;
    const { meses, totales, proyectos: pa } = reportAnual;
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <label style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Año:</label>
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value,10))}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchAnual} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem' }}>Cargar</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
          <Card icon="📥" title="Ingresos Totales" color={P.ingreso} value={fmt(totales.ingresos)} sub={`Año ${anio}`} />
          <Card icon="📤" title="Egresos Totales"  color={P.egreso}  value={fmt(totales.egresos)}  sub={`Año ${anio}`} />
          <Card icon={totales.balance>=0?'💚':'🔴'} title="Balance Anual"
            color={totales.balance>=0?P.ingreso:P.egreso} value={fmt(totales.balance)}
            sub={totales.balance>=0?'Superávit':'Déficit'} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24, marginBottom: 28 }}>
          <h4 style={{ margin: '0 0 18px', fontSize: '0.95rem' }}>📈 Evolución {anio}</h4>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={meses} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={P.ingreso} stopOpacity={0.3}/><stop offset="95%" stopColor={P.ingreso} stopOpacity={0}/></linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={P.egreso}  stopOpacity={0.3}/><stop offset="95%" stopColor={P.egreso}  stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-muted)" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} tickFormatter={v=>'$'+v} />
              <ReTooltip {...tooltipStyle} formatter={v=>fmt(v)} />
              <Legend iconType="circle" iconSize={10} />
              <Area type="monotone" dataKey="ingresos" stroke={P.ingreso} strokeWidth={2.5} fill="url(#gI)" name="Ingresos" />
              <Area type="monotone" dataKey="egresos"  stroke={P.egreso}  strokeWidth={2.5} fill="url(#gE)" name="Egresos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <SectionTitle icon="📋" text="Detalle por Mes" />
        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Mes','Internet','IP TV','Adicional','Extras','Ingresos','Egresos','Balance'].map((h,i) => (
                  <th key={h} style={{ padding: '13px 14px', textAlign: i===0?'left':'right', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <tr key={m.mes} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i%2===0?'transparent':'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>{m.label}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: P.internet }}>{fmt(m.internet)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: P.iptv }}>{fmt(m.iptv)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: P.adic }}>{fmt(m.adicional)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: P.extras }}>{fmt(m.extras)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: P.ingreso }}>{fmt(m.ingresos)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: P.egreso }}>{fmt(m.egresos)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: m.balance>=0?P.ingreso:P.egreso }}>{m.balance>=0?'+':''}{fmt(m.balance)}</td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(99,102,241,0.08)', borderTop: '2px solid rgba(99,102,241,0.3)' }}>
                <td style={{ padding: 14, fontWeight: 800 }}>TOTAL {anio}</td>
                <td colSpan={4} />
                <td style={{ padding: 14, textAlign: 'right', fontWeight: 800, color: P.ingreso }}>{fmt(totales.ingresos)}</td>
                <td style={{ padding: 14, textAlign: 'right', fontWeight: 800, color: P.egreso  }}>{fmt(totales.egresos)}</td>
                <td style={{ padding: 14, textAlign: 'right', fontWeight: 800, color: totales.balance>=0?P.ingreso:P.egreso }}>{totales.balance>=0?'+':''}{fmt(totales.balance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // VISTA EGRESOS
  // ─────────────────────────────────────────────────────────────────
  const renderEgresos = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>📤 Gestión de Egresos</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Registra todos los gastos con su subcategoría.</p>
        </div>
        <button id="btn-nuevo-egreso" onClick={() => setModalEgreso('crear')}
          style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          ＋ Nuevo Egreso
        </button>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Descripción','En qué se gastó','Categoría','Fecha','Mes','Método','Monto',''].map(h => (
                <th key={h} style={{ padding: '13px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {egresos.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No hay egresos registrados.</td></tr>
            ) : egresos.map(eg => (
              <tr key={eg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, maxWidth: 200 }}>{eg.descripcion}</td>
                <td style={{ padding: '10px 14px' }}>
                  {eg.subcategoria ? <Badge text={eg.subcategoria} color={P.proyecto} /> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                </td>
                <td style={{ padding: '10px 14px' }}><Badge text={CAT_LABELS[eg.categoria]||eg.categoria} color={P.cat[eg.categoria]||'#94a3b8'} /></td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{eg.fecha}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{eg.mes}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{eg.metodo_pago}</td>
                <td style={{ padding: '10px 14px', color: P.egreso, fontWeight: 800 }}>{fmt(eg.monto)}</td>
                <td style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
                  <button onClick={() => setModalEgreso(eg)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, color: P.balance, padding: '5px 9px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDeleteEgreso(eg.id)} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: 8, color: P.egreso, padding: '5px 9px', cursor: 'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // VISTA PROYECTOS
  // ─────────────────────────────────────────────────────────────────
  const renderProyectos = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>🏗️ Gestión de Proyectos</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Haz clic en "Ver Detalle" para gestionar los pagos y gastos internos.</p>
        </div>
        <button id="btn-nuevo-proyecto" onClick={() => setModalProy('crear')}
          style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          ＋ Nuevo Proyecto
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 18 }}>
        {proyectos.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 16, gridColumn: '1/-1' }}>No hay proyectos registrados.</div>
        ) : proyectos.map(p => {
          const pct = p.monto_total > 0 ? Math.min(100, (p.monto_invertido / p.monto_total) * 100) : 0;
          const ec  = p.estado === 'Completado' ? P.ingreso : p.estado === 'Pausado' ? P.egreso : P.proyecto;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 18, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', flex: 1 }}>{p.nombre}</div>
                <Badge text={p.estado} color={ec} />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, minHeight: 24 }}>{p.descripcion || 'Sin descripción'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Presupuesto:</span>
                <span style={{ fontWeight: 700 }}>{fmt(p.monto_total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)' }}>Invertido:</span>
                <span style={{ color: P.proyecto, fontWeight: 700 }}>{fmt(p.monto_invertido)}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                  style={{ height: '100%', background: `linear-gradient(90deg,${P.proyecto},#d97706)`, borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                <span>Inicio: {p.fecha_inicio || '—'}</span>
                <span>{pct.toFixed(1)}%</span>
                <span>Fin: {p.fecha_fin || '—'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setProyDetalle(p)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(217,119,6,0.2))', border: '1px solid rgba(245,158,11,0.4)', color: P.proyecto, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s' }}>
                  📋 Ver Detalle
                </button>
                <button onClick={() => setModalProy(p)} style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: P.balance, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✏️</button>
                <button onClick={() => handleDeleteProy(p.id)} style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: P.egreso, cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>📒 Balance & Finanzas</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Ingresos, egresos y nóminas de proyectos — reporte mensual y anual completo.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, padding: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        <Tab id="mensual"   label="Reporte Mensual"  icon="📅" />
        <Tab id="anual"     label="Reporte Anual"    icon="📆" />
        <Tab id="egresos"   label="Egresos"          icon="📤" />
        <Tab id="proyectos" label="Proyectos"        icon="🏗️" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={vista} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>Cargando reporte…
            </div>
          ) : (
            <>
              {vista === 'mensual'   && renderMensual()}
              {vista === 'anual'     && renderAnual()}
              {vista === 'egresos'   && renderEgresos()}
              {vista === 'proyectos' && renderProyectos()}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal Egreso */}
      {modalEgreso !== null && (
        <Modal title={modalEgreso==='crear'?'➕ Nuevo Egreso':'✏️ Editar Egreso'} onClose={() => setModalEgreso(null)}>
          <EgresoForm initial={modalEgreso!=='crear'?{...modalEgreso}:null} onSave={handleSaveEgreso} onClose={() => setModalEgreso(null)} />
        </Modal>
      )}

      {/* Modal Proyecto */}
      {modalProy !== null && (
        <Modal title={modalProy==='crear'?'➕ Nuevo Proyecto':'✏️ Editar Proyecto'} onClose={() => setModalProy(null)}>
          <ProyectoForm initial={modalProy!=='crear'?{...modalProy}:null} onSave={handleSaveProy} onClose={() => setModalProy(null)} />
        </Modal>
      )}

      {/* Detalle de Proyecto (modal con nóminas) */}
      {proyDetalle !== null && (
        <ProyectoDetalle proyecto={proyDetalle} onClose={() => setProyDetalle(null)} />
      )}
    </div>
  );
};

export default Balance;
