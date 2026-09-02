import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, LabelList, AreaChart, Area, Legend,
  PieChart, Pie
} from 'recharts';
import { balanceService } from '../services/api';
import { showAlert, showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';


// ─────────────────────────────────────────────────────────────────────────────
// PALETA
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  ingreso: '#10b981', egreso: '#f43f5e', proyecto: '#f59e0b',
  internet: '#0ea5e9', iptv: '#ec4899', extras: '#8b5cf6',
  adic: '#14b8a6', balance: '#6366f1',
  pichincha: '#facc15', jep: '#fb923c', efectivo: '#4ade80',
  cat: { operacional: '#f59e0b', nomina: '#0ea5e9', proyecto: '#8b5cf6', otro: '#94a3b8' }
};

const CATEGORIAS = ['operacional', 'nomina', 'proyecto', 'otro'];
const CAT_LABELS = { operacional: '⚙️ Operacional', nomina: '👔 Nómina', proyecto: '🏗️ Proyecto', otro: '📦 Otro' };
const METODOS = ['Efectivo', 'Pichincha', 'JEP', 'Datatfast', 'Otro'];
const ESTADOS_PROY = ['En progreso', 'Completado', 'Pausado'];

// Subcategorías predefinidas para proyectos (editable como texto libre)
const SUBCATS_PROY = ['VIATICOS', 'CONSTRUCCION', 'COMPRAS', 'HERRAJERIA', 'VARIOS', 'INVERSIONISTA', 'TECNICO CAMPO', 'ADMINISTRATIVO'];
// Subcategorías predefinidas para egresos generales
const SUBCATS_EGR = ['VIATICOS', 'NOMINA', 'SERVICIOS', 'EQUIPOS', 'MANTENIMIENTO', 'CONSTRUCCION', 'COMPRAS', 'ADMINISTRATIVO', 'OTROS'];

const now = new Date();
const DEFAULT_MES = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const DEFAULT_ANIO = now.getFullYear();

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES UI
// ─────────────────────────────────────────────────────────────────────────────
function Card({ title, value, icon, color, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}44`,
        borderLeft: `4px solid ${color}`, borderRadius: 16, padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0
      }}>
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
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}22`, color, border: `1px solid ${color}44`
    }}>{text}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL GENÉRICO
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, maxWidth = 560, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'linear-gradient(145deg,#1a1040,#1e1550)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 28,
          width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto'
        }}>
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
  appearance: 'none', // Quitar flecha default para customización
};

// Estilos para las opciones de los selects (para que no salgan blancas)
const OS = { background: '#1a1040', color: 'white' };

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
    if (!form.descripcion || !form.monto) return showWarning('Completa descripción y monto.');
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
            {CATEGORIAS.map(c => <option key={c} value={c} style={OS}>{CAT_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Monto ($)</label>
          <input style={IS} type="number" step="0.01" min="0" value={form.monto} onChange={e => set('monto', e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Método de Pago</label>
          <select style={IS} value={form.metodo_pago} onChange={e => set('metodo_pago', e.target.value)}>
            {METODOS.map(m => <option key={m} value={m} style={OS}>{m}</option>)}
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
    if (!form.nombre || !form.monto_total) return showWarning('Completa nombre y monto total.');
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
    if (!form.descripcion || !form.valor) return showWarning('Completa descripción y valor.');
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
    if (!form.descripcion || !form.valor) return showWarning('Completa descripción y valor.');
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
// COLCHON FORM
// ─────────────────────────────────────────────────────────────────────────────
function ColchonForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { descripcion: '', monto: '', fecha: new Date().toISOString().split('T')[0] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.descripcion || !form.monto) return showWarning('Completa descripción y monto.');
    await onSave({ ...form, monto: parseFloat(form.monto) });
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Descripción / Concepto</label>
        <input style={IS} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required placeholder="Ej: Reserva para equipos…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Monto ($)</label>
          <input style={IS} type="number" step="0.01" min="0" value={form.monto} onChange={e => set('monto', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha</label>
          <input style={IS} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GASTO FIJO FORM
// ─────────────────────────────────────────────────────────────────────────────
function GastoFijoForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    descripcion: '', monto: '', categoria: 'operacional', metodo_pago: 'Efectivo', activo: true, notas: ''
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.descripcion || !form.monto) return showWarning('Completa descripción y monto.');
    await onSave({ ...form, monto: parseFloat(form.monto) });
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Descripción del Gasto Fijo</label>
        <input style={IS} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required placeholder="Ej: Arriendo oficina, Internet empresa…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Monto Mensual ($)</label>
          <input style={IS} type="number" step="0.01" min="0" value={form.monto} onChange={e => set('monto', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Categoría</label>
          <select style={IS} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS.map(c => <option key={c} value={c} style={OS}>{CAT_LABELS[c]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Método de Pago</label>
        <select style={IS} value={form.metodo_pago} onChange={e => set('metodo_pago', e.target.value)}>
          {METODOS.map(m => <option key={m} value={m} style={OS}>{m}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Notas (opcional)</label>
        <textarea style={{ ...IS, resize: 'vertical', minHeight: 52 }} value={form.notas} onChange={e => set('notas', e.target.value)} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 16, height: 16, accentColor: P.ingreso }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>Activo (se cobra este mes)</span>
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOVIMIENTO INTERNO FORM (Transferencia entre cuentas/bancos)
// ─────────────────────────────────────────────────────────────────────────────
function MovimientoInternoForm({ initial, onSave, onClose }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState(initial || {
    origen: 'Efectivo',
    destino: 'Pichincha',
    monto: '',
    fecha: todayStr,
    observacion: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.monto || parseFloat(form.monto) <= 0) return showWarning('Ingresa un monto válido mayor a 0.');
    if (!form.fecha) return showWarning('Selecciona la fecha del movimiento.');
    if (form.origen === form.destino) return showWarning('El origen y el destino deben ser diferentes.');

    await onSave({
      ...form,
      monto: parseFloat(form.monto)
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Origen (De dónde sale)</label>
          <select style={IS} value={form.origen} onChange={e => set('origen', e.target.value)}>
            <option value="Efectivo" style={OS}>💵 Efectivo (Caja Chica)</option>
            <option value="Pichincha" style={OS}>🏦 Banco Pichincha</option>
            <option value="JEP" style={OS}>🏛️ Coac JEP</option>
            <option value="Otro" style={OS}>💳 Otro / Banco</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Para / Destino (Hacia dónde va)</label>
          <select style={IS} value={form.destino} onChange={e => set('destino', e.target.value)}>
            <option value="Pichincha" style={OS}>🏦 Banco Pichincha</option>
            <option value="JEP" style={OS}>🏛️ Coac JEP</option>
            <option value="Efectivo" style={OS}>💵 Efectivo (Caja Chica)</option>
            <option value="Otro" style={OS}>💳 Otro / Banco</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Monto / Valor ($)</label>
          <input style={IS} type="number" step="0.01" min="0.01" placeholder="Ej: 300.00" value={form.monto} onChange={e => set('monto', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Fecha de Pago / Transacción</label>
          <input style={IS} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6, fontWeight: 600 }}>Observación / Concepto (Opcional)</label>
        <input style={IS} placeholder="Ej: Depósito de caja chica a cuenta Pichincha" value={form.observacion || ''} onChange={e => set('observacion', e.target.value)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
        <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Cancelar</button>
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Guardar Movimiento</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTH NAVIGATION BAR (Horizontal Strip)
// ─────────────────────────────────────────────────────────────────────────────
function MonthNavBar({ value = DEFAULT_MES, onChange }) {
  const valStr = value || DEFAULT_MES;
  const [aStr, mNum] = valStr.split('-');
  const currentMonthIdx = parseInt(mNum, 10) - 1;
  const currentYear = parseInt(aStr, 10);

  const shortMonths = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 15 }}>
        <button onClick={() => onChange(`${currentYear - 1}-${mNum}`)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 950, letterSpacing: 2, background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{currentYear}</h2>
        <button onClick={() => onChange(`${currentYear + 1}-${mNum}`)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {shortMonths.map((m, i) => {
          const isSelected = i === currentMonthIdx;
          const mVal = `${currentYear}-${(i + 1).toString().padStart(2, '0')}`;
          return (
            <button
              key={m}
              onClick={() => onChange(mVal)}
              style={{
                padding: '12px 20px', borderRadius: 14, border: 'none',
                background: isSelected ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: isSelected ? 'white' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem',
                fontWeight: isSelected ? 900 : 600, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 8px 20px rgba(99,102,241,0.3)' : 'none',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROYECTO DETALLE (modal con nóminas internas)
// ─────────────────────────────────────────────────────────────────────────────
function ProyectoDetalle({ proyecto, onClose }) {
  const [tab, setTab] = useState('pagos');   // 'pagos' | 'gastos'
  const [pagos, setPagos] = useState([]);
  const [gastos, setGastos] = useState({ grupos: {}, total: 0, flat: [] });
  const [modalPago, setModalPago] = useState(null);
  const [modalGasto, setModalGasto] = useState(null);
  const [loadingP, setLoadingP] = useState(false);
  const [loadingG, setLoadingG] = useState(false);

  const fetchPagos = useCallback(async () => {
    setLoadingP(true);
    try { const r = await balanceService.listarPagosProyecto(proyecto.id); setPagos(r.data); }
    catch (e) { console.error(e); }
    setLoadingP(false);
  }, [proyecto.id]);

  const fetchGastos = useCallback(async () => {
    setLoadingG(true);
    try { const r = await balanceService.listarGastosProyecto(proyecto.id); setGastos(r.data); }
    catch (e) { console.error(e); }
    setLoadingG(false);
  }, [proyecto.id]);

  useEffect(() => { fetchPagos(); fetchGastos(); }, [fetchPagos, fetchGastos]);

  const savePago = async data => {
    if (data.id) await balanceService.actualizarPagoProyecto(proyecto.id, data.id, data);
    else await balanceService.crearPagoProyecto(proyecto.id, data);
    fetchPagos();
  };
  const deletePago = async id => {
    const confirmado = await showConfirm('¿Eliminar pago?', '¿Eliminar este pago?', 'Sí, eliminar', 'Cancelar');
    if (!confirmado) return;
    await balanceService.eliminarPagoProyecto(proyecto.id, id);
    fetchPagos();
  };

  const saveGasto = async data => {
    if (data.id) await balanceService.actualizarGastoProyecto(proyecto.id, data.id, data);
    else await balanceService.crearGastoProyecto(proyecto.id, data);
    fetchGastos();
  };
  const deleteGasto = async id => {
    const confirmado = await showConfirm('¿Eliminar gasto?', '¿Eliminar este gasto?', 'Sí, eliminar', 'Cancelar');
    if (!confirmado) return;
    await balanceService.eliminarGastoProyecto(proyecto.id, id);
    fetchGastos();
  };

  const totalPagos = pagos.reduce((s, p) => s + parseFloat(p.valor || 0), 0);
  const estadoColor = proyecto.estado === 'Completado' ? P.ingreso : proyecto.estado === 'Pausado' ? P.egreso : P.proyecto;
  const pct = proyecto.monto_total > 0 ? Math.min(100, (proyecto.monto_invertido / proyecto.monto_total) * 100) : 0;

  const th = (label, right = false) => (
    <th style={{ padding: '10px 12px', textAlign: right ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{label}</th>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px', overflowY: 'auto'
    }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'linear-gradient(145deg,#130d35,#1a1040)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24,
          width: '100%', maxWidth: 900, padding: 28
        }}>

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
            { label: 'Presupuesto', value: fmt(proyecto.monto_total), color: P.balance },
            { label: 'Total Aportes', value: fmt(totalPagos), color: P.ingreso },
            { label: 'Costo Gastos', value: fmt(gastos.total), color: P.egreso },
            { label: 'Avance', value: `${pct.toFixed(1)}%`, color: P.proyecto },
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
          {[['pagos', '💳 Pagos al Proyecto'], ['gastos', '📊 Gastos Generales']].map(([id, label]) => (
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
                      {[['Ítem'], ['Descripción'], ['Fecha'], ['Tipo de Pago'], ['Valor', 'right'], ['',]].map(([h, r], i) => (
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
// HISTORIAL DE CLIENTES (DEUDAS)
// ─────────────────────────────────────────────────────────────────────────────
function HistorialClientes({ mesTarget }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [filtroCartera, setFiltroCartera] = useState('');

  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await balanceService.historialClientes();
      setClientes(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const months = [];
  const [aStr, mNum] = mesTarget.split('-');
  const d = new Date(parseInt(aStr, 10), parseInt(mNum, 10) - 1, 1);
  for (let i = 0; i < 12; i++) {
    const nd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push({
      label: MONTH_NAMES[nd.getMonth()].substring(0, 3) + ' ' + nd.getFullYear(),
      key: `m${i}`
    });
  }

  const getEstadoBadge = (estado) => {
    const est = (estado || '').toLowerCase().trim();
    if (est === 'en activación' || est === 'en activacion') {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          background: 'rgba(251, 191, 36, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(251, 191, 36, 0.3)',
        }}>
          🛠️ En Activación
        </span>
      );
    } else if (est === 'pendiente') {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          background: 'rgba(96, 165, 250, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(96, 165, 250, 0.3)',
        }}>
          ⏳ Pendiente
        </span>
      );
    } else {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'var(--text-muted)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}>
          {estado || 'Sin estado'}
        </span>
      );
    }
  };

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    (c.nodo && c.nodo.toLowerCase().includes(filtro.toLowerCase())) ||
    (c.plan && c.plan.toLowerCase().includes(filtro.toLowerCase()))
  );

  const filteredActivos = filtered.filter(c => {
    const isActivo = !c.estado || c.estado.toLowerCase() === 'activo';
    const isNew = c.instalation_date && c.instalation_date.startsWith(mesTarget);
    const matchesCartera = c.nombre.toLowerCase().includes(filtroCartera.toLowerCase());
    return isActivo && !isNew && matchesCartera;
  });

  const filteredRecientes = filtered.filter(c => {
    const isActivo = c.estado && c.estado.toLowerCase() === 'activo';
    const isNew = c.instalation_date && c.instalation_date.startsWith(mesTarget);
    return isActivo && isNew;
  });

  const filteredProspectos = filtered.filter(c =>
    c.estado && c.estado.toLowerCase() !== 'activo'
  );

  const totalTarifaRecientes = filteredRecientes.reduce((acc, c) => acc + parseFloat(c.tarifa_mensual || 0), 0);
  const pagosPorMetodo = filteredRecientes.reduce((acc, c) => {
    const metodo = (c.bank || 'Efectivo').trim() || 'Efectivo';
    acc[metodo] = (acc[metodo] || 0) + parseFloat(c.tarifa_mensual || 0);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Historial de Deudas (Cartera)</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Distribución de la deuda total en los últimos 6 meses</p>
        </div>
        <div style={{ position: 'relative', width: 300 }}>
          <input
            type="text"
            placeholder="🔍 Buscar cliente, nodo o plan..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{ ...IS, padding: '10px 14px 10px 36px' }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔎</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando historial...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* SECCIÓN 1: CLIENTES RECIÉN ACTIVADOS */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span> Clientes Recién Activados (Nuevos este mes)
              </h4>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Clientes activados recientemente durante el mes de facturación seleccionado.
              </p>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#131326', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Cliente</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Nodo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Plan Contratado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Fecha Activación</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Método Pago</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Tarifa/Mes</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Deuda Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecientes.map((c, idx) => (
                    <tr key={c.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                    }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.nombre}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{c.nodo || '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{c.plan || '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{c.instalation_date || '—'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{c.bank || 'Efectivo'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: P.internet }}>{fmt(c.tarifa_mensual)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: parseFloat(c.saldo_total || 0) > 0 ? P.egreso : P.ingreso }}>
                        {fmt(c.saldo_total)}
                      </td>
                    </tr>
                  ))}
                  {filteredRecientes.length > 0 && (
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                      <td colSpan={5} style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'left' }}>Total Clientes Nuevos del Mes:</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: P.ingreso, fontSize: '0.9rem' }}>
                        {fmt(totalTarifaRecientes)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: filteredRecientes.reduce((acc, c) => acc + parseFloat(c.saldo_total || 0), 0) > 0 ? P.egreso : P.ingreso }}>
                        {fmt(filteredRecientes.reduce((acc, c) => acc + parseFloat(c.saldo_total || 0), 0))}
                      </td>
                    </tr>
                  )}
                  {filteredRecientes.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        ✨ No hay clientes activados recientemente en este mes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredRecientes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, padding: '12px 18px', background: 'rgba(255,255,255,0.015)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Métodos de Pago Utilizados:</span>
                {Object.entries(pagosPorMetodo).map(([metodo, total]) => (
                  <div key={metodo} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontWeight: 600 }}>{metodo}:</span>
                    <span style={{ color: P.ingreso, fontWeight: 700 }}>{fmt(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: CARTERA DE CLIENTES ACTIVOS */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>💰</span> Cartera General (Clientes Activos)
                </h4>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Historial de deudas consolidadas y control de cartera de clientes activos.
                </p>
              </div>
              <div style={{ position: 'relative', width: 260 }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar cliente por nombre..."
                  value={filtroCartera}
                  onChange={e => setFiltroCartera(e.target.value)}
                  style={{ ...IS, padding: '8px 12px 8px 32px', fontSize: '0.8rem' }}
                />
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: '0.85rem' }}>🔎</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#131326', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Cliente</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Nodo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Tarifa/Mes</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>Deuda Total</th>
                    {months.map(m => (
                      <th key={m.key} style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem' }}>{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActivos.map((c, idx) => {
                    let saldoPendiente = parseFloat(c.saldo_total || 0);
                    const tarifa = parseFloat(c.tarifa_mensual || 0);
                    const isDeudor = saldoPendiente > 0;

                    return (
                      <tr key={c.id} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                      }} className="hover-row">
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.nombre}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{c.nodo || '—'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: P.internet }}>{fmt(tarifa)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: isDeudor ? P.egreso : P.ingreso }}>
                          {fmt(saldoPendiente)}
                        </td>
                        {months.map((m, i) => {
                          let cellVal = 0;
                          if (saldoPendiente > 0) {
                            if (tarifa > 0) {
                              if (i === months.length - 1) {
                                cellVal = saldoPendiente;
                              } else {
                                cellVal = Math.min(saldoPendiente, tarifa);
                              }
                              saldoPendiente -= cellVal;
                            } else {
                              if (i === 0) {
                                cellVal = saldoPendiente;
                                saldoPendiente = 0;
                              }
                            }
                          }
                          const hasDebt = cellVal > 0;
                          return (
                            <td key={m.key} style={{
                              padding: '12px 16px', textAlign: 'right',
                              color: hasDebt ? P.egreso : 'var(--text-muted)',
                              fontWeight: hasDebt ? 700 : 400
                            }}>
                              {hasDebt ? fmt(cellVal) : <span style={{ opacity: 0.4 }}>Pagado</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {filteredActivos.length === 0 && (
                    <tr>
                      <td colSpan={4 + months.length} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        No se encontraron clientes activos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const Balance = () => {
  const [vista, setVista] = useState('mensual');
  const [mes, setMes] = useState(DEFAULT_MES);
  const [anio, setAnio] = useState(DEFAULT_ANIO);
  const [report, setReport] = useState(null);
  const [reportPlataforma, setReportPlataforma] = useState(null);
  const [reportMovsInternos, setReportMovsInternos] = useState(null);
  const [reportAnual, setReportAnual] = useState(null);
  const [egresos, setEgresos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [gastosFijos, setGastosFijos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalEgreso, setModalEgreso] = useState(null);
  const [modalProy, setModalProy] = useState(null);
  const [modalColchon, setModalColchon] = useState(null);
  const [modalGastoFijo, setModalGastoFijo] = useState(null);
  const [modalMovInterno, setModalMovInterno] = useState(null);
  const [proyDetalle, setProyDetalle] = useState(null);   // proyecto seleccionado para detalle
  const [filtroEgreso, setFiltroEgreso] = useState('');   // Búsqueda en egresos del mes

  // ── FETCH ──
  const fetchMensual = useCallback(async () => { setLoading(true); try { const r = await balanceService.reporteMensual(mes); setReport(r.data); } catch (e) { } setLoading(false); }, [mes]);
  const fetchPlataforma = useCallback(async () => { setLoading(true); try { const r = await balanceService.reportePlataforma(mes); setReportPlataforma(r.data); } catch (e) { } setLoading(false); }, [mes]);
  const fetchMovsInternos = useCallback(async () => { setLoading(true); try { const r = await balanceService.listarMovimientosInternos(mes); setReportMovsInternos(r.data); } catch (e) { } setLoading(false); }, [mes]);
  const fetchAnual = useCallback(async () => { setLoading(true); try { const r = await balanceService.reporteAnual(anio); setReportAnual(r.data); } catch (e) { } setLoading(false); }, [anio]);
  const fetchEgresos = useCallback(async () => { try { const r = await balanceService.listarEgresos(); setEgresos(r.data); } catch (e) { } }, []);
  const fetchProyectos = useCallback(async () => { try { const r = await balanceService.listarProyectos(); setProyectos(r.data); } catch (e) { } }, []);
  const fetchGastosFijos = useCallback(async () => { try { const r = await balanceService.listarGastosFijos(); setGastosFijos(r.data); } catch (e) { } }, []);

  useEffect(() => { if (vista === 'mensual') fetchMensual(); }, [vista, fetchMensual]);
  useEffect(() => { if (vista === 'plataforma') fetchPlataforma(); }, [vista, fetchPlataforma]);
  useEffect(() => { if (vista === 'movimientos-internos') fetchMovsInternos(); }, [vista, mes, fetchMovsInternos]);
  useEffect(() => { if (vista === 'anual') fetchAnual(); }, [vista, fetchAnual]);
  useEffect(() => { if (vista === 'egresos') { fetchEgresos(); fetchGastosFijos(); } }, [vista, fetchEgresos, fetchGastosFijos]);
  useEffect(() => { if (vista === 'proyectos') fetchProyectos(); }, [vista, fetchProyectos]);
  useEffect(() => { fetchGastosFijos(); }, [fetchGastosFijos]);

  const handleSaveMovInterno = async data => {
    if (data.id) await balanceService.actualizarMovimientoInterno(data.id, data);
    else await balanceService.crearMovimientoInterno(data);
    fetchMovsInternos();
    showSuccess('Movimiento interno guardado correctamente');
  };

  const handleDeleteMovInterno = async id => {
    const confirmado = await showConfirm('¿Eliminar movimiento?', '¿Deseas eliminar este movimiento interno?', 'Sí, eliminar', 'Cancelar');
    if (!confirmado) return;
    await balanceService.eliminarMovimientoInterno(id);
    fetchMovsInternos();
    showSuccess('Movimiento eliminado');
  };
  useEffect(() => { if (vista === 'proyectos') fetchProyectos(); }, [vista, fetchProyectos]);
  useEffect(() => { fetchGastosFijos(); }, [fetchGastosFijos]);

  const handleSaveEgreso = async data => {
    if (data.id) await balanceService.actualizarEgreso(data.id, data);
    else await balanceService.crearEgreso(data);
    fetchEgresos(); if (vista === 'mensual') fetchMensual();
  };
  const handleDeleteEgreso = async id => {
    const confirmado = await showConfirm('¿Eliminar egreso?', '¿Eliminar este egreso?', 'Sí, eliminar', 'Cancelar');
    if (!confirmado) return;
    await balanceService.eliminarEgreso(id);
    fetchEgresos(); if (vista === 'mensual') fetchMensual();
  };
  const handleSaveProy = async data => {
    if (data.id) await balanceService.actualizarProyecto(data.id, data);
    else await balanceService.crearProyecto(data);
    fetchProyectos();
  };
  const handleDeleteProy = async id => {
    const confirmado = await showConfirm('¿Eliminar proyecto?', '¿Eliminar este proyecto y todos sus datos?', 'Sí, eliminar', 'Cancelar');
    if (!confirmado) return;
    await balanceService.eliminarProyecto(id);
    fetchProyectos();
  };

  const handleSaveColchon = async data => {
    if (data.id) await balanceService.actualizarColchon(data.id, data);
    else await balanceService.crearColchon(data);
    if (vista === 'mensual') fetchMensual();
  };
  const handleDeleteColchon = async id => {
    const confirmado = await showConfirm('¿Eliminar colchón?', '¿Eliminar este registro del colchón?', 'Sí, eliminar', 'Cancelar');
    if (!confirmado) return;
    await balanceService.eliminarColchon(id);
    if (vista === 'mensual') fetchMensual();
  };

  const handleSaveGastoFijo = async data => {
    if (data.id) await balanceService.actualizarGastoFijo(data.id, data);
    else await balanceService.crearGastoFijo(data);
    fetchGastosFijos();
    if (vista === 'mensual') fetchMensual();
  };
  const handleDeleteGastoFijo = async id => {
    const confirmado = await showConfirm('¿Eliminar gasto fijo?', '¿Eliminar este gasto fijo?', 'Sí, eliminar', 'Cancelar');
    if (!confirmado) return;
    await balanceService.eliminarGastoFijo(id);
    fetchGastosFijos();
    if (vista === 'mensual') fetchMensual();
  };

  const handleExportar = async () => {
    try {
      setLoading(true);
      const [aStr, mNum] = mes.split('-');
      const mLabel = MONTH_NAMES[parseInt(mNum, 10) - 1];
      const response = await balanceService.exportarReporteExcel(mes);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Balance_Opsatel_${mLabel}_${aStr}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      showError("Error al exportar el reporte Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleExportarAnual = async () => {
    setLoading(true);
    try {
      const response = await balanceService.exportarReporteAnualExcel(anio);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Balance_Anual_Opsatel_${anio}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      showError("Error al exportar el reporte anual Excel");
    } finally {
      setLoading(false);
    }
  };

  const Tab = ({ id, label, icon }) => (
    <button id={`tab-balance-${id}`} onClick={() => setVista(id)} style={{
      padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
      fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', fontWeight: 600,
      border: vista === id ? '1px solid rgba(255,255,255,0.22)' : '1px solid transparent',
      background: vista === id ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.03)',
      color: vista === id ? '#fff' : 'rgba(255,255,255,0.55)',
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
    const barData = [
      { name: 'Ingresos', total: ingresos.total, fill: P.ingreso },
      { name: 'Egresos', total: egData.total, fill: P.egreso },
      { name: 'Proyectos', total: proyData.total, fill: P.proyecto },
      { name: 'Balance', total: Math.abs(balance_neto), fill: balance_neto >= 0 ? P.ingreso : P.egreso },
    ];
    const [anioStr, mesNum] = mes.split('-');
    const mesLabel = MONTH_NAMES[parseInt(mesNum, 10) - 1] + ' ' + anioStr;

    const egByCat = Object.entries(egData.detalle || {}).map(([name, value]) => ({ name: CAT_LABELS[name] || name, value, color: P.cat[name] || '#94a3b8' })).filter(x => x.value > 0);
    const egByMetodo = egData.lista.reduce((acc, eg) => {
      acc[eg.metodo_pago] = (acc[eg.metodo_pago] || 0) + parseFloat(eg.monto);
      return acc;
    }, {});
    const pieMetodo = Object.entries(egByMetodo).map(([name, value]) => ({ name, value, color: name === 'Pichincha' ? P.pichincha : name === 'JEP' ? P.jep : name === 'Efectivo' ? P.efectivo : '#94a3b8' }));

    return (
      <div>
        <MonthNavBar value={mes} onChange={val => setMes(val)} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, background: 'rgba(255,255,255,0.03)', padding: '12px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, background: 'rgba(99,102,241,0.2)', borderRadius: 12 }}>📊</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Resumen Operativo</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cierre de caja para {mesLabel}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={fetchMensual} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>🔄 Refrescar</button>
            <button onClick={handleExportar} title="Genera el reporte Excel mensual estructurado con formato para la presentación ante el regulador ARCOTEL" style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', transition: 'transform 0.2s' }}>📥 Exportar Arcotel</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
          <Card icon="📥" title="Ingresos" color={P.ingreso} value={fmt(ingresos.total)} sub="Total recaudado" />
          <Card icon="📤" title="Egresos" color={P.egreso} value={fmt(egData.total)} sub="Gastos operativos" />
          <Card icon="🏗️" title="Proyectos" color={P.proyecto} value={fmt(proyData.total)} sub="Inversión en obras" />
          <Card icon={balance_neto >= 0 ? '💰' : '⚠️'} title="Balance Neto"
            color={balance_neto >= 0 ? P.ingreso : P.egreso} value={fmt(balance_neto)}
            sub={balance_neto >= 0 ? 'Superávit Mensual' : 'Déficit Mensual'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px,1fr))', gap: 20, marginBottom: 32 }}>
          {/* Gráfica Principal */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>📊 Flujo de Caja</h4>
              <Badge text="Resumen" color={P.balance} />
            </div>
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
                  <ReTooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={v => fmt(v)} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={45}>
                    {barData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.9} />)}
                    <LabelList dataKey="total" position="top" fill="white" fontSize={11} fontWeight={700} formatter={fmt} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráficas de Torta */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24 }}>
            <h4 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700 }}>🥧 Distribución de Gastos</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, fontWeight: 700 }}>POR CATEGORÍA</p>
                <div style={{ width: '100%', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={egByCat} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                        {egByCat.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <ReTooltip {...tooltipStyle} formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, fontWeight: 700 }}>POR MÉTODO</p>
                <div style={{ width: '100%', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieMetodo} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                        {pieMetodo.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <ReTooltip {...tooltipStyle} formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 15 }}>
              {egByCat.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen Tipo Excel - Side by Side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 18, padding: 20 }}>
            <h5 style={{ margin: '0 0 15px', color: P.ingreso, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              🟢 Resumen de Ingresos <span style={{ flex: 1, height: 1, background: 'rgba(16,185,129,0.2)' }} />
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '🌐 Internet', val: ingresos.internet.total, sub: `Recaudado de ${ingresos.internet.cantidad || 0} clientes` },
                { label: '📺 IP TV', val: ingresos.iptv.total, sub: 'Servicios de televisión' },
                { label: '🌍 Extras', val: ingresos.extras.total, sub: 'Pagos adicionales y diversos' },
                { label: '➕ Adicional', val: ingresos.adicional, sub: 'Otros conceptos' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.sub}</div>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: P.ingreso }}>{fmt(item.val)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 18, padding: 20 }}>
            <h5 style={{ margin: '0 0 15px', color: P.egreso, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              🔴 Resumen de Egresos <span style={{ flex: 1, height: 1, background: 'rgba(244,63,94,0.2)' }} />
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(egData.detalle || {}).map(([cat, val]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'capitalize' }}>{CAT_LABELS[cat] || cat}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gasto mensual</div>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: P.egreso }}>{fmt(val)}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(244,63,94,0.1)', borderRadius: 12, marginTop: 5, border: '1px solid rgba(244,63,94,0.2)' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>TOTAL GASTOS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: P.egreso }}>{fmt(egData.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Egresos del mes - Vista Excel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <SectionTitle icon="📋" text="Detalle de Egresos (Hoja de Cálculo)" margin={0} />
          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="text"
              placeholder="🔍 Buscar en egresos..."
              value={filtroEgreso}
              onChange={e => setFiltroEgreso(e.target.value)}
              style={{ ...IS, padding: '8px 14px 8px 36px', fontSize: '0.82rem', background: 'rgba(255,255,255,0.04)' }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔎</span>
          </div>
        </div>
        {egData.lista.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>📭</div>
            Sin egresos registrados para este período.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: '#1a1a2e', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  {['Descripción', 'En qué se gastó', 'Categoría', 'Método', 'Monto'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {egData.lista
                  .filter(e => {
                    const search = filtroEgreso.toLowerCase();
                    return e.descripcion.toLowerCase().includes(search) ||
                      (e.subcategoria && e.subcategoria.toLowerCase().includes(search)) ||
                      e.categoria.toLowerCase().includes(search) ||
                      e.metodo_pago.toLowerCase().includes(search);
                  })
                  .map((eg, idx) => (
                    <tr key={eg.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      transition: 'background 0.2s'
                    }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'white' }}>{eg.descripcion}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {eg.subcategoria ? <Badge text={eg.subcategoria} color={P.proyecto} /> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}><Badge text={CAT_LABELS[eg.categoria] || eg.categoria} color={P.cat[eg.categoria] || '#94a3b8'} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: eg.metodo_pago === 'Efectivo' ? P.efectivo : P.pichincha, fontWeight: 700, fontSize: '0.75rem' }}>● {eg.metodo_pago.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: P.egreso, fontWeight: 800, fontSize: '0.95rem' }}>{fmt(eg.monto)}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot style={{ position: 'sticky', bottom: 0 }}>
                <tr style={{ background: 'rgba(244,63,94,0.15)', backdropFilter: 'blur(10px)', fontWeight: 900 }}>
                  <td colSpan={4} style={{ padding: '16px', color: 'white', letterSpacing: 1 }}>TOTAL GASTOS DEL MES</td>
                  <td style={{ padding: '16px', color: P.egreso, fontSize: '1.2rem', textAlign: 'left' }}>{fmt(egData.total)}</td>
                </tr>
              </tfoot>
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
                const ec = p.estado === 'Completado' ? P.ingreso : p.estado === 'Pausado' ? P.egreso : P.proyecto;
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

        {/* ── SECCIÓN COLCHÓN (Excel-like) ── */}
        <SectionTitle icon="💰" text="Caja de Colchón (Reserva de Capital)" />
        <div style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 20, padding: 22, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>Fondo de ahorro acumulado para emergencias o inversiones futuras.</p>
            </div>
            <button onClick={() => setModalColchon('crear')} style={{ padding: '9px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              ＋ Agregar Valor
            </button>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['Concepto / Descripción', 'Fecha', 'Monto ($)', 'Acciones'].map((h, i) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: i === 2 ? 'right' : 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!report.colchon?.lista || report.colchon.lista.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No hay valores registrados en el colchón.</td></tr>
                ) : report.colchon.lista.map((c, idx) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.descripcion}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)' }}>{c.fecha}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: P.ingreso, fontSize: '1rem' }}>{fmt(c.monto)}</td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                      <button onClick={() => setModalColchon(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>✏️</button>
                      <button onClick={() => handleDeleteColchon(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(16,185,129,0.15)', borderTop: '2px solid rgba(16,185,129,0.3)' }}>
                  <td colSpan={2} style={{ padding: '16px', fontWeight: 900, fontSize: '0.95rem', letterSpacing: 1 }}>TOTAL COLCHÓN ACUMULADO</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 950, color: P.ingreso, fontSize: '1.25rem' }}>{fmt(report.colchon?.total || 0)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Historial de Clientes / Cartera */}
        <div style={{ marginTop: 32 }}>
          <HistorialClientes mesTarget={mes} />
        </div>

        {/* ── SECCIÓN GASTOS FIJOS en vista mensual ── */}
        {report?.egresos?.gastos_fijos?.length > 0 && (
          <>
            <SectionTitle icon="🔒" text="Egresos Fijos del Mes (Aplicados Automáticamente)" />
            <div style={{ background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 16, padding: 18, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={() => setVista('gastos-fijos')} style={{ padding: '7px 16px', borderRadius: 10, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: P.egreso, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif' }}>
                  ⚙️ Gestionar Egresos Fijos
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.egresos.gastos_fijos.map(gf => (
                  <div key={gf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.87rem', fontWeight: 700 }}>{gf.descripcion}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{CAT_LABELS[gf.categoria] || gf.categoria} · {gf.metodo_pago}</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: P.egreso }}>{fmt(gf.monto)}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(244,63,94,0.1)', borderRadius: 10, borderTop: '1px solid rgba(244,63,94,0.2)', marginTop: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>TOTAL GASTOS FIJOS</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: P.egreso }}>{fmt(report.egresos.total_gastos_fijos)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // VISTA PLATAFORMA (IPTV)
  // ─────────────────────────────────────────────────────────────────
  const renderPlataforma = () => {
    if (!reportPlataforma) return null;
    const { sumatoria_total, desglose_origen, desglose_bancos, transacciones } = reportPlataforma;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <MonthNavBar value={mes} onChange={val => setMes(val)} />

        {/* HEADER DE SECCIÓN PLATAFORMA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🚀</span> Recaudación por Plataforma (IPTV & Cuentas Extras)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Consolidado financiero exclusivo de pantallas adicionales e ingresos por cuentas de plataforma.
            </p>
          </div>
          <button onClick={fetchPlataforma} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: 12, fontSize: '0.82rem' }}>
            🔄 Refrescar
          </button>
        </div>

        {/* METRICAS PRINCIPALES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <Card title="Total Plataforma" value={fmt(sumatoria_total)} icon="🚀" color="#a78bfa" sub="Sumatoria Total Recaudada" />
          <Card title="IPTV Plus (Clientes Internet)" value={fmt(desglose_origen?.iptv_plus || 0)} icon="📺" color="#3b82f6" sub="Pantallas Extras de Clientes" />
          <Card title="Clientes Extras (Solo Plataforma)" value={fmt(desglose_origen?.clientes_extras || 0)} icon="🌍" color="#10b981" sub="Cuentas Plataforma Externas" />
        </div>

        {/* DESGLOSE POR ENTIDAD BANCARIA */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 18, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            🏦 Desglose de Plataforma por Entidad Bancaria
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>💵 Efectivo / Ventanilla</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>{fmt(desglose_bancos?.efectivo || 0)}</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ color: '#f59e0b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>🏦 Banco Pichincha</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>{fmt(desglose_bancos?.pichincha || 0)}</div>
            </div>
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ color: '#6366f1', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>🏛️ Coac JEP / Guayaquil</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>{fmt(desglose_bancos?.jep || 0)}</div>
            </div>
            <div style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>💳 Otros Métodos</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>{fmt(desglose_bancos?.otros || 0)}</div>
            </div>
          </div>
        </div>

        {/* TABLA DE TRANSACCIONES DETALLADAS DE PLATAFORMA */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 18, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            📋 Transacciones y Cobros Registrados en Plataforma
          </h4>
          <div style={{ overflowX: 'auto', borderRadius: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Cliente / Usuario</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Tipo de Ingreso</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Banco / Método</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Monto Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {(!transacciones || transacciones.length === 0) ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🚀</div>
                      No hay cobros de plataforma registrados en este mes.
                    </td>
                  </tr>
                ) : transacciones.map((t, idx) => (
                  <tr key={t.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'white' }}>{t.cliente}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                        background: t.tipo?.includes('Internet') ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                        color: t.tipo?.includes('Internet') ? '#60a5fa' : '#34d399',
                        border: `1px solid ${t.tipo?.includes('Internet') ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`
                      }}>
                        {t.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#cbd5e1' }}>
                      {t.banco}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {t.fecha}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: '#a78bfa', fontSize: '0.95rem' }}>
                      {fmt(t.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {transacciones && transacciones.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(167,139,250,0.1)', borderTop: '2px solid rgba(167,139,250,0.3)' }}>
                    <td colSpan={4} style={{ padding: '14px 16px', fontWeight: 900, color: '#f8fafc', letterSpacing: 1 }}>TOTAL PLATAFORMA</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#a78bfa', fontSize: '1.2rem', fontWeight: 900 }}>{fmt(sumatoria_total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // VISTA MOVIMIENTOS INTERNOS
  // ─────────────────────────────────────────────────────────────────
  const renderMovimientosInternos = () => {
    if (!reportMovsInternos) return null;
    const { movimientos, totales_movidos, recaudacion_bruta, saldos_finales } = reportMovsInternos;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <MonthNavBar value={mes} onChange={val => setMes(val)} />

        {/* HEADER DE SECCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 24px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🔄</span> Movimientos Internos entre Cuentas
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Registro de depósitos y transferencias internas entre caja chica y cuentas bancarias.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={fetchMovsInternos} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: 12, fontSize: '0.82rem' }}>
              🔄 Refrescar
            </button>
            <button onClick={() => setModalMovInterno('crear')} className="btn btn-primary" style={{ padding: '8px 18px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              + Registrar Movimiento Interno
            </button>
          </div>
        </div>

        {/* METRICAS DE SALDOS FINALES DISPONIBLES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <Card title="Efectivo Final (Caja)" value={fmt(saldos_finales?.efectivo || 0)} icon="💵" color="#4ade80" sub={`Recaudado ${fmt(recaudacion_bruta?.efectivo)} - Movido ${fmt(totales_movidos?.efectivo)}`} />
          <Card title="Banco Pichincha Final" value={fmt(saldos_finales?.pichincha || 0)} icon="🏦" color="#facc15" sub={`Recaudado ${fmt(recaudacion_bruta?.pichincha)} - Movido ${fmt(totales_movidos?.pichincha)}`} />
          <Card title="Coac JEP Final" value={fmt(saldos_finales?.jep || 0)} icon="🏛️" color="#fb923c" sub={`Recaudado ${fmt(recaudacion_bruta?.jep)} - Movido ${fmt(totales_movidos?.jep)}`} />
        </div>

        {/* TABLA PRINCIPAL DE MOVIMIENTOS INTERNOS (COMO LA HOJA DE CÁLCULO DEL USUARIO) */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginBottom: 18, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Registro de Transferencias y Depósitos Internos
          </h4>
          <div style={{ overflowX: 'auto', borderRadius: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', width: 60 }}>Item #</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Para (Destino)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Fecha de Pago</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Tipo (Origen)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Valor ($)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Observación</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(!movimientos || movimientos.length === 0) ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔄</div>
                      No hay movimientos internos registrados en este mes.
                    </td>
                  </tr>
                ) : movimientos.map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)' }}>
                        {m.destino}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                      {m.fecha}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                        {m.origen}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: '#4ade80', fontSize: '0.95rem' }}>
                      {fmt(m.monto)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {m.observacion || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => setModalMovInterno(m)} style={{ background: 'rgba(99,102,241,0.12)', border: 'none', borderRadius: 8, color: '#6366f1', padding: '5px 8px', cursor: 'pointer' }} title="Editar">✏️</button>
                        <button onClick={() => handleDeleteMovInterno(m.id)} style={{ background: 'rgba(244,63,94,0.12)', border: 'none', borderRadius: 8, color: '#f43f5e', padding: '5px 8px', cursor: 'pointer' }} title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA RESUMEN INFERIOR (MATCHING HOJA DE CÁLCULO) */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px', maxWidth: 500, alignSelf: 'flex-end', width: '100%' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', marginBottom: 14, letterSpacing: '0.03em' }}>
            📈 Resumen de Movimientos y Saldos Finales
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Total Efectivo Movido</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#f8fafc' }}>{fmt(totales_movidos?.efectivo)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Total Trans. Pichincha Movido</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#f8fafc' }}>{fmt(totales_movidos?.pichincha)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Total Trans. JEP Movido</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#f8fafc' }}>{fmt(totales_movidos?.jep)}</td>
              </tr>
              <tr style={{ background: 'rgba(74,222,128,0.12)', borderTop: '2px solid rgba(74,222,128,0.3)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 900, color: '#4ade80' }}>Total Efectivo Final (Caja)</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#4ade80', fontSize: '1rem' }}>{fmt(saldos_finales?.efectivo)}</td>
              </tr>
              <tr style={{ background: 'rgba(250,204,21,0.12)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 900, color: '#facc15' }}>Total Trans. Pichincha Final</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#facc15', fontSize: '1rem' }}>{fmt(saldos_finales?.pichincha)}</td>
              </tr>
              <tr style={{ background: 'rgba(251,146,60,0.12)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 900, color: '#fb923c' }}>Total Trans. JEP Final</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#fb923c', fontSize: '1rem' }}>{fmt(saldos_finales?.jep)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // VISTA ANUAL
  // ─────────────────────────────────────────────────────────────────
  const renderAnual = () => {
    if (!reportAnual) return null;
    const { meses, totales, proyectos: pa } = reportAnual;

    const stackedData = meses.map(m => ({
      name: m.label,
      Internet: m.internet,
      IPTV: m.iptv,
      Extras: m.extras + m.adicional,
      Egresos: -m.egresos,
      Balance: m.balance
    }));

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <label style={{ color: 'var(--text-muted)', fontWeight: 600 }}>📆 Año Contable:</label>
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value, 10))}
            style={{ ...IS, width: 'auto' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} style={OS}>{y}</option>)}
          </select>
          <button onClick={fetchAnual} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>Cargar Reporte Anual</button>
          <button onClick={handleExportarAnual} style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            📥 Exportar {anio}
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>BALANCE GENERAL {anio}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
          <Card icon="📈" title="Ingresos Anuales" color={P.ingreso} value={fmt(totales.ingresos)} sub={`Recaudación total ${anio}`} />
          <Card icon="📉" title="Egresos Anuales" color={P.egreso} value={fmt(totales.egresos)} sub={`Gastos operativos ${anio}`} />
          <Card icon={totales.balance >= 0 ? '💰' : '🚨'} title="Balance Neto Anual"
            color={totales.balance >= 0 ? P.ingreso : P.egreso} value={fmt(totales.balance)}
            sub={totales.balance >= 0 ? 'Rentabilidad Positiva' : 'Atención: Saldo Negativo'} />
          <Card icon="🏗️" title="Proyectos" color={P.proyecto} value={pa.length} sub="Proyectos gestionados" />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, marginBottom: 32, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📊 Evolución Financiera Mensual</h4>
            <div style={{ display: 'flex', gap: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}><div style={{ width: 10, height: 10, background: P.ingreso, borderRadius: 2 }} /> Ingresos</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}><div style={{ width: 10, height: 10, background: P.egreso, borderRadius: 2 }} /> Egresos</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
                <ReTooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={v => fmt(v)} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Internet" stackId="a" fill={P.internet} barSize={35} radius={[0, 0, 0, 0]} />
                <Bar dataKey="IPTV" stackId="a" fill={P.iptv} />
                <Bar dataKey="Extras" stackId="a" fill={P.extras} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" stackId="b" fill={P.egreso} radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <SectionTitle icon="📗" text={`Resumen Consolidado ${anio}`} />
        <div style={{ overflowX: 'auto', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#1a1a2e', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                {['Mes', '🌐 Internet', '📺 IPTV', '💰 Otros', '📥 Ingresos', '📤 Egresos', '⚖️ Balance'].map((h, i) => (
                  <th key={h} style={{ padding: '16px', textAlign: i === 0 ? 'left' : 'right', color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <tr key={m.mes} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  transition: 'background 0.2s'
                }} className="hover-row">
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: 'white' }}>{m.label.toUpperCase()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: P.internet, fontWeight: 600 }}>{fmt(m.internet)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: P.iptv, fontWeight: 600 }}>{fmt(m.iptv)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: P.extras, fontWeight: 600 }}>{fmt(m.extras + m.adicional)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: P.ingreso, fontSize: '0.95rem' }}>{fmt(m.ingresos)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: P.egreso, fontWeight: 600 }}>{fmt(m.egresos)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: m.balance >= 0 ? P.ingreso : P.egreso, fontSize: '1rem', background: m.balance >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(244,63,94,0.05)' }}>
                    {m.balance >= 0 ? '+' : ''}{fmt(m.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ position: 'sticky', bottom: 0 }}>
              <tr style={{ background: 'rgba(99,102,241,0.2)', backdropFilter: 'blur(10px)', fontWeight: 900 }}>
                <td style={{ padding: '18px 16px', color: 'white', letterSpacing: 1 }}>TOTAL ANUAL {anio}</td>
                <td colSpan={3} />
                <td style={{ padding: '18px 16px', textAlign: 'right', color: P.ingreso, fontSize: '1.2rem' }}>{fmt(totales.ingresos)}</td>
                <td style={{ padding: '18px 16px', textAlign: 'right', color: P.egreso, fontSize: '1.1rem' }}>{fmt(totales.egresos)}</td>
                <td style={{ padding: '18px 16px', textAlign: 'right', color: totales.balance >= 0 ? P.ingreso : P.egreso, fontSize: '1.3rem' }}>{fmt(totales.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // VISTA EGRESOS
  // ─────────────────────────────────────────────────────────────────
  const renderEgresos = () => {
    const sortedEgresos = [...egresos].sort((a, b) => {
      if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
      return b.fecha.localeCompare(a.fecha);
    });

    // Grouping by category for visual hierarchy
    const groupedEgresos = sortedEgresos.reduce((acc, eg) => {
      acc[eg.categoria] = acc[eg.categoria] || [];
      acc[eg.categoria].push(eg);
      return acc;
    }, {});

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, background: 'rgba(255,255,255,0.03)', padding: '16px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>📖 Libro de Egresos</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Listado histórico de gastos operativos y proyectos.</p>
          </div>
          <button id="btn-nuevo-egreso" onClick={() => setModalEgreso('crear')}
            style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 20px rgba(244,63,94,0.3)' }}>
            ＋ Registrar Nuevo Egreso
          </button>
        </div>

        <div className="grid-responsive" style={{ marginBottom: 28 }}>
          {CATEGORIAS.map(cat => {
            const total = egresos.filter(e => e.categoria === cat).reduce((s, e) => s + parseFloat(e.monto), 0);
            return (
              <div key={cat} style={{ background: `${P.cat[cat]}0a`, border: `1px solid ${P.cat[cat]}33`, borderRadius: 16, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: P.cat[cat] }}>{CAT_LABELS[cat].toUpperCase()}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{fmt(total)}</span>
              </div>
            );
          })}
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#1a1a2e', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                {['Concepto', 'Subcategoría', 'Fecha', 'Mes', 'Método', 'Monto', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '16px', textAlign: h === 'Monto' ? 'right' : 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {egresos.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>📭 No hay egresos registrados todavía.</td></tr>
              ) : Object.entries(groupedEgresos).map(([cat, list]) => (
                <React.Fragment key={cat}>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <td colSpan={7} style={{ padding: '10px 16px', color: P.cat[cat], fontWeight: 800, fontSize: '0.75rem', letterSpacing: 2, textTransform: 'uppercase' }}>
                      ▶ {CAT_LABELS[cat]}
                    </td>
                  </tr>
                  {list.map(eg => (
                    <tr key={eg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'white' }}>{eg.descripcion}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {eg.subcategoria ? <Badge text={eg.subcategoria} color={P.proyecto} /> : <span style={{ color: 'rgba(255,255,255,0.1)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{eg.fecha}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.3)' }}>{eg.mes}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: eg.metodo_pago === 'Efectivo' ? P.efectivo : P.pichincha, fontWeight: 700, fontSize: '0.7rem' }}>{eg.metodo_pago.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: P.egreso, fontWeight: 800, fontSize: '1rem' }}>{fmt(eg.monto)}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
                        <button onClick={() => setModalEgreso(eg)} style={{ background: 'rgba(99,102,241,0.1)', border: 'none', borderRadius: 8, color: P.balance, padding: '6px 10px', cursor: 'pointer', transition: 'all 0.2s' }}>✏️</button>
                        <button onClick={() => handleDeleteEgreso(eg.id)} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: 8, color: P.egreso, padding: '6px 10px', cursor: 'pointer', transition: 'all 0.2s' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
      <div className="grid-responsive">
        {proyectos.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 16, gridColumn: '1/-1' }}>No hay proyectos registrados.</div>
        ) : proyectos.map(p => {
          const pct = p.monto_total > 0 ? Math.min(100, (p.monto_invertido / p.monto_total) * 100) : 0;
          const ec = p.estado === 'Completado' ? P.ingreso : p.estado === 'Pausado' ? P.egreso : P.proyecto;
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
  // VISTA GASTOS FIJOS
  // ─────────────────────────────────────────────────────────────────
  const renderGastosFijos = () => {
    const totalFijos = gastosFijos.filter(g => g.activo).reduce((s, g) => s + parseFloat(g.monto || 0), 0);
    const totalInactivos = gastosFijos.filter(g => !g.activo).reduce((s, g) => s + parseFloat(g.monto || 0), 0);
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, background: 'rgba(255,255,255,0.03)', padding: '16px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>🔒 Egresos Fijos Mensuales</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Gastos recurrentes que se cobran automáticamente cada mes.</p>
          </div>
          <button onClick={() => setModalGastoFijo('crear')}
            style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 20px rgba(244,63,94,0.3)' }}>
            ＋ Nuevo Egreso Fijo
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
          <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 16, padding: '18px 22px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Total Activos / Mes</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f43f5e' }}>${totalFijos.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{gastosFijos.filter(g => g.activo).length} gasto(s) activo(s)</div>
          </div>
          <div style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 16, padding: '18px 22px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Inactivos (Pausados)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#94a3b8' }}>${totalInactivos.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{gastosFijos.filter(g => !g.activo).length} gasto(s) pausado(s)</div>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '18px 22px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Total Anual Estimado</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#6366f1' }}>${(totalFijos * 12).toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Proyección a 12 meses</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#1a1a2e', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                {['Estado', 'Concepto', 'Categoría', 'Método', 'Monto/Mes', 'Acciones'].map((h, i) => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Monto/Mes' ? 'right' : 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gastosFijos.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔒</div>
                  No hay egresos fijos registrados aún.
                </td></tr>
              ) : gastosFijos.map((g, idx) => (
                <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', opacity: g.activo ? 1 : 0.5, transition: 'background 0.2s' }} className="hover-row">
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: g.activo ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)', color: g.activo ? '#10b981' : '#94a3b8', border: `1px solid ${g.activo ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.2)'}` }}>
                      {g.activo ? '● ACTIVO' : '○ PAUSADO'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'white' }}>
                    {g.descripcion}
                    {g.notas && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{g.notas}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}><Badge text={CAT_LABELS[g.categoria] || g.categoria} color={P.cat[g.categoria] || '#94a3b8'} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: g.metodo_pago === 'Efectivo' ? P.efectivo : P.pichincha, fontWeight: 700, fontSize: '0.75rem' }}>● {(g.metodo_pago || 'Efectivo').toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: P.egreso, fontWeight: 900, fontSize: '1rem' }}>{fmt(g.monto)}</td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                    <button onClick={() => setModalGastoFijo(g)} style={{ background: 'rgba(99,102,241,0.1)', border: 'none', borderRadius: 8, color: P.balance, padding: '6px 10px', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDeleteGastoFijo(g.id)} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: 8, color: P.egreso, padding: '6px 10px', cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {gastosFijos.length > 0 && (
              <tfoot>
                <tr style={{ background: 'rgba(244,63,94,0.12)', borderTop: '2px solid rgba(244,63,94,0.3)' }}>
                  <td colSpan={4} style={{ padding: '16px', fontWeight: 900, letterSpacing: 1 }}>TOTAL FIJO MENSUAL (ACTIVOS)</td>
                  <td style={{ padding: '16px', textAlign: 'right', color: P.egreso, fontSize: '1.3rem', fontWeight: 900 }}>{fmt(totalFijos)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>📒 Balance & Finanzas</h1>
          <p>
            Ingresos, egresos y nóminas de proyectos — reporte mensual y anual completo.
          </p>
        </div>
      </div>

      <div className="page-actions" style={{ marginBottom: 28, padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Tab id="mensual" label="Resumen Mensual" icon="📊" />
        <Tab id="plataforma" label="Plataforma (IPTV)" icon="🚀" />
        <Tab id="movimientos-internos" label="Movimientos Internos" icon="🔄" />
        <Tab id="anual" label="Evolución Anual" icon="📈" />
        <Tab id="egresos" label="Libro de Egresos" icon="📖" />
        <Tab id="gastos-fijos" label="Egresos Fijos" icon="🔒" />
        <Tab id="proyectos" label="Proyectos & Obras" icon="🏗️" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={vista} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>Cargando reporte…
            </div>
          ) : (
            <>
              {vista === 'mensual' && renderMensual()}
              {vista === 'plataforma' && renderPlataforma()}
              {vista === 'movimientos-internos' && renderMovimientosInternos()}
              {vista === 'anual' && renderAnual()}
              {vista === 'egresos' && renderEgresos()}
              {vista === 'gastos-fijos' && renderGastosFijos()}
              {vista === 'proyectos' && renderProyectos()}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal Egreso */}
      {modalEgreso !== null && (
        <Modal title={modalEgreso === 'crear' ? '➕ Nuevo Egreso' : '✏️ Editar Egreso'} onClose={() => setModalEgreso(null)}>
          <EgresoForm initial={modalEgreso !== 'crear' ? { ...modalEgreso } : null} onSave={handleSaveEgreso} onClose={() => setModalEgreso(null)} />
        </Modal>
      )}

      {/* Modal Proyecto */}
      {modalProy !== null && (
        <Modal title={modalProy === 'crear' ? '➕ Nuevo Proyecto' : '✏️ Editar Proyecto'} onClose={() => setModalProy(null)}>
          <ProyectoForm initial={modalProy !== 'crear' ? { ...modalProy } : null} onSave={handleSaveProy} onClose={() => setModalProy(null)} />
        </Modal>
      )}

      {/* Detalle de Proyecto (modal con nóminas) */}
      {proyDetalle !== null && (
        <ProyectoDetalle proyecto={proyDetalle} onClose={() => setProyDetalle(null)} />
      )}

      {/* Modal Colchon */}
      {modalColchon !== null && (
        <Modal title={modalColchon === 'crear' ? '➕ Agregar al Colchón' : '✏️ Editar Colchón'} onClose={() => setModalColchon(null)}>
          <ColchonForm initial={modalColchon !== 'crear' ? { ...modalColchon } : null} onSave={handleSaveColchon} onClose={() => setModalColchon(null)} />
        </Modal>
      )}

      {/* Modal Gasto Fijo */}
      {modalGastoFijo !== null && (
        <Modal title={modalGastoFijo === 'crear' ? '➕ Nuevo Egreso Fijo' : '✏️ Editar Egreso Fijo'} onClose={() => setModalGastoFijo(null)}>
          <GastoFijoForm initial={modalGastoFijo !== 'crear' ? { ...modalGastoFijo } : null} onSave={handleSaveGastoFijo} onClose={() => setModalGastoFijo(null)} />
        </Modal>
      )}

      {/* Modal Movimiento Interno */}
      {modalMovInterno !== null && (
        <Modal title={modalMovInterno === 'crear' ? '➕ Registrar Movimiento Interno' : '✏️ Editar Movimiento Interno'} onClose={() => setModalMovInterno(null)}>
          <MovimientoInternoForm initial={modalMovInterno !== 'crear' ? { ...modalMovInterno } : null} onSave={handleSaveMovInterno} onClose={() => setModalMovInterno(null)} />
        </Modal>
      )}
    </div>
  );
};

export default Balance;
