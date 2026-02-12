
import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { tokenStorage } from "../utils/toeknStorage";
import { isTokenExpired } from "../utils/jwt";
import { userAuthApi } from "../services/userAuthApi";

const UserAuthContext = createContext(null);

export const UserAuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [role, setRole] = useState(null);
  const [context, setContext] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [availableRoles, setAvailableRoles] = useState([]);
  console.log(profile);

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

    initializeAfterLogin();
  }, []);

  /* ===============================
     INITIALIZE AFTER LOGIN/RESTORE
  =============================== */
  const initializeAfterLogin = async () => {
    await fetchAvailableRoles();
    await fetchUserProfile();
    setLoading(false);
  };

  /* ===============================
     LOGIN
  =============================== */
  const loginUser = async (jwt) => {
    tokenStorage.set(jwt);
    const decoded = jwtDecode(jwt);

    setToken(jwt);
    setUser(decoded);
    setRole(decoded.role || null);
    setContext(decoded.context || null);
    setIsAuthenticated(true);

    await initializeAfterLogin();
  };

  /* ===============================
     LOGOUT
  =============================== */
  const logoutUser = () => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    setContext(null);
    setAvailableRoles([]);
    setIsAuthenticated(false);
  };

  /* ===============================
     FETCH AVAILABLE ROLES
  =============================== */
  const fetchAvailableRoles = async () => {
    try {
      const res = await userAuthApi.getAvailableRoles();
      setAvailableRoles(res.roles || []);
    } catch (err) {
      console.error("Failed to fetch roles", err);
      setAvailableRoles([]);
    }
  };

  /* ===============================
     FETCH USER PROFILE
  =============================== */
  const fetchUserProfile = async () => {
    try {
      const data = await userAuthApi.getUserProfile();
      setProfile(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch profile", err);
      setProfile(null);
      return null;
    }
  };

  /* ===============================
     CREATE PROFILE
  =============================== */
  const createUserProfile = async (payload) => {
    await userAuthApi.createUserProfile(payload);
    return await fetchUserProfile();
  };

  /* ===============================
     EDIT PROFILE
  =============================== */
  const editUserProfile = async (payload) => {
    await userAuthApi.editUserProfile(payload);
    return await fetchUserProfile();
  };

  /* ===============================
     SWITCH ROLE
  =============================== */
  const switchUserRole = async (newRole) => {
    const res = await userAuthApi.switchRole(newRole);
    const newToken = res.access_token;

    tokenStorage.set(newToken);
    const decoded = jwtDecode(newToken);

    setToken(newToken);
    setUser(decoded);
    setRole(decoded.role || null);
    setContext(decoded.context || null);
    setIsAuthenticated(true);

    await fetchUserProfile();

    return res;
  };

  const roleNames = availableRoles.map((r) => r.role);

  const value = {
    token,
    user,
    profile,
    role,
    context,
    isAuthenticated,
    loading,
    availableRoles: roleNames,

    loginUser,
    logoutUser,
    switchUserRole,

    fetchUserProfile,
    createUserProfile,
    editUserProfile,

    userId: user?.sub,
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
