import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/api';
import { motion } from 'framer-motion';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    porActivar: 0,
    saldoPendiente: 0,
    recaudacionMes: 0,
    tendencia: 0 // +1 subida, -1 bajada, 0 estable
  });
  const [chartData, setChartData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [financeStats, setFinanceStats] = useState({
    internet: { Efectivo: 0, Pichincha: 0, JEP: 0 },
    plus: { Efectivo: 0, Pichincha: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [allClientes, setAllClientes] = useState([]);
  const [recentPagos, setRecentPagos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, pagosRes, financeRes] = await Promise.all([
          clienteService.listar(),
          clienteService.listarPagos(),
          clienteService.getDashboardStats()
        ]);

        const clientes = clientesRes.data;
        const pagos = pagosRes.data;
        const finance = financeRes.data;

        setFinanceStats(finance);


        // Distribución para PieChart
        const activosCount = clientes.filter(c => c.estado?.toUpperCase() === 'ACTIVO').length;
        const inactivosCount = clientes.filter(c => c.estado?.toUpperCase() === 'INACTIVO').length;
        const porActivarCount = clientes.filter(c =>
          c.estado?.toUpperCase() === 'PENDIENTE' ||
          c.estado?.toUpperCase() === 'EN ACTIVACIÓN'
        ).length;

        setChartData([
          { name: 'Activos', value: activosCount, color: '#10b981' },
          { name: 'Inactivos', value: inactivosCount, color: '#94a3b8' },
          { name: 'Por Activar', value: porActivarCount, color: '#f59e0b' },
        ]);

        // Recaudación mensual para AreaChart
        const revenueByMonth = {};
        pagos.forEach(p => {
          const month = p.fecha_pago.slice(0, 7);
          revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(p.monto);
        });

        const sortedMonths = Object.keys(revenueByMonth).sort();
        const revData = sortedMonths.map(month => ({
          month,
          total: revenueByMonth[month]
        })).slice(-12);

        setRevenueData(revData);

        // Calcular tendencia
        const now = new Date();
        const thisMonth = now.toISOString().slice(0, 7);
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(now.getMonth() - 1);
        const lastMonth = lastMonthDate.toISOString().slice(0, 7);

        const totalThisMonth = revenueByMonth[thisMonth] || 0;
        const totalLastMonth = revenueByMonth[lastMonth] || 0;

        let tendencia = 0;
        if (totalThisMonth > totalLastMonth) tendencia = 1;
        else if (totalThisMonth < totalLastMonth) tendencia = -1;

        setStats({
          total: clientes.length,
          activos: activosCount,
          inactivos: inactivosCount,
          porActivar: porActivarCount,
          saldoPendiente: clientes.reduce((acc, c) => acc + (parseFloat(c.total_pago) || 0), 0),
          recaudacionMes: totalThisMonth,
          tendencia
        });

        setAllClientes(clientes);

        setRecentPagos(pagos.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleShowList = (title, filterFn) => {
    const filtered = allClientes.filter(filterFn);
    setModalTitle(title);
    setModalData(filtered);
    setShowModal(true);
  };

  const cards = [
    { title: 'Clientes Totales', value: stats.total, icon: '👥', color: 'var(--primary)' },
    {
      title: 'Servicios por Activar',
      value: stats.porActivar,
      icon: '⏳',
      color: '#f59e0b',
      clickable: true,
      onClick: () => handleShowList('Servicios por Activar', c => ['PENDIENTE', 'EN ACTIVACIÓN', 'POR ACTIVAR'].includes(c.estado?.toUpperCase()))
    },
    { title: 'Servicios ya Activos', value: stats.activos, icon: '✅', color: '#10b981' },
    {
      title: 'Servicios Inactivos',
      value: stats.inactivos,
      icon: '❌',
      color: '#ef4444',
      clickable: true,
      onClick: () => handleShowList('Servicios Inactivos', c => c.estado?.toUpperCase() === 'INACTIVO')
    },
    {
      title: 'Saldo Pendiente',
      value: `$${stats.saldoPendiente.toFixed(2)}`,
      icon: '💰',
      color: '#f43f5e',
      clickable: true,
      onClick: () => handleShowList('Clientes con Saldo Pendiente', c => parseFloat(c.total_pago || 0) > 0)
    },
    {
      title: 'Recaudación Mensual',
      value: `$${stats.recaudacionMes.toFixed(2)}`,
      icon: stats.tendencia === 1 ? '📈' : (stats.tendencia === -1 ? '📉' : '📊'),
      color: '#6366f1',
      trend: stats.tendencia
    },

    {
      title: 'Plan Internet',
      value: `$${(financeStats.internet.Efectivo + financeStats.internet.Pichincha + financeStats.internet.JEP).toFixed(2)}`,
      icon: '🌐',
      color: '#0ea5e9',
      clickable: true,
      onClick: () => handleShowFinance('Desglose Internet', [
        { name: 'Efectivo', value: financeStats.internet.Efectivo, color: '#10b981' },
        { name: 'Pichincha', value: financeStats.internet.Pichincha, color: '#fbbf24' },
        { name: 'JEP', value: financeStats.internet.JEP, color: '#6366f1' }
      ])
    },
    {
      title: 'Servicio IP TV',
      value: `$${(financeStats.plus.Efectivo + financeStats.plus.Pichincha).toFixed(2)}`,
      icon: '➕',
      color: '#ec4899',
      clickable: true,
      onClick: () => handleShowFinance('Desglose Plus', [
        { name: 'Efectivo', value: financeStats.plus.Efectivo, color: '#10b981' },
        { name: 'Pichincha', value: financeStats.plus.Pichincha, color: '#fbbf24' }
      ])
    },
  ];

  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeModalTitle, setFinanceModalTitle] = useState('');
  const [financeModalData, setFinanceModalData] = useState([]);

  const handleShowFinance = (title, data) => {
    setFinanceModalTitle(title);
    setFinanceModalData(data);
    setShowFinanceModal(true);
  };


  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Panel de Control</h1>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card glass ${card.clickable ? 'clickable-card' : ''}`}
            style={{
              borderLeft: `4px solid ${card.color}`,
              padding: '20px',
              cursor: card.clickable ? 'pointer' : 'default',
            }}
            onClick={card.onClick}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.8rem' }}>{card.icon}</div>
              {card.trend && (
                <span style={{ fontSize: '1.2rem', color: card.trend === 1 ? '#4ade80' : '#f87171' }}>
                  {card.trend === 1 ? '↑' : '↓'}
                </span>
              )}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginTop: '8px' }}>{card.title}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px' }}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-card glass" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px' }}>🌐 Recaudación Internet</h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Efectivo', value: financeStats.internet.Efectivo },
                    { name: 'Pichincha', value: financeStats.internet.Pichincha },
                    { name: 'JEP', value: financeStats.internet.JEP }
                  ]}
                  innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#fbbf24" />
                  <Cell fill="#6366f1" />
                </Pie>
                <ReTooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card glass" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px' }}>➕ Recaudación IP TV</h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Efectivo', value: financeStats.plus.Efectivo },
                    { name: 'Pichincha', value: financeStats.plus.Pichincha }
                  ]}
                  innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#fbbf24" />
                </Pie>
                <ReTooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-card glass" style={{ padding: '24px', minHeight: '350px' }}>
          <h3 style={{ marginBottom: '24px' }}>📈 Estado de Servicios</h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card glass" style={{ padding: '24px', minHeight: '350px' }}>
          <h3 style={{ marginBottom: '24px' }}>💵 Histórico de Ingresos</h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                <ReTooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="glass-card glass" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>📝 Últimos Pagos Registrados</h3>
          {loading ? <p>Cargando reportes...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentPagos.length > 0 ? recentPagos.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>ID Cliente: {p.cliente_id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(p.fecha_pago).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4ade80', fontWeight: 'bold' }}>+${parseFloat(p.monto).toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.metodo_pago}</div>
                  </div>
                </div>
              )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay pagos recientes aún.</p>}
            </div>
          )}
        </div>

        <div className="glass-card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⭐</div>
          <h4>Rendimiento Óptimo</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '12px' }}>
            Los indicadores de activación muestran un flujo constante.
            <br />
            ¡Buen trabajo este mes!
          </p>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass"
            style={{ width: '100%', maxWidth: '600px', padding: '32px', borderRadius: '24px', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>{modalTitle}</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                &times;
              </button>
            </div>

            <div className="custom-scrollbar" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {modalData.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No hay clientes en este estado.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <th style={{ textAlign: 'left', padding: '12px' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Nombre</th>
                      {modalTitle.includes('Saldo') ? (
                        <th style={{ textAlign: 'left', padding: '12px' }}>Deuda</th>
                      ) : (
                        <th style={{ textAlign: 'left', padding: '12px' }}>Plan</th>
                      )}
                      <th style={{ textAlign: 'left', padding: '12px' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{c.id}</td>
                        <td style={{ padding: '12px' }}>{c.nombre}</td>
                        {modalTitle.includes('Saldo') ? (
                          <td style={{ padding: '12px', color: '#f87171', fontWeight: 'bold' }}>${parseFloat(c.total_pago || 0).toFixed(2)}</td>
                        ) : (
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{c.plan}</td>
                        )}
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem',
                            background: c.estado?.toUpperCase() === 'INACTIVO' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: c.estado?.toUpperCase() === 'INACTIVO' ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${c.estado?.toUpperCase() === 'INACTIVO' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                          }}>
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
            </div>
          </motion.div>
        </div>
      )}

      {showFinanceModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass"
            style={{ width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '24px', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>{financeModalTitle}</h2>
              <button
                onClick={() => setShowFinanceModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {financeModalData.map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: `1px solid ${item.color}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color }} />
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: 'white' }}>${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowFinanceModal(false)}>Cerrar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};




export default Dashboard;
