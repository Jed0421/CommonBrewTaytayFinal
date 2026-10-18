import React, { useState, useEffect } from 'react';
import { Product, User, InventoryItem } from '../types';

export const ArchiveView: React.FC = () => {
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [archivedUsers, setArchivedUsers] = useState<User[]>([]);
  const [archivedInventory, setArchivedInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchArchive();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/archive').catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        setArchivedProducts(data.archivedProducts || []);
        setArchivedUsers(data.archivedUsers || []);
        setArchivedInventory(data.archivedInventory || []);
      }
    } catch (e) {
      console.warn('[ArchiveView] Error fetching archive:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProduct = async (id: string, name: string) => {
    try {
      await fetch(`/api/archive/restore-product/${id}`, { method: 'POST' });
      setToastMessage(`Product "${name}" restored to active menu!`);
      fetchArchive();
    } catch (e) {
      setToastMessage('Error restoring product');
    }
  };

  const handleRestoreUser = async (id: string, name: string) => {
    try {
      await fetch(`/api/archive/restore-user/${id}`, { method: 'POST' });
      setToastMessage(`Staff account "${name}" reactivated! They can now log in.`);
      fetchArchive();
    } catch (e) {
      setToastMessage('Error restoring user account');
    }
  };

  const handleRestoreInventory = async (id: string, name: string) => {
    try {
      await fetch(`/api/archive/restore-inventory/${id}`, { method: 'POST' });
      setToastMessage(`Raw material "${name}" restored to active inventory!`);
      fetchArchive();
    } catch (e) {
      setToastMessage('Error restoring raw material');
    }
  };

  return (
    <div>
      {toastMessage && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#15803d',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Archive Repository</h1>
          <p className="page-subtitle">Manage archived menu items, deactivated staff accounts, and archived raw materials</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Archived Products */}
        <div className="table-card">
          <div className="table-header-row">
            <h2 className="card-title" style={{ margin: 0 }}>Archived Menu Products</h2>
            <span className="record-count">{archivedProducts.length} Items</span>
          </div>

          {archivedProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No archived menu items.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {archivedProducts.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>{p.productType}</td>
                    <td>₱{p.price.toFixed(2)}</td>
                    <td>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => handleRestoreProduct(p.id, p.name)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <i className="fa-solid fa-rotate-left" style={{ fontSize: '0.75rem' }}></i>
                        Restore Product
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Archived Raw Materials */}
        <div className="table-card">
          <div className="table-header-row">
            <h2 className="card-title" style={{ margin: 0 }}>Archived Raw Materials (Inventory)</h2>
            <span className="record-count">{archivedInventory.length} Materials</span>
          </div>

          {archivedInventory.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No archived raw materials.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Unit Cost</th>
                  <th>Stock Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {archivedInventory.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700 }}>{inv.name}</td>
                    <td><span className="kpi-badge blue">{inv.category || 'General'}</span></td>
                    <td>₱{inv.unitCost || 0} / {inv.unit}</td>
                    <td>{inv.currentStock} {inv.unit}</td>
                    <td>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => handleRestoreInventory(inv.id, inv.name)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <i className="fa-solid fa-rotate-left" style={{ fontSize: '0.75rem' }}></i>
                        Restore Material
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Archived Users */}
        <div className="table-card">
          <div className="table-header-row">
            <h2 className="card-title" style={{ margin: 0 }}>Deactivated User Accounts</h2>
            <span className="record-count">{archivedUsers.length} Users</span>
          </div>

          {archivedUsers.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No deactivated accounts.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {archivedUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                    <td>{u.username}</td>
                    <td><span className="kpi-badge blue">{u.role}</span></td>
                    <td>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => handleRestoreUser(u.id, u.fullName || u.username)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <i className="fa-solid fa-rotate-left" style={{ fontSize: '0.75rem' }}></i>
                        Reactivate Account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
