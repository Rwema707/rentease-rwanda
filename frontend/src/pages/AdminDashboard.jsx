import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, u, p] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/payments'),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setPayments(p.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const navItems = [
    { key: 'stats', icon: '📊', label: 'Overview' },
    { key: 'users', icon: '👥', label: 'Users' },
    { key: 'payments', icon: '💰', label: 'All Payments' },
  ];

  function statusBadge(s) {
    const map = { completed: 'badge-green', failed: 'badge-red', pending: 'badge-gold' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  }

  return (
    <div className="page-wrapper">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-section-label">Admin Panel</div>
          <ul className="sidebar-nav">
            {navItems.map(it => (
              <li key={it.key} className="sidebar-nav-item">
                <button onClick={() => setTab(it.key)} className={tab === it.key ? 'active' : ''}>
                  <span className="icon">{it.icon}</span> {it.label}
                </button>
              </li>
            ))}
            <li className="sidebar-nav-item" style={{ marginTop: 16 }}>
              <button onClick={() => { logout(); navigate('/'); }} style={{ color: 'var(--danger)' }}>
                <span className="icon">🚪</span> Sign Out
              </button>
            </li>
          </ul>
        </aside>

        <main className="dashboard-main">
          {loading ? <div className="loading-page"><div className="loading-spinner" /></div> : (
            <>
              {tab === 'stats' && stats && (
                <div>
                  <div className="page-header"><div><h1 className="page-title">⚙️ Admin Dashboard</h1><p className="page-subtitle">Platform overview — RentEase Rwanda</p></div></div>
                  <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon stat-icon-blue">👥</div><div className="stat-value">{stats.users.total}</div><div className="stat-label">Total Users</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-green">🏠</div><div className="stat-value">{stats.properties.total}</div><div className="stat-label">Properties</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-gold">💰</div><div className="stat-value">RWF {(stats.payments.total_revenue/1000000).toFixed(1)}M</div><div className="stat-label">Revenue Processed</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-terra">🔧</div><div className="stat-value">{stats.maintenance.total}</div><div className="stat-label">Maintenance Requests</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-blue">👨‍💼</div><div className="stat-value">{stats.users.landlords}</div><div className="stat-label">Landlords</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-green">🔑</div><div className="stat-value">{stats.users.tenants}</div><div className="stat-label">Tenants</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-terra">🏠</div><div className="stat-value">{stats.properties.available}</div><div className="stat-label">Available Properties</div></div>
                    <div className="stat-card"><div className="stat-icon stat-icon-gold">📄</div><div className="stat-value">{stats.payments.count}</div><div className="stat-label">Transactions</div></div>
                  </div>
                </div>
              )}

              {tab === 'users' && (
                <div>
                  <div className="page-header"><div><h1 className="page-title">👥 All Users</h1><p className="page-subtitle">{users.length} registered accounts</p></div></div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Verified</th><th>Joined</th></tr></thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>{u.id}</td>
                            <td><strong>{u.name}</strong></td>
                            <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                            <td style={{ fontSize: '0.85rem' }}>{u.phone}</td>
                            <td><span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'landlord' ? 'badge-gold' : 'badge-green'}`}>{u.role}</span></td>
                            <td>{u.is_verified ? '✅' : '❌'}</td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'payments' && (
                <div>
                  <div className="page-header"><div><h1 className="page-title">💰 All Payments</h1><p className="page-subtitle">{payments.length} transactions</p></div></div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Receipt</th><th>Tenant</th><th>Landlord</th><th>Property</th><th>Amount</th><th>Method</th><th>Month</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id}>
                            <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.receipt_number || '—'}</span></td>
                            <td><strong>{p.tenant_name}</strong></td>
                            <td>{p.landlord_name}</td>
                            <td style={{ fontSize: '0.85rem' }}>{p.property_title}</td>
                            <td><strong style={{ color: 'var(--green)' }}>RWF {Number(p.amount).toLocaleString()}</strong></td>
                            <td style={{ fontSize: '0.8rem' }}>{p.payment_method?.replace('_',' ')}</td>
                            <td style={{ fontSize: '0.85rem' }}>{p.month_covered}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                            <td>{statusBadge(p.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
