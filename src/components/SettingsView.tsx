import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Mail, Phone, ShieldCheck, CheckCircle2, AlertCircle, Edit, Key, Lock, UserCheck, RefreshCw, UserX, FileText, Eye, EyeOff } from 'lucide-react';
import { useRealtimeSync } from '../lib/realtimeSync';
import { LegalDocumentsModal } from './LegalDocumentsModal';

interface SettingsViewProps {
  currentUser?: User | null;
  onUserUpdated?: (updated: User) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser: loggedInUser, onUserUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | null>(null);

  // Add Staff Modal State
  const [showAddUser, setShowAddUser] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  // OTP Verification State for Adding Staff
  const [emailOtp, setEmailOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Staff Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editOriginalEmail, setEditOriginalEmail] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // OTP Verification State for Editing Staff (especially Administrator or any staff changing Gmail)
  const [editEmailOtp, setEditEmailOtp] = useState('');
  const [editOtpSent, setEditOtpSent] = useState(false);
  const [editOtpVerified, setEditOtpVerified] = useState(false);
  const [editOtpLoading, setEditOtpLoading] = useState(false);
  const [editOtpCountdown, setEditOtpCountdown] = useState(0);
  const [editOtpError, setEditOtpError] = useState('');
  const [editOtpSuccess, setEditOtpSuccess] = useState('');

  // Deactivate In-App Confirmation Modal State (Solves browser iframe confirm() blocks)
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [deactivatingLoading, setDeactivatingLoading] = useState(false);

  // Email Duplication Real-Time Check States
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [editEmailError, setEditEmailError] = useState('');
  const [checkingEditEmail, setCheckingEditEmail] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('commonbrew_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Instantly re-fetch users and settings if modified directly in Supabase
  useRealtimeSync(['users', 'store_settings'], () => {
    console.log('[SettingsView] Supabase user or store change received! Auto-refreshing user list...');
    fetchUsers();
  });

  // Debounced check for Add Staff email duplication in Database & in-memory store
  useEffect(() => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@') || clean.length < 5) {
      setEmailError('');
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (data.exists) {
          setEmailError('Email is already used');
        } else {
          setEmailError('');
        }
      } catch (err) {
        console.error('Failed to check email duplication:', err);
      } finally {
        setCheckingEmail(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [email]);

  // Debounced check for Edit Staff email duplication in Database & in-memory store
  useEffect(() => {
    const clean = editEmail.trim().toLowerCase();
    const current = (editOriginalEmail || '').trim().toLowerCase();
    if (!clean || !clean.includes('@') || clean === current) {
      setEditEmailError('');
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEditEmail(true);
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(clean)}&excludeId=${editingUser?.id || ''}`);
        const data = await res.json();
        if (data.exists) {
          setEditEmailError('Email is already used');
        } else {
          setEditEmailError('');
        }
      } catch (err) {
        console.error('Failed to check edit email duplication:', err);
      } finally {
        setCheckingEditEmail(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [editEmail, editOriginalEmail, editingUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('commonbrew_theme', theme);
  }, [theme]);

  // Countdown timer for email registration OTP
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Countdown timer for edit email OTP
  useEffect(() => {
    let timer: any;
    if (editOtpCountdown > 0) {
      timer = setInterval(() => {
        setEditOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [editOtpCountdown]);

  // Clear top notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Add Form
  const resetAddForm = () => {
    setShowAddUser(false);
    setFullName('');
    setUsername('');
    setContactNumber('');
    setEmail('');
    setEmailError('');
    setCheckingEmail(false);
    setPassword('');
    setEmailOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpLoading(false);
    setOtpCountdown(0);
    setOtpError('');
    setOtpSuccess('');
    setCreateLoading(false);
  };

  // Send OTP to Staff Gmail / Email
  const handleSendStaffEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setOtpError('Please enter a valid Gmail / Email address first.');
      return;
    }
    if (emailError) {
      setOtpError('Email is already used');
      return;
    }
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'staff_registration' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.message || 'Failed to send verification code.');
        if (data.message === 'Email is already used') {
          setEmailError('Email is already used');
        }
      } else {
        setOtpSent(true);
        setOtpCountdown(60);
        setOtpSuccess(data.message || `Verification OTP code sent to ${cleanEmail}!`);
      }
    } catch (err) {
      setOtpError('Failed to connect to email verification service.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP code for Add Staff
  const handleVerifyStaffEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = emailOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.message || 'Invalid verification code.');
      } else {
        setOtpVerified(true);
        setOtpSuccess('Gmail successfully verified!');
      }
    } catch (err) {
      setOtpError('Failed to verify OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Create Staff User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (emailError) {
      setOtpError('Email is already used');
      return;
    }

    if (email && !otpVerified) {
      setOtpError('Email verification required! Please verify the Gmail with the 6-digit OTP code before creating the staff member.');
      return;
    }

    setCreateLoading(true);

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          contactNumber: contactNumber.trim(),
          phone: contactNumber.trim(),
          email: email.trim(),
          password,
          role: 'Cashier'
        })
      });
      const data = await res.json();
      if (data.success) {
        resetAddForm();
        fetchUsers();
        setNotification({
          type: 'success',
          message: `Cashier staff member "${fullName}" created successfully!`
        });
      } else {
        setOtpError(data.message || 'Error creating user');
      }
    } catch (e) {
      setOtpError('Error connecting to server');
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName || '');
    setEditUsername(u.username || '');
    setEditContactNumber(u.phone || '');
    setEditEmail(u.email || '');
    setEditOriginalEmail(u.email || '');
    setEditEmailError('');
    setCheckingEditEmail(false);
    setEditNewPassword('');
    setEditError('');
    setEditSuccess('');

    // Reset OTP verification states for edit modal
    setEditEmailOtp('');
    setEditOtpSent(false);
    setEditOtpVerified(false);
    setEditOtpLoading(false);
    setEditOtpCountdown(0);
    setEditOtpError('');
    setEditOtpSuccess('');
  };

  // Check if email has been changed from original
  const isEmailModified = editingUser && editEmail.trim().toLowerCase() !== editOriginalEmail.trim().toLowerCase();

  // Send OTP for updating Admin or Staff Email
  const handleSendEditEmailOtp = async () => {
    if (!editingUser) return;
    const cleanEmail = editEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEditOtpError('Please enter a valid Gmail / Email address.');
      return;
    }
    if (editEmailError) {
      setEditOtpError('Email is already used');
      return;
    }
    setEditOtpError('');
    setEditOtpSuccess('');
    setEditOtpLoading(true);

    try {
      const purpose = editingUser.role === 'Administrator' ? 'admin_email_update' : 'staff_email_update';
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          purpose,
          userId: editingUser.id
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditOtpError(data.message || 'Failed to send verification code.');
        if (data.message === 'Email is already used') {
          setEditEmailError('Email is already used');
        }
      } else {
        setEditOtpSent(true);
        setEditOtpCountdown(60);
        setEditOtpSuccess(data.message || `Verification code sent to ${cleanEmail}!`);
      }
    } catch (err) {
      setEditOtpError('Failed to connect to email verification service.');
    } finally {
      setEditOtpLoading(false);
    }
  };

  // Verify OTP for updating Admin or Staff Email
  const handleVerifyEditEmailOtp = async () => {
    const cleanEmail = editEmail.trim().toLowerCase();
    const cleanOtp = editEmailOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setEditOtpError('Please enter the 6-digit verification code.');
      return;
    }
    setEditOtpError('');
    setEditOtpSuccess('');
    setEditOtpLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditOtpError(data.message || 'Invalid verification code.');
      } else {
        setEditOtpVerified(true);
        setEditOtpSuccess('New Gmail address verified successfully!');
      }
    } catch (err) {
      setEditOtpError('Failed to verify OTP code.');
    } finally {
      setEditOtpLoading(false);
    }
  };

  // Update Staff User Handler
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setEditSuccess('');

    if (editEmailError) {
      setEditError('Email is already used');
      return;
    }

    // If the Gmail was changed, enforce OTP verification
    const emailChanged = editEmail.trim().toLowerCase() !== editOriginalEmail.trim().toLowerCase();
    if (emailChanged && editEmail.trim() !== '' && !editOtpVerified) {
      setEditError(`Verification required! Please click "Verify Email" and enter the 6-digit OTP code before saving changes.`);
      return;
    }

    setEditLoading(true);

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          username: editUsername.trim(),
          contactNumber: editContactNumber.trim(),
          phone: editContactNumber.trim(),
          email: editEmail.trim(),
          role: editingUser.role === 'Administrator' ? 'Administrator' : 'Cashier',
          password: editNewPassword.trim() ? editNewPassword.trim() : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditSuccess('Staff member updated successfully!');
        const updatedFullName = data.user?.fullName || editFullName.trim();
        const updatedUsername = data.user?.username || editUsername.trim();
        setNotification({
          type: 'success',
          message: `Account for ${updatedFullName} (${updatedUsername}) updated successfully!`
        });

        // Trigger updates in parent App and anywhere across application
        if (data.user) {
          window.dispatchEvent(new CustomEvent('commonbrew:user-updated', { detail: data.user }));
          if (onUserUpdated) {
            onUserUpdated(data.user);
          }
        }

        setTimeout(() => {
          setEditingUser(null);
          fetchUsers();
        }, 700);
      } else {
        setEditError(data.message || 'Error updating staff member');
      }
    } catch (err) {
      setEditError('Failed to connect to server');
    } finally {
      setEditLoading(false);
    }
  };

  // Open Deactivate Confirmation Modal
  const openDeactivateModal = (u: User) => {
    if (u.role === 'Administrator') {
      setNotification({
        type: 'error',
        message: 'The primary Administrator account cannot be deactivated.'
      });
      return;
    }
    setUserToDeactivate(u);
  };

  // Confirm Deactivate - moves account to Archive
  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return;
    setDeactivatingLoading(true);

    try {
      const res = await fetch(`/api/users/${userToDeactivate.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to deactivate account.'
        });
      } else {
        setNotification({
          type: 'success',
          message: `Cashier account "${userToDeactivate.fullName || userToDeactivate.username}" has been deactivated and moved to the Archive Module.`
        });
        setUserToDeactivate(null);
        await fetchUsers();
      }
    } catch (e) {
      setNotification({
        type: 'error',
        message: 'Error communicating with server to deactivate account.'
      });
    } finally {
      setDeactivatingLoading(false);
    }
  };

  const activeUsers = users.filter(u => u.isActive);

  return (
    <div>
      {/* Top Notification Banner */}
      {notification && (
        <div style={{
          background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${notification.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: notification.type === 'success' ? '#15803d' : '#b91c1c',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings & Staff Accounts</h1>
          <p className="page-subtitle">Configure store parameters and manage cashier/admin login credentials</p>
        </div>

        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowAddUser(true)}>
            + Add Staff User
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        <div className="table-card">
          <div className="table-header-row">
            <h2 className="card-title" style={{ margin: 0 }}>Active Cashier & Admin Users</h2>
            <span className="record-count">{activeUsers.length} Users</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Contact & Gmail</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#9ca3af' }}>
                    No active staff accounts found.
                  </td>
                </tr>
              ) : (
                activeUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{u.username}</td>
                    <td>
                      <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {u.phone ? (
                          <span style={{ color: 'var(--text-1)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} color="#059669" /> {u.phone}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.75rem' }}>No contact</span>
                        )}
                        {u.email ? (
                          <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                            <Mail size={12} /> {u.email}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.75rem' }}>No Gmail</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`kpi-badge ${u.role === 'Administrator' ? 'green' : 'blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        <button
                          className="btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                          onClick={() => openEditModal(u)}
                          title="Edit staff details and update credentials"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        {u.role !== 'Administrator' && (
                          <button
                            className="btn-outline btn-sm"
                            style={{
                              color: '#ef4444',
                              borderColor: '#fca5a5',
                              background: 'rgba(239, 68, 68, 0.04)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontWeight: 600
                            }}
                            onClick={() => openDeactivateModal(u)}
                            title="Deactivate this cashier staff member"
                          >
                            <UserX size={13} /> Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="stock-card">
            <h2 className="card-title">Store Configuration</h2>
            <div className="form-group">
              <label className="form-label">Shop Branding Name</label>
              <input type="text" className="form-input" value="CommonBrew Taytay" readOnly />
            </div>

            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input type="text" className="form-input" value="Philippine Peso (₱)" readOnly />
            </div>

            <div className="form-group">
              <label className="form-label">Active POS Version</label>
              <input type="text" className="form-input" value="v2.5 Full-Stack POS Engine" readOnly />
            </div>

            <div className="form-group">
              <label className="form-label">Administrator Account Policy</label>
              <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', lineHeight: 1.4 }}>
                CommonBrew enforces a single Administrator policy. All additional staff users are granted Cashier permissions.
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Legal & Compliance Documents</span>
                <span style={{ fontSize: '0.7rem', color: '#16a34a', background: '#f0fdf4', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bbf7d0', fontWeight: 700 }}>
                  RA 10173 Active
                </span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setLegalModalTab('terms')}
                  className="btn-outline"
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer' }}
                >
                  <FileText size={14} style={{ color: '#ea580c' }} />
                  <span>Terms & Conditions</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModalTab('privacy')}
                  className="btn-outline"
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer' }}
                >
                  <ShieldCheck size={14} style={{ color: '#ea580c' }} />
                  <span>Privacy Policy</span>
                </button>
              </div>
            </div>
          </div>

          <div className="stock-card" style={{ marginTop: '1.25rem' }}>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-palette" style={{ color: 'var(--brand)' }}></i>
              <span>Global Interface Theme</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
              Switch the entire POS interface between light and dark mode.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setTheme('light')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: theme === 'light' ? '2px solid #FF5E00' : '1px solid var(--border)',
                  background: theme === 'light' ? '#fff7ed' : 'var(--surface)',
                  color: theme === 'light' ? '#ea580c' : 'var(--text)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: theme === 'light' ? '0 4px 12px rgba(255, 94, 0, 0.15)' : 'none'
                }}
              >
                <i className="fa-solid fa-sun" style={{ fontSize: '0.9rem' }}></i>
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: theme === 'dark' ? '2px solid #FF5E00' : '1px solid var(--border)',
                  background: theme === 'dark' ? '#1e293b' : 'var(--surface)',
                  color: theme === 'dark' ? '#f8fafc' : 'var(--text)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                <i className="fa-solid fa-moon" style={{ fontSize: '0.9rem' }}></i>
                <span>Dark Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="receipt-modal" style={{ maxWidth: '480px', width: '92%', borderRadius: '20px', padding: '1.75rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 800 }}>
              Add New Staff Member
            </h2>

            {otpError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{otpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  required
                />
              </div>

              {/* Username */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Username
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. juancashier"
                  required
                />
              </div>

              {/* Contact Number */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} color="#059669" /> Contact Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 09123456789"
                />
              </div>

              {/* Gmail / Email Address with OTP verification */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} color={emailError ? "#dc2626" : "#2563eb"} /> Gmail / Email Address
                  </label>
                  {otpVerified && !emailError && (
                    <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={13} /> Verified
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (otpVerified) {
                        setOtpVerified(false);
                        setOtpSent(false);
                      }
                    }}
                    placeholder="e.g. juan.cashier@gmail.com"
                    style={{
                      flex: 1,
                      borderColor: emailError ? '#dc2626' : (otpVerified ? '#10b981' : undefined),
                      background: emailError ? '#fef2f2' : (otpVerified ? '#f0fdf4' : undefined)
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendStaffEmailOtp}
                    disabled={otpLoading || otpCountdown > 0 || !email.includes('@') || !!emailError || checkingEmail}
                    style={{
                      background: otpVerified ? '#f3f4f6' : (emailError ? '#9ca3af' : '#2563eb'),
                      color: otpVerified ? '#6b7280' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: otpLoading || otpCountdown > 0 || !email.includes('@') || !!emailError || checkingEmail ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      opacity: otpLoading || !email.includes('@') || !!emailError ? 0.7 : 1
                    }}
                  >
                    {otpLoading ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : otpCountdown > 0 ? (
                      `Resend (${otpCountdown}s)`
                    ) : otpVerified ? (
                      'Change'
                    ) : (
                      'Verify Email'
                    )}
                  </button>
                </div>

                {/* Catch: Email is already used */}
                {emailError ? (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '0.8rem' }}></i>
                    <span>{emailError}</span>
                  </div>
                ) : checkingEmail ? (
                  <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={11} className="animate-spin" /> Checking database...
                  </div>
                ) : null}

                {/* OTP Input Field when code has been sent and not yet verified */}
                {otpSent && !otpVerified && (
                  <div style={{
                    marginTop: '0.6rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={14} color="#ea580c" />
                      <span>Enter the 6-digit verification code sent to <strong>{email}</strong>:</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        maxLength={6}
                        className="form-input"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit OTP"
                        style={{
                          letterSpacing: '3px',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          textAlign: 'center',
                          maxWidth: '150px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyStaffEmailOtp}
                        disabled={otpLoading || emailOtp.length !== 6}
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0 1rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: otpLoading || emailOtp.length !== 6 ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          opacity: emailOtp.length !== 6 ? 0.6 : 1
                        }}
                      >
                        {otpLoading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Initial Password */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Initial Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter initial password"
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    aria-label={showAddPassword ? 'Hide password' : 'Show password'}
                    title={showAddPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '6px'
                    }}
                  >
                    {showAddPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={resetAddForm}
                  style={{
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    background: '#ff5e00',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: createLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(255, 94, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    opacity: createLoading ? 0.7 : 1
                  }}
                >
                  {createLoading ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Member Modal */}
      {editingUser && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="receipt-modal" style={{ maxWidth: '480px', width: '92%', borderRadius: '20px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Edit size={18} color="#ff5e00" /> Edit Staff Member
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Updating user: <strong style={{ color: '#0f172a' }}>{editingUser.username}</strong>
                </span>
              </div>
            </div>

            {editError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <AlertCircle size={16} />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <CheckCircle2 size={16} />
                <span>{editSuccess}</span>
              </div>
            )}

            {editOtpError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <AlertCircle size={16} />
                <span>{editOtpError}</span>
              </div>
            )}

            {editOtpSuccess && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <CheckCircle2 size={16} />
                <span>{editOtpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser}>
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  required
                />
              </div>

              {/* Username */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Username
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. juancashier"
                  required
                />
              </div>

              {/* Contact Number */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} color="#059669" /> Contact Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  value={editContactNumber}
                  onChange={(e) => setEditContactNumber(e.target.value)}
                  placeholder="e.g. 09123456789"
                />
              </div>

              {/* Gmail / Email Address with verification OTP if changed */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} color={editEmailError ? "#dc2626" : "#2563eb"} /> Gmail / Email Address
                  </label>
                  {isEmailModified ? (
                    editOtpVerified && !editEmailError ? (
                      <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={13} /> Verified
                      </span>
                    ) : (
                      <span style={{ color: editEmailError ? '#dc2626' : '#d97706', fontSize: '0.75rem', fontWeight: 700 }}>
                        {editEmailError ? '● Already Used' : '● New Email (OTP Required)'}
                      </span>
                    )
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      Current Email
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      if (editOtpVerified) {
                        setEditOtpVerified(false);
                        setEditOtpSent(false);
                      }
                    }}
                    placeholder="e.g. admin@commonbrew.ph"
                    style={{
                      flex: 1,
                      borderColor: editEmailError ? '#dc2626' : (isEmailModified ? (editOtpVerified ? '#10b981' : '#f59e0b') : undefined),
                      background: editEmailError ? '#fef2f2' : (editOtpVerified ? '#f0fdf4' : undefined)
                    }}
                  />
                  {isEmailModified && (
                    <button
                      type="button"
                      onClick={handleSendEditEmailOtp}
                      disabled={editOtpLoading || editOtpCountdown > 0 || !editEmail.includes('@') || !!editEmailError || checkingEditEmail}
                      style={{
                        background: editOtpVerified ? '#f3f4f6' : (editEmailError ? '#9ca3af' : '#2563eb'),
                        color: editOtpVerified ? '#6b7280' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: editOtpLoading || editOtpCountdown > 0 || !editEmail.includes('@') || !!editEmailError || checkingEditEmail ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        opacity: editOtpLoading || !editEmail.includes('@') || !!editEmailError ? 0.7 : 1
                      }}
                    >
                      {editOtpLoading ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : editOtpCountdown > 0 ? (
                        `Resend (${editOtpCountdown}s)`
                      ) : editOtpVerified ? (
                        'Change'
                      ) : (
                        'Verify Email'
                      )}
                    </button>
                  )}
                </div>

                {/* Catch: Email is already used */}
                {editEmailError ? (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '0.8rem' }}></i>
                    <span>{editEmailError}</span>
                  </div>
                ) : checkingEditEmail ? (
                  <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={11} className="animate-spin" /> Checking database...
                  </div>
                ) : null}

                {/* Inline OTP input section when new email OTP has been dispatched */}
                {isEmailModified && editOtpSent && !editOtpVerified && (
                  <div style={{
                    marginTop: '0.6rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #fed7aa',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={14} color="#ea580c" />
                      <span>Enter the 6-digit code sent to <strong>{editEmail}</strong>:</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        maxLength={6}
                        className="form-input"
                        value={editEmailOtp}
                        onChange={(e) => setEditEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit OTP"
                        style={{
                          letterSpacing: '3px',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          textAlign: 'center',
                          maxWidth: '150px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEditEmailOtp}
                        disabled={editOtpLoading || editEmailOtp.length !== 6}
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0 1rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: editOtpLoading || editEmailOtp.length !== 6 ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          opacity: editEmailOtp.length !== 6 ? 0.6 : 1
                        }}
                      >
                        {editOtpLoading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Role (Read-only badge since CommonBrew has exactly 1 Administrator) */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Role
                </label>
                <div style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: 700, color: editingUser.role === 'Administrator' ? '#15803d' : '#2563eb' }}>
                    {editingUser.role}
                  </span>
                  <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                    {editingUser.role === 'Administrator' ? 'Primary Admin (Only 1 allowed)' : 'Staff Role'}
                  </span>
                </div>
              </div>

              {/* Change Password (Optional) */}
              <div className="form-group" style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Key size={14} color="#d97706" /> Change Password <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>(Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    className="form-input"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                    title={showEditPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '6px'
                    }}
                  >
                    {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setEditingUser(null)}
                  style={{
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    background: '#ff5e00',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: editLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(255, 94, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    opacity: editLoading ? 0.7 : 1
                  }}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Deactivate Confirmation Modal */}
      {userToDeactivate && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="receipt-modal" style={{ maxWidth: '440px', width: '92%', borderRadius: '20px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <UserX size={28} />
            </div>

            <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 800, color: '#0f172a' }}>
              Deactivate Staff Account?
            </h2>

            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to deactivate <strong style={{ color: '#0f172a' }}>{userToDeactivate.fullName}</strong> (@{userToDeactivate.username})?
              <br /><br />
              This cashier will immediately be prevented from logging in to the POS terminal. This account will be moved to the <strong>Archive Module</strong>, where you can view or restore it anytime.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setUserToDeactivate(null)}
                disabled={deactivatingLoading}
                style={{
                  borderRadius: '10px',
                  padding: '0.7rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={deactivatingLoading}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.7rem',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: deactivatingLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  opacity: deactivatingLoading ? 0.7 : 1
                }}
              >
                {deactivatingLoading ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Legal Documents Modal */}
      <LegalDocumentsModal
        isOpen={Boolean(legalModalTab)}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'terms'}
      />
    </div>
  );
};
