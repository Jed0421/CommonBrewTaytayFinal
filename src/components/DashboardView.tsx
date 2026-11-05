import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Banknote,
  Receipt,
  Coffee,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { DailyAnalytics } from '../types';

const getToday = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find(part => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
};

const getWeekStart = () => {
  const date = new Date(getToday() + 'T00:00:00.000Z');
  date.setUTCDate(date.getUTCDate() - 6);
  return date.toISOString().slice(0, 10);
};

const displayDate = (value: string) =>
  new Date(`${value}T00:00:00+08:00`).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const peso = (value: number) =>
  `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const GrowthBadge = ({ value }: { value: number | null }) => {
  const displayedValue = value === null ? null : Math.min(100, value);
  const positive = value !== null && value > 0;
  const negative = value !== null && value < 0;

  const text =
    value === null
      ? 'New sales'
      : positive
        ? `↑ +${displayedValue!.toFixed(1)}%`
        : negative
          ? `↓ ${value.toFixed(1)}%`
          : '— 0.0%';

  return (
    <span
      className="kpi-badge"
      title={
        value === null
          ? 'Previous period was zero; percentage growth is undefined.'
          : value > 100
            ? 'Increase capped at 100% for display.'
            : 'Change compared with the previous period of equal length.'
      }
      style={{
        background: positive
          ? '#dcfce7'
          : negative
            ? '#fee2e2'
            : '#f3f4f6',
        color: positive
          ? '#15803d'
          : negative
            ? '#b91c1c'
            : '#4b5563',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
};

export const DashboardView: React.FC = () => {
  const [fromDate, setFromDate] = useState(getWeekStart);
  const [calendarChanged, setCalendarChanged] = useState(false);
  const [toDate, setToDate] = useState(getToday);
  const [analytics, setAnalytics] = useState<DailyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const today = getToday();

  const rangeError =
    !fromDate || !toDate
      ? 'Please select both dates.'
      : fromDate > toDate
        ? 'From Date must be on or before To Date.'
        : toDate > today
          ? 'Please select today or an earlier date.'
          : null;

  useEffect(() => {
    if (rangeError) {
      setLoading(false);
      setAnalytics(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      setAnalytics(null);

      try {
        const query = new URLSearchParams({
          from: fromDate,
          to: toDate,
        });

        const response = await fetch(
          `/api/dashboard/analytics?${query}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(
            body?.message || 'Unable to load dashboard analytics.'
          );
        }

        const data: DailyAnalytics = await response.json();
        // Reject an outdated API response before rendering number/date fields.
        if (!data ||
          ![data.todayRevenue, data.todayTransactions, data.previousRevenue, data.previousTransactions, data.lowStockCount].every(Number.isFinite) ||
          ![data.fromDate, data.toDate, data.previousFromDate, data.previousToDate].every(value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) ||
          ![data.revenueGrowth, data.transactionGrowth].every(value => value === null || Number.isFinite(value)) ||
          !Array.isArray(data.weeklySales) || !Array.isArray(data.lowStockItems) || !Array.isArray(data.topProducts)) {
          throw new Error('Dashboard API is outdated or invalid. Restart the server with npm run dev, then click Retry.');
        }

        if (!controller.signal.aborted) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard analytics.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => controller.abort();
  }, [fromDate, toDate, rangeError, retry]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">
            Sales performance and current inventory insights
          </p>
        </div>

        <div
          className="page-actions"
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <label className="dashboard-date-field">
            <span>From Date:</span>
            <input
              type="date"
              value={fromDate}
              max={today}
              required
              onChange={e => { setFromDate(e.target.value); setCalendarChanged(true); }}
            />
          </label>

          <label className="dashboard-date-field">
            <span>To Date:</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              max={today}
              required
              onChange={e => { setToDate(e.target.value); setCalendarChanged(true); }}
            />
          </label>
        </div>
      </div>

      {rangeError ? (
        <p role="alert" style={{ color: '#b91c1c' }}>
          {rangeError}
        </p>
      ) : error ? (
        <div role="alert">
          <p style={{ color: '#b91c1c' }}>{error}</p>
          <button
            className="btn-outline"
            onClick={() => setRetry(value => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <p role="status" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading sales analytics...
        </p>
      ) : analytics ? (
        <>
          <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
            <strong>
              {displayDate(analytics.fromDate)} –{' '}
              {displayDate(analytics.toDate)}
            </strong>
            {' · Compared with '}
            {displayDate(analytics.previousFromDate)} –{' '}
            {displayDate(analytics.previousToDate)}
          </p>


          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrap green">
                <Banknote size={20} />
              </div>
              <div className="kpi-info">
                <p className="kpi-label">Total Revenue</p>
                <p className="kpi-value">
                  {peso(analytics.todayRevenue)}
                </p>
                <small>
                  Previous: {peso(analytics.previousRevenue)}
                </small>
              </div>
              <GrowthBadge value={analytics.revenueGrowth} />
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap blue">
                <Receipt size={20} />
              </div>
              <div className="kpi-info">
                <p className="kpi-label">Completed Orders</p>
                <p className="kpi-value">
                  {analytics.todayTransactions.toLocaleString()}
                </p>
                <small>
                  Previous: {analytics.previousTransactions.toLocaleString()}
                </small>
              </div>
              <GrowthBadge value={analytics.transactionGrowth} />
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap orange">
                <Coffee size={20} />
              </div>
              <div className="kpi-info">
                <p className="kpi-label">Top Selling Item</p>
                <p className="kpi-value" style={{ fontSize: '1.1rem' }}>
                  {analytics.topSellingProduct}
                </p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap red">
                <AlertTriangle size={20} />
              </div>
              <div className="kpi-info">
                <p className="kpi-label">Current Low Stock Alerts</p>
                <p className="kpi-value">{analytics.lowStockCount}</p>
              </div>
              {analytics.lowStockCount > 0 && (
                <span className="kpi-badge red">Action Needed</span>
              )}
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="chart-card">
              <h2 className="card-title">
                {calendarChanged ? 'Sales Revenue — Selected Date Range' : 'Sales Revenue Trend (Past 7 Days)'}
              </h2>

              {analytics.todayTransactions === 0 && (
                <p>No sales found for this date range.</p>
              )}

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.weeklySales}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="dayLabel"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      minTickGap={24}
                      tickFormatter={value => {
                        if (!calendarChanged) {
                          const weekday = new Date(String(value) + 'T00:00:00.000Z').getUTCDay();
                          return ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'][weekday];
                        }
                        const [, month, day] = String(value).split('-');
                        return `${month}/${day}`;
                      }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={value => `₱${value}`}
                    />
                    <Tooltip
                      labelFormatter={value =>
                        displayDate(String(value))
                      }
                      formatter={(value: any) => [
                        peso(Number(value)),
                        'Revenue',
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#f97316"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stock-card">
              <h2 className="card-title">Current Inventory Alerts</h2>

              {analytics.lowStockItems.length === 0 ? (
                <p>
                  <CheckCircle2
                    size={18}
                    style={{ color: '#10b981', verticalAlign: 'middle' }}
                  />{' '}
                  All ingredients are above critical levels.
                </p>
              ) : (
                <div className="stock-list">
                  {analytics.lowStockItems.map(item => (
                    <div key={item.id} className="stock-item">
                      <div>
                        <p className="stock-name">{item.name}</p>
                        <p className="stock-critical">
                          Critical Level: {item.criticalLevel} {item.unit}
                        </p>
                      </div>
                      <p className="stock-qty red">
                        {item.currentStock} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb',
                }}
              >
                <h3 style={{ fontSize: '0.9rem' }}>
                  Top Revenue Generators — Selected Range
                </h3>

                {analytics.topProducts.length === 0 ? (
                  <p>No products sold in this range.</p>
                ) : (
                  analytics.topProducts.map(product => (
                    <div
                      key={product.productName}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        padding: '0.4rem 0',
                        fontSize: '0.825rem',
                      }}
                    >
                      <span>{product.productName}</span>
                      <strong style={{ color: '#f97316' }}>
                        {peso(product.totalRevenue)} ({product.totalSold} sold)
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};