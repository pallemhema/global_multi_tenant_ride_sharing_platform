import React, { createContext, useContext, useEffect, useState } from 'react';

import { tokenStorage } from '../services/toeknStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // On app load, restore auth from storage
  useEffect(() => {
    const storedToken = tokenStorage.get();
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (accessToken) => {
    tokenStorage.set(accessToken);
    setToken(accessToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook (cleaner usage)
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
