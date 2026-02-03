import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { tokenStorage } from "../utils/toeknStorage";
import { isTokenExpired } from "../utils/jwt";
import { userAuthApi } from "../services/userAuthApi";

const UserAuthContext = createContext(null);

export const UserAuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [context, setContext] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState(null);

  const [availableRoles, setAvailableRoles] = useState([]);

  /* ===============================
     INIT FROM STORAGE
  =============================== */
  useEffect(() => {
    const storedToken = tokenStorage.get();

    if (!storedToken || isTokenExpired(storedToken)) {
      tokenStorage.clear();
      setLoading(false);
      return;
    }

    const decoded = jwtDecode(storedToken);
    setToken(storedToken);
    setUser(decoded);
    setRole(decoded.role || null);
    setContext(decoded.context || null);
    setIsAuthenticated(true);
    setLoading(false);

    // Fetch roles after auth restore
    fetchAvailableRoles();
  }, []);

  /* ===============================
     LOGIN
  =============================== */
  const loginUser = async (jwt, phoneNumber = null) => {
    tokenStorage.set(jwt);
    const decoded = jwtDecode(jwt);

    setToken(jwt);
    setUser(decoded);
    setRole(decoded.role || null);
    setContext(decoded.context || null);
    setIsAuthenticated(true);
    setPhone(phoneNumber);

    await fetchAvailableRoles();
  };

  /* ===============================
     LOGOUT
  =============================== */
  const logoutUser = () => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setRole(null);
    setContext(null);
    setAvailableRoles([]);
    setIsAuthenticated(false);
    setPhone(null);
  };

  /* ===============================
     FETCH AVAILABLE ROLES
  =============================== */
  const fetchAvailableRoles = async () => {
    try {
      const res = await userAuthApi.getAvailableRoles();

      // 🔑 normalize once
      setAvailableRoles(res.roles || []);

      return res.roles || [];
    } catch (err) {
      console.error("Failed to fetch roles", err);
      setAvailableRoles([]);
      return [];
    }
  };

  /* ===============================
     SWITCH ROLE
  =============================== */
  const switchUserRole = async (newRole) => {
    console.log("Switching to role:", newRole);
    try {
      const res = await userAuthApi.switchRole(newRole);
      const newToken = res.access_token;

      console.log("New token received:", newToken);
      tokenStorage.set(newToken);
      const decoded = jwtDecode(newToken);

      console.log("Decoded token:", decoded);
      setToken(newToken);
      setUser(decoded);
      setRole(decoded.role || null);
      setContext(decoded.context || null);
      setIsAuthenticated(true);

      return res;
    } catch (err) {
      console.error("Role switch failed", err);
      throw err;
    }
  };
  const roleNames = availableRoles.map((r) => r.role);
  console.log("availableRoles:", roleNames);

  const value = {
    // State
    token,
    user,
    role,
    context,
    isAuthenticated,
    loading,
    phone,
    availableRoles: roleNames,

    // Methods
    loginUser,
    logoutUser,
    fetchAvailableRoles,
    switchUserRole,

    // Helpers
    userId: user?.sub,
    driverId: user?.driver_id,
    fleetOwnerId: user?.fleet_owner_id,
    tenantId: user?.tenant_id,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) {
    throw new Error("useUserAuth must be used within UserAuthProvider");
  }
  return ctx;
};
