import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { ThermalReceiptModal, ThermalReceiptData } from './ThermalReceiptModal';
import { useRealtimeSync } from '../lib/realtimeSync';

type PaymentFilter = 'ALL' | 'CASH' | 'ONLINE';
type OrderTypeFilter = 'ALL' | 'IN_STORE' | 'ONLINE_ORDER';

// Cash, Cash on Pickup and Cash on Delivery are cash; GCash / card / e-wallets are online payments
const isCashPayment = (method?: string) => (method || 'Cash').trim().toLowerCase().startsWith('cash');

// Online orders are logged with a CB-ONL-xxxx reference when the order is completed
const isOnlineOrder = (t: Transaction) =>
  (t.transactionRef || '').toUpperCase().startsWith('CB-ONL') || (t.id || '').startsWith('tx-onl-');

const peso = (amount: number) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Segmented filter control matching the status tabs
const FilterTabs = <T extends string>({ label, value, onChange, options }: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; color?: string }[];
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
    <span className="form-label" style={{ margin: 0 }}>{label}</span>
    <div style={{ display: 'flex', gap: '0.35rem', background: '#f3f4f6', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              background: active ? '#ffffff' : 'transparent',
              color: active ? (opt.color || '#111827') : '#6b7280',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

export const ReportsView: React.FC = () => {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });

  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'VOIDED'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>('ALL');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [thermalReceiptToPrint, setThermalReceiptToPrint] = useState<ThermalReceiptData | null>(null);

  // Voiding State
  const [voidingTx, setVoidingTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('Customer Order Cancellation');
  const [customReason, setCustomReason] = useState('');
  const [submittingVoid, setSubmittingVoid] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [fromDate, toDate]);

  // Automatically refresh reports when transactions or online orders change in Supabase
  useRealtimeSync(['transactions', 'online_orders'], () => {
    console.log('[ReportsView] Supabase transaction change received! Auto-refreshing reports...');
    fetchReports();
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/transactions?from=${fromDate}&to=${toDate}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) setTransactions(data);
      }
    } catch (e) {
      console.warn('[ReportsView] Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  // Order type filter applies everywhere; payment filter applies to everything except the
  // Cash / Online payment cards (so both totals stay visible side by side)
  const isVoidedTx = (t: Transaction) => t.status === 'Voided' || t.status === 'void';
  const matchesOrderType = (t: Transaction) =>
    orderTypeFilter === 'ALL' || (orderTypeFilter === 'ONLINE_ORDER' ? isOnlineOrder(t) : !isOnlineOrder(t));
  const matchesPayment = (t: Transaction) =>
    paymentFilter === 'ALL' || (paymentFilter === 'CASH' ? isCashPayment(t.paymentMethod) : !isCashPayment(t.paymentMethod));

  const orderTypeTxns = transactions.filter(matchesOrderType);
  const scopedTxns = orderTypeTxns.filter(matchesPayment);

  // Calculations
  const completedTxns = scopedTxns.filter(t => !isVoidedTx(t));
  const voidedTxns = scopedTxns.filter(isVoidedTx);

  // Separate money totals per payment type (respects the order type filter)
  const completedForPaymentSplit = orderTypeTxns.filter(t => !isVoidedTx(t));
  const cashTxns = completedForPaymentSplit.filter(t => isCashPayment(t.paymentMethod));
  const onlinePayTxns = completedForPaymentSplit.filter(t => !isCashPayment(t.paymentMethod));
  const totalCashSales = cashTxns.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalOnlinePaySales = onlinePayTxns.reduce((sum, t) => sum + t.totalAmount, 0);

  const totalNetSales = completedTxns.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalCompletedOrders = completedTxns.length;
  const avgOrderValue = totalCompletedOrders > 0 ? totalNetSales / totalCompletedOrders : 0;

  const totalVoidedAmount = voidedTxns.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalVoidedOrders = voidedTxns.length;

  // Filtered transactions for display table
  const displayedTransactions = scopedTxns.filter(t => {
    const isVoided = isVoidedTx(t);
    if (statusFilter === 'COMPLETED') return !isVoided;
    if (statusFilter === 'VOIDED') return isVoided;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Ref', 'Date Time', 'Cashier', 'Order Type', 'Payment Method', 'Payment Type', 'Status', 'Total Amount', 'Void Reason'];
    const rows = displayedTransactions.map(t => [
      t.transactionRef,
      new Date(t.createdAt).toLocaleString(),
      t.cashierName || 'Cashier',
      isOnlineOrder(t) ? 'Online Order' : 'On-store',
      t.paymentMethod,
      isCashPayment(t.paymentMethod) ? 'Cash' : 'Online Payment',
      t.status === 'Voided' ? 'VOIDED' : 'COMPLETED',
      t.totalAmount.toFixed(2),
      t.status === 'Voided' ? (t.voidReason || 'N/A') : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(cell => `"${cell}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filterSuffix = [
      orderTypeFilter === 'ONLINE_ORDER' ? 'OnlineOrders' : orderTypeFilter === 'IN_STORE' ? 'OnStore' : '',
      paymentFilter === 'CASH' ? 'Cash' : paymentFilter === 'ONLINE' ? 'OnlinePayment' : ''
    ].filter(Boolean).join('_');
    link.setAttribute('download', `CommonBrew_SalesReport_${fromDate}_to_${toDate}${filterSuffix ? `_${filterSuffix}` : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmVoid = async () => {
    if (!voidingTx) return;

    const finalReason = voidReason === 'Other' ? customReason : voidReason;
    if (!finalReason.trim()) {
      alert('Please specify a reason for voiding this order.');
      return;
    }

    setSubmittingVoid(true);
    try {
      const res = await fetch(`/api/reports/transactions/${voidingTx.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason })
      });
      const data = await res.json();

      if (data.success) {
        setToastMessage(`Order ${voidingTx.transactionRef} voided successfully. Amount deducted from dashboard & inventory restored.`);
        setVoidingTx(null);
        setSelectedTx(null);
        setCustomReason('');
        setVoidReason('Customer Order Cancellation');
        await fetchReports();

        setTimeout(() => setToastMessage(null), 6000);
      } else {
        alert(data.message || 'Failed to void transaction.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while voiding order.');
    } finally {
      setSubmittingVoid(false);
    }
  };

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#10b981',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          fontWeight: 700,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span><i className="fa-solid fa-circle-check"></i></span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }}
            title="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Sales & Financial Reports</h1>
          <p className="page-subtitle">Historical sales records, transaction audit logs, and void order management</p>
        </div>

        <div className="page-actions">
          <button className="btn-outline" onClick={handleExportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <i className="fa-solid fa-file-arrow-down" style={{ fontSize: '0.9rem' }}></i>
            <span>Export CSV</span>
          </button>
          <button className="btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <i className="fa-solid fa-print" style={{ fontSize: '0.9rem' }}></i>
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="table-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="form-label">From Date:</span>
              <input
                type="date"
                className="form-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="form-label">To Date:</span>
              <input
                type="date"
                className="form-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <button className="btn-outline" onClick={fetchReports} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <i className="fa-solid fa-rotate" style={{ fontSize: '0.85rem' }}></i>
              <span>Refresh</span>
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', background: '#f3f4f6', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: statusFilter === 'ALL' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ALL' ? '#111827' : '#6b7280',
                boxShadow: statusFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              All Records ({scopedTxns.length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: statusFilter === 'COMPLETED' ? '#ffffff' : 'transparent',
                color: statusFilter === 'COMPLETED' ? '#16a34a' : '#6b7280',
                boxShadow: statusFilter === 'COMPLETED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Completed ({completedTxns.length})
            </button>
            <button
              onClick={() => setStatusFilter('VOIDED')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: statusFilter === 'VOIDED' ? '#ffffff' : 'transparent',
                color: statusFilter === 'VOIDED' ? '#dc2626' : '#6b7280',
                boxShadow: statusFilter === 'VOIDED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Voided ({voidedTxns.length})
            </button>
          </div>
        </div>

        {/* Payment & Order Type Filters */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
          <FilterTabs<PaymentFilter>
            label="Payment:"
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={[
              { value: 'ALL', label: 'All Payments' },
              { value: 'CASH', label: 'Cash', color: '#16a34a' },
              { value: 'ONLINE', label: 'Online Payment', color: '#2563eb' }
            ]}
          />
          <FilterTabs<OrderTypeFilter>
            label="Order Type:"
            value={orderTypeFilter}
            onChange={setOrderTypeFilter}
            options={[
              { value: 'ALL', label: 'All Orders' },
              { value: 'IN_STORE', label: 'On-store', color: '#ea580c' },
              { value: 'ONLINE_ORDER', label: 'Online Orders', color: '#7c3aed' }
            ]}
          />
          {(paymentFilter !== 'ALL' || orderTypeFilter !== 'ALL') && (
            <button
              className="btn-outline btn-sm"
              onClick={() => { setPaymentFilter('ALL'); setOrderTypeFilter('ALL'); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: '0.75rem' }}></i>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap green" style={{ color: 'var(--green)' }}>
            <i className="fa-solid fa-money-bill-wave" style={{ fontSize: '1.25rem' }}></i>
          </div>
          <div className="kpi-info">
            <p className="kpi-label">
              Net Sales Revenue
              {paymentFilter !== 'ALL' && ` · ${paymentFilter === 'CASH' ? 'Cash' : 'Online Payment'}`}
              {orderTypeFilter !== 'ALL' && ` · ${orderTypeFilter === 'ONLINE_ORDER' ? 'Online Orders' : 'On-store'}`}
            </p>
            <p className="kpi-value">{peso(totalNetSales)}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap blue" style={{ color: '#2563eb' }}>
            <i className="fa-solid fa-receipt" style={{ fontSize: '1.25rem' }}></i>
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Completed Orders</p>
            <p className="kpi-value">{totalCompletedOrders}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap orange" style={{ color: 'var(--brand)' }}>
            <i className="fa-solid fa-chart-simple" style={{ fontSize: '1.25rem' }}></i>
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Avg Order Value</p>
            <p className="kpi-value">₱{avgOrderValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
          <div className="kpi-icon-wrap red" style={{ color: '#dc2626' }}>
            <i className="fa-solid fa-ban" style={{ fontSize: '1.25rem' }}></i>
          </div>
          <div className="kpi-info">
            <p className="kpi-label" style={{ color: '#991b1b' }}>Voided / Deducted Orders</p>
            <p className="kpi-value" style={{ color: '#dc2626' }}>{totalVoidedOrders} Orders</p>
            <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>
              -₱{totalVoidedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} Deducted
            </span>
          </div>
        </div>
      </div>

      {/* Cash vs Online Payment Totals (click a card to filter by it) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {([
          { key: 'CASH' as const, title: 'Cash Payments', sub: 'Cash, Cash on Pickup & Cash on Delivery', icon: 'fa-money-bill-1', color: '#16a34a', bg: '#f0fdf4', border: '#86efac', total: totalCashSales, count: cashTxns.length },
          { key: 'ONLINE' as const, title: 'Online Payments', sub: 'GCash & other e-wallets', icon: 'fa-mobile-screen-button', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', total: totalOnlinePaySales, count: onlinePayTxns.length }
        ]).map(card => {
          const active = paymentFilter === card.key;
          return (
            <button
              key={card.key}
              className="kpi-card"
              onClick={() => setPaymentFilter(active ? 'ALL' : card.key)}
              title={active ? 'Show all payments' : `Show ${card.title.toLowerCase()} only`}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
                width: '100%',
                border: `2px solid ${active ? card.color : 'transparent'}`,
                background: active ? card.bg : undefined
              }}
            >
              <div className="kpi-icon-wrap" style={{ color: card.color, background: card.bg, border: `1px solid ${card.border}` }}>
                <i className={`fa-solid ${card.icon}`} style={{ fontSize: '1.2rem' }}></i>
              </div>
              <div className="kpi-info">
                <p className="kpi-label">{card.title}</p>
                <p className="kpi-value" style={{ color: card.color }}>{peso(card.total)}</p>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                  {card.count} {card.count === 1 ? 'order' : 'orders'} · {card.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Transactions Table */}
      <div className="table-card">
        <div className="table-header-row">
          <h2 className="card-title" style={{ margin: 0 }}>Transaction Audit History</h2>
          <span className="record-count">{displayedTransactions.length} Records</span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading report data...</div>
        ) : displayedTransactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>No transaction records found for this date range / filter.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction Ref</th>
                <th>Date & Time</th>
                <th>Cashier</th>
                <th>Order Type</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.map(t => {
                const isVoided = t.status === 'Voided' || t.status === 'void';
                return (
                  <tr key={t.id} style={{ opacity: isVoided ? 0.75 : 1, background: isVoided ? '#fff1f2' : 'transparent' }}>
                    <td style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                      {t.transactionRef}
                    </td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.cashierName || 'Cashier'}</td>
                    <td>
                      {isOnlineOrder(t) ? (
                        <span style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #c4b5fd', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                          <i className="fa-solid fa-globe" style={{ fontSize: '0.7rem' }}></i>
                          Online
                        </span>
                      ) : (
                        <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fdba74', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                          <i className="fa-solid fa-store" style={{ fontSize: '0.7rem' }}></i>
                          On-store
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        background: isCashPayment(t.paymentMethod) ? '#f0fdf4' : '#eff6ff',
                        color: isCashPayment(t.paymentMethod) ? '#16a34a' : '#2563eb',
                        border: `1px solid ${isCashPayment(t.paymentMethod) ? '#86efac' : '#93c5fd'}`,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap'
                      }}>
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td>
                      {isVoided ? (
                        <span style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: '1px solid #fca5a5',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <i className="fa-solid fa-ban" style={{ fontSize: '0.75rem' }}></i>
                          VOIDED
                        </span>
                      ) : (
                        <span style={{
                          background: '#dcfce7',
                          color: '#16a34a',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: '1px solid #86efac',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <i className="fa-solid fa-check" style={{ fontSize: '0.75rem' }}></i>
                          COMPLETED
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 800, color: isVoided ? '#991b1b' : '#f97316', textDecoration: isVoided ? 'line-through' : 'none' }}>
                      ₱{t.totalAmount.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          className="btn-outline btn-sm"
                          onClick={() => setSelectedTx(t)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                        >
                          <i className="fa-solid fa-eye" style={{ fontSize: '0.75rem' }}></i>
                          Details
                        </button>

                        {!isVoided && (
                          <button
                            className="btn-outline btn-sm"
                            style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                            onClick={() => {
                              setVoidingTx(t);
                              setVoidReason('Customer Order Cancellation');
                              setCustomReason('');
                            }}
                          >
                            <i className="fa-solid fa-ban" style={{ fontSize: '0.75rem' }}></i>
                            Void Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Breakdown Modal */}
      {selectedTx && (
        <div className="modal-overlay">
          <div className="receipt-modal" style={{ maxWidth: '440px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>Ref: {selectedTx.transactionRef}</h2>
                <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.25rem 0 0.75rem 0' }}>
                  Cashier: {selectedTx.cashierName || 'Cashier'} • {new Date(selectedTx.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedTx.status === 'Voided' ? (
                <span style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  VOIDED
                </span>
              ) : (
                <span style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  COMPLETED
                </span>
              )}
            </div>

            {/* Void Notice Banner if Voided */}
            {(selectedTx.status === 'Voided' || selectedTx.status === 'void') && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: '#991b1b'
              }}>
                <p style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-ban"></i>
                  <span>THIS ORDER WAS VOIDED</span>
                </p>
                {selectedTx.voidedAt && (
                  <p style={{ margin: '0.2rem 0 0 0' }}><strong>Voided On:</strong> {new Date(selectedTx.voidedAt).toLocaleString()}</p>
                )}
                {selectedTx.voidedBy && (
                  <p style={{ margin: '0.2rem 0 0 0' }}><strong>By:</strong> {selectedTx.voidedBy}</p>
                )}
                <p style={{ margin: '0.2rem 0 0 0' }}><strong>Reason:</strong> {selectedTx.voidReason || 'Customer Cancellation'}</p>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', fontStyle: 'italic', color: '#dc2626' }}>
                  * Amounts deducted from dashboard revenue and ingredient inventory restored.
                </p>
              </div>
            )}

            <div className="receipt-body">
              <hr />
              {selectedTx.items.map((item, idx) => (
                <div key={idx} className="receipt-line">
                  <span>{item.quantity}x {item.productName} {item.isUpsize ? '(Large)' : ''}</span>
                  <span>₱{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <hr />
              <div className="receipt-line total">
                <span>Total Amount</span>
                <span style={{ textDecoration: (selectedTx.status === 'Voided' || selectedTx.status === 'void') ? 'line-through' : 'none' }}>
                  ₱{selectedTx.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="receipt-line">
                <span>Payment Method</span>
                <span>{selectedTx.paymentMethod}</span>
              </div>
              {selectedTx.cashTendered !== null && selectedTx.cashTendered !== undefined && (
                <div className="receipt-line">
                  <span>Cash Tendered</span>
                  <span>₱{selectedTx.cashTendered.toFixed(2)}</span>
                </div>
              )}
              {selectedTx.changeAmount !== null && selectedTx.changeAmount !== undefined && (
                <div className="receipt-line">
                  <span>Change Amount</span>
                  <span>₱{selectedTx.changeAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="receipt-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', borderColor: '#ea580c', color: '#ea580c', fontWeight: 700 }}
                onClick={() => {
                  setThermalReceiptToPrint({
                    ref: selectedTx.transactionRef,
                    date: new Date(selectedTx.createdAt).toLocaleString(),
                    items: (selectedTx.items || []).map((it: any) => ({
                      name: it.productName || it.name,
                      qty: it.quantity || it.qty || 1,
                      price: it.unitPrice || it.price,
                      originalPrice: it.unitPrice || it.price,
                      isUpsize: it.isUpsize,
                      addons: it.addons
                    })),
                    totalAmount: selectedTx.totalAmount,
                    paymentMethod: selectedTx.paymentMethod,
                    cashTendered: selectedTx.cashTendered ?? selectedTx.totalAmount,
                    changeAmount: selectedTx.changeAmount ?? 0,
                    cashierName: selectedTx.cashierName || 'Cashier'
                  });
                }}
              >
                <i className="fa-solid fa-print"></i>
                <span>Print Receipt</span>
              </button>

              {selectedTx.status !== 'Voided' && selectedTx.status !== 'void' && (
                <button
                  className="btn-outline"
                  style={{ color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
                  onClick={() => {
                    setVoidingTx(selectedTx);
                    setVoidReason('Customer Order Cancellation');
                    setCustomReason('');
                  }}
                >
                  <i className="fa-solid fa-ban"></i>
                  <span>Void This Order</span>
                </button>
              )}
              <button className="btn-primary" onClick={() => setSelectedTx(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Generated Modal */}
      {thermalReceiptToPrint && (
        <ThermalReceiptModal
          receipt={thermalReceiptToPrint}
          onClose={() => setThermalReceiptToPrint(null)}
          autoPrint={true}
        />
      )}

      {/* Void Order Modal Dialog */}
      {voidingTx && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="receipt-modal" style={{ maxWidth: '480px', width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#dc2626', marginBottom: '0.75rem' }}>
              <i className="fa-solid fa-ban" style={{ fontSize: '1.4rem' }}></i>
              <h2 className="card-title" style={{ margin: 0, color: '#dc2626' }}>Void Order Confirmation</h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
              Are you sure you want to void order <strong>{voidingTx.transactionRef}</strong> (Total: <strong>₱{voidingTx.totalAmount.toFixed(2)}</strong>)?
            </p>

            <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', color: '#c2410c' }}>
              <strong>What happens when you void an order:</strong>
              <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
                <li>This order amount will be <strong>deducted from Gross Sales</strong> in the Sales Report and Dashboard.</li>
                <li>The ingredient inventory for all order items will be <strong>restored back to stock</strong>.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
                Reason for Voiding:
              </label>
              <select
                className="form-input"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                <option value="Customer Order Cancellation">Customer Order Cancellation</option>
                <option value="POS Punch Error / Duplicate Order">POS Punch Error / Duplicate Order</option>
                <option value="Wrong Items Selected">Wrong Items Selected</option>
                <option value="Payment Method Change / Failure">Payment Method Change / Failure</option>
                <option value="Other">Other Reason...</option>
              </select>

              {voidReason === 'Other' && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Specify custom void reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn-outline"
                disabled={submittingVoid}
                onClick={() => setVoidingTx(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                disabled={submittingVoid}
                onClick={handleConfirmVoid}
              >
                {submittingVoid ? 'Processing Void...' : 'Yes, Void Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
