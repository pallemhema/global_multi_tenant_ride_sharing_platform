import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useUserAuth } from "./UserAuthContext";
import { driverApi } from "../services/driverApi";

const DriverContext = createContext(null);

export const DriverProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useUserAuth();

  /* ================= CORE STATE ================= */

  const [driver, setDriver] = useState(null);
  const driverId = driver?.driver_id ?? null;

  const [documents, setDocuments] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [vehicleSummary, setVehicleSummary] = useState(null);
  const [invites, setInvites] = useState([]);

  const [tripRequests, setTripRequests] = useState([]);
  const [tripRequestsLoading, setTripRequestsLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    /* ================= RESET ON DRIVER CHANGE ================= */

  useEffect(() => {
    setDocuments([]);
    setActiveShift(null);
    setRuntimeStatus(null);
    setActiveTrip(null);
    setVehicleSummary(null);
    setInvites([]);
    setTripRequests([]);
  }, [driverId]);

  /* ================= HELPERS ================= */

 const refreshRuntime = async () => {
  const res = await driverApi.getRuntimeStatus();
  setRuntimeStatus(res?.runtime_status ?? null);
  return res;
};



  const loadTripRequests = async () => {
    try {
      setTripRequestsLoading(true);
      const res = await driverApi.getTripRequests();
      setTripRequests(res || []);
    } catch (err) {
      console.error("Failed to load trip requests", err);
      setTripRequests([]);
    } finally {
      setTripRequestsLoading(false);
    }
  };

  const refreshActiveTrip = async () => {
    try {
      const res = await driverApi.getactiveTrip();
      console.log("ACTIVE TRIP FETCHED:", res);
      setActiveTrip(res);
    } catch (err) {
      console.warn("No active trip");
      setActiveTrip(null);
    }
  };



  /* ================= INITIAL DRIVER LOAD ================= */

  const loadDriverData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await driverApi.getDriverProfile();
      const nextDriver = profile?.driver ?? null;
      setDriver(nextDriver);

      if (!nextDriver?.driver_id) return;

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
      await refreshActiveTrip();

      await loadTripRequests();
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

  /* ================= ACTIVE TRIP — ONLY WHEN NEEDED ================= */
useEffect(() => {
  if (runtimeStatus?.runtime_status === "trip_accepted" || runtimeStatus?.runtime_status === "on_trip") {
    refreshActiveTrip();
  } else {
    setActiveTrip(null);
  }
}, [runtimeStatus]);

  /* ================= DERIVED ================= */

  const can_start_shift =
    activeShift?.shift_status === "offline" &&
    (vehicleSummary?.active_vehicles ?? 0) > 0;

  /* ================= DOCUMENT & PROFILE ================= */

  const uploadDocument = async (payload) => {
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

  const selectTenant = async (tenant_id) => {
    const res = await driverApi.selectTenantForDriver(tenant_id);
    await loadDriverData();
    return res;
  };

  const selectDriverType = async (type) => {
    const res = await driverApi.updateDriverType(type);
    await loadDriverData();
    return res;
  };

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

  /* ================= SHIFT ================= */

  const startShift = async (payload) => {
    const res = await driverApi.startShift(payload);
    await loadDriverData();
    return res;
  };

  const endShift = async () => {
    const res = await driverApi.endShift();
    await loadDriverData();
    return res;
  };

  /* ================= RUNTIME ================= */

  const updateRuntimeStatus = async (status) => {
    const res = await driverApi.updateRuntimeStatus(status);
    setRuntimeStatus(res);
    return res;
  };

  /* ================= TRIP ACTIONS ================= */

  const acceptTrip = async ({ trip_request_id, batch_id }) => {
    const res = await driverApi.respondToOffer(
      trip_request_id,
      batch_id,
      "accepted"
    );
    await refreshRuntime();
    await loadTripRequests();
    return res;
  };

  const rejectTrip = async ({ trip_request_id, batch_id }) => {
    const res = await driverApi.respondToOffer(
      trip_request_id,
      batch_id,
      "rejected"
    );
    await loadTripRequests();
    return res;
  };

  const startTrip = async ({ trip_id, otp }) => {
    const res = await driverApi.startTrip(trip_id, otp);
    await refreshRuntime();
    return res;
  };

  const completeTrip = async ({ trip_id, distance_km, duration_minutes }) => {
    const res = await driverApi.completeTrip(trip_id, {
      distance_km,
      duration_minutes,
    });
    await refreshRuntime();
    return res;
  };

  const cancelTrip = async ({ trip_id, reason }) => {
    const res = await driverApi.cancelTrip(trip_id, { reason });
    await refreshRuntime();
    return res;
  };
console.log("RUNTIME STATUS RAW:", runtimeStatus, typeof runtimeStatus);
console.log("ACTIVE TRIP RAW:", activeTrip, typeof activeTrip);

  /* ================= CONTEXT VALUE ================= */

  const value = useMemo(
    () => ({
      driver,
      driverId,
      documents,
      activeShift,
      runtimeStatus,
      activeTrip,
      vehicleSummary,
      invites,
      loading,
      error,

      can_start_shift,

      tripRequests,
      tripRequestsLoading,

      uploadDocument,
      updateDocument,
      deleteDocument,
      selectTenant,
      selectDriverType,
      submitDocuments,
      updateProfile,

      startShift,
      endShift,
      updateRuntimeStatus,

      acceptTrip,
      rejectTrip,
      startTrip,
      completeTrip,
      cancelTrip,
    }),
    [
      driver,
      driverId,
      documents,
      activeShift,
      runtimeStatus,
      activeTrip,
      vehicleSummary,
      invites,
      loading,
      error,
      tripRequests,
      tripRequestsLoading,
    ]
  );

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useDriver = () => {
  const ctx = useContext(DriverContext);
  if (!ctx) {
    throw new Error("useDriver must be used inside DriverProvider");
  }
  return ctx;
};
