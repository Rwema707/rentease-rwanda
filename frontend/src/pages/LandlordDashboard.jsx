import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

function Sidebar({ active, setActive, onLogout }) {
  const items = [
    { key: 'overview', icon: '📊', label: 'Overview' },
    { key: 'properties', icon: '🏠', label: 'My Properties' },
    { key: 'requests', icon: '📋', label: 'Rental Requests' },
    { key: 'payments', icon: '💰', label: 'Payments' },
    { key: 'maintenance', icon: '🔧', label: 'Maintenance' },
    { key: 'profile', icon: '👤', label: 'Profile' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">Landlord Portal</div>
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

const AMENITY_OPTIONS = ['WiFi', 'Parking', 'Water', 'Electricity', 'Security', 'Garden', 'Kitchen', 'Furnished', 'Generator', 'DSTV'];

export default function LandlordDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPropModal, setShowPropModal] = useState(false);
  const [editProp, setEditProp] = useState(null);
  const [maintUpdateId, setMaintUpdateId] = useState(null);
  const [actionStatus, setActionStatus] = useState({ loading: false, success: '', error: '' });
  const fileRef = useRef(null);

  const [propForm, setPropForm] = useState({
    title: '', description: '', location: '', district: 'Gasabo',
    price: '', rooms: '1', property_type: 'apartment', amenities: [], images: []
  });
  const [maintForm, setMaintForm] = useState({ status: 'in_progress', landlord_notes: '' });
  const [reminderTenantId, setReminderTenantId] = useState('');
  const [reminderMsg, setReminderMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [props, reqs, pays, maint] = await Promise.all([
        api.get('/properties/landlord/mine'),
        api.get('/rentals/landlord'),
        api.get('/payments/history'),
        api.get('/maintenance/landlord'),
      ]);
      setProperties(Array.isArray(props.data) ? props.data : []);
      setRequests(Array.isArray(reqs.data) ? reqs.data : []);
      setPayments(Array.isArray(pays.data) ? pays.data : []);
      setMaintenance(Array.isArray(maint.data) ? maint.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  function openNewProp() {
    setEditProp(null);
    setPropForm({ title: '', description: '', location: '', district: 'Gasabo', price: '', rooms: '1', property_type: 'apartment', amenities: [], images: [] });
    setActionStatus({ loading: false, success: '', error: '' });
    setShowPropModal(true);
  }

  function openEditProp(p) {
    setEditProp(p);
    setPropForm({ title: p.title, description: p.description, location: p.location, district: p.district, price: p.price, rooms: p.rooms, property_type: p.property_type, amenities: p.amenities || [], images: [] });
    setActionStatus({ loading: false, success: '', error: '' });
    setShowPropModal(true);
  }

  async function submitProperty(e) {
    e.preventDefault();
    setActionStatus({ loading: true, success: '', error: '' });
    try {
      const fd = new FormData();
      Object.keys(propForm).forEach(k => {
        if (k === 'images') { propForm.images.forEach(f => fd.append('images', f)); }
        else if (k === 'amenities') { fd.append('amenities', JSON.stringify(propForm.amenities)); }
        else { fd.append(k, propForm[k]); }
      });
      if (editProp) { await api.put(`/properties/${editProp.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      else { await api.post('/properties', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      setActionStatus({ loading: false, success: editProp ? 'Property updated!' : 'Property listed!', error: '' });
      loadAll();
      setTimeout(() => setShowPropModal(false), 1500);
    } catch (err) {
      setActionStatus({ loading: false, success: '', error: err.response?.data?.error || 'Failed to save property' });
    }
  }

  async function deleteProperty(id) {
    if (!window.confirm('Deactivate this listing?')) return;
    await api.delete(`/properties/${id}`);
    loadAll();
  }

  async function handleRequest(id, status) {
    try {
      await api.put(`/rentals/${id}`, { status });
      loadAll();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  }

  async function updateMaintenance(e) {
    e.preventDefault();
    setActionStatus({ loading: true, success: '', error: '' });
    try {
      await api.put(`/maintenance/${maintUpdateId}`, maintForm);
      setActionStatus({ loading: false, success: 'Status updated!', error: '' });
      loadAll();
      setTimeout(() => setMaintUpdateId(null), 1500);
    } catch (err) { setActionStatus({ loading: false, success: '', error: 'Update failed' }); }
  }

  async function sendReminder() {
    if (!reminderTenantId) return alert('Select a tenant first');
    try {
      await api.post('/notifications/send-reminder', { tenant_id: Number(reminderTenantId), message: reminderMsg });
      alert('Reminder sent!');
      setReminderTenantId(''); setReminderMsg('');
    } catch (err) { alert('Failed to send reminder'); }
  }

  function statusBadge(s) {
    const map = { pending: 'badge-gold', approved: 'badge-green', rejected: 'badge-red', completed: 'badge-green', failed: 'badge-red', in_progress: 'badge-gray', cancelled: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s?.replace('_', ' ')}</span>;
  }

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const pendingReqs = requests.filter(r => r.status === 'pending').length;

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
                    <div><h1 className="page-title">Welcome, {user.name.split(' ')[0]} 🏠</h1><p className="page-subtitle">Manage your properties and tenants</p></div>
                    <button className="btn btn-primary" onClick={openNewProp}>+ Add Property</button>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon stat-icon-green">🏠</div><div className="stat-value">{properties.length}</div><div className="stat-label">Properties</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-gold">💰</div><div className="stat-value">RWF {(totalRevenue/1000).toFixed(0)}K</div><div className="stat-label">Revenue Collected</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-terra">📋</div><div className="stat-value">{pendingReqs}</div><div className="stat-label">Pending Requests</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-blue">🔧</div><div className="stat-value">{maintenance.filter(m => m.status === 'pending').length}</div><div className="stat-label">Open Issues</div></div>
                  </div>

                  {/* Pending requests alert */}
                  {pendingReqs > 0 && (
                    <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                      📋 You have <strong>{pendingReqs}</strong> pending rental request(s). <button style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--green)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setTab('requests')}>Review now →</button>
                    </div>
                  )}

                  {/* Recent payments */}
                  {payments.length > 0 && (
                    <div className="card">
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Recent Payments</h3>
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead><tr><th>Tenant</th><th>Property</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
                          <tbody>
                            {payments.slice(0,5).map(p => (
                              <tr key={p.id}>
                                <td><strong>{p.tenant_name}</strong><br /><span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{p.tenant_phone}</span></td>
                                <td>{p.property_title}</td>
                                <td><strong style={{ color: 'var(--green)' }}>RWF {Number(p.amount).toLocaleString()}</strong></td>
                                <td style={{ fontSize: '0.82rem' }}>{p.payment_method?.replace('_',' ').toUpperCase()}</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
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

              {/* PROPERTIES - FR 2.1, 2.3, 2.4 */}
              {tab === 'properties' && (
                <div>
                  <div className="page-header">
                    <div><h1 className="page-title">🏠 My Properties</h1><p className="page-subtitle">{properties.length} listing(s)</p></div>
                    <button className="btn btn-primary" onClick={openNewProp}>+ Add Property</button>
                  </div>
                  {properties.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">🏗️</div><h3>No Properties Yet</h3><p>Add your first property to start renting</p><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNewProp}>+ Add Property</button></div>
                  ) : (
                    <div className="gap-stack">
                      {properties.map(p => (
                        <div key={p.id} className="card card-sm">
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ width: 80, height: 60, borderRadius: 8, overflow: 'hidden', background: 'var(--gray-100)', flexShrink: 0 }}>
                              {p.image_urls?.[0] ? <img src={p.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>🏠</div>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <h3 style={{ fontWeight: 700 }}>{p.title}</h3>
                                <span className={`badge ${p.is_available ? 'badge-green' : 'badge-gray'}`}>{p.is_available ? 'Available' : 'Occupied'}</span>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>📍 {p.location}, {p.district} · 🛏 {p.rooms} rooms · RWF {Number(p.price).toLocaleString()}/mo</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEditProp(p)}>✏️ Edit</button>
                              <Link to={`/properties/${p.id}`} className="btn btn-ghost btn-sm">👁 View</Link>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteProperty(p.id)}>🗑</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RENTAL REQUESTS - FR 4.2 */}
              {tab === 'requests' && (
                <div>
                  <div className="page-header"><div><h1 className="page-title">📋 Rental Requests</h1><p className="page-subtitle">Review and approve tenant applications</p></div></div>
                  {requests.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No Requests</h3><p>No rental requests yet.</p></div>
                  ) : (
                    <div className="gap-stack">
                      {requests.map(r => (
                        <div key={r.id} className="card card-sm">
                          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                  {r.tenant_name?.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700 }}>{r.tenant_name}</div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{r.tenant_email} · {r.tenant_phone}</div>
                                </div>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', margin: '6px 0' }}>
                                Property: <strong>{r.property_title}</strong> · {r.property_location}
                              </p>
                              {r.move_in_date && <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Move-in: {r.move_in_date}</p>}
                              {r.message && <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 6, background: 'var(--cream)', padding: '8px 12px', borderRadius: 8 }}>"{r.message}"</p>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {statusBadge(r.status)}
                              <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                              {r.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                  <button className="btn btn-primary btn-sm" onClick={() => handleRequest(r.id, 'approved')}>✓ Approve</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleRequest(r.id, 'rejected')}>✗ Reject</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENTS + REMINDERS */}
              {tab === 'payments' && (
                <div>
                  <div className="page-header"><div><h1 className="page-title">💰 Payments & Reminders</h1><p className="page-subtitle">Track income and send rent reminders</p></div></div>

                  {/* FR 6.1, 6.2 – Send Reminder */}
                  <div className="card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>📅 Send Rent Reminder</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                      <div className="form-group">
                        <label className="form-label">Select Tenant</label>
                        <select className="form-select" value={reminderTenantId} onChange={e => setReminderTenantId(e.target.value)}>
                          <option value="">— Select —</option>
                          {[...new Map(payments.map(p => [p.tenant_name, p])).values()].map(p => (
                            <option key={p.tenant_name} value={p.tenant_id}>{p.tenant_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Custom Message (optional)</label>
                        <input className="form-input" value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} placeholder="Rent is due on the 1st…" />
                      </div>
                      <button className="btn btn-gold" onClick={sendReminder}>📤 Send</button>
                    </div>
                  </div>

                  {payments.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">💰</div><h3>No Payments Yet</h3></div>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead><tr><th>Tenant</th><th>Property</th><th>Amount</th><th>Receipt</th><th>Month</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                          {payments.map(p => (
                            <tr key={p.id}>
                              <td><strong>{p.tenant_name}</strong></td>
                              <td>{p.property_title}</td>
                              <td><strong style={{ color: 'var(--green)' }}>RWF {Number(p.amount).toLocaleString()}</strong></td>
                              <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--gray-500)' }}>{p.receipt_number || '—'}</span></td>
                              <td style={{ fontSize: '0.85rem' }}>{p.month_covered}</td>
                              <td style={{ fontSize: '0.8rem' }}>{p.payment_method?.replace('_',' ').toUpperCase()}</td>
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

              {/* MAINTENANCE - FR 7.2, 7.3 */}
              {tab === 'maintenance' && (
                <div>
                  <div className="page-header"><div><h1 className="page-title">🔧 Maintenance Requests</h1><p className="page-subtitle">Manage repair requests from tenants</p></div></div>
                  {maintenance.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon">🔧</div><h3>No Requests</h3><p>All clear! No maintenance requests.</p></div>
                  ) : (
                    <div className="gap-stack">
                      {maintenance.map(m => (
                        <div key={m.id} className="card card-sm">
                          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                <h3 style={{ fontWeight: 700 }}>{m.title}</h3>
                                {statusBadge(m.status)}
                                <span className={`badge ${m.priority === 'urgent' ? 'badge-red' : m.priority === 'high' ? 'badge-gold' : 'badge-gray'}`}>{m.priority}</span>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: 6 }}>{m.description}</p>
                              <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>
                                Tenant: <strong>{m.tenant_name}</strong> · {m.tenant_phone} · Property: {m.property_title}
                              </p>
                              {m.landlord_notes && <p style={{ fontSize: '0.82rem', color: 'var(--green)', marginTop: 6 }}>Your note: {m.landlord_notes}</p>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                              <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{new Date(m.created_at).toLocaleDateString()}</div>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setMaintUpdateId(m.id); setMaintForm({ status: m.status, landlord_notes: m.landlord_notes || '' }); setActionStatus({ loading: false, success: '', error: '' }); }}>
                                ✏️ Update Status
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'profile' && <ProfileTab user={user} />}
            </>
          )}
        </main>
      </div>

      {/* Add/Edit Property Modal */}
      {showPropModal && (
        <Modal title={editProp ? '✏️ Edit Property' : '🏠 Add New Property'} onClose={() => setShowPropModal(false)} maxWidth={620}>
          {actionStatus.success && <div className="alert alert-success">✅ {actionStatus.success}</div>}
          {actionStatus.error && <div className="alert alert-error">⚠️ {actionStatus.error}</div>}
          {!actionStatus.success && (
            <form onSubmit={submitProperty} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group"><label className="form-label">Property Title *</label>
                <input className="form-input" value={propForm.title} onChange={e => setPropForm(p => ({ ...p, title: e.target.value }))} placeholder="Modern 2BR in Kacyiru" required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Location *</label>
                  <input className="form-input" value={propForm.location} onChange={e => setPropForm(p => ({ ...p, location: e.target.value }))} placeholder="Kacyiru, Gasabo" required /></div>
                <div className="form-group"><label className="form-label">District *</label>
                  <select className="form-select" value={propForm.district} onChange={e => setPropForm(p => ({ ...p, district: e.target.value }))}>
                    {['Gasabo','Kicukiro','Nyarugenge','Musanze','Huye','Rubavu','Rusizi','Nyagatare','Gicumbi'].map(d => <option key={d}>{d}</option>)}
                  </select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Monthly Rent (RWF) *</label>
                  <input className="form-input" type="number" value={propForm.price} onChange={e => setPropForm(p => ({ ...p, price: e.target.value }))} placeholder="150000" required /></div>
                <div className="form-group"><label className="form-label">Number of Rooms *</label>
                  <select className="form-select" value={propForm.rooms} onChange={e => setPropForm(p => ({ ...p, rooms: e.target.value }))}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select></div>
              </div>
              <div className="form-group"><label className="form-label">Property Type</label>
                <select className="form-select" value={propForm.property_type} onChange={e => setPropForm(p => ({ ...p, property_type: e.target.value }))}>
                  {['apartment','house','studio','villa','room'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Description</label>
                <textarea className="form-textarea" value={propForm.description} onChange={e => setPropForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your property…" rows={3} /></div>
              <div className="form-group">
                <label className="form-label">Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AMENITY_OPTIONS.map(a => (
                    <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', padding: '5px 12px', borderRadius: 999, background: propForm.amenities.includes(a) ? 'var(--green)' : 'var(--gray-100)', color: propForm.amenities.includes(a) ? 'white' : 'var(--gray-700)', fontSize: '0.82rem', transition: 'all .15s', userSelect: 'none' }}>
                      <input type="checkbox" style={{ display: 'none' }} checked={propForm.amenities.includes(a)} onChange={e => setPropForm(p => ({ ...p, amenities: e.target.checked ? [...p.amenities, a] : p.amenities.filter(x => x !== a) }))} />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
              {/* FR 2.2 – Image upload */}
              <div className="form-group">
                <label className="form-label">Photos (up to 6)</label>
                <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => setPropForm(p => ({ ...p, images: Array.from(e.target.files) }))} style={{ padding: '8px 0', fontSize: '0.85rem' }} />
                {propForm.images.length > 0 && <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{propForm.images.length} file(s) selected</div>}
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={actionStatus.loading}>
                {actionStatus.loading ? '⏳ Saving…' : editProp ? '✓ Update Property' : '+ List Property'}
              </button>
            </form>
          )}
        </Modal>
      )}

      {/* Maintenance Update Modal */}
      {maintUpdateId && (
        <Modal title="🔧 Update Maintenance Status" onClose={() => setMaintUpdateId(null)}>
          {actionStatus.success && <div className="alert alert-success">✅ {actionStatus.success}</div>}
          {!actionStatus.success && (
            <form onSubmit={updateMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={maintForm.status} onChange={e => setMaintForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="pending">⏳ Pending</option>
                  <option value="in_progress">🔨 In Progress</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select></div>
              <div className="form-group"><label className="form-label">Notes to Tenant</label>
                <textarea className="form-textarea" value={maintForm.landlord_notes} onChange={e => setMaintForm(p => ({ ...p, landlord_notes: e.target.value }))} placeholder="Update message for the tenant…" rows={3} /></div>
              <button type="submit" className="btn btn-primary btn-full" disabled={actionStatus.loading}>
                {actionStatus.loading ? '⏳ Saving…' : '✓ Update Status'}
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
  const [status, setStatus] = useState({ success: '', error: '' });
  async function save(e) {
    e.preventDefault(); setStatus({ success: '', error: '' });
    try { const r = await api.put('/auth/profile', form); updateUser(r.data.user); setStatus({ success: 'Profile saved!', error: '' }); }
    catch (err) { setStatus({ success: '', error: 'Update failed' }); }
  }
  return (
    <div style={{ maxWidth: 520 }}>
      <div className="page-header"><div><h1 className="page-title">👤 Profile</h1><p className="page-subtitle">Account settings</p></div></div>
      {status.success && <div className="alert alert-success">✅ {status.success}</div>}
      {status.error && <div className="alert alert-error">⚠️ {status.error}</div>}
      <div className="card">
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Email (read-only)</label><input className="form-input" value={user.email} disabled style={{ opacity: .6 }} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Bank Details (optional)</label><textarea className="form-textarea" value={form.bank_details} onChange={e => setForm(p => ({ ...p, bank_details: e.target.value }))} placeholder="Bank name, account number…" rows={3} /></div>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
}