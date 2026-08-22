import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(localStorage.getItem('org_id') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => {
        setUser(data);
        if (data.organizations?.length > 0) {
          const firstOrgId = data.organizations[0].org_id;
          localStorage.setItem('org_id', firstOrgId);
          setOrgId(firstOrgId);
        }
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('org_id');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (tokens) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    return getMe().then((data) => {
      setUser(data);
      if (data.organizations?.length > 0) {
        const firstOrgId = data.organizations[0].org_id;
        localStorage.setItem('org_id', firstOrgId);
        setOrgId(firstOrgId);
      }
      return data;
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setOrgId(null);
  };

  return (
    <AuthContext.Provider value={{ user, orgId, setOrgId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);