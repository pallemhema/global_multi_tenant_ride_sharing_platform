
import { createContext, useContext, useEffect, useState, useMemo } from "react";
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

  const [tripRequests, setTripRequests] = useState([]);
  const [tripRequestsLoading, setTripRequestsLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [invites, setInvites] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState();

  const [wallet, setWallet] = useState(null);

  const [pastTrips, setPastTrips] = useState([]);

  // const [paymentId, setPaymentId] = useState(null);
const [pendingPayments, setPendingPayments] = useState([]);

  /* ================= RESET ON DRIVER CHANGE ================= */

 useEffect(() => {
  // 🔥 HARD RESET on auth change
  setDriver(null);
  setDocuments([]);
  setActiveShift(null);
  setRuntimeStatus(null);
  setActiveTrip(null);
  setVehicleSummary(null);
  setTripRequests([]);
  setInvites([]);
  setAssignedVehicle(null);
  setError(null);
  setLoading(true);
  setWallet(null)
  setPastTrips([])
  setPendingPayments([])
}, [isAuthenticated]);

  /* ================= HELPERS ================= */

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

  /* 🔒 HARD-GUARDED TRIP REQUEST LOADER */
  const loadTripRequests = async () => {
    if (runtimeStatus?.runtime_status !== "available") {
      console.log(
        "Skipping trip requests. Runtime:",
        runtimeStatus?.runtime_status
      );
      return;
    }

    try {
      setTripRequestsLoading(true);
      const res = await driverApi.getTripRequests();

      setTripRequests((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(res)) return prev;
        return res || [];
      });
    } catch (err) {
      console.error("Failed to load trip requests", err);
    } finally {
      setTripRequestsLoading(false);
    }
  };

  /* ================= FLEET-DRIVER ONLY ================= */

const loadFleetInvites = async () => {
  try {
    const res = await driverApi.getFleetInvites();
    setInvites(res || []);
  } catch (err) {
    console.error("Failed to load fleet invites", err);
    setInvites([]);
  }
};

const loadAssignedVehicle = async () => {
  try {
    const res = await driverApi.getAssignedVehicle();
    setAssignedVehicle(res || null);
  } catch (err) {
    console.error("Failed to load assigned vehicles", err);
    setAssignedVehicle(null);
  }
};
const refreshWallet = async () => {
  try {
    const res = await driverApi.getWallet();
    setWallet(res || null);
    return res;
  } catch (err) {
    console.error("Failed to refresh wallet", err);
  }
};

const refreshPastTrips = async () => {
  try {
    const res = await driverApi.getPastTrips();
    setPastTrips(res || []);
    return res;
  } catch (err) {
    console.error("Failed to refresh past trips", err);
  }
};


  const loadPendingPayment = async () => {
  try {
    const res = await driverApi.getPendingPayment();
    setPendingPayments(res || []);
  } catch (err) {
    console.error("Failed to load pending payment", err);
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
    
      await refreshPastTrips();
      await refreshWallet();

    } catch (err) {
      console.error(err);
      setError("Failed to load driver data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= POLLING (STATE DRIVEN) ================= */

  // Trip requests → ONLY when available
  useEffect(() => {
    if (runtimeStatus?.runtime_status !== "available") return;

    const interval = setInterval(() => {
      loadTripRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [runtimeStatus?.runtime_status]);




  /* ================= ACTIVE TRIP SYNC ================= */

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

  /* ================= AUTH BOOTSTRAP ================= */

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDriverData();
      loadPendingPayment(); 
    } else if (!authLoading && !isAuthenticated) {
      setDriver(null);
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  /* ================= FLEET-DRIVER BOOTSTRAP ================= */

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


  /* ================= DERIVED ================= */

const can_start_shift = useMemo(() => {
  if (!driver) return false;
  if (driver.kyc_status !== "approved") return false;

  if (driver.driver_type === "fleet_driver") {
    return (
      activeShift?.shift_status === "offline" &&
      assignedVehicle !== null
    );
  }

  return (
    activeShift?.shift_status === "offline" &&
    (vehicleSummary?.active_vehicles ?? 0) > 0
  );
}, [driver, activeShift, assignedVehicle, vehicleSummary]);




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
    // 🚫 never allow manual on_trip
    if (status === "on_trip") return;
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

    await refreshRuntime(); // → trip_accepted
    setTripRequests([]);    // stop further requests
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
    await refreshRuntime(); // → on_trip
    await loadTripRequests();
    return res;
  };

  const completeTrip = async ({ trip_id, distance_km, duration_minutes }) => {
    const res = await driverApi.completeTrip(trip_id, {
      distance_km,
      duration_minutes,
    });
    await loadPendingPayment();
    await refreshRuntime(); // → available
    await refreshWallet();
    await refreshPastTrips();

    return res;
  };

  const cancelTrip = async ({ trip_id, reason }) => {
    const res = await driverApi.cancelTrip(trip_id, { reason });
    await refreshRuntime(); 
      await refreshPastTrips();
  };


   const acceptInvite = async (inviteId) => {
    const res = await driverApi.acceptFleetInvite(inviteId);

    // Mark accepted invite
    setInvites((prev) =>
      prev.map((i) =>
        i.invite_id === inviteId
          ? { ...i, invite_status: "accepted" }
          : { ...i, invite_status: "rejected" }
      )
    );

    return res;
  };

  const rejectInvite = async (inviteId) => {
    const res = await driverApi.rejectFleetInvite(inviteId);

    setInvites((prev) =>
      prev.map((i) =>
        i.invite_id === inviteId
          ? { ...i, invite_status: "rejected" }
          : i
      )
    );

    return res;
  };

const paymentconfirmation = async (tripId, paymentMethod) => {
  const res = await driverApi.confirmPayment(tripId, paymentMethod);

  // Refresh balances & history
  await refreshWallet();
  await refreshPastTrips();

  // ✅ Remove ONLY this payment
  setPendingPayments(prev =>
    prev.filter(p => p.trip_id !== tripId)
  );

  return res;
};

console.log("pending payment:",pendingPayments)





  console.log("past trips:",pastTrips)
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
      loading,
      error,
       invites,         
    assignedVehicle,

      can_start_shift,

      tripRequests,
      tripRequestsLoading,
      wallet,
      pastTrips,
      pendingPayments,

      startShift,
      endShift,
      updateRuntimeStatus,

      acceptTrip,
      rejectTrip,
      startTrip,
      completeTrip,
      cancelTrip,
      acceptInvite,
      rejectInvite,
      paymentconfirmation
    }),
    [
      driver,
      driverId,
      documents,
      activeShift,
      runtimeStatus,
      activeTrip,
      vehicleSummary,
      loading,
      error,
      tripRequests,
      tripRequestsLoading,
      invites,
      assignedVehicle,
      wallet,
      pastTrips,
      can_start_shift,
      pendingPayments,
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
