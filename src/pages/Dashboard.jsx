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
  const [recentPagos, setRecentPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, pagosRes] = await Promise.all([
          clienteService.listar(),
          clienteService.listarPagos()
        ]);
        
        const clientes = clientesRes.data;
        const pagos = pagosRes.data;

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
          saldoPendiente: clientes.reduce((acc, c) => acc + (parseFloat(c.saldo) || 0), 0),
          recaudacionMes: totalThisMonth,
          tendencia
        });

        setRecentPagos(pagos.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { title: 'Clientes Totales', value: stats.total, icon: '👥', color: 'var(--primary)' },
    { title: 'Servicios por Activar', value: stats.porActivar, icon: '⏳', color: '#f59e0b' },
    { title: 'Servicios ya Activos', value: stats.activos, icon: '✅', color: '#10b981' },
    { title: 'Servicios Inactivos', value: stats.inactivos, icon: '❌', color: '#ef4444' },
    { title: 'Saldo Pendiente', value: `$${stats.saldoPendiente.toFixed(2)}`, icon: '💰', color: '#f43f5e' },
    { 
      title: 'Recaudación Mensual', 
      value: `$${stats.recaudacionMes.toFixed(2)}`, 
      icon: stats.tendencia === 1 ? '📈' : (stats.tendencia === -1 ? '📉' : '📊'), 
      color: '#6366f1',
      trend: stats.tendencia
    },
  ];


  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Panel de Control</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {cards.map((card, i) => (
          <motion.div 
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card glass"
            style={{ borderLeft: `4px solid ${card.color}`, padding: '20px' }}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '40px' }}>
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
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card glass" style={{ padding: '24px', minHeight: '350px' }}>
          <h3 style={{ marginBottom: '24px' }}>💵 Recaudación Histórica</h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
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
    </div>
  );
};




export default Dashboard;
