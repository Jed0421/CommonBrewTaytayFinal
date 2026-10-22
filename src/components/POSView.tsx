import React, { useState, useEffect } from 'react';
import { Product, Category, OrderItem, OnlineOrder } from '../types';
import { Search, Bike, Coffee, Zap, Banknote, Smartphone, Printer, X, User, Store, MapPin, Clock, CheckCircle2, Check, Plus, Minus, Mail, Send, AlertCircle, FileText, Eye, Receipt, Ban } from 'lucide-react';
import { commonbrewAddons, getAddonPrice, getAvailableAddonsForProduct } from '../data/commonbrewData';
import { getCategoryDrinkImage, getProductImage } from '../data/drinkImages';
import { ThermalReceiptModal, ThermalReceiptData } from './ThermalReceiptModal';
import { useRealtimeSync } from '../lib/realtimeSync';

export const POSView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash'>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  const [thermalReceiptData, setThermalReceiptData] = useState<ThermalReceiptData | null>(null);
  const [cashierName, setCashierName] = useState<string>('Maria Cashier');
  const [viewReceiptModalImage, setViewReceiptModalImage] = useState<string | null>(null);

  // Online Orders State
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineFilter, setOnlineFilter] = useState<'all' | 'Pending' | 'Preparing' | 'Ready'>('Pending');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OnlineOrder | null>(null);
  const [cancelReasonChoice, setCancelReasonChoice] = useState('');
  const [cancelReasonOther, setCancelReasonOther] = useState('');
  const CANCEL_REASONS = [
    'Fake / invalid GCash receipt',
    'Random image uploaded (not a GCash receipt)',
    'Receipt amount does not match order total',
    'Payment not received in GCash account',
    'Customer requested cancellation',
    'Item unavailable / out of stock',
    'Other'
  ];
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string; sub?: string } | null>(null);
  const [outOfStockNotice, setOutOfStockNotice] = useState<{ name: string; reason: string } | null>(null);

  const showOutOfStockNotice = (product: Product) => {
    const reason = product.outOfStockReason || (product.outOfStockIngredients && product.outOfStockIngredients.length > 0
      ? `Raw material "${product.outOfStockIngredients.join(', ')}" is depleted.`
      : 'Required raw materials are out of stock.');
    setOutOfStockNotice({ name: product.name, reason });
    setTimeout(() => {
      setOutOfStockNotice(null);
    }, 5000);
  };

  useEffect(() => {
    fetchData();
    fetchOnlineOrders();
    const staffToken = localStorage.getItem('commonbrew_staff_token');
    if (staffToken) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${staffToken}` } })
        .then(r => r.json())
        .then(u => {
          if (u?.fullName) setCashierName(u.fullName);
        })
        .catch(() => {});
    }
    // Poll data periodically so inventory changes (e.g. Assam Tea Base reaching 0 ml) reflect immediately
    const interval = setInterval(() => {
      fetchData();
      fetchOnlineOrders();
    }, 4000);

    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Instantly reflect Supabase edits for products, categories, inventory, and online orders
  useRealtimeSync(['products', 'categories', 'inventory', 'online_orders'], () => {
    console.log('[POSView] Supabase change received! Auto-updating menu and orders...');
    fetchData();
    fetchOnlineOrders();
  });

  const handlePrintReceipt = (receiptOverride?: any) => {
    const target = receiptOverride || lastReceipt;
    if (!target) return;
    setThermalReceiptData({
      ref: target.ref || target.orderRef || `CB-REC-${Date.now().toString().slice(-4)}`,
      date: target.date || new Date().toLocaleString(),
      items: target.items || [],
      totalAmount: target.totalAmount || 0,
      paymentMethod: target.paymentMethod || 'Cash',
      cashTendered: target.cashTendered !== undefined ? target.cashTendered : (target.totalAmount || 0),
      changeAmount: target.changeAmount !== undefined ? target.changeAmount : 0,
      cashierName: target.cashierName || cashierName
    });
    setShowThermalReceipt(true);
  };

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories').catch(() => null),
        fetch('/api/products').catch(() => null)
      ]);
      if (catRes && catRes.ok) {
        const cats = await catRes.json().catch(() => null);
        if (Array.isArray(cats)) setCategories(cats);
      }
      if (prodRes && prodRes.ok) {
        const prods = await prodRes.json().catch(() => null);
        if (Array.isArray(prods)) setProducts(prods);
      }
    } catch (e) {
      console.warn('[POSView] Error fetching data:', e);
    }
  };

  const fetchOnlineOrders = async () => {
    try {
      const res = await fetch('/api/online-orders').catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (Array.isArray(data)) setOnlineOrders(data);
      }
    } catch (e) {
      console.warn('[POSView] Error fetching online orders:', e);
    }
  };

  const handleUpdateOnlineStatus = async (orderId: string, status: string, cancelReason?: string) => {
    setUpdatingOrderId(orderId);
    try {
      const staffToken = localStorage.getItem('commonbrew_staff_token');
      const res = await fetch('/api/online-orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'Authorization': `Bearer ${staffToken}` } : {})
        },
        body: JSON.stringify({ orderId, status, cancelReason })
      });
      const data = await res.json();
      if (data.success) {
        if (status === 'Ready') {
          if (data.emailDelivery?.sent) {
            setStatusNotification({
              type: 'success',
              message: `Delivery notification emailed to ${data.emailDelivery.recipient}!`,
              sub: `"${data.emailDelivery.message}"`
            });
          } else if (data.emailDelivery?.recipient) {
            setStatusNotification({
              type: 'info',
              message: `Order marked as Ready. Attempted email to ${data.emailDelivery.recipient}.`,
              sub: data.emailDelivery.message
            });
          } else {
            setStatusNotification({
              type: 'info',
              message: `Order marked as Ready!`,
              sub: `(No customer email address on file for this order)`
            });
          }
          setTimeout(() => setStatusNotification(null), 9000);
        }
        fetchOnlineOrders();
        if (status === 'Cancelled') {
          setCancelTarget(null);
          setCancelReasonChoice('');
          setCancelReasonOther('');
        }
      } else {
        alert(data.message || 'Error updating order status');
      }
    } catch (e) {
      alert('Error updating order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const pendingOnlineCount = onlineOrders.filter(o => o.status === 'Pending').length;

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    if (product.isOutOfStock) {
      showOutOfStockNotice(product);
      return;
    }

    setOrderItems(prev => {
      const existingIndex = prev.findIndex(item => item.id.startsWith(product.id) && !item.isUpsize && item.addons.length === 0);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += 1;
        return updated;
      }

      const newItem: OrderItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        categoryId: product.categoryId,
        name: product.name,
        originalPrice: product.price,
        upsizePrice: product.upsizePrice,
        productType: product.productType,
        isUpsize: false,
        addons: [],
        qty: 1
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setOrderItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean) as OrderItem[];
    });
  };

  const handleToggleUpsize = (itemId: string) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const prod = products.find(p => p.id === item.productId || item.id.startsWith(p.id));
        if (!item.isUpsize && prod?.isUpsizeOutOfStock) {
          alert(`Cannot upsize "${prod?.name || item.name}": Upsize raw materials or upsize cups are depleted.`);
          return item;
        }
        return { ...item, isUpsize: !item.isUpsize };
      }
      return item;
    }));
  };

  const handleToggleAddon = (itemId: string, addonName: string) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const exists = item.addons.includes(addonName);
        const newAddons = exists
          ? item.addons.filter(a => a !== addonName)
          : [...item.addons, addonName];
        return { ...item, addons: newAddons };
      }
      return item;
    }));
  };

  const getItemUnitPrice = (item: OrderItem) => {
    let price = item.isUpsize && item.upsizePrice ? item.upsizePrice : item.originalPrice;
    item.addons.forEach(addon => {
      price += getAddonPrice(addon);
    });
    return price;
  };

  const hasOosItemsInCart = orderItems.some(item => {
    const prod = products.find(p => p.id === item.productId || item.id.startsWith(p.id));
    return Boolean(prod?.isOutOfStock);
  });

  const totalAmount = orderItems.reduce((sum, item) => sum + (getItemUnitPrice(item) * item.qty), 0);
  const numericCash = parseFloat(cashTendered) || 0;
  const changeAmount = paymentMethod === 'Cash' ? Math.max(0, numericCash - totalAmount) : 0;

  const handleCheckout = async () => {
    if (orderItems.length === 0) return;
    if (hasOosItemsInCart) {
      alert('Cannot checkout: Your order contains Out Of Stock items. Please remove them to proceed.');
      return;
    }
    if (paymentMethod === 'Cash' && numericCash < totalAmount) {
      alert(`Insufficient cash tendered. Total is ₱${totalAmount.toFixed(2)}`);
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        paymentMethod,
        cashTendered: paymentMethod === 'Cash' ? numericCash : totalAmount,
        items: orderItems.map(item => ({
          productId: item.productId || (item.id.includes('-') ? item.id.substring(0, item.id.lastIndexOf('-')) : item.id),
          productName: `${item.name}${item.isUpsize ? ' (22oz Upsize)' : ''}${item.addons.length ? ` [${item.addons.join(', ')}]` : ''}`,
          unitPrice: getItemUnitPrice(item),
          quantity: item.qty,
          isUpsize: item.isUpsize,
          addons: item.addons
        }))
      };

      const staffToken = localStorage.getItem('commonbrew_staff_token');
      const res = await fetch('/api/pos/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'Authorization': `Bearer ${staffToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Transaction failed');
        setProcessing(false);
        fetchData();
        return;
      }

      setLastReceipt({
        ref: data.transactionRef,
        date: new Date().toLocaleString(),
        items: [...orderItems],
        totalAmount,
        paymentMethod,
        cashTendered: paymentMethod === 'Cash' ? numericCash : totalAmount,
        changeAmount: data.change,
        cashierName
      });

      setOrderItems([]);
      setCashTendered('');
      fetchData();
    } catch (e) {
      alert('Error processing order.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pos-layout">
      {/* Products Column */}
      <div className="pos-products">
        <div className="pos-search-bar" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} className="search-icon-sm" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Search products or drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Online Orders Live Button */}
          <button
            type="button"
            onClick={() => setShowOnlineModal(true)}
            style={{
              position: 'relative',
              background: pendingOnlineCount > 0 ? '#FF5E00' : '#0f172a',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: pendingOnlineCount > 0 ? '0 4px 14px rgba(255, 94, 0, 0.4)' : 'none'
            }}
          >
            <Bike size={18} />
            <span>Online Orders</span>
            {pendingOnlineCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                {pendingOnlineCount}
              </span>
            )}
          </button>
        </div>

        {/* Out Of Stock Notification Alert */}
        {outOfStockNotice && (
          <div
            style={{
              background: '#fee2e2',
              border: '1.5px solid #ef4444',
              color: '#991b1b',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              margin: '0.75rem 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.18)',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem' }}>
                  Cannot Select: "{outOfStockNotice.name}" is Labeled Out Of Stock!
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#b91c1c' }}>
                  {outOfStockNotice.reason}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOutOfStockNotice(null)}
              style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: '4px' }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="cat-pills">
          <button
            className={`cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Products
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`cat-pill ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filteredProducts.map(product => {
            const isOOS = Boolean(product.isOutOfStock);
            const firstMissing = product.outOfStockIngredients?.[0];

            return (
              <div
                key={product.id}
                className={`product-card ${isOOS ? 'out-of-stock disabled' : ''}`}
                onClick={() => {
                  if (isOOS) {
                    showOutOfStockNotice(product);
                    return;
                  }
                  handleAddToCart(product);
                }}
                style={{
                  position: 'relative',
                  cursor: isOOS ? 'not-allowed' : 'pointer',
                  opacity: isOOS ? 0.72 : 1,
                  filter: isOOS ? 'grayscale(0.65)' : 'none',
                  borderColor: isOOS ? '#ef4444' : undefined,
                  background: isOOS ? '#fff5f5' : undefined
                }}
                title={isOOS ? `OUT OF STOCK: ${product.outOfStockReason || 'Raw materials depleted'}` : `Click to add ${product.name}`}
              >
                {/* Labeled Out Of Stock Badge Banner */}
                {isOOS && (
                  <div
                    className="out-of-stock-badge"
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      zIndex: 10,
                      background: '#ef4444',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.65rem',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.45)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    <AlertCircle size={11} strokeWidth={3} />
                    <span>Out Of Stock!</span>
                  </div>
                )}

                <div className="product-img-wrap" style={{ position: 'relative' }}>
                  <img
                    src={getProductImage(product.imageUrl, product.categoryId, product.name)}
                    alt={product.name}
                    className="product-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getCategoryDrinkImage(product.categoryId, product.name);
                    }}
                  />
                  {isOOS && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.42)',
                        backdropFilter: 'blur(1px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span
                        style={{
                          background: 'rgba(239, 68, 68, 0.95)',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: '0.72rem',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <X size={12} strokeWidth={3} /> Out Of Stock!
                      </span>
                    </div>
                  )}
                </div>

                <div className="product-info" style={{ padding: '0.4rem 0.6rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p className="product-name" style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>{product.name}</p>
                    {isOOS && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#dc2626', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {firstMissing ? `Low: ${firstMissing}` : 'Material 0 ml'}
                      </p>
                    )}
                  </div>
                  <p className="product-price" style={{ margin: 0, fontWeight: 800, color: isOOS ? '#94a3b8' : 'var(--brand)' }}>
                    ₱{product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Panel */}
      <div className="pos-order">
        <div className="order-header">
          <div className="order-title-row">
            <span className="order-title">Current Order</span>
            <span className="order-count">{orderItems.reduce((s, i) => s + i.qty, 0)} items</span>
          </div>
        </div>

        <div className="order-items">
          {orderItems.length === 0 ? (
            <div className="order-empty">
              <Coffee size={40} style={{ margin: '0 auto 0.5rem', color: '#94a3b8' }} />
              <p style={{ fontWeight: 600 }}>No items in current order</p>
              <p style={{ fontSize: '0.78rem' }}>Click any menu item on the left to add</p>
            </div>
          ) : (
            orderItems.map(item => {
              const unitPrice = getItemUnitPrice(item);
              const subtotal = unitPrice * item.qty;

              return (
                <div key={item.id} className="order-item-stack">
                  <div className="order-item-main">
                    <div className="order-item-info">
                      <p className="order-item-name">
                        {item.name}
                        {item.isUpsize && <span className="order-badge">22oz Upsize</span>}
                      </p>
                      <p className="order-item-price">₱{unitPrice.toFixed(2)}</p>
                    </div>

                    <div className="order-item-qty">
                      <button className="qty-btn" onClick={() => handleUpdateQty(item.id, -1)}>-</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn" onClick={() => handleUpdateQty(item.id, 1)}>+</button>
                    </div>

                    <span className="order-item-sub">₱{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Out of Stock Warning on Cart Item */}
                  {(() => {
                    const productObj = products.find(p => p.id === item.productId || item.id.startsWith(p.id));
                    if (!productObj?.isOutOfStock) return null;
                    return (
                      <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '5px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <span>OUT OF STOCK: Raw material depleted</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, -item.qty)}
                          style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 800, textDecoration: 'underline' }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })()}

                  {/* Customization Options */}
                  {(() => {
                    const productObj = products.find(p => p.id === item.productId);
                    const effectiveCategoryId = item.categoryId || productObj?.categoryId;
                    const availableAddons = getAvailableAddonsForProduct({
                      categoryId: effectiveCategoryId,
                      productType: item.productType,
                      name: item.name
                    });

                    const hasUpsize = Boolean(item.upsizePrice && item.productType === 'Drink');
                    const hasAddons = availableAddons.length > 0;

                    if (!hasUpsize && !hasAddons) return null;

                    return (
                      <div className="order-item-controls">
                        {hasUpsize && (
                          <button
                            className={`upsize-btn ${item.isUpsize ? 'active' : ''}`}
                            onClick={() => handleToggleUpsize(item.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Zap size={13} /> {effectiveCategoryId === 'cat-hotcoffee' ? '16oz Hot Cup' : '22oz Upsize'} (+₱{((item.upsizePrice || 0) - item.originalPrice).toFixed(0)})
                          </button>
                        )}

                        {hasAddons && (
                          <div className="addon-wrap">
                            {availableAddons.map(addon => (
                              <button
                                key={addon.name}
                                className={`addon-btn ${item.addons.includes(addon.name) ? 'active' : ''}`}
                                onClick={() => handleToggleAddon(item.id, addon.name)}
                              >
                                + {addon.name} (₱{addon.price})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>

        <div className="order-footer">
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total Payable</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-methods">
            {(['Cash', 'GCash'] as const).map(pm => (
              <button
                key={pm}
                className={`pay-btn ${paymentMethod === pm ? 'active' : ''}`}
                onClick={() => setPaymentMethod(pm)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                {pm === 'Cash' && <Banknote size={16} />}
                {pm === 'GCash' && <Smartphone size={16} />}
                <span>{pm}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'GCash' && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#1e40af' }}>
              <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Smartphone size={14} color="#007dfe" />
                <span>GCash Recipient: 09474960778</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '2px' }}>
                CommonBrew Taytay • Customer scans or sends here
              </div>
            </div>
          )}

          {paymentMethod === 'Cash' && (
            <>
              <div className="cash-input-wrap">
                <span className="cash-icon">₱</span>
                <input
                  type="number"
                  className="cash-input"
                  placeholder="Cash Tendered"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                />
              </div>

              {numericCash > 0 && (
                <div className="change-display">
                  Change: <strong>₱{changeAmount.toFixed(2)}</strong>
                </div>
              )}
            </>
          )}

          <button
            className="pay-action-btn"
            disabled={orderItems.length === 0 || processing || hasOosItemsInCart}
            onClick={handleCheckout}
            style={{
              background: hasOosItemsInCart ? '#dc2626' : undefined,
              cursor: hasOosItemsInCart ? 'not-allowed' : undefined,
              opacity: (orderItems.length === 0 || processing || hasOosItemsInCart) ? 0.65 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem'
            }}
          >
            {processing ? (
              'Processing...'
            ) : hasOosItemsInCart ? (
              <>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Remove Out-Of-Stock Items</span>
              </>
            ) : (
              `Complete Sale • ₱${totalAmount.toFixed(2)}`
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {lastReceipt && (
        <div className="modal-overlay">
          <div className="receipt-modal">
            <div className="receipt-header">
              <h2>CommonBrew Taytay</h2>
              <p>Point of Sale Receipt</p>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                Ref: {lastReceipt.ref}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{lastReceipt.date}</p>
            </div>

            <div className="receipt-body">
              <hr />
              {lastReceipt.items.map((item: OrderItem, idx: number) => {
                const price = getItemUnitPrice(item);
                return (
                  <div key={idx} style={{ marginBottom: '0.35rem' }}>
                    <div className="receipt-line">
                      <span>
                        {item.qty}x {item.name}
                        {item.isUpsize ? ' (22oz)' : ''}
                      </span>
                      <span>₱{(price * item.qty).toFixed(2)}</span>
                    </div>
                    {item.addons && item.addons.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', paddingLeft: '0.75rem', marginTop: '1px' }}>
                        {item.addons.map((add, aIdx) => (
                          <div key={aIdx}>+ {add} (+₱{getAddonPrice(add).toFixed(2)})</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <hr />
              <div className="receipt-line total">
                <span>Total Amount</span>
                <span>₱{lastReceipt.totalAmount.toFixed(2)}</span>
              </div>
              <div className="receipt-line">
                <span>Payment Method</span>
                <span>{lastReceipt.paymentMethod}</span>
              </div>
              <div className="receipt-line">
                <span>Cash Tendered</span>
                <span>₱{lastReceipt.cashTendered.toFixed(2)}</span>
              </div>
              <div className="receipt-line">
                <span>Change</span>
                <span>₱{lastReceipt.changeAmount.toFixed(2)}</span>
              </div>
              <hr />
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', margin: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                <span>Thank you for brewing with us!</span>
                <Coffee size={14} style={{ color: '#FF5E00' }} />
              </p>
            </div>

            <div className="receipt-actions">
              <button
                className="btn-outline"
                onClick={() => handlePrintReceipt()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderColor: '#ea580c',
                  color: '#ea580c',
                  fontWeight: 700
                }}
              >
                <Printer size={16} /> Print
              </button>
              <button className="btn-primary" onClick={() => { setLastReceipt(null); setShowThermalReceipt(false); }}>
                New Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Official Thermal Receipt Modal */}
      {showThermalReceipt && thermalReceiptData && (
        <ThermalReceiptModal
          receipt={thermalReceiptData}
          onClose={() => {
            setShowThermalReceipt(false);
            setLastReceipt(null);
          }}
          autoPrint={true}
        />
      )}
      {/* Online Orders Manager Modal */}
      {showOnlineModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '800px', height: '85vh', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#2c1810', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bike size={22} /> Online Orders Management
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#d1d5db' }}>Manage live customer pickup & delivery orders</p>
              </div>
              <button onClick={() => setShowOnlineModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Status Notification Toast/Banner */}
            {statusNotification && (
              <div style={{
                background: statusNotification.type === 'success' ? '#ecfdf5' : statusNotification.type === 'error' ? '#fef2f2' : '#eff6ff',
                borderBottom: `2px solid ${statusNotification.type === 'success' ? '#10b981' : statusNotification.type === 'error' ? '#ef4444' : '#3b82f6'}`,
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {statusNotification.type === 'success' ? (
                    <Send size={18} color="#059669" />
                  ) : (
                    <AlertCircle size={18} color="#2563eb" />
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: statusNotification.type === 'success' ? '#065f46' : '#1e40af' }}>
                      {statusNotification.message}
                    </div>
                    {statusNotification.sub && (
                      <div style={{ fontSize: '0.75rem', color: statusNotification.type === 'success' ? '#047857' : '#3b82f6', marginTop: '1px' }}>
                        {statusNotification.sub}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setStatusNotification(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#faf5f0', borderBottom: '1px solid #e5e7eb' }}>
              {['Pending', 'Preparing', 'Ready', 'all'].map(st => (
                <button
                  key={st}
                  onClick={() => setOnlineFilter(st as any)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '20px',
                    border: 'none',
                    background: onlineFilter === st ? '#3d2314' : '#fff',
                    color: onlineFilter === st ? '#fff' : '#374151',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {st === 'all' ? 'All Orders' : st} ({st === 'all' ? onlineOrders.length : onlineOrders.filter(o => o.status === st).length})
                </button>
              ))}
            </div>

            {/* Order Cards List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#fcfaf8' }}>
              {onlineOrders.filter(o => onlineFilter === 'all' || o.status === onlineFilter).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9ca3af' }}>
                  <Coffee size={48} style={{ margin: '0 auto 0.5rem', color: '#cbd5e1' }} />
                  <p style={{ fontWeight: 700, margin: 0 }}>No online orders in this category</p>
                </div>
              ) : (
                onlineOrders
                  .filter(o => onlineFilter === 'all' || o.status === onlineFilter)
                  .map(order => (
                    <div key={order.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#2c1810' }}>{order.orderRef}</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.75rem' }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.9rem', color: '#1f2937', marginTop: '2px', flexWrap: 'wrap' }}>
                            <User size={15} style={{ color: '#64748b' }} /> {order.customerName} ({order.customerPhone})
                            {order.customerEmail && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#2563eb', fontSize: '0.78rem', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe', marginLeft: '4px' }}>
                                <Mail size={12} /> {order.customerEmail}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: order.status === 'Completed' ? '#d1fae5' : order.status === 'Preparing' ? '#fef3c7' : order.status === 'Ready' ? '#dbeafe' : '#fee2e2',
                            color: order.status === 'Completed' ? '#065f46' : order.status === 'Preparing' ? '#92400e' : order.status === 'Ready' ? '#1e40af' : '#991b1b'
                          }}>
                            ● {order.status}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginTop: '4px' }}>
                            {order.orderType === 'Delivery' ? <Bike size={14} /> : order.orderType === 'Pickup' ? <Store size={14} /> : <Coffee size={14} />}
                            <span>{order.orderType === 'Delivery' ? 'Delivery' : order.orderType === 'Pickup' ? 'Pickup' : 'Table ' + (order.tableNumber || '')} • {order.paymentMethod}</span>
                          </span>
                        </div>
                      </div>
                      
                      {order.status === 'Cancelled' && order.cancelReason && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.4rem 0.75rem', borderRadius: '8px', marginTop: '0.5rem', fontSize: '0.78rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <Ban size={14} /> <span>Cancel reason: {order.cancelReason}</span>
                        </div>
                      )}

                      {order.deliveryEmailSent && (
                        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.4rem 0.75rem', borderRadius: '8px', marginTop: '0.5rem', fontSize: '0.76rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Send size={13} color="#059669" />
                          <span><strong>Delivery Email Sent:</strong> Customer was emailed at <u>{order.deliveryEmailRecipient || order.customerEmail}</u></span>
                        </div>
                      )}

                      {order.deliveryAddress && (
                        <div style={{ background: '#f9fafb', padding: '0.5rem 0.75rem', borderRadius: '8px', marginTop: '0.5rem', fontSize: '0.8rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MapPin size={15} style={{ color: '#d97706' }} />
                          <span><strong>Delivery Address:</strong> {order.deliveryAddress}</span>
                        </div>
                      )}

                      {order.paymentMethod === 'GCash' && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.55rem 0.75rem', borderRadius: '8px', marginTop: '0.5rem', fontSize: '0.78rem', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Smartphone size={14} color="#007dfe" />
                            <strong>GCash to:</strong> 09474960778
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {order.gcashReceiptImage ? (
                              <button
                                type="button"
                                onClick={() => setViewReceiptModalImage(order.gcashReceiptImage!)}
                                style={{
                                  background: '#059669',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 12px',
                                  fontSize: '0.76rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                                }}
                              >
                                <Eye size={13} />
                                <span>View Uploaded GCash Receipt 📄</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                                ⚠️ No receipt attached
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div style={{ margin: '0.85rem 0', padding: '0.75rem 0', borderTop: '1px dashed #e5e7eb', borderBottom: '1px dashed #e5e7eb' }}>
                        {order.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                            <div>
                              <strong style={{ color: '#1f2937' }}>{it.quantity}x {it.productName}</strong>
                              {it.sugarLevel && <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>Sugar: {it.sugarLevel} | Ice: {it.iceLevel}</span>}
                              {it.addons && it.addons.length > 0 && <span style={{ fontSize: '0.75rem', color: '#059669', display: 'block' }}>Addons: {it.addons.join(', ')}</span>}
                              {it.specialInstructions && <span style={{ fontSize: '0.75rem', color: '#d97706', display: 'block' }}>Note: "{it.specialInstructions}"</span>}
                            </div>
                            <span style={{ fontWeight: 800, color: '#2c1810' }}>₱{it.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#2c1810' }}>
                          Total: ₱{order.totalAmount} {order.deliveryFee > 0 && <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>(incl. ₱{order.deliveryFee} delivery)</small>} {Boolean(order.loyaltyDiscount && order.loyaltyDiscount > 0) && <small style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>(Loyalty: -₱{order.loyaltyDiscount})</small>}
                        </span>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              handlePrintReceipt({
                                ref: order.orderRef,
                                date: new Date(order.createdAt).toLocaleString(),
                                items: order.items.map(it => ({
                                  name: it.productName,
                                  qty: it.quantity,
                                  price: it.unitPrice,
                                  originalPrice: it.unitPrice,
                                  isUpsize: it.isUpsize,
                                  addons: it.addons
                                })),
                                totalAmount: order.totalAmount,
                                paymentMethod: order.paymentMethod,
                                cashTendered: order.totalAmount,
                                changeAmount: 0,
                                cashierName: `${cashierName} (Online)`
                              });
                            }}
                            style={{
                              background: '#ffffff',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            title="Generate and print official thermal receipt slip"
                          >
                            <Printer size={14} /> Print Slip
                          </button>

                          {order.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateOnlineStatus(order.id, 'Preparing')}
                              disabled={updatingOrderId === order.id}
                              style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: updatingOrderId === order.id ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', opacity: updatingOrderId === order.id ? 0.7 : 1 }}
                            >
                              <Clock size={14} /> Start Preparing
                            </button>
                          )}

                          {(order.status === 'Preparing' || order.status === 'Pending') && (
                            <button
                              onClick={() => handleUpdateOnlineStatus(order.id, 'Ready')}
                              disabled={updatingOrderId === order.id}
                              style={{
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                padding: '0.45rem 1rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                cursor: updatingOrderId === order.id ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                                opacity: updatingOrderId === order.id ? 0.7 : 1
                              }}
                              title="Marks order as ready and sends instant delivery notification email to customer"
                            >
                              <CheckCircle2 size={15} />
                              <span>
                                {updatingOrderId === order.id ? 'Sending Email...' : 'Mark as ready'}
                              </span>
                            </button>
                          )}

                          {(order.status === 'Ready' || order.status === 'Preparing') && (
                            <button
                              onClick={() => handleUpdateOnlineStatus(order.id, 'Completed')}
                              disabled={updatingOrderId === order.id}
                              style={{ background: '#059669', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: updatingOrderId === order.id ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', opacity: updatingOrderId === order.id ? 0.7 : 1 }}
                            >
                              <Check size={14} /> Complete Order
                            </button>
                          )}

                          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                            <button
                              onClick={() => { setCancelTarget(order); setCancelReasonChoice(''); setCancelReasonOther(''); }}
                              disabled={updatingOrderId === order.id}
                              style={{ background: '#f3f4f6', color: '#ef4444', border: '1px solid #e5e7eb', padding: '0.45rem 0.75rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: updatingOrderId === order.id ? 'not-allowed' : 'pointer' }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

            {/* Cancel Reason Modal */}
      {cancelTarget && (() => {
        const finalReason = cancelReasonChoice === 'Other' ? cancelReasonOther.trim() : cancelReasonChoice;
        const canSubmit = !!finalReason && updatingOrderId !== cancelTarget.id;
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setCancelTarget(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
            >
              <div style={{ background: '#991b1b', color: '#fff', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                  <Ban size={18} /> Cancel Order {cancelTarget.orderRef}
                </div>
                <button onClick={() => setCancelTarget(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#4b5563' }}>
                  Select the reason for cancelling this order. The customer will be able to see it.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {CANCEL_REASONS.map(r => (
                    <label
                      key={r}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600,
                        border: cancelReasonChoice === r ? '1.5px solid #dc2626' : '1px solid #e5e7eb',
                        background: cancelReasonChoice === r ? '#fef2f2' : '#fff',
                        color: '#1f2937'
                      }}
                    >
                      <input type="radio" name="cancel-reason" checked={cancelReasonChoice === r} onChange={() => setCancelReasonChoice(r)} />
                      {r}
                    </label>
                  ))}
                </div>
                {cancelReasonChoice === 'Other' && (
                  <textarea
                    value={cancelReasonOther}
                    onChange={(e) => setCancelReasonOther(e.target.value)}
                    placeholder="Type the reason..."
                    maxLength={300}
                    rows={3}
                    style={{ width: '100%', marginTop: '0.6rem', padding: '0.6rem', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.84rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                )}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    onClick={() => setCancelTarget(null)}
                    style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Keep Order
                  </button>
                  <button
                    disabled={!canSubmit}
                    onClick={() => handleUpdateOnlineStatus(cancelTarget.id, 'Cancelled', finalReason)}
                    style={{ background: canSubmit ? '#dc2626' : '#fca5a5', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                  >
                    {updatingOrderId === cancelTarget.id ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Full-Screen Receipt View Modal for Cashier */}
      {viewReceiptModalImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setViewReceiptModalImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '92vh',
              background: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#007dfe', fontWeight: 800, fontSize: '0.95rem' }}>
                <Receipt size={18} />
                <span>Customer GCash Payment Receipt</span>
              </div>
              <button
                type="button"
                onClick={() => setViewReceiptModalImage(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1rem', overflowY: 'auto', textAlign: 'center', maxHeight: 'calc(92vh - 120px)', background: '#f1f5f9' }}>
              <img
                src={viewReceiptModalImage}
                alt="GCash Receipt"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </div>
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>Verify amount matches order total</span>
              </span>
              <button
                type="button"
                onClick={() => setViewReceiptModalImage(null)}
                style={{ background: '#3d2314', color: '#ffffff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
