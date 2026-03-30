import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ message: '', move_in_date: '' });
  const [requestStatus, setRequestStatus] = useState({ loading: false, success: '', error: '' });

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => setProperty(r.data))
      .catch(() => navigate('/properties'))
      .finally(() => setLoading(false));
  }, [id]);

  async function submitRequest(e) {
    e.preventDefault();
    setRequestStatus({ loading: true, success: '', error: '' });
    try {
      await api.post('/rentals', { property_id: property.id, ...requestForm });
      setRequestStatus({ loading: false, success: 'Request sent! The landlord will review and respond.', error: '' });
      setTimeout(() => setShowRequestModal(false), 2500);
    } catch (err) {
      setRequestStatus({ loading: false, success: '', error: err.response?.data?.error || 'Failed to send request' });
    }
  }

  if (loading) return <div className="page-wrapper loading-page"><div className="loading-spinner" /></div>;
  if (!property) return null;

  const imgs = Array.isArray(property.image_urls) ? property.image_urls : [];
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];

  return (
    <div className="page-wrapper">
      <div className="container section-sm">
        {/* Breadcrumb */}
        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/properties" style={{ color: 'var(--green)' }}>← Properties</Link>
          <span>/</span>
          <span>{property.district}</span>
          <span>/</span>
          <span style={{ color: 'var(--dark)' }}>{property.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
          {/* Left column */}
          <div>
            {/* Image gallery */}
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 24, background: 'var(--gray-100)' }}>
              {imgs.length > 0 ? (
                <>
                  <img src={imgs[activeImg]} alt={property.title} style={{ width: '100%', height: 380, objectFit: 'cover' }} />
                  {imgs.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, padding: '12px', overflowX: 'auto' }}>
                      {imgs.map((img, i) => (
                        <img key={i} src={img} alt="" onClick={() => setActiveImg(i)}
                          style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: i === activeImg ? '2px solid var(--green)' : '2px solid transparent', opacity: i === activeImg ? 1 : 0.7, transition: 'all .2s' }} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ height: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-300)', gap: 12 }}>
                  <span style={{ fontSize: '4rem' }}>🏠</span>
                  <span>No photos available</span>
                </div>
              )}
            </div>

            {/* Title + details */}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>{property.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}>📍 {property.location}, {property.district}</span>
              <span className={`badge ${property.is_available ? 'badge-green' : 'badge-gray'}`}>
                {property.is_available ? '✓ Available' : 'Occupied'}
              </span>
              <span className="badge badge-gray">🏠 {property.property_type}</span>
            </div>

            {/* Description */}
            {property.description && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 10 }}>About This Property</h3>
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.8 }}>{property.description}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Property Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Bedrooms/Rooms', value: `${property.rooms} Room${property.rooms > 1 ? 's' : ''}` },
                  { label: 'Property Type', value: property.property_type?.charAt(0).toUpperCase() + property.property_type?.slice(1) },
                  { label: 'District', value: property.district },
                  { label: 'Monthly Rent', value: `RWF ${Number(property.price).toLocaleString()}` },
                ].map(d => (
                  <div key={d.label}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-400)', letterSpacing: '0.05em', marginBottom: 4 }}>{d.label}</div>
                    <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Amenities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {amenities.map(a => (
                    <span key={a} style={{ padding: '5px 14px', background: 'var(--green-pale)', color: 'var(--green)', borderRadius: 999, fontSize: '0.85rem', fontWeight: 500 }}>✓ {a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sticky panel */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--green)', marginBottom: 4 }}>
                RWF {Number(property.price).toLocaleString()}
              </div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: 24 }}>per month</div>

              {/* Landlord info */}
              <div style={{ padding: '14px', background: 'var(--cream)', borderRadius: 10, marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8 }}>Listed by</div>
                <div style={{ fontWeight: 700 }}>{property.landlord_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{property.landlord_phone}</div>
              </div>

              {user?.role === 'tenant' && property.is_available ? (
                <button className="btn btn-primary btn-full btn-lg" onClick={() => setShowRequestModal(true)}>
                  🏠 Request to Rent
                </button>
              ) : !user ? (
                <Link to="/login" className="btn btn-primary btn-full btn-lg" style={{ display: 'flex', justifyContent: 'center' }}>
                  Sign In to Request
                </Link>
              ) : !property.is_available ? (
                <div className="alert alert-warning" style={{ textAlign: 'center' }}>This property is currently occupied</div>
              ) : null}

              <div style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--gray-400)', textAlign: 'center', lineHeight: 1.6 }}>
                Pay rent securely via MTN MoMo, Airtel Money, or bank transfer after approval
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal - FR 4.1 */}
      {showRequestModal && (
        <Modal title="🏠 Request to Rent" onClose={() => setShowRequestModal(false)}>
          <p style={{ color: 'var(--gray-500)', marginBottom: 20, fontSize: '0.9rem' }}>
            You're requesting to rent <strong>{property.title}</strong> at RWF {Number(property.price).toLocaleString()}/month.
          </p>
          {requestStatus.success && <div className="alert alert-success">✅ {requestStatus.success}</div>}
          {requestStatus.error && <div className="alert alert-error">⚠️ {requestStatus.error}</div>}
          {!requestStatus.success && (
            <form onSubmit={submitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Preferred Move-in Date</label>
                <input className="form-input" type="date" value={requestForm.move_in_date}
                  onChange={e => setRequestForm(p => ({ ...p, move_in_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label">Message to Landlord (optional)</label>
                <textarea className="form-textarea" value={requestForm.message}
                  onChange={e => setRequestForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Introduce yourself, mention your occupation, family size, etc." rows={4} />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={requestStatus.loading}>
                {requestStatus.loading ? '⏳ Sending…' : '→ Submit Request'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
