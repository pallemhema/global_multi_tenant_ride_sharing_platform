import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useUserAuth } from "./UserAuthContext";
import { driverApi } from "../services/driverApi";

const DriverContext = createContext(null);

export const DriverProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useUserAuth();

  const [driver, setDriver] = useState(null);
  const driverId = driver?.driver_id ?? null;

  const [documents, setDocuments] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [vehicleSummary, setVehicleSummary] = useState(null);
  const [invites, setInvites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitesLoading, setInvitesLoading] = useState(false);

  /* reset driver-scoped state when driver changes */
  useEffect(() => {
    setDocuments([]);
    setActiveShift(null);
    setRuntimeStatus(null);
    setVehicleSummary(null);
    setInvites([]);
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await driverApi.getDriverProfile();
      const nextDriver = profile?.driver ?? null;
      setDriver(nextDriver);

      if (!nextDriver?.driver_id) {
        setDocuments([]);
        return;
      }

      const [docs, shift, runtime, vehicle] = await Promise.all([
        driverApi.getDriverDocuments(),
        driverApi.getShiftStatus(),
        driverApi.getRuntimeStatus(),
        driverApi.getVehicleSummary(),
      ]);

      setDocuments(docs || []);
      setActiveShift(shift || null);
      setRuntimeStatus(runtime || null);
      setVehicleSummary(vehicle || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load driver data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDriverData();
    } else if (!authLoading && !isAuthenticated) {
      setDriver(null);
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  /* ================= ACTIONS ================= */

  const uploadDocument = async (payload) => {
    console.log(payload);
    const res = await driverApi.uploadDriverDocument(payload);
    await loadDriverData();
    return res;
  };

  const updateDocument = async (documentId, payload) => {
    const res = await driverApi.updateDriverDocument(documentId, payload);
    await loadDriverData();
    return res;
  };

  const deleteDocument = async (documentId) => {
    await driverApi.deleteDriverDocument(documentId);
    await loadDriverData();
  };

  const selectTenant = async (payload) => {
    const res = await driverApi.selectTenantForDriver(payload);
    await loadDriverData();
    return res;
  };
  const selectDiverType = async(type)=>{
    const res = await driverApi.updateDriverType(type);
    await loadDriverData();
    return res;
  }

  const submitDocuments = async () => {
    const res = await driverApi.submitDocuments();
    await loadDriverData();
    return res;
  };

  const updateProfile = async (payload) => {
    const res = await driverApi.updateDriverProfile(payload);
    await loadDriverData();
    return res;
  };

  const value = useMemo(
    () => ({
      driver,
      driverId,
      documents,
      activeShift,
      runtimeStatus,
      vehicleSummary,
      invites,
      loading,
      error,
      invitesLoading,

      uploadDocument,
      updateDocument,
      deleteDocument,
      selectTenant,
      submitDocuments,
      updateProfile,
      selectDiverType
    }),
    [
      driver,
      driverId,
      documents,
      activeShift,
      runtimeStatus,
      vehicleSummary,
      invites,
      loading,
      error,
      invitesLoading,
    ],
  );

  return (
    <DriverContext.Provider value={value}>{children}</DriverContext.Provider>
  );
};

export const useDriver = () => {
  const ctx = useContext(DriverContext);
  if (!ctx) {
    throw new Error("useDriver must be used inside DriverProvider");
  }
  return ctx;
};
