import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { tokenStorage } from "../utils/toeknStorage";
import { isTokenExpired } from "../utils/jwt";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  
  useEffect(() => {
    const storedToken = tokenStorage.get();

    if (!storedToken) return;

    if (isTokenExpired(storedToken)) {
      tokenStorage.clear();
      setToken(null);
      setUser(null);
      return;
    }

    setToken(storedToken);
    setUser(jwtDecode(storedToken));
  }, []);

  const login = (jwt) => {
    tokenStorage.set(jwt);
    setToken(jwt);
    setUser(jwtDecode(jwt));
  };

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  };
 

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
