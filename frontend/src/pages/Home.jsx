import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🏠', title: 'List & Discover Properties', desc: 'Landlords post listings with photos, pricing and location. Tenants filter by district, rooms and budget.' },
  { icon: '💰', title: 'Mobile Money Payments', desc: 'Pay rent instantly via MTN MoMo or Airtel Money. Every transaction gets a digital receipt.' },
  { icon: '📄', title: 'Digital Receipts', desc: 'Automatic receipt generation after every payment. Full payment history accessible anytime.' },
  { icon: '🔔', title: 'Smart Reminders', desc: 'Automated rent reminders sent 3 days before due date via in-app notifications.' },
  { icon: '🔧', title: 'Maintenance Tracking', desc: 'Tenants submit repair requests with photos. Landlords update status from Pending → Completed.' },
  { icon: '🔒', title: 'Secure & Compliant', desc: 'Built under Rwanda Data Protection Law No. 058/2021 with role-based access and HTTPS.' },
];

const DISTRICTS = ['Kigali', 'Gasabo', 'Kicukiro', 'Nyarugenge', 'Musanze', 'Huye', 'Rubavu', 'Rusizi'];

export default function Home() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/properties?location=${encodeURIComponent(search)}`);
  }

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="hero-pattern" />
        <div className="container hero-content">
          <div className="hero-eyebrow">
            <span>🇷🇼</span> Rwanda's #1 Rental Platform
          </div>
          <h1 className="hero-title">
            Find Your Perfect<br />
            Home <span className="accent">Across Rwanda</span>
          </h1>
          <p className="hero-subtitle">
            Connecting landlords and tenants with seamless digital rent payments,
            automated reminders, and transparent property management.
          </p>

          {/* Search bar */}
          <form className="search-bar" onSubmit={handleSearch}>
            <span style={{ padding: '0 8px', fontSize: '1.2rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by district or location (e.g. Gasabo, Kigali…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {/* Quick district links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            {DISTRICTS.map(d => (
              <button key={d} onClick={() => navigate(`/properties?location=${d}`)}
                style={{ padding: '5px 14px', borderRadius: 999, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.75)', fontSize: '0.82rem', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,.18)'; e.target.style.color = 'white'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,.1)'; e.target.style.color = 'rgba(255,255,255,.75)'; }}>
                {d}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {[
              { value: '500', suffix: '+', label: 'Properties Listed' },
              { value: '1,200', suffix: '+', label: 'Happy Tenants' },
              { value: 'RWF 2B', suffix: '', label: 'Rent Processed' },
              { value: '30', suffix: '+', label: 'Districts Covered' },
            ].map(s => (
              <div key={s.label}>
                <div className="hero-stat-value">{s.value}<span>{s.suffix}</span></div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header text-center" style={{ textAlign: 'center' }}>
            <div className="section-eyebrow">How It Works</div>
            <h2 className="section-title">Built for Rwanda's Rental Market</h2>
            <p className="section-subtitle" style={{ margin: '12px auto 0' }}>
              Everything you need to rent or manage property — in one platform
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card" style={{ borderTop: '3px solid var(--green)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8, fontSize: '1.05rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SPLIT */}
      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Landlord CTA */}
            <div style={{ background: 'var(--green)', borderRadius: 'var(--radius-xl)', padding: '48px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '8rem', opacity: .1 }}>🏗️</div>
              <div style={{ position: 'relative' }}>
                <span className="badge badge-gold" style={{ marginBottom: 20, display: 'inline-flex' }}>For Landlords</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 14 }}>List & Manage Properties with Ease</h2>
                <p style={{ color: 'rgba(255,255,255,.75)', marginBottom: 28, lineHeight: 1.7 }}>
                  Post listings, screen tenants, collect rent digitally, and track maintenance — all from your dashboard.
                </p>
                <Link to="/register?role=landlord" className="btn btn-gold btn-lg">Start Listing Free</Link>
              </div>
            </div>
            {/* Tenant CTA */}
            <div style={{ background: 'var(--dark)', borderRadius: 'var(--radius-xl)', padding: '48px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '8rem', opacity: .1 }}>🔑</div>
              <div style={{ position: 'relative' }}>
                <span className="badge badge-green" style={{ marginBottom: 20, display: 'inline-flex' }}>For Tenants</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 14 }}>Find Your Perfect Home in Rwanda</h2>
                <p style={{ color: 'rgba(255,255,255,.65)', marginBottom: 28, lineHeight: 1.7 }}>
                  Browse verified properties, pay rent with mobile money, and manage everything from your phone.
                </p>
                <Link to="/properties" className="btn btn-primary btn-lg">Browse Properties</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
            <div>
              <div className="footer-brand">Rent<span>Ease</span> Rwanda</div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>A digital property management and rental platform built for Rwanda.</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'white', marginBottom: 12, fontSize: '0.9rem' }}>Platform</div>
              {['Browse Properties', 'List Property', 'Pay Rent', 'Maintenance'].map(l => (
                <div key={l} style={{ fontSize: '0.85rem', marginBottom: 6 }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'white', marginBottom: 12, fontSize: '0.9rem' }}>Payment Methods</div>
              {['MTN Mobile Money', 'Airtel Money', 'Bank Transfer'].map(l => (
                <div key={l} style={{ fontSize: '0.85rem', marginBottom: 6 }}>{l}</div>
              ))}
            </div>
          </div>
          <div className="footer-copy">
            © 2026 RentEase Rwanda · African Leadership University · Built by Gashumba Rwema Christian
          </div>
        </div>
      </footer>
    </div>
  );
}
