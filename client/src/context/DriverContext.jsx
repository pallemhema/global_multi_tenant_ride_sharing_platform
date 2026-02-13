import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useUserAuth } from "./UserAuthContext";
import { driverApi } from "../services/driverApi";

const DriverContext = createContext(null);

export const DriverProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useUserAuth();

  /* =====================================================
     CORE STATE
  ===================================================== */

  const [driver, setDriver] = useState(null);
  const driverId = driver?.driver_id ?? null;

  const [tenantLocations, setTenantLocations] = useState([]);

  const [documents, setDocuments] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [vehicleSummary, setVehicleSummary] = useState(null);

  const [tripRequests, setTripRequests] = useState([]);
  const [tripRequestsLoading, setTripRequestsLoading] = useState(false);

  const [invites, setInvites] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  const [wallet, setWallet] = useState(null);
  const [pastTrips, setPastTrips] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* =====================================================
     RESET ON AUTH CHANGE
  ===================================================== */

useEffect(() => { // 🔥 HARD RESET on auth change 
  setDriver(null); 
  setDocuments([]); 
  setActiveShift(null); 
  setRuntimeStatus(null); 
  setActiveTrip(null); 
  setVehicleSummary(null); 
  setTripRequestsLoading(false)
  setTripRequests([]); setInvites([]); 
  setAssignedVehicle(null); 
  setError(null); 
  setLoading(true); 
  setWallet(null) 
  setPastTrips([]) 
  setPendingPayments([])
 }, [isAuthenticated]);

  /* =====================================================
     DRIVER INITIAL LOAD
  ===================================================== */

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

      await refreshPastTrips();
      await refreshWallet();
      await loadPendingPayment();

      // 🔥 Resume onboarding data
      if (
        nextDriver.onboarding_status === "tenant_selected" ||
        nextDriver.onboarding_status === "location_selected"
      ) {
        await loadTenantLocations();
      }

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
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  /* =====================================================
     ONBOARDING METHODS
  ===================================================== */

  const loadTenantLocations = async () => {
    const res = await driverApi.getTenantLocations();
    setTenantLocations(res.countries || []);
    return res;
  };

  const selectTenant = async (tenantId) => {
    const res = await driverApi.selectTenantForDriver(tenantId);

    setDriver((prev) => ({
      ...prev,
      tenant_id: tenantId,
      onboarding_status: res.onboarding_status,
    }));

    setTenantLocations(res.countries || []);
    return res;
  };

  const selectLocation = async (payload) => {
    const res = await driverApi.selectLocation(payload);

    setDriver((prev) => ({
      ...prev,
      country_id: payload.country_id,
      city_id: payload.city_id,
      onboarding_status: res.onboarding_status,
    }));

    return res;
  };

  const updateDriverType = async (type) => {
    const res = await driverApi.updateDriverType(type);

    setDriver((prev) => ({
      ...prev,
      driver_type: type,
      onboarding_status: res.onboarding_status,
    }));

    return res;
  };

  const submitDocuments = async () => {
    const res = await driverApi.submitDocuments();

    setDriver((prev) => ({
      ...prev,
      onboarding_status: res.onboarding_status,
    }));

    return res;
  };

  /* =====================================================
     DOCUMENTS
  ===================================================== */

  const refreshDocuments = async () => {
    const docs = await driverApi.getDriverDocuments();
    setDocuments(docs || []);
    return docs;
  };

  /* =====================================================
     SHIFT & RUNTIME
  ===================================================== */

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

  const updateRuntimeStatus = async (status) => {
    if (status === "on_trip") return;
    const res = await driverApi.updateRuntimeStatus(status);
    setRuntimeStatus(res);
    return res;
  };

  /* =====================================================
     TRIPS
  ===================================================== */

  const refreshRuntime = async () => {
    const res = await driverApi.getRuntimeStatus();
    setRuntimeStatus(res || null);
    return res;
  };

  const refreshActiveTrip = async () => {
    try {
      const res = await driverApi.getactiveTrip();
      setActiveTrip(res || null);
    } catch {
      setActiveTrip(null);
    }
  };

  const loadTripRequests = async () => {
    if (runtimeStatus?.runtime_status !== "available") return;

    setTripRequestsLoading(true);
    try {
      const res = await driverApi.getTripRequests();
      setTripRequests(res || []);
    } finally {
      setTripRequestsLoading(false);
    }
  };

  const acceptTrip = async ({ trip_request_id, batch_id }) => {
    const res = await driverApi.respondToOffer(
      trip_request_id,
      batch_id,
      "accepted"
    );
    await refreshRuntime();
    setTripRequests([]);
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
    await refreshWallet();
    await refreshPastTrips();
    await loadPendingPayment();

    return res;
  };

  const cancelTrip = async ({ trip_id, reason }) => {
    const res = await driverApi.cancelTrip(trip_id, { reason });
    await refreshRuntime();
    await refreshPastTrips();
    return res;
  };
  useEffect(() => {
    if (
      runtimeStatus?.runtime_status === "trip_accepted" ||
      runtimeStatus?.runtime_status === "on_trip"
    ) {
      refreshActiveTrip();
    } else {
      setActiveTrip(null);
    }
  }, [runtimeStatus?.runtime_status]);


  /* =====================================================
     FLEET
  ===================================================== */

  const loadFleetInvites = async () => {
    const res = await driverApi.getFleetInvites();
    setInvites(res || []);
  };

  const loadAssignedVehicle = async () => {
    const res = await driverApi.getAssignedVehicle();
    setAssignedVehicle(res || null);
  };

  const acceptInvite = async (inviteId) => {
    const res = await driverApi.acceptFleetInvite(inviteId);
    await loadFleetInvites();
    return res;
  };

  const rejectInvite = async (inviteId) => {
    const res = await driverApi.rejectFleetInvite(inviteId);
    await loadFleetInvites();
    return res;
  };
  useEffect(() => {
  if (!driver?.driver_type) return;

  if (driver.driver_type === "fleet_driver") {
    loadFleetInvites();
    loadAssignedVehicle();
  } else {
    // 🚫 Not a fleet driver → hard reset
    setInvites([]);
    setAssignedVehicle([]);
  }
}, [driver?.driver_type]);

  /* =====================================================
     FINANCE
  ===================================================== */

  const refreshWallet = async () => {
    const res = await driverApi.getWallet();
    setWallet(res || null);
    return res;
  };

  const refreshPastTrips = async () => {
    const res = await driverApi.getPastTrips();
    setPastTrips(res || []);
    return res;
  };

  const loadPendingPayment = async () => {
    const res = await driverApi.getPendingPayment();
    setPendingPayments(res || []);
  };

  const paymentconfirmation = async (tripId, paymentMethod) => {
    const res = await driverApi.confirmPayment(tripId, paymentMethod);
    await refreshWallet();
    await refreshPastTrips();
    setPendingPayments((prev) =>
      prev.filter((p) => p.trip_id !== tripId)
    );
    return res;
  };

  /* =====================================================
     DERIVED
  ===================================================== */

  const can_start_shift = useMemo(() => {
    if (!driver) return false;
    if (driver.kyc_status !== "approved") return false;

    if (driver.driver_type === "fleet_driver") {
      return activeShift?.shift_status === "offline" && assignedVehicle;
    }

    return (
      activeShift?.shift_status === "offline" &&
      (vehicleSummary?.active_vehicles ?? 0) > 0
    );
  }, [driver, activeShift, assignedVehicle, vehicleSummary]);

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */

  const value = useMemo(
    () => ({
      driver,
      driverId,
      loading,
      error,

      tenantLocations,
      documents,
      activeShift,
      runtimeStatus,
      activeTrip,
      vehicleSummary,
      tripRequests,
      tripRequestsLoading,
      invites,
      assignedVehicle,
      wallet,
      pastTrips,
      pendingPayments,

      // onboarding
      selectTenant,
      selectLocation,
      updateDriverType,
      submitDocuments,
      loadTenantLocations,

      // documents
      refreshDocuments,

      // shifts
      startShift,
      endShift,
      updateRuntimeStatus,
      can_start_shift,

      // trips
      acceptTrip,
      rejectTrip,
      startTrip,
      completeTrip,
      cancelTrip,

      // fleet
      acceptInvite,
      rejectInvite,

      // finance
      paymentconfirmation,
    }),
    [
      driver,
      loading,
      error,
      tenantLocations,
      documents,
      activeShift,
      runtimeStatus,
      activeTrip,
      vehicleSummary,
      tripRequests,
      invites,
      assignedVehicle,
      wallet,
      pastTrips,
      pendingPayments,
      can_start_shift,
    ]
  );

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => {
  const ctx = useContext(DriverContext);
  if (!ctx) {
    throw new Error("useDriver must be used inside DriverProvider");
  }
  return ctx;
};
