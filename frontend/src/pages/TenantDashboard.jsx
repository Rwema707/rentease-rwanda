import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

function Sidebar({ active, setActive, onLogout }) {
  const items = [
    { key: 'overview', icon: '📊', label: 'Overview' },
    { key: 'payments', icon: '💳', label: 'Pay Rent' },
    { key: 'history', icon: '📄', label: 'Payment History' },
    { key: 'requests', icon: '🏠', label: 'My Requests' },
    { key: 'maintenance', icon: '🔧', label: 'Maintenance' },
    { key: 'profile', icon: '👤', label: 'Profile' },
  ];
  return (
    <aside className="sidebar">
      <div style={{ marginBottom: 8 }}>
        <div className="sidebar-section-label">Tenant Portal</div>
      </div>
      <ul className="sidebar-nav">
        {items.map(it => (
          <li key={it.key} className="sidebar-nav-item">
            <button onClick={() => setActive(it.key)} className={active === it.key ? 'active' : ''}>
              <span className="icon">{it.icon}</span> {it.label}
            </button>
          </li>
        ))}
        <li className="sidebar-nav-item" style={{ marginTop: 16 }}>
          <button onClick={onLogout} style={{ color: 'var(--danger)' }}>
            <span className="icon">🚪</span> Sign Out
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default function TenantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [tenancy, setTenancy] = useState(null);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [maintModal, setMaintModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'mtn_momo', phone_number: '', month_covered: new Date().toISOString().substring(0,7) });
  const [maintForm, setMaintForm] = useState({ title: '', description: '', priority: 'medium' });
  const [actionStatus, setActionStatus] = useState({ loading: false, success: '', error: '' });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const safe = async (fn, fallback) => { try { const r = await fn(); return r?.data ?? fallback; } catch(e) { console.warn('API err:', e?.message); return fallback; } };
    const [ten, pay, req, maint] = await Promise.all([
      safe(() => api.get('/payments/tenancy'), null),
      safe(() => api.get('/payments/history'), []),
      safe(() => api.get('/rentals/tenant'), []),
      safe(() => api.get('/maintenance/tenant'), []),
    ]);
    setTenancy(ten || null);
    setPayments(Array.isArray(pay) ? pay : []);
    setRequests(Array.isArray(req) ? req : []);
    setMaintenance(Array.isArray(maint) ? maint : []);
    if (ten?.monthly_rent) setPayForm(p => ({ ...p, amount: ten.monthly_rent }));
    setLoading(false);
  }

  async function submitPayment(e) {
    e.preventDefault();
    setActionStatus({ loading: true, success: '', error: '' });
    try {
      const res = await api.post('/payments', { ...payForm, tenancy_id: tenancy.id });
      if (res.data.success) {
        setActionStatus({ loading: false, success: `✅ Payment successful! Receipt: ${res.data.receipt_number}`, error: '' });
        loadAll();
        setTimeout(() => setPayModal(false), 2000);
      } else {
        setActionStatus({ loading: false, success: '', error: '❌ Payment failed. Please try again.' });
      }
    } catch (err) {
      setActionStatus({ loading: false, success: '', error: err.response?.data?.error || 'Payment failed' });
    }
  }

  async function submitMaintenance(e) {
    e.preventDefault();
    if (!tenancy) return;
    setActionStatus({ loading: true, success: '', error: '' });
    try {
      await api.post('/maintenance', { ...maintForm, property_id: tenancy.property_id });
      setActionStatus({ loading: false, success: '✅ Maintenance request submitted!', error: '' });
      loadAll();
      setTimeout(() => setMaintModal(false), 2000);
    } catch (err) {
      setActionStatus({ loading: false, success: '', error: err.response?.data?.error || 'Submission failed' });
    }
  }

  function statusBadge(s) {
    const map = { pending: 'badge-gold', approved: 'badge-green', rejected: 'badge-red', completed: 'badge-green', failed: 'badge-red', in_progress: 'badge-gray', cancelled: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s?.replace('_', ' ')}</span>;
  }

  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="page-wrapper">
      <div className="dashboard-layout">
        <Sidebar active={tab} setActive={setTab} onLogout={() => { logout(); navigate('/'); }} />
        <main className="dashboard-main">
          {loading ? <div className="loading-page"><div className="loading-spinner" /></div> : (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div>
                  <div className="page-header">
                    <div>
                      <h1 className="page-title">Welcome, {user?.name?.split(' ')?.[0] || 'there'} 👋</h1>
                      <p className="page-subtitle">Manage your tenancy and payments</p>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon stat-icon-green">🏠</div>
                      <div className="stat-value">{tenancy ? '1' : '0'}</div>
                      <div className="stat-label">Active Tenancy</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon stat-icon-gold">💰</div>
                      <div className="stat-value">RWF {(totalPaid/1000).toFixed(0)}K</div>
                      <div className="stat-label">Total Paid</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon stat-icon-terra">📄</div>
                      <div className="stat-value">{completedPayments.length}</div>
                      <div className="stat-label">Payments Made</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon stat-icon-blue">🔧</div>
                      <div className="stat-value">{maintenance.filter(m => m.status === 'pending').length}</div>
                      <div className="stat-label">Open Requests</div>
                    </div>
                  </div>

                  {/* Current tenancy card */}
                  {tenancy ? (
                    <div className="card" style={{ marginBottom: 24 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>🏠 Current Home</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div><div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Property</div><div style={{ fontWeight: 600 }}>{tenancy.property_title}</div></div>
                        <div><div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Location</div><div style={{ fontWeight: 600 }}>{tenancy.location}</div></div>
                        <div><div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Monthly Rent</div><div style={{ fontWeight: 600, color: 'var(--green)' }}>RWF {Number(tenancy.monthly_rent).toLocaleString()}</div></div>
                        <div><div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Landlord</div><div style={{ fontWeight: 600 }}>{tenancy.landlord_name}</div></div>
                      </div>
                      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                        <button className="btn btn-primary" onClick={() => { setPayModal(true); setActionStatus({ loading: false, success: '', error: '' }); }}>💳 Pay Rent</button>
                        <button className="btn btn-ghost" onClick={() => { setMaintModal(true); setActionStatus({ loading: false, success: '', error: '' }); }}>🔧 Report Issue</button>
                      </div>
                    </div>
                  ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '48px 24px', marginBottom: 24 }}>
                      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔑</div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>No Active Tenancy</h3>
                      <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>Browse properties and send a rental request to get started.</p>
                      <Link to="/properties" className="btn btn-primary">Browse Properties</Link>
                    </div>
                  )}

                  {/* Recent payments */}
                  {payments.length > 0 && (
                    <div className="card">
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Recent Payments</h3>
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead><tr><th>Property</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
                          <tbody>
                            {payments.slice(0,5).map(p => (
                              <tr key={p.id}>
                                <td>{p.property_title}</td>
                                <td><strong>RWF {Number(p.amount).toLocaleString()}</strong></td>
                                <td><span style={{ fontSize: '0.82rem' }}>{p.payment_method?.replace('_', ' ').toUpperCase()}</span></td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                                <td>{statusBadge(p.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PAY RENT */}
              {tab === 'payments' && (
                <div>
                  <div className="page-header"><div><h1 className="page-title">💳 Pay Rent</h1><p className="page-subtitle">Make secure rent payments via mobile money</p></div></div>
                  {!tenancy ? (
                    <div className="empty-state"><div className="empty-state-icon">🏠</div><h3>No Active Tenancy</h3><p>You need an active tenancy to make payments.</p><Link to="/properties" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Properties</Link></div>
                  ) : (
                    <div style={{ maxWidth: 520 }}>
                      <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Current Tenancy</h3>
                        <p>{tenancy.property_title} — <strong>RWF {Number(tenancy.monthly_rent).toLocaleString()}/month</strong></p>
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Landlord: {tenancy.landlord_name} · {tenancy.landlord_phone}</p>
                      </div>
                      {actionStatus.success && <div className="alert alert-success">{actionStatus.success}</div>}
                      {actionStatus.error && <div className="alert alert-error">{actionStatus.error}</div>}
                      <div className="card">
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Make a Payment</h3>
                        <form onSubmit={submitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div className="form-group">
                            <label className="form-label">Amount (RWF)</label>
                            <input className="form-input" type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Payment Method</label>
                            <select className="form-select" value={payForm.payment_method} onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))}>
                              <option value="mtn_momo">📱 MTN Mobile Money</option>
                              <option value="airtel_money">📱 Airtel Money</option>
                              <option value="bank_transfer">🏦 Bank Transfer</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Month Covered</label>
                            <input className="form-input" type="month" value={payForm.month_covered} onChange={e => setPayForm(p => ({ ...p, month_covered: e.target.value }))} />
                          </div>
                          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={actionStatus.loading}>
                            {actionStatus.loading ? '⏳ Processing Payment…' : '💳 Pay Now'}
                          </button>
                          <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', textAlign: 'center' }}>Payments are processed securely. A digital receipt will be generated automatically.</p>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENT HISTORY - FR 5.3 */}
              {tab === 'history' && (
                <div>
                  <div className="page-header"><div><h1 className="page-title">📄 Payment History</h1><p className="page-subtitle">All your rent payment records</p></div></div>
                  {payments.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">📄</div><h3>No Payments Yet</h3><p>Your payment history will appear here.</p></div>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead><tr><th>Receipt #</th><th>Property</th><th>Amount</th><th>Method</th><th>Month</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                          {payments.map(p => (
                            <tr key={p.id}>
                              <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--gray-500)' }}>{p.receipt_number || '—'}</span></td>
                              <td>{p.property_title}</td>
                              <td><strong style={{ color: 'var(--green)' }}>RWF {Number(p.amount).toLocaleString()}</strong></td>
                              <td style={{ fontSize: '0.82rem' }}>{p.payment_method?.replace('_',' ').toUpperCase()}</td>
                              <td style={{ fontSize: '0.85rem' }}>{p.month_covered}</td>
                              <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                              <td>{statusBadge(p.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* REQUESTS */}
              {tab === 'requests' && (
                <div>
                  <div className="page-header">
                    <div><h1 className="page-title">🏠 My Rental Requests</h1><p className="page-subtitle">Track your property applications</p></div>
                    <Link to="/properties" className="btn btn-primary">+ Browse Properties</Link>
                  </div>
                  {requests.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">🏠</div><h3>No Requests Yet</h3><p>Browse properties and send rental requests.</p><Link to="/properties" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Properties</Link></div>
                  ) : (
                    <div className="gap-stack">
                      {requests.map(r => (
                        <div key={r.id} className="card card-sm">
                          <div className="flex-between">
                            <div>
                              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{r.property_title}</h3>
                              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>📍 {r.location} · RWF {Number(r.price).toLocaleString()}/mo · Landlord: {r.landlord_name}</p>
                              {r.move_in_date && <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginTop: 4 }}>Move-in: {r.move_in_date}</p>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {statusBadge(r.status)}
                              <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: 6 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MAINTENANCE - FR 7.1 */}
              {tab === 'maintenance' && (
                <div>
                  <div className="page-header">
                    <div><h1 className="page-title">🔧 Maintenance</h1><p className="page-subtitle">Report and track repair requests</p></div>
                    {tenancy && <button className="btn btn-primary" onClick={() => { setMaintModal(true); setActionStatus({ loading: false, success: '', error: '' }); }}>+ Report Issue</button>}
                  </div>
                  {maintenance.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">🔧</div><h3>No Requests</h3><p>No maintenance requests submitted yet.</p></div>
                  ) : (
                    <div className="gap-stack">
                      {maintenance.map(m => (
                        <div key={m.id} className="card card-sm">
                          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                            <div>
                              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{m.title}</h3>
                              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 8 }}>{m.description}</p>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {statusBadge(m.status)}
                                <span className={`badge ${m.priority === 'urgent' ? 'badge-red' : m.priority === 'high' ? 'badge-gold' : 'badge-gray'}`}>
                                  {m.priority} priority
                                </span>
                              </div>
                              {m.landlord_notes && <p style={{ fontSize: '0.82rem', marginTop: 8, color: 'var(--green)', background: 'var(--green-pale)', padding: '6px 10px', borderRadius: 6 }}>Landlord note: {m.landlord_notes}</p>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', whiteSpace: 'nowrap', marginLeft: 16 }}>{new Date(m.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PROFILE */}
              {tab === 'profile' && <ProfileTab user={user} />}
            </>
          )}
        </main>
      </div>

      {/* Pay Rent Modal */}
      {payModal && tenancy && (
        <Modal title="💳 Pay Rent" onClose={() => setPayModal(false)}>
          {actionStatus.success && <div className="alert alert-success">{actionStatus.success}</div>}
          {actionStatus.error && <div className="alert alert-error">{actionStatus.error}</div>}
          {!actionStatus.success && (
            <form onSubmit={submitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Amount (RWF)</label>
                <input className="form-input" type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={payForm.payment_method} onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))}>
                  <option value="mtn_momo">📱 MTN Mobile Money</option>
                  <option value="airtel_money">📱 Airtel Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Month</label>
                <input className="form-input" type="month" value={payForm.month_covered} onChange={e => setPayForm(p => ({ ...p, month_covered: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={actionStatus.loading}>
                {actionStatus.loading ? '⏳ Processing…' : '💳 Confirm Payment'}
              </button>
            </form>
          )}
        </Modal>
      )}

      {/* Maintenance Modal */}
      {maintModal && tenancy && (
        <Modal title="🔧 Report Issue" onClose={() => setMaintModal(false)}>
          {actionStatus.success && <div className="alert alert-success">{actionStatus.success}</div>}
          {actionStatus.error && <div className="alert alert-error">{actionStatus.error}</div>}
          {!actionStatus.success && (
            <form onSubmit={submitMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Issue Title</label>
                <input className="form-input" value={maintForm.title} onChange={e => setMaintForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Leaking roof in bedroom" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={maintForm.description} onChange={e => setMaintForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the problem in detail…" required />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={maintForm.priority} onChange={e => setMaintForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={actionStatus.loading}>
                {actionStatus.loading ? '⏳ Submitting…' : '→ Submit Request'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

function ProfileTab({ user }) {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone, bank_details: user.bank_details || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [status, setStatus] = useState({ success: '', error: '' });

  async function saveProfile(e) {
    e.preventDefault(); setStatus({ success: '', error: '' });
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.user);
      setStatus({ success: 'Profile updated!', error: '' });
    } catch (err) { setStatus({ success: '', error: err.response?.data?.error || 'Update failed' }); }
  }
  async function changePassword(e) {
    e.preventDefault(); setStatus({ success: '', error: '' });
    if (pwForm.newPassword !== pwForm.confirm) return setStatus({ success: '', error: 'Passwords do not match' });
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setStatus({ success: 'Password updated!', error: '' });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { setStatus({ success: '', error: err.response?.data?.error || 'Change failed' }); }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header"><div><h1 className="page-title">👤 Profile</h1><p className="page-subtitle">Manage your account settings</p></div></div>
      {status.success && <div className="alert alert-success">✅ {status.success}</div>}
      {status.error && <div className="alert alert-error">⚠️ {status.error}</div>}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Personal Information</h3>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user?.email || ''} disabled style={{ opacity: .6 }} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required /></div>
          <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required /></div>
          <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required /></div>
          <button type="submit" className="btn btn-ghost">Update Password</button>
        </form>
      </div>
    </div>
  );
}