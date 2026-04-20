import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, LabelList, AreaChart, Area, Legend,
  PieChart, Pie
} from 'recharts';
import { balanceService } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  ingreso:   '#10b981',
  egreso:    '#f43f5e',
  proyecto:  '#f59e0b',
  internet:  '#0ea5e9',
  iptv:      '#ec4899',
  extras:    '#8b5cf6',
  adic:      '#14b8a6',
  balance:   '#6366f1',
  cat: {
    operacional: '#f59e0b',
    nomina:      '#0ea5e9',
    proyecto:    '#8b5cf6',
    otro:        '#94a3b8',
  }
};

const CATEGORIAS = ['operacional', 'nomina', 'proyecto', 'otro'];
const CAT_LABELS = {
  operacional: '⚙️ Operacional',
  nomina:      '👔 Nómina',
  proyecto:    '🏗️ Proyecto',
  otro:        '📦 Otro',
};
const METODOS = ['Efectivo', 'Pichincha', 'JEP', 'Datatfast', 'Otro'];
const ESTADOS_PROY = ['En progreso', 'Completado', 'Pausado'];

const now = new Date();
const DEFAULT_MES = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const DEFAULT_ANIO = now.getFullYear();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function Card({ title, value, icon, color, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}44`,
        borderLeft: `4px solid ${color}`,
        borderRadius: '16px',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.6rem' }}>{icon}</span>
        <span style={{ color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          {title}
        </span>
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
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>{text}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'linear-gradient(145deg, #1a1040, #1e1550)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24, padding: 32,
          width: '100%', maxWidth: 540,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EGRESO FORM
// ─────────────────────────────────────────────────────────────────────────────
function EgresoForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    descripcion: '', categoria: 'operacional', monto: '',
    fecha: DEFAULT_MES + '-01', mes: DEFAULT_MES,
    metodo_pago: 'Efectivo', notas: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descripcion || !form.monto) return alert('Completa descripción y monto.');
    // Autodetect mes from fecha
    const mes = form.fecha?.slice(0, 7) || DEFAULT_MES;
    await onSave({ ...form, monto: parseFloat(form.monto), mes });
    onClose();
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: 'white', fontSize: '0.9rem', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'Outfit, sans-serif',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Descripción</label>
        <input style={inputStyle} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Categoría</label>
          <select style={inputStyle} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Monto ($)</label>
          <input style={inputStyle} type="number" step="0.01" min="0" value={form.monto} onChange={e => set('monto', e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha</label>
          <input style={inputStyle} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Método Pago</label>
          <select style={inputStyle} value={form.metodo_pago} onChange={e => set('metodo_pago', e.target.value)}>
            {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Notas (opcional)</label>
        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} value={form.notas} onChange={e => set('notas', e.target.value)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #f43f5e, #e11d48)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROYECTO FORM
// ─────────────────────────────────────────────────────────────────────────────
function ProyectoForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    nombre: '', descripcion: '', monto_total: '',
    monto_invertido: '0', estado: 'En progreso',
    fecha_inicio: DEFAULT_MES + '-01', fecha_fin: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.monto_total) return alert('Completa nombre y monto total.');
    await onSave({
      ...form,
      monto_total: parseFloat(form.monto_total),
      monto_invertido: parseFloat(form.monto_invertido || 0),
    });
    onClose();
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: 'white', fontSize: '0.9rem', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'Outfit, sans-serif',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Nombre del Proyecto</label>
        <input style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
      </div>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Descripción</label>
        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Monto Total ($)</label>
          <input style={inputStyle} type="number" step="0.01" min="0" value={form.monto_total} onChange={e => set('monto_total', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Invertido hasta ahora ($)</label>
          <input style={inputStyle} type="number" step="0.01" min="0" value={form.monto_invertido} onChange={e => set('monto_invertido', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Estado</label>
          <select style={inputStyle} value={form.estado} onChange={e => set('estado', e.target.value)}>
            {ESTADOS_PROY.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha Inicio</label>
          <input style={inputStyle} type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha Fin</label>
          <input style={inputStyle} type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const Balance = () => {
  const [vista, setVista] = useState('mensual');  // 'mensual' | 'anual' | 'egresos' | 'proyectos'
  const [mes, setMes] = useState(DEFAULT_MES);
  const [anio, setAnio] = useState(DEFAULT_ANIO);
  const [report, setReport] = useState(null);
  const [reportAnual, setReportAnual] = useState(null);
  const [egresos, setEgresos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);

  // modals
  const [modalEgreso, setModalEgreso] = useState(null);   // null | 'crear' | egreso_obj
  const [modalProy, setModalProy]     = useState(null);

  // ── FETCH ──
  const fetchMensual = useCallback(async () => {
    setLoading(true);
    try {
      const res = await balanceService.reporteMensual(mes);
      setReport(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [mes]);

  const fetchAnual = useCallback(async () => {
    setLoading(true);
    try {
      const res = await balanceService.reporteAnual(anio);
      setReportAnual(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [anio]);

  const fetchEgresos = useCallback(async () => {
    try {
      const res = await balanceService.listarEgresos();
      setEgresos(res.data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchProyectos = useCallback(async () => {
    try {
      const res = await balanceService.listarProyectos();
      setProyectos(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (vista === 'mensual') fetchMensual(); }, [vista, fetchMensual]);
  useEffect(() => { if (vista === 'anual')   fetchAnual(); },  [vista, fetchAnual]);
  useEffect(() => { if (vista === 'egresos')  fetchEgresos(); }, [vista, fetchEgresos]);
  useEffect(() => { if (vista === 'proyectos') fetchProyectos(); }, [vista, fetchProyectos]);

  // ── EGRESOS CRUD ──
  const handleSaveEgreso = async (data) => {
    if (data.id) await balanceService.actualizarEgreso(data.id, data);
    else          await balanceService.crearEgreso(data);
    fetchEgresos();
    if (vista === 'mensual') fetchMensual();
  };

  const handleDeleteEgreso = async (id) => {
    if (!window.confirm('¿Eliminar este egreso?')) return;
    await balanceService.eliminarEgreso(id);
    fetchEgresos();
    if (vista === 'mensual') fetchMensual();
  };

  // ── PROYECTOS CRUD ──
  const handleSaveProy = async (data) => {
    if (data.id) await balanceService.actualizarProyecto(data.id, data);
    else          await balanceService.crearProyecto(data);
    fetchProyectos();
  };

  const handleDeleteProy = async (id) => {
    if (!window.confirm('¿Eliminar este proyecto?')) return;
    await balanceService.eliminarProyecto(id);
    fetchProyectos();
  };

  // ── TAB BUTTON ──
  const Tab = ({ id, label, icon }) => (
    <button
      id={`tab-balance-${id}`}
      onClick={() => setVista(id)}
      style={{
        padding: '10px 20px', borderRadius: 12, cursor: 'pointer',
        fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', fontWeight: 600,
        border: vista === id ? '1px solid rgba(255,255,255,0.22)' : '1px solid transparent',
        background: vista === id ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.03)',
        color: vista === id ? '#fff' : 'rgba(255,255,255,0.55)',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: 7,
      }}
    >
      <span>{icon}</span>{label}
    </button>
  );

  const tooltipStyle = {
    contentStyle: { background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 },
    itemStyle: { color: '#e2e8f0' },
    labelStyle: { color: '#94a3b8', fontWeight: 700 },
  };

  // ─────────────────────────────────────────────────────────────────
  // REPORTE MENSUAL VIEW
  // ─────────────────────────────────────────────────────────────────
  const renderMensual = () => {
    if (!report) return null;
    const { ingresos, egresos: egresosData, proyectos: proyData, balance_neto } = report;

    const pieIngr = [
      { name: 'Internet', value: ingresos.internet.total, color: P.internet },
      { name: 'IP TV',    value: ingresos.iptv.total,    color: P.iptv },
      { name: 'Adicional', value: ingresos.adicional,    color: P.adic },
      { name: 'Extras',   value: ingresos.extras.total,  color: P.extras },
    ].filter(x => x.value > 0);

    const pieEgr = Object.entries(egresosData.detalle).map(([cat, val]) => ({
      name: CAT_LABELS[cat] || cat, value: val, color: P.cat[cat] || '#94a3b8',
    }));

    const barComparativa = [
      { name: 'Ingresos', total: ingresos.total,         fill: P.ingreso },
      { name: 'Egresos',  total: egresosData.total,      fill: P.egreso },
      { name: 'Proyectos',total: proyData.total,         fill: P.proyecto },
      { name: 'Balance',  total: Math.abs(balance_neto), fill: balance_neto >= 0 ? P.ingreso : P.egreso },
    ];

    const internetBar = [
      { name: 'Efectivo',  value: ingresos.internet.efectivo, color: P.ingreso },
      { name: 'Pichincha', value: ingresos.internet.pichincha, color: '#fbbf24' },
      { name: 'JEP',       value: ingresos.internet.jep,       color: P.balance },
    ];

    const [mesNum, anioStr] = mes.split('-');
    const mesLabel = MONTH_NAMES[parseInt(mesNum, 10) - 1] + ' ' + anioStr;

    return (
      <div>
        {/* Selector de Mes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Mes:</label>
          <input
            type="month" value={mes}
            onChange={e => setMes(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', outline: 'none' }}
          />
          <button onClick={fetchMensual} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem' }}>
            Cargar
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📅 {mesLabel}</span>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <Card icon="📥" title="Total Ingresos"  color={P.ingreso}  value={fmt(ingresos.total)} />
          <Card icon="📤" title="Total Egresos"   color={P.egreso}   value={fmt(egresosData.total)} />
          <Card icon="🏗️" title="Proyectos"       color={P.proyecto} value={fmt(proyData.total)} />
          <Card
            icon={balance_neto >= 0 ? '💚' : '🔴'}
            title="Balance Neto"
            color={balance_neto >= 0 ? P.ingreso : P.egreso}
            value={fmt(balance_neto)}
            sub={balance_neto >= 0 ? 'Superávit' : 'Déficit'}
          />
        </div>

        {/* Gráfica Comparativa + Ingresos Pie */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
            <h4 style={{ margin: '0 0 20px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>📊 Resumen Financiero</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barComparativa} margin={{ top: 16, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
                <ReTooltip {...tooltipStyle} formatter={v => fmt(v)} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={38}>
                  {barComparativa.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  <LabelList dataKey="total" position="top" fill="#e2e8f0" fontSize={13} formatter={fmt} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
            <h4 style={{ margin: '0 0 20px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>🥧 Desglose de Ingresos</h4>
            {pieIngr.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieIngr} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {pieIngr.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <ReTooltip {...tooltipStyle} formatter={v => fmt(v)} />
                  <Legend iconType="circle" iconSize={10} formatter={(v, e) => <span style={{ color: '#e2e8f0', fontSize: '0.8rem' }}>{v}: {fmt(e.payload.value)}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60 }}>Sin ingresos este mes</div>
            )}
          </div>
        </div>

        {/* Ingresos Detallados */}
        <SectionTitle icon="💰" text="Desglose de Ingresos" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
          {/* Internet */}
          <div style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 14, padding: 20 }}>
            <div style={{ color: P.internet, fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>🌐 Internet — {fmt(ingresos.internet.total)}</div>
            {[['Efectivo', ingresos.internet.efectivo, P.ingreso], ['Pichincha', ingresos.internet.pichincha, '#fbbf24'], ['JEP', ingresos.internet.jep, P.balance]].map(([label, v, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{fmt(v)}</span>
              </div>
            ))}
          </div>
          {/* IPTV */}
          <div style={{ background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 14, padding: 20 }}>
            <div style={{ color: P.iptv, fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>📺 IP TV — {fmt(ingresos.iptv.total)}</div>
            {[['Efectivo', ingresos.iptv.efectivo, P.ingreso], ['Pichincha', ingresos.iptv.pichincha, '#fbbf24']].map(([label, v, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{fmt(v)}</span>
              </div>
            ))}
          </div>
          {/* Extras */}
          <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: 20 }}>
            <div style={{ color: P.extras, fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>🌍 Extras — {fmt(ingresos.extras.total)}</div>
            {[['Efectivo', ingresos.extras.efectivo, P.ingreso], ['Pichincha', ingresos.extras.pichincha, '#fbbf24'], ['JEP', ingresos.extras.jep, P.balance]].map(([label, v, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{fmt(v)}</span>
              </div>
            ))}
          </div>
          {/* Adicional */}
          <div style={{ background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 14, padding: 20 }}>
            <div style={{ color: P.adic, fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>➕ Adicional — {fmt(ingresos.adicional)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>Servicios adicionales cobrados a clientes principales.</div>
          </div>
        </div>

        {/* Egresos */}
        <SectionTitle icon="📤" text="Egresos del Mes" />
        {egresosData.lista.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 14 }}>
            Sin egresos registrados para este mes. <button onClick={() => setVista('egresos')} style={{ background: 'none', border: 'none', color: P.egreso, cursor: 'pointer', fontWeight: 700 }}>Agregar uno</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                  {['Descripción', 'Categoría', 'Fecha', 'Método', 'Monto', 'Notas'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {egresosData.lista.map(eg => (
                  <tr key={eg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 600 }}>{eg.descripcion}</td>
                    <td style={{ padding: '11px 14px' }}><Badge text={CAT_LABELS[eg.categoria] || eg.categoria} color={P.cat[eg.categoria] || '#94a3b8'} /></td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{eg.fecha}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{eg.metodo_pago}</td>
                    <td style={{ padding: '11px 14px', color: P.egreso, fontWeight: 800 }}>{fmt(eg.monto)}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 200 }}>{eg.notas || '—'}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(244,63,94,0.05)', fontWeight: 800 }}>
                  <td colSpan={4} style={{ padding: '12px 14px', color: P.egreso }}>TOTAL EGRESOS</td>
                  <td style={{ padding: '12px 14px', color: P.egreso, fontSize: '1rem' }}>{fmt(egresosData.total)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Proyectos activos */}
        {proyData.lista.length > 0 && (
          <>
            <SectionTitle icon="🏗️" text="Proyectos Activos" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {proyData.lista.map(p => {
                const pct = p.monto_total > 0 ? Math.min(100, (p.monto_invertido / p.monto_total) * 100) : 0;
                const estadoColor = p.estado === 'Completado' ? P.ingreso : p.estado === 'Pausado' ? P.egreso : P.proyecto;
                return (
                  <div key={p.id} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.nombre}</div>
                      <Badge text={p.estado} color={estadoColor} />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>{p.descripcion || 'Sin descripción'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Invertido:</span>
                      <span style={{ color: P.proyecto, fontWeight: 700 }}>{fmt(p.monto_invertido)} / {fmt(p.monto_total)}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${P.proyecto}, #d97706)`, borderRadius: 99, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>{pct.toFixed(1)}% completado</div>
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
  // REPORTE ANUAL VIEW
  // ─────────────────────────────────────────────────────────────────
  const renderAnual = () => {
    if (!reportAnual) return null;
    const { meses, totales, proyectos: proyAnual } = reportAnual;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Año:</label>
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value, 10))}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchAnual} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem' }}>
            Cargar
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <Card icon="📥" title="Ingresos Totales" color={P.ingreso}  value={fmt(totales.ingresos)} sub={`Año ${anio}`} />
          <Card icon="📤" title="Egresos Totales"  color={P.egreso}   value={fmt(totales.egresos)}  sub={`Año ${anio}`} />
          <Card
            icon={totales.balance >= 0 ? '💚' : '🔴'}
            title="Balance Anual"
            color={totales.balance >= 0 ? P.ingreso : P.egreso}
            value={fmt(totales.balance)}
            sub={totales.balance >= 0 ? 'Superávit anual' : 'Déficit anual'}
          />
        </div>

        {/* Area Chart año */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24, marginBottom: 28 }}>
          <h4 style={{ margin: '0 0 20px', fontSize: '0.95rem' }}>📈 Evolución Mensual {anio}</h4>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={meses} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="gIngr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={P.ingreso} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={P.ingreso} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEgr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={P.egreso} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={P.egreso} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
              <ReTooltip {...tooltipStyle} formatter={v => fmt(v)} />
              <Legend iconType="circle" iconSize={10} />
              <Area type="monotone" dataKey="ingresos" stroke={P.ingreso} strokeWidth={2.5} fill="url(#gIngr)" name="Ingresos" />
              <Area type="monotone" dataKey="egresos"  stroke={P.egreso}  strokeWidth={2.5} fill="url(#gEgr)"  name="Egresos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla anual por mes */}
        <SectionTitle icon="📋" text="Detalle por Mes" />
        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Mes', 'Internet', 'IP TV', 'Adicional', 'Extras', 'Total Ingresos', 'Egresos', 'Balance'].map(h => (
                  <th key={h} style={{ padding: '13px 14px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5, '&:firstChild': { textAlign: 'left' } }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <tr key={m.mes} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: 'white', textAlign: 'left' }}>{m.label}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: P.internet }}>{fmt(m.internet)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: P.iptv }}>{fmt(m.iptv)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: P.adic }}>{fmt(m.adicional)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: P.extras }}>{fmt(m.extras)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: P.ingreso }}>{fmt(m.ingresos)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', color: P.egreso }}>{fmt(m.egresos)}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 800, color: m.balance >= 0 ? P.ingreso : P.egreso }}>
                    {m.balance >= 0 ? '+' : ''}{fmt(m.balance)}
                  </td>
                </tr>
              ))}
              {/* Fila total */}
              <tr style={{ background: 'rgba(99,102,241,0.08)', borderTop: '2px solid rgba(99,102,241,0.3)' }}>
                <td style={{ padding: '14px', fontWeight: 800, fontSize: '0.95rem' }}>TOTAL {anio}</td>
                <td colSpan={4} />
                <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: P.ingreso, fontSize: '0.95rem' }}>{fmt(totales.ingresos)}</td>
                <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: P.egreso,  fontSize: '0.95rem' }}>{fmt(totales.egresos)}</td>
                <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: totales.balance >= 0 ? P.ingreso : P.egreso, fontSize: '0.95rem' }}>
                  {totales.balance >= 0 ? '+' : ''}{fmt(totales.balance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Proyectos */}
        {proyAnual.length > 0 && (
          <>
            <SectionTitle icon="🏗️" text={`Proyectos — ${anio}`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {proyAnual.map(p => {
                const pct = p.monto_total > 0 ? Math.min(100, (p.monto_invertido / p.monto_total) * 100) : 0;
                const estadoColor = p.estado === 'Completado' ? P.ingreso : p.estado === 'Pausado' ? P.egreso : P.proyecto;
                return (
                  <div key={p.id} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 14, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                      <Badge text={p.estado} color={estadoColor} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total / Invertido:</span>
                      <span style={{ color: P.proyecto, fontWeight: 700 }}>{fmt(p.monto_total)} / {fmt(p.monto_invertido)}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${P.proyecto},#d97706)`, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{pct.toFixed(1)}%</div>
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
  // EGRESOS CRUD VIEW
  // ─────────────────────────────────────────────────────────────────
  const renderEgresos = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>📤 Gestión de Egresos</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Registra todos los gastos de la empresa.</p>
        </div>
        <button
          id="btn-nuevo-egreso"
          onClick={() => setModalEgreso('crear')}
          style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          ＋ Nuevo Egreso
        </button>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Descripción', 'Categoría', 'Fecha', 'Mes', 'Método', 'Monto', 'Notas', ''].map(h => (
                <th key={h} style={{ padding: '13px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {egresos.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay egresos registrados.</td></tr>
            ) : egresos.map((eg) => (
              <tr key={eg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '11px 14px', fontWeight: 600 }}>{eg.descripcion}</td>
                <td style={{ padding: '11px 14px' }}><Badge text={CAT_LABELS[eg.categoria] || eg.categoria} color={P.cat[eg.categoria] || '#94a3b8'} /></td>
                <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{eg.fecha}</td>
                <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{eg.mes}</td>
                <td style={{ padding: '11px 14px', color: 'var(--text-muted)' }}>{eg.metodo_pago}</td>
                <td style={{ padding: '11px 14px', color: P.egreso, fontWeight: 800 }}>{fmt(eg.monto)}</td>
                <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 180 }}>{eg.notas || '—'}</td>
                <td style={{ padding: '11px 14px', display: 'flex', gap: 8 }}>
                  <button onClick={() => setModalEgreso(eg)} title="Editar" style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, color: P.balance, padding: '5px 10px', cursor: 'pointer', fontSize: '0.9rem' }}>✏️</button>
                  <button onClick={() => handleDeleteEgreso(eg.id)} title="Eliminar" style={{ background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: 8, color: P.egreso, padding: '5px 10px', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // PROYECTOS CRUD VIEW
  // ─────────────────────────────────────────────────────────────────
  const renderProyectos = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>🏗️ Gestión de Proyectos</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Inversiones y proyectos de la empresa.</p>
        </div>
        <button
          id="btn-nuevo-proyecto"
          onClick={() => setModalProy('crear')}
          style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          ＋ Nuevo Proyecto
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
        {proyectos.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 16, gridColumn: '1/-1' }}>No hay proyectos registrados.</div>
        ) : proyectos.map(p => {
          const pct = p.monto_total > 0 ? Math.min(100, (p.monto_invertido / p.monto_total) * 100) : 0;
          const estadoColor = p.estado === 'Completado' ? P.ingreso : p.estado === 'Pausado' ? P.egreso : P.proyecto;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 18, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{p.nombre}</div>
                <Badge text={p.estado} color={estadoColor} />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14, minHeight: 28 }}>{p.descripcion || 'Sin descripción'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Presupuesto:</span>
                <span style={{ color: 'white', fontWeight: 700 }}>{fmt(p.monto_total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)' }}>Invertido:</span>
                <span style={{ color: P.proyecto, fontWeight: 700 }}>{fmt(p.monto_invertido)}</span>
              </div>
              <div style={{ height: 7, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                  style={{ height: '100%', background: `linear-gradient(90deg,${P.proyecto},#d97706)`, borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                <span>Inicio: {p.fecha_inicio || '—'}</span>
                <span>{pct.toFixed(1)}% completado</span>
                <span>Fin: {p.fecha_fin || '—'}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModalProy(p)} style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: P.balance, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }}>✏️ Editar</button>
                <button onClick={() => handleDeleteProy(p.id)} style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: P.egreso, cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>📒 Balance & Finanzas</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Reporte de ingresos, egresos y proyectos — mensual y anual completo.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32, padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        <Tab id="mensual"   label="Reporte Mensual"  icon="📅" />
        <Tab id="anual"     label="Reporte Anual"    icon="📆" />
        <Tab id="egresos"   label="Egresos"          icon="📤" />
        <Tab id="proyectos" label="Proyectos"        icon="🏗️" />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={vista} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
              Cargando reporte...
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
        <Modal
          title={modalEgreso === 'crear' ? '➕ Nuevo Egreso' : '✏️ Editar Egreso'}
          onClose={() => setModalEgreso(null)}
        >
          <EgresoForm
            initial={modalEgreso !== 'crear' ? { ...modalEgreso } : null}
            onSave={handleSaveEgreso}
            onClose={() => setModalEgreso(null)}
          />
        </Modal>
      )}

      {/* Modal Proyecto */}
      {modalProy !== null && (
        <Modal
          title={modalProy === 'crear' ? '➕ Nuevo Proyecto' : '✏️ Editar Proyecto'}
          onClose={() => setModalProy(null)}
        >
          <ProyectoForm
            initial={modalProy !== 'crear' ? { ...modalProy } : null}
            onSave={handleSaveProy}
            onClose={() => setModalProy(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Balance;
