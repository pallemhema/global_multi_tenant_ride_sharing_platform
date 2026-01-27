import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔐 Decode JWT safely
  const decodeJWT = (token) => {
    try {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      return JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
    } catch {
      return null;
    }
  };

  // 🔁 Restore session on refresh
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    const decoded = decodeJWT(storedToken);

    if (!decoded) {
      logout();
      setLoading(false);
      return;
    }

    setToken(storedToken);
    setUser(decoded);
    setRole(decoded.role);                     // ✅ FROM JWT
    setTenantId(decoded.tenant_id ?? null);    // ✅ FROM JWT
    setIsAuthenticated(true);

    axios.defaults.headers.common['Authorization'] =
      `Bearer ${storedToken}`;

    setLoading(false);
  }, []);

  // 🔑 Login
  const login = (accessToken) => {
    const decoded = decodeJWT(accessToken);
    if (!decoded || !decoded.role) return false;

    setToken(accessToken);
    setUser(decoded);
    setRole(decoded.role);
    setTenantId(decoded.tenant_id ?? null);
    setIsAuthenticated(true);

    localStorage.setItem('access_token', accessToken);
    axios.defaults.headers.common['Authorization'] =
      `Bearer ${accessToken}`;

    return true;
  };

  // 🚪 Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    setTenantId(null);
    setIsAuthenticated(false);

    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AdminContext.Provider
      value={{
        token,
        user,
        role,
        tenantId,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used inside AdminProvider');
  }
  return ctx;
}
