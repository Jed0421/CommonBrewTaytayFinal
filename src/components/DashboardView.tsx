import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Banknote, Receipt, Coffee, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DailyAnalytics } from '../types';

export const DashboardView: React.FC = () => {
  const [period, setPeriod] = useState<string>('Today');
  const [analytics, setAnalytics] = useState<DailyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/analytics?period=${period}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data) setAnalytics(data);
      }
    } catch (e) {
      console.warn('[DashboardView] Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Loading sales analytics...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time performance and inventory insights for CommonBrew</p>
        </div>

        <div className="page-actions">
          <select
            className="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="Today">Today</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <Banknote size={20} />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Total Revenue ({period})</p>
            <p className="kpi-value">₱{analytics.todayRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>
          <span className="kpi-badge green">+{analytics.revenueGrowth}%</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap blue">
            <Receipt size={20} />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Completed Orders</p>
            <p className="kpi-value">{analytics.todayTransactions}</p>
          </div>
          <span className="kpi-badge blue">+{analytics.transactionGrowth}%</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap orange">
            <Coffee size={20} />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Top Selling Item</p>
            <p className="kpi-value" style={{ fontSize: '1.1rem' }}>{analytics.topSellingProduct}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap red">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Low Stock Alerts</p>
            <p className="kpi-value">{analytics.lowStockCount}</p>
          </div>
          {analytics.lowStockCount > 0 && <span className="kpi-badge red">Action Needed</span>}
        </div>
      </div>

      {/* Grid Charts & Stock */}
      <div className="dashboard-grid">
        <div className="chart-card">
          <h2 className="card-title">Sales Revenue Trend (Past 7 Days)</h2>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="dayLabel" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(val) => `₱${val}`} />
                <Tooltip
                  formatter={(val: any) => [`₱${Number(val).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stock-card">
          <h2 className="card-title">Critical Inventory Alerts</h2>
          {analytics.lowStockItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} style={{ color: '#10b981' }} />
              <p style={{ margin: 0 }}>All ingredients are above critical levels.</p>
            </div>
          ) : (
            <div className="stock-list">
              {analytics.lowStockItems.map(item => (
                <div key={item.id} className="stock-item">
                  <div>
                    <p className="stock-name">{item.name}</p>
                    <p className="stock-critical">Critical Level: {item.criticalLevel} {item.unit}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="stock-qty red">{item.currentStock} {item.unit}</p>
                    <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>Low Stock</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Top Revenue Generators</h3>
            {analytics.topProducts.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.825rem' }}>
                <span style={{ fontWeight: 600 }}>{p.productName}</span>
                <span style={{ color: '#f97316', fontWeight: 700 }}>₱{p.totalRevenue.toFixed(2)} ({p.totalSold} sold)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
