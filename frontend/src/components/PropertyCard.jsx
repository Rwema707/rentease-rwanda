import { useNavigate } from 'react-router-dom';

export default function PropertyCard({ property }) {
  const navigate = useNavigate();
  const imgs = Array.isArray(property.image_urls) ? property.image_urls : [];

  return (
    <div className="property-card" onClick={() => navigate(`/properties/${property.id}`)}>
      <div className="property-card-img">
        {imgs.length > 0 ? (
          <img src={imgs[0]} alt={property.title} />
        ) : (
          <div className="property-card-no-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />
              <rect x="9" y="14" width="6" height="7" />
            </svg>
            <span>No photo</span>
          </div>
        )}
        {property.is_available ? (
          <span className="prop-available-badge">Available</span>
        ) : (
          <span className="prop-available-badge" style={{ background: 'var(--gray-500)' }}>Occupied</span>
        )}
      </div>
      <div className="property-card-body">
        <div className="property-price">
          RWF {Number(property.price).toLocaleString()}
          <span>/month</span>
        </div>
        <h3 className="property-title">{property.title}</h3>
        <div className="property-location">
          📍 {property.location}, {property.district}
        </div>
        <div className="property-meta">
          <span className="property-meta-item">🛏 {property.rooms} {property.rooms === 1 ? 'Room' : 'Rooms'}</span>
          <span className="property-meta-item">🏠 {property.property_type}</span>
          {property.landlord_name && (
            <span className="property-meta-item" style={{ marginLeft: 'auto', color: 'var(--gray-400)' }}>
              by {property.landlord_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
