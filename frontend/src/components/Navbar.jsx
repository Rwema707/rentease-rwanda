import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    if (user) fetchNotifications();
    const interval = setInterval(() => { if (user) fetchNotifications(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications');
      const data = res?.data;
      // Reject Railway/Vercel error objects {code, message}
      if (!data || typeof data !== 'object' || data.code || !('notifications' in data)) return;
      const notifList = Array.isArray(data.notifications) ? data.notifications : [];
      // Ensure every notification has string title/message (not objects)
      const safeNotifs = notifList.map(n => ({
        ...n,
        title: typeof n.title === 'string' ? n.title : 'Notification',
        message: typeof n.message === 'string' ? n.message : '',
      }));
      setNotifs(safeNotifs);
      setUnread(typeof data.unread_count === 'number' ? data.unread_count : 0);
    } catch {}
  }

  async function markAllRead() {
    await api.put('/notifications/read');
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  }

  const dashPath = user?.role === 'landlord' ? '/dashboard/landlord' :
                   user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/tenant';

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">🏠</div>
          Rent<span>Ease</span>
        </Link>

        <ul className="navbar-nav">
          <li><Link to="/properties" className={location.pathname === '/properties' ? 'active' : ''}>Browse Properties</Link></li>
          {user && <li><Link to={dashPath} className={location.pathname.startsWith('/dashboard') ? 'active' : ''}>Dashboard</Link></li>}
          {!user && <li><Link to="/about">How It Works</Link></li>}
        </ul>

        <div className="navbar-actions">
          {user ? (
            <>
              {/* Notification Bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button className="notif-btn" onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}>
                  🔔
                  {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
                </button>

                {showNotifs && (
                  <div className="notif-panel">
                    <div className="notif-header">
                      <h3>Notifications</h3>
                      {unread > 0 && (
                        <button onClick={markAllRead} style={{ fontSize: '0.78rem', color: 'var(--green)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifs.length === 0 ? (
                        <div className="notif-empty">🔔 No notifications yet</div>
                      ) : notifs.map(n => (
                        <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                          onClick={() => { api.put('/notifications/read', { ids: [n.id] }); setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x)); setUnread(prev => Math.max(0, prev - 1)); }}>
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-msg">{n.message}</div>
                          <div className="notif-time">{timeAgo(n.created_at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div ref={userRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                    background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8,
                    color: 'white', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600
                  }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green)', display: 'grid', placeItems: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                  {user.name?.split(' ')[0]}
                  <span style={{ fontSize: '0.7rem', opacity: .7 }}>▼</span>
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, background: 'white',
                    borderRadius: 12, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gray-100)',
                    minWidth: 200, overflow: 'hidden', zIndex: 100
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{user.role} · {user.email}</div>
                    </div>
                    {[
                      { label: '📊 Dashboard', to: dashPath },
                      { label: '👤 Profile', to: '/profile' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setShowUserMenu(false)}
                        style={{ display: 'block', padding: '11px 16px', fontSize: '0.88rem', color: 'var(--gray-700)', transition: 'background .15s' }}
                        onMouseEnter={e => e.target.style.background = 'var(--cream)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <button onClick={handleLogout}
                        style={{ display: 'block', width: '100%', padding: '11px 16px', fontSize: '0.88rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .15s' }}
                        onMouseEnter={e => e.target.style.background = 'var(--danger-pale)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}>
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,.8)', borderColor: 'rgba(255,255,255,.2)' }}>Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}