import React, { useState, useEffect } from 'react';
import { User } from './types';
import { LoginView } from './components/LoginView';
import { POSView } from './components/POSView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { ProductsView } from './components/ProductsView';
import { ReportsView } from './components/ReportsView';
import { ArchiveView } from './components/ArchiveView';
import { SettingsView } from './components/SettingsView';
import { CommonBotDrawer } from './components/CommonBotDrawer';
import { CustomerStorefrontView } from './components/CustomerStorefrontView';
import { CommonBrewLogo } from './components/CommonBrewLogo';
import { Coffee, Bell, Bot, Menu, X } from 'lucide-react';
import { useRealtimeSync, initClientRealtimeSync } from './lib/realtimeSync';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'customer' | 'staff'>('customer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<'pos' | 'dashboard' | 'inventory' | 'products' | 'reports' | 'archive' | 'settings'>('pos');
  const [timeString, setTimeString] = useState('');
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [forcedSignOutNotice, setForcedSignOutNotice] = useState<string | null>(null);

  // Check auth session & theme
  useEffect(() => {
    checkAuth();
    const savedTheme = localStorage.getItem('commonbrew_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Listen for real-time user updates (e.g. Username or Full Name edits in Settings)
  useEffect(() => {
    const handleUserUpdated = (e: any) => {
      if (e.detail) {
        const updated = e.detail;
        setCurrentUser(prev => {
          if (!prev) return updated;
          if (prev.id === updated.id || (prev.role === 'Administrator' && updated.role === 'Administrator')) {
            return { ...prev, ...updated };
          }
          return prev;
        });
      }
    };
    window.addEventListener('commonbrew:user-updated', handleUserUpdated);
    return () => window.removeEventListener('commonbrew:user-updated', handleUserUpdated);
  }, []);

  const checkAuth = async () => {
    try {
      const staffToken = localStorage.getItem('commonbrew_staff_token');
      if (!staffToken) {
        setCurrentUser(null);
        setLoadingAuth(false);
        return;
      }
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${staffToken}`
        }
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const user = await res.json();
        setCurrentUser(user);
        setMode('staff');
        if (user.role === 'Cashier') setCurrentView('pos');
      } else {
        localStorage.removeItem('commonbrew_staff_token');
        setCurrentUser(null);
      }
    } catch (e) {
      console.error(e);
      setCurrentUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  // Live Top Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch low stock count periodically
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/inventory');
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const items = await res.json();
          if (Array.isArray(items)) {
            const low = items.filter((i: any) => i.isLowStock).length;
            setLowStockCount(low);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchNotifs();
    const inv = setInterval(fetchNotifs, 15000);
    return () => clearInterval(inv);
  }, [currentUser]);

  // Realtime notification update when inventory changes in Supabase
  useRealtimeSync(['inventory'], () => {
    if (!currentUser) return;
    fetch('/api/inventory')
      .then(res => res.json())
      .then(items => {
        if (Array.isArray(items)) {
          const low = items.filter((i: any) => i.isLowStock).length;
          setLowStockCount(low);
        }
      })
      .catch(() => {});
  });

  // Immediately end this device's staff session (e.g. the Admin deactivated this account)
  const forceSignOut = (message: string) => {
    localStorage.removeItem('commonbrew_staff_token');
    setCurrentUser(null);
    setMode('customer');
    setIsBotOpen(false);
    setIsMobileNavOpen(false);
    setForcedSignOutNotice(message);
  };

  // Verify the account is still active: instant via realtime events, with a periodic check as fallback
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const deactivatedMessage = 'Your account has been deactivated by the Administrator. You have been signed out.';
    const expiredMessage = 'Your login session has ended. Please sign in again.';

    const verifySession = async () => {
      const staffToken = localStorage.getItem('commonbrew_staff_token');
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            ...(staffToken ? { 'Authorization': `Bearer ${staffToken}` } : {}),
            'X-Staff-User-Id': userId
          }
        });
        if (res.status === 401) {
          const data = await res.json().catch(() => null);
          forceSignOut(data?.reason === 'account_deactivated' ? deactivatedMessage : expiredMessage);
        }
      } catch (e) {
        // Offline / server unreachable - keep the session and retry on the next tick
      }
    };

    const handleRealtime = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const revoked = detail.table === 'staff_sessions' && detail.eventType === 'REVOKED' && detail.new?.userId === userId;
      const deactivated = detail.table === 'users' && detail.new?.id === userId && detail.new?.is_active === false;
      if (revoked || deactivated) {
        forceSignOut(deactivatedMessage);
      }
    };

    initClientRealtimeSync();
    window.addEventListener('supabase-data-changed', handleRealtime);
    const interval = setInterval(verifySession, 10000);
    const onFocus = () => verifySession();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('supabase-data-changed', handleRealtime);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser?.id]);

  const handleSignOut = async () => {
    const staffToken = localStorage.getItem('commonbrew_staff_token');
    if (staffToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${staffToken}`
          }
        });
      } catch (e) {}
      localStorage.removeItem('commonbrew_staff_token');
    }
    setCurrentUser(null);
    setMode('customer');
  };

  if (loadingAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c0d02', color: '#fff' }}>
        <p style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Coffee size={24} style={{ color: '#FF5E00' }} /> Loading CommonBrew Taytay...
        </p>
      </div>
    );
  }

  const forcedSignOutModal = forcedSignOutNotice && (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}
    >
      <div style={{ background: '#fff', borderRadius: '14px', maxWidth: '420px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#b91c1c', fontSize: '1.15rem', fontWeight: 800 }}>Signed Out</h3>
        <p style={{ margin: '0 0 1.25rem', color: '#334155', fontSize: '0.95rem', lineHeight: 1.5 }}>{forcedSignOutNotice}</p>
        <button
          onClick={() => setForcedSignOutNotice(null)}
          style={{ background: '#FF5E00', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
        >
          OK
        </button>
      </div>
    </div>
  );

  // Render Customer Public Home Page Showcase
  if (mode === 'customer') {
    return (
      <>
      {forcedSignOutModal}
      <CustomerStorefrontView
        onSwitchToStaffLogin={() => setMode('staff')}
        onStaffLoginSuccess={(user, token) => {
          if (token) localStorage.setItem('commonbrew_staff_token', token);
          setCurrentUser(user);
          setMode('staff');
          setCurrentView(user.role === 'Cashier' ? 'pos' : 'dashboard');
        }}
      />
      </>
    );
  }

  // Render Staff Login if not authenticated
  if (mode === 'staff' && !currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#fdfbf7' }}>
        <LoginView
          onLoginSuccess={(u, token) => {
            if (token) localStorage.setItem('commonbrew_staff_token', token);
            setCurrentUser(u);
            setCurrentView(u.role === 'Cashier' ? 'pos' : 'dashboard');
          }}
          onCustomerLoginSuccess={(cust, token) => {
            if (token) localStorage.setItem('commonbrew_customer_token', token);
            localStorage.setItem('commonbrew_customer', JSON.stringify(cust));
            setMode('customer');
          }}
          onBackToStorefront={() => setMode('customer')}
        />
      </div>
    );
  }

  return (
    <div className="app-body">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileNavOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo" style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <CommonBrewLogo variant="full" size="md" color="#FF5E00" />
            <button
              className="mobile-nav-close"
              onClick={() => setIsMobileNavOpen(false)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          </div>
          <span className="logo-role" style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
            {currentUser?.role.toUpperCase()} TERMINAL
          </span>
        </div>

        <nav className="sidebar-menu">
          <p className="menu-label">MAIN NAVIGATION</p>
          <ul className="nav-list">
            <li>
              <button
                className={`nav-link ${currentView === 'pos' ? 'active' : ''}`}
                onClick={() => { setCurrentView('pos'); setIsMobileNavOpen(false); }}
              >
                <i className="fa-solid fa-calculator icon"></i>
                <span>Point of Sale</span>
              </button>
            </li>

            {currentUser?.role === 'Administrator' && (
              <li>
                <button
                  className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => { setCurrentView('dashboard'); setIsMobileNavOpen(false); }}
                >
                  <i className="fa-solid fa-chart-line icon"></i>
                  <span>Dashboard</span>
                </button>
              </li>
            )}

            <li>
              <button
                className={`nav-link ${currentView === 'inventory' ? 'active' : ''}`}
                onClick={() => { setCurrentView('inventory'); setIsMobileNavOpen(false); }}
              >
                <i className="fa-solid fa-boxes-stacked icon"></i>
                <span>Raw Materials</span>
              </button>
            </li>

            <li>
              <button
                className={`nav-link ${currentView === 'reports' ? 'active' : ''}`}
                onClick={() => { setCurrentView('reports'); setIsMobileNavOpen(false); }}
              >
                <i className="fa-solid fa-file-invoice-dollar icon"></i>
                <span>Sales Reports</span>
              </button>
            </li>

            {currentUser?.role === 'Administrator' && (
              <>
                <li>
                  <button
                    className={`nav-link ${currentView === 'products' ? 'active' : ''}`}
                    onClick={() => { setCurrentView('products'); setIsMobileNavOpen(false); }}
                  >
                    <i className="fa-solid fa-mug-hot icon"></i>
                    <span>Products Menu</span>
                  </button>
                </li>

                <li>
                  <button
                    className={`nav-link ${currentView === 'archive' ? 'active' : ''}`}
                    onClick={() => { setCurrentView('archive'); setIsMobileNavOpen(false); }}
                  >
                    <i className="fa-solid fa-box-archive icon"></i>
                    <span>Archive</span>
                  </button>
                </li>

                <li>
                  <button
                    className={`nav-link ${currentView === 'settings' ? 'active' : ''}`}
                    onClick={() => { setCurrentView('settings'); setIsMobileNavOpen(false); }}
                  >
                    <i className="fa-solid fa-gear icon"></i>
                    <span>Settings</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(currentUser?.username || currentUser?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p
                className="user-name"
                title={currentUser?.fullName ? `${currentUser.fullName} (@${currentUser?.username || ''})` : (currentUser?.username || '')}
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {currentUser?.username || currentUser?.fullName}
              </p>
              <p className="user-role" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.role}
              </p>
            </div>
          </div>
          <button className="signout-btn" onClick={handleSignOut}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div style={{ fontWeight: 700, color: '#6b7280', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="mobile-hamburger-btn"
              onClick={() => setIsMobileNavOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem', color: '#111827', display: 'none', borderRadius: '8px' }}
              title="Toggle Navigation Menu"
            >
              <Menu size={22} />
            </button>
            <span className="app-top-title">CommonBrew Taytay</span>
          </div>

          <div className="top-clock">
            {timeString}
          </div>

          <div className="top-bar-actions">
            <button
              className="notif-btn"
              title="Low Stock Alerts"
              onClick={() => setCurrentView('inventory')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={18} />
              {lowStockCount > 0 && <span className="notif-badge">{lowStockCount}</span>}
            </button>

            {currentUser?.role === 'Administrator' && (
              <button className="ai-btn" onClick={() => setIsBotOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.65rem' }}>
                <img
                  src="/commonbot-avatar.jpg"
                  alt="CommonBot"
                  referrerPolicy="no-referrer"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid #FF5E00'
                  }}
                />
                <span>CommonBot AI</span>
              </button>
            )}
          </div>
        </header>

        {/* View Content */}
        <main className="page-content">
          {currentView === 'pos' && <POSView />}
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'inventory' && <InventoryView />}
          {currentView === 'products' && <ProductsView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'archive' && <ArchiveView />}
          {currentView === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onUserUpdated={(updatedUser) => {
                setCurrentUser(prev => (prev ? { ...prev, ...updatedUser } : updatedUser));
                checkAuth();
              }}
            />
          )}
        </main>
      </div>

      {/* CommonBot AI Drawer */}
      <CommonBotDrawer
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        userName={currentUser?.username || currentUser?.fullName || 'User'}
      />
    </div>
  );
};

export default App;
