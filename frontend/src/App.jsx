import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#faf7f2' }}>
        <div>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#7a7a75', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dest = user.role === 'landlord' ? '/dashboard/landlord'
                : user.role === 'admin'    ? '/dashboard/admin'
                : '/dashboard/tenant';
    return <Navigate to={dest} replace />;
  }
  return children;
}

function ProfileRedirect() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'landlord') return <LandlordDashboard />;
  if (user.role === 'admin')    return <AdminDashboard />;
  return <TenantDashboard />;
}

function NotFound() {
  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '72px 24px 24px' }}>
      <div>
        <div style={{ fontSize: '5rem', marginBottom: 16, opacity: .3 }}>404</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 12 }}>Page Not Found</h1>
        <a href="/" className="btn btn-primary">← Go Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<><Navbar /><ErrorBoundary><Home /></ErrorBoundary></>} />
            <Route path="/properties" element={<><Navbar /><ErrorBoundary><Properties /></ErrorBoundary></>} />
            <Route path="/properties/:id" element={<><Navbar /><ErrorBoundary><PropertyDetail /></ErrorBoundary></>} />
            <Route path="/dashboard/tenant" element={
              <ProtectedRoute allowedRoles={['tenant']}>
                <Navbar /><ErrorBoundary><TenantDashboard /></ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/landlord" element={
              <ProtectedRoute allowedRoles={['landlord']}>
                <Navbar /><ErrorBoundary><LandlordDashboard /></ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Navbar /><ErrorBoundary><AdminDashboard /></ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Navbar /><ErrorBoundary><ProfileRedirect /></ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="*" element={<><Navbar /><NotFound /></>} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}