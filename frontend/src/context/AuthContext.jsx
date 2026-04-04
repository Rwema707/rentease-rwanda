import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

function isValidUser(data) {
  return data && typeof data === 'object' && data.id && data.role &&
    ['tenant', 'landlord', 'admin'].includes(data.role);
}

function safeGetUser() {
  try {
    const parsed = JSON.parse(localStorage.getItem('rentease_user'));
    return isValidUser(parsed) ? parsed : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(safeGetUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rentease_token');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then(res => {
        const data = res?.data;
        if (isValidUser(data)) {
          setUser(data);
          localStorage.setItem('rentease_user', JSON.stringify(data));
        } else {
          console.warn('Invalid /auth/me response, keeping cached user:', data);
          const cached = safeGetUser();
          if (cached) {
            setUser(cached);
          } else {
            localStorage.removeItem('rentease_token');
            localStorage.removeItem('rentease_user');
            setUser(null);
          }
        }
      })
      .catch(err => {
        console.warn('/auth/me failed:', err?.message);
        if (err?.response?.status === 401) {
          localStorage.removeItem('rentease_token');
          localStorage.removeItem('rentease_user');
          setUser(null);
        }
        // Otherwise keep cached user (transient network error)
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    if (!isValidUser(userData)) throw new Error('Invalid server response');
    localStorage.setItem('rentease_token', token);
    localStorage.setItem('rentease_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user: userData } = res.data;
    if (!isValidUser(userData)) throw new Error('Invalid server response');
    localStorage.setItem('rentease_token', token);
    localStorage.setItem('rentease_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('rentease_token');
    localStorage.removeItem('rentease_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    if (!isValidUser(updated)) return;
    setUser(updated);
    localStorage.setItem('rentease_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}