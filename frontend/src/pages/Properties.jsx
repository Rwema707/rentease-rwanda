import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import PropertyCard from '../components/PropertyCard';

const DISTRICTS = ['All', 'Gasabo', 'Kicukiro', 'Nyarugenge', 'Musanze', 'Huye', 'Rubavu', 'Rusizi', 'Nyagatare', 'Gicumbi'];
const TYPES = ['All', 'apartment', 'house', 'studio', 'villa', 'room'];

export default function Properties() {
  const [params, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: params.get('location') || '',
    district: 'All',
    min_price: '',
    max_price: '',
    rooms: '',
    property_type: 'All',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchProperties(); }, []);

  async function fetchProperties() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters.location) q.set('location', filters.location);
      if (filters.district !== 'All') q.set('district', filters.district);
      if (filters.min_price) q.set('min_price', filters.min_price);
      if (filters.max_price) q.set('max_price', filters.max_price);
      if (filters.rooms) q.set('rooms', filters.rooms);
      if (filters.property_type !== 'All') q.set('property_type', filters.property_type);
      const res = await api.get(`/properties?${q}`);
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchProperties();
  }

  function clearFilters() {
    setFilters({ location: '', district: 'All', min_price: '', max_price: '', rooms: '', property_type: 'All' });
    setTimeout(() => fetchProperties(), 100);
  }

  return (
    <div className="page-wrapper">
      {/* Search Header */}
      <div style={{ background: 'var(--dark)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 16 }}>
            Browse Properties in Rwanda
          </h1>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ flex: 1, minWidth: 220, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: 'white' }}
                placeholder="🔍 Search by location, district…"
                value={filters.location}
                onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}
              />
              <button type="submit" className="btn btn-primary">Search</button>
              <button type="button" className="btn btn-ghost" style={{ color: 'rgba(255,255,255,.75)', borderColor: 'rgba(255,255,255,.2)' }}
                onClick={() => setShowFilters(!showFilters)}>
                ⚙️ Filters {showFilters ? '▲' : '▼'}
              </button>
            </div>
          </form>

          {/* Filter panel - FR 3.2 */}
          {showFilters && (
            <div style={{ marginTop: 16, padding: 20, background: 'rgba(255,255,255,.06)', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,.7)' }}>District</label>
                  <select className="form-select" value={filters.district} onChange={e => setFilters(p => ({ ...p, district: e.target.value }))}>
                    {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,.7)' }}>Min Price (RWF)</label>
                  <input className="form-input" type="number" placeholder="50,000" value={filters.min_price} onChange={e => setFilters(p => ({ ...p, min_price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,.7)' }}>Max Price (RWF)</label>
                  <input className="form-input" type="number" placeholder="500,000" value={filters.max_price} onChange={e => setFilters(p => ({ ...p, max_price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,.7)' }}>Rooms</label>
                  <select className="form-select" value={filters.rooms} onChange={e => setFilters(p => ({ ...p, rooms: e.target.value }))}>
                    <option value="">Any</option>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n===1?'Room':'Rooms'}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,.7)' }}>Property Type</label>
                  <select className="form-select" value={filters.property_type} onChange={e => setFilters(p => ({ ...p, property_type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                <button className="btn btn-primary btn-sm" onClick={fetchProperties}>Apply Filters</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,.7)', borderColor: 'rgba(255,255,255,.2)' }} onClick={clearFilters}>Clear All</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container section-sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            {loading ? 'Loading…' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} found`}
          </p>
        </div>

        {loading ? (
          <div className="loading-page"><div className="loading-spinner" /></div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏚️</div>
            <h3>No Properties Found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={clearFilters}>Show All Properties</button>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
