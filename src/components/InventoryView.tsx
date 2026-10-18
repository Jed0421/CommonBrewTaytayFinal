import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { UnitComboBox } from './UnitComboBox';
import { useRealtimeSync } from '../lib/realtimeSync';

interface InventoryLog {
  id: string;
  inventoryItemId: string;
  itemName?: string;
  unit?: string;
  changeType: 'stock_in' | 'deduction' | 'spoilage' | 'adjustment';
  quantityChange: number;
  note?: string;
  performedBy?: string;
  createdAt: string;
}

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Stock Adjustment Modal
  const [stockModalItem, setStockModalItem] = useState<InventoryItem | null>(null);
  const [changeType, setChangeType] = useState<'stock_in' | 'spoilage' | 'adjustment' | 'set_exact'>('stock_in');
  const [addQty, setAddQty] = useState('');
  const [note, setNote] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('g');
  const [newItemCategory, setNewItemCategory] = useState('Coffee Beans');
  const [newItemCost, setNewItemCost] = useState('150');
  const [newItemSupplier, setNewItemSupplier] = useState('Benguet Coffee Roasters');
  const [newItemStock, setNewItemStock] = useState('1000');
  const [newItemCritical, setNewItemCritical] = useState('200');

  // Edit Material Modal
  const [editModalItem, setEditModalItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Coffee Beans');
  const [editUnit, setEditUnit] = useState('g');
  const [editCost, setEditCost] = useState('0');
  const [editSupplier, setEditSupplier] = useState('');
  const [editCritical, setEditCritical] = useState('10');

  // Audit Logs Modal
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState<InventoryLog[]>([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  // Automatically update stock levels when inventory is modified in Supabase
  useRealtimeSync(['inventory', 'inventory_logs'], () => {
    console.log('[InventoryView] Supabase inventory change received! Auto-refreshing stock levels...');
    fetchInventory();
  });

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory').catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) setItems(data);
      }
    } catch (e) {
      console.warn('[InventoryView] Error fetching inventory:', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/inventory/logs').catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) {
          setLogs(data);
          setShowLogsModal(true);
        }
      }
    } catch (e) {
      console.warn('[InventoryView] Error fetching logs:', e);
    }
  };

  const handleArchiveItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"? It will be moved to the System Archive Repository.`)) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchInventory();
      }
    } catch (e) {
      alert('Error archiving material');
    }
  };

  const handleStockAdjustment = async () => {
    if (!stockModalItem || !addQty) return;
    try {
      const res = await fetch('/api/inventory/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: stockModalItem.id,
          quantity: Number(addQty),
          changeType,
          note
        })
      });
      const data = await res.json();
      if (data.success) {
        setStockModalItem(null);
        setAddQty('');
        setNote('');
        fetchInventory();
      }
    } catch (e) {
      alert('Error updating stock');
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          unit: newItemUnit,
          category: newItemCategory,
          unitCost: Number(newItemCost),
          supplierName: newItemSupplier,
          currentStock: Number(newItemStock),
          criticalLevel: Number(newItemCritical)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewItemName('');
        setNewItemUnit('g');
        setNewItemStock('1000');
        setNewItemCost('150');
        fetchInventory();
      }
    } catch (e) {
      alert('Error creating raw material ingredient');
    }
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditModalItem(item);
    setEditName(item.name);
    setEditCategory(item.category || 'Coffee Beans');
    setEditUnit(item.unit || 'g');
    setEditCost(String(item.unitCost || 0));
    setEditSupplier(item.supplierName || '');
    setEditCritical(String(item.criticalLevel || 10));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalItem) return;
    try {
      const res = await fetch(`/api/inventory/${editModalItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          category: editCategory,
          unit: editUnit,
          unitCost: Number(editCost),
          supplierName: editSupplier,
          criticalLevel: Number(editCritical)
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditModalItem(null);
        fetchInventory();
      } else {
        alert(data.message || 'Error updating ingredient');
      }
    } catch (e) {
      alert('Error updating ingredient');
    }
  };

  const filteredItems = items.filter(i => {
    const matchesFilter = filter === 'all' || (filter === 'low' && i.isLowStock);
    const matchesCat = categoryFilter === 'all' || (i.category || 'General').toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || (i.supplierName || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesCat && matchesSearch;
  });

  const totalValuation = items.reduce((sum, item) => sum + (item.currentStock * (item.unitCost || 0)), 0);
  const lowStockCount = items.filter(i => i.isLowStock).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Raw Materials Inventory</h1>
          <p className="page-subtitle">Track coffee beans, dairy, syrups, packaging & raw material stock valuations</p>
        </div>

        <div className="page-actions">
          <button className="btn-outline" onClick={fetchLogs} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <i className="fa-solid fa-clipboard-list" style={{ fontSize: '0.9rem' }}></i>
            <span>Material Audit Logs</span>
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <i className="fa-solid fa-plus" style={{ fontSize: '0.9rem' }}></i>
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* Inventory KPI Summary Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrap blue" style={{ color: 'var(--brand)' }}>
            <i className="fa-solid fa-boxes-stacked" style={{ fontSize: '1.25rem' }}></i>
          </div>
          <div className="kpi-info">
            <p className="kpi-label" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Total Material Items</p>
            <h3 className="kpi-value">{items.length}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green" style={{ color: 'var(--green)' }}>
            <i className="fa-solid fa-peso-sign" style={{ fontSize: '1.25rem' }}></i>
          </div>
          <div className="kpi-info">
            <p className="kpi-label" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Total Inventory Valuation</p>
            <h3 className="kpi-value" style={{ color: 'var(--green)' }}>₱{totalValuation.toLocaleString()}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap red" style={{ color: 'var(--red)' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.25rem' }}></i>
          </div>
          <div className="kpi-info">
            <p className="kpi-label" style={{ textTransform: 'uppercase', fontWeight: 700 }}>Low Stock Warnings</p>
            <h3 className="kpi-value" style={{ color: lowStockCount > 0 ? 'var(--red)' : 'var(--green)' }}>
              {lowStockCount} {lowStockCount > 0 && (
                <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.4rem' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> Action Needed
                </span>
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="table-card" style={{ padding: '1.25rem' }}>
        <div className="table-header-row" style={{ borderBottom: 'none', padding: 0, marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '0.85rem', pointerEvents: 'none' }}></i>
              <input
                type="text"
                className="form-input"
                placeholder="Search material or supplier name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.3rem' }}
              />
            </div>

            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="all">All Categories</option>
              <option value="coffee beans">Coffee Beans</option>
              <option value="dairy & milk">Dairy & Milk</option>
              <option value="syrups & concentrates">Syrups & Concentrates</option>
              <option value="packaging & cups">Packaging & Cups</option>
              <option value="toppings & add-ons">Toppings & Add-ons</option>
              <option value="barista supplies">Barista Supplies</option>
            </select>

            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{ fontWeight: 600 }}
            >
              <option value="all">All Stock Status</option>
              <option value="low">Low Stock Alerts Only</option>
            </select>
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 700 }}>{filteredItems.length} Materials Found</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Raw Material</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Unit Cost</th>
              <th>Current Stock</th>
              <th>Stock Valuation</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const itemValuation = item.currentStock * (item.unitCost || 0);

              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 800, color: 'var(--text)' }}>{item.name}</td>
                  <td>
                    <span style={{ background: 'var(--orange-bg)', color: 'var(--brand)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{item.supplierName || 'General Supplier'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text)' }}>₱{item.unitCost || 0} / {item.unit}</td>
                  <td style={{ fontWeight: 800, color: item.isLowStock ? 'var(--red)' : 'var(--text)' }}>
                    {item.currentStock} {item.unit}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', display: 'block', fontWeight: 500 }}>Critical: {item.criticalLevel} {item.unit}</span>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--green)' }}>₱{itemValuation.toLocaleString()}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: item.isLowStock ? 'var(--red-bg)' : 'var(--green-bg)',
                      color: item.isLowStock ? 'var(--red)' : 'var(--green)'
                    }}>
                      {item.isLowStock ? (
                        <>
                          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '0.75rem' }}></i>
                          Low Stock
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check" style={{ fontSize: '0.75rem' }}></i>
                          Good
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap' }}>
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => { setStockModalItem(item); setChangeType('stock_in'); }}
                        style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Adjust Stock"
                      >
                        <i className="fa-solid fa-sliders" style={{ fontSize: '0.75rem' }}></i>
                        Adjust
                      </button>
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => handleOpenEdit(item)}
                        style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Edit Ingredient & Unit"
                      >
                        <i className="fa-solid fa-pen" style={{ fontSize: '0.75rem' }}></i>
                        Edit
                      </button>
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => handleArchiveItem(item.id, item.name)}
                        style={{ color: 'var(--red)', borderColor: 'var(--border)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Archive Raw Material"
                      >
                        <i className="fa-solid fa-box-archive" style={{ fontSize: '0.75rem' }}></i>
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {stockModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>Adjust Stock: {stockModalItem.name}</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', margin: '4px 0 1rem' }}>
              Current stock level: <strong>{stockModalItem.currentStock} {stockModalItem.unit}</strong>
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Action Type</label>
              <select
                className="form-select"
                value={changeType}
                onChange={(e) => setChangeType(e.target.value as any)}
                style={{ width: '100%', fontWeight: 700 }}
              >
                <option value="stock_in">Stock In (New Supplier Delivery / Restock)</option>
                <option value="set_exact">Set Exact Stock Level</option>
                <option value="spoilage">Spoilage / Expired / Damaged Material</option>
                <option value="adjustment">Deduct Manual Count Correction</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                {changeType === 'set_exact' ? `New Total Stock (${stockModalItem.unit})` : `Quantity to Apply (${stockModalItem.unit})`}
              </label>
              <input
                type="number"
                className="form-input"
                required
                placeholder={changeType === 'set_exact' ? 'e.g. 0' : 'e.g. 500'}
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Reason / Note</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Received batch #402 from roaster"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setStockModalItem(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleStockAdjustment}>
                Save Stock Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Raw Material Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>Add Raw Material Ingredient</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', margin: '4px 0 1rem' }}>Define raw stock items used in coffee & pastry recipes</p>

            <form onSubmit={handleCreateIngredient}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Material Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Oat Milk Barista Edition"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Category</label>
                  <select
                    className="form-select"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    style={{ width: '100%', fontWeight: 600 }}
                  >
                    <option value="Coffee Beans">Coffee Beans</option>
                    <option value="Dairy & Milk">Dairy & Milk</option>
                    <option value="Syrups & Concentrates">Syrups & Concentrates</option>
                    <option value="Packaging & Cups">Packaging & Cups</option>
                    <option value="Toppings & Add-ons">Toppings & Add-ons</option>
                    <option value="Barista Supplies">Barista Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Unit of Measure</label>
                  <UnitComboBox
                    value={newItemUnit}
                    onChange={setNewItemUnit}
                    required
                    placeholder="g, ml, pcs, scoop..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Unit Cost (₱)</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    placeholder="150"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Supplier Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Supplier Name"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Initial Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Critical Threshold</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={newItemCritical}
                    onChange={(e) => setNewItemCritical(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Raw Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Raw Material Modal */}
      {editModalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>Edit Raw Material Ingredient</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', margin: '4px 0 1rem' }}>Update ingredient information and unit of measure</p>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Material Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Category</label>
                  <select
                    className="form-select"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ width: '100%', fontWeight: 600 }}
                  >
                    <option value="Coffee Beans">Coffee Beans</option>
                    <option value="Dairy & Milk">Dairy & Milk</option>
                    <option value="Syrups & Concentrates">Syrups & Concentrates</option>
                    <option value="Packaging & Cups">Packaging & Cups</option>
                    <option value="Toppings & Add-ons">Toppings & Add-ons</option>
                    <option value="Barista Supplies">Barista Supplies</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Unit of Measure</label>
                  <UnitComboBox
                    value={editUnit}
                    onChange={setEditUnit}
                    required
                    placeholder="g, ml, pcs, scoop..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Unit Cost (₱)</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Supplier Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Supplier Name"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.2rem' }}>Critical Threshold ({editUnit})</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  value={editCritical}
                  onChange={(e) => setEditCritical(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setEditModalItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Audit Logs Modal */}
      {showLogsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', width: '100%', maxWidth: '700px', height: '80vh', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--brand)' }}></i>
                  <span>Raw Material Stock Movement Audit Logs</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-2)' }}>Automatic tracking of sales deductions, supplier deliveries & spoilages</p>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.25rem' }}
                title="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {logs.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-3)' }}>No material movement logs found.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{log.itemName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', display: 'block' }}>{new Date(log.createdAt).toLocaleString()} • Performed by: {log.performedBy || 'System'}</span>
                      {log.note && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontStyle: 'italic', display: 'block' }}>"{log.note}"</span>}
                    </div>

                    <span style={{
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      color: log.changeType === 'stock_in' ? 'var(--green)' : 'var(--red)'
                    }}>
                      {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange} {log.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
