import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: params.get('role') || 'tenant'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role });
      navigate(res.user.role === 'landlord' ? '/dashboard/landlord' : '/dashboard/tenant');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div style={{ fontSize: '3rem', marginBottom: 24 }}>🇷🇼</div>
          <h1>Join<br />Rent<span>Ease</span><br />Rwanda</h1>
          <p style={{ marginTop: 20 }}>
            The smarter way to find housing and manage rent payments across Rwanda.
          </p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,.12)' }}>
              <div style={{ fontWeight: 700, color: 'white', marginBottom: 4, fontSize: '0.95rem' }}>🏠 For Landlords</div>
              <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '0.85rem', lineHeight: 1.6 }}>List properties, approve tenants, collect digital payments, manage maintenance.</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,.12)' }}>
              <div style={{ fontWeight: 700, color: 'white', marginBottom: 4, fontSize: '0.95rem' }}>🔑 For Tenants</div>
              <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '0.85rem', lineHeight: 1.6 }}>Browse properties, pay rent via MoMo, get receipts, submit maintenance requests.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-inner">
          <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>← Back to home</Link>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join thousands of Rwandans using RentEase</p>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {['tenant', 'landlord'].map(role => (
              <button key={role} type="button" onClick={() => setForm(p => ({ ...p, role }))}
                style={{
                  padding: '12px', borderRadius: 10, border: `2px solid ${form.role === role ? 'var(--green)' : 'var(--gray-300)'}`,
                  background: form.role === role ? 'var(--green-pale)' : 'white',
                  color: form.role === role ? 'var(--green)' : 'var(--gray-700)',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all .2s'
                }}>
                {role === 'tenant' ? '🔑 I\'m a Tenant' : '🏠 I\'m a Landlord'}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="name" value={form.name} onChange={change} placeholder="Uwamahoro Jeanne" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" name="phone" value={form.phone} onChange={change} placeholder="+250 78X XXX XXX" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" name="password" value={form.password} onChange={change} placeholder="Min. 6 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={change} placeholder="Repeat password" required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? '⏳ Creating Account…' : '→ Create My Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--green)', fontWeight: 600 }}>Sign in here</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-300)', marginTop: 12 }}>
            By registering you agree to Rwanda Data Protection Law No. 058/2021
          </p>
        </div>
      </div>
    </div>
  );
}
