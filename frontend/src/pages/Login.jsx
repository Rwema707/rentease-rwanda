import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(form.email, form.password);
      const role = res.user.role;
      navigate(role === 'landlord' ? '/dashboard/landlord' : role === 'admin' ? '/dashboard/admin' : '/dashboard/tenant');
    } catch (err) {
      const errVal = err.response?.data?.error || err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(typeof errVal === 'string' ? errVal : 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div style={{ fontSize: '3rem', marginBottom: 24 }}>🏠</div>
          <h1>Welcome<br />Back to<br /><span>RentEase</span></h1>
          <p style={{ marginTop: 20 }}>
            Rwanda's trusted platform for digital property management and rent collection.
          </p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '💳', text: 'Pay rent via MTN MoMo & Airtel Money' },
              { icon: '📊', text: 'Track payments and get receipts' },
              { icon: '🔔', text: 'Never miss a rent reminder' },
            ].map(f => (
              <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,.8)', fontSize: '0.95rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-inner">
          <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 40 }}>← Back to home</Link>
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">Enter your credentials to access your account</p>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          {/* Demo credentials */}
          <div style={{ background: 'var(--gold-pale)', border: '1px solid rgba(232,160,32,.3)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 24, fontSize: '0.82rem', color: '#7a5600' }}>
            <strong>Demo Accounts:</strong><br />
            Admin: admin@rentease.rw / admin123<br />
            (Or register a new account below)
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" value={form.password} onChange={change} placeholder="Your password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? '⏳ Signing In…' : '→ Sign In'}
            </button>
          </form>

          <div className="auth-divider" style={{ margin: '24px 0' }}>or</div>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--gray-500)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--green)', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}