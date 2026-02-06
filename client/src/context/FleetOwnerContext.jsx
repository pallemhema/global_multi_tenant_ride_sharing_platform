import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { useUserAuth } from "./UserAuthContext";
import { fleetOwnerApi } from "../services/fleetOwnerApi";

const FleetOwnerContext = createContext(null);

export const FleetOwnerProvider = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useUserAuth();
  const fleetOwnerId = user?.fleet_owner_id ?? null;
  const [fleetOwner,setFleetOwner] = useState(null);

  const [documents, setDocuments] = useState([]);

  const [invites, setInvites] = useState([]);
  const [eligibleDrivers, setEligibleDrivers] = useState([])
  const [assignedDrivers, setAssignedDrivers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [fleetDrivers, setFleetDrivers] = useState([]);

  const [wallet, setWallet] = useState(null);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔒 Prevent multiple initial loads
  const hasLoadedRef = useRef(false);

   useEffect(() => {
  // 🔥 HARD RESET on auth change
  setFleetOwner(null);
  setDocuments([]);
  setInvites([]);
  setAssignedDrivers([]);
   setEligibleDrivers([])

  setFleetDrivers([]);
  setWallet(null)

  setLoading(true);
  setError(null)
 
}, [isAuthenticated]);

  /* ================= INITIAL LOAD ================= */
const loadInitialFleetData = async () => {
  setLoading(true);
  setError(null);

  try {
 
    try {
        console.log("Loading fleet owner data...");
      const fleet = await fleetOwnerApi.getFleet();
      setFleetOwner(fleet);
    } catch (err) {
      setFleetOwner(null);
    }

    // 2️⃣ Documents (ALWAYS allowed)
    try {
      const docs = await fleetOwnerApi.getFleetDocuments();
      setDocuments(docs || []);
    } catch {
      setDocuments([]);
    }

     // 2️⃣ show drivers to sent invite 
    try {
      const drivers = await fleetOwnerApi.getAvaialibleDrivers();
      setEligibleDrivers(drivers || []);
    } catch {
      setDocuments([]);
    }


    // 4️⃣ Invites
    try {
      const invs = await fleetOwnerApi.getDriverInvites();
      setInvites(invs || []);
    } catch {
      setInvites([]);
    }

    // 4️⃣ fleet Drivers
    try{
      const fltdrivers = await fleetOwnerApi.getFleetDrivers();
      setFleetDrivers(fltdrivers || []);
    } catch (err) {
      setFleetDrivers([]);
    }

    // 5️⃣ Dashboard
    try {
      const stats = await fleetOwnerApi.getDashboardStats();
      setDashboardStats(stats || null);
    } catch {
      setDashboardStats(null);
    }
      try {
      const wlt = await fleetOwnerApi.getWallet();
      setWallet(wlt || null);
    } catch {
      setWallet(null);
    }

  } finally {
    setLoading(false);
  }
};


  /* ================= AUTH EFFECT ================= */

  useEffect(() => {
    if (!authLoading && isAuthenticated && fleetOwnerId) {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        loadInitialFleetData();
      }
    }

    if (!isAuthenticated) {
      hasLoadedRef.current = false;
      setDocuments([]);
      setInvites([]);
      setEligibleDrivers([]);
      setAssignedDrivers([]);
      setDashboardStats(null);
    }
  }, [authLoading, isAuthenticated,fleetOwnerId]);

  /* ================= ACTIONS ================= */

  const registerFleetOwner = async () => {
    setLoading(true);
    try {
      const res = await fleetOwnerApi.registerFleetOwner();
      hasLoadedRef.current = false;
      await loadInitialFleetData();
      return res;
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = async (tenantId) => {
    const res = await fleetOwnerApi.selectTenantForFleetOwner(tenantId);
    hasLoadedRef.current = false;
    await loadInitialFleetData();
    return res;
  };

  const fillFleetDetails = async (detailsData) => {
    const res = await fleetOwnerApi.uploadFleetDetails(detailsData);
    hasLoadedRef.current = false;
    await loadInitialFleetData();
    return res;
  };


  /* -------- Documents -------- */

  const uploadDocument = async (payload) => {
    const doc = await fleetOwnerApi.uploadFleetDocument(payload);
    setDocuments((prev) => [...prev, doc]);
    return doc;
  };

  const updateDocument = async (documentId, payload) => {
    const updated = await fleetOwnerApi.updateFleetDocument(documentId, payload);
    setDocuments((prev) =>
      prev.map((d) => (d.document_id === documentId ? updated : d))
    );
    return updated;
  };

  const deleteDocument = async (documentId) => {
    await fleetOwnerApi.deleteFleetDocument(documentId);
    setDocuments((prev) =>
      prev.filter((d) => d.document_id !== documentId)
    );
  };





  /* -------- Drivers -------- */

  const inviteDriver = async (driverId) => {
    const invite = await fleetOwnerApi.inviteDriver(driverId);
    setInvites((prev) => [...prev, invite]);
    return invite;
  };
   const cancelInvite = async (inviteId) => {
  const updatedInvite = await fleetOwnerApi.cancelInvite(inviteId);

  setInvites((prev) =>
    prev.map((invite) =>
      invite.invite_id === updatedInvite.invite_id
        ? updatedInvite
        : invite
    )
  );

  return updatedInvite;
};


  const assignVehicleToDriver = async (inviteId, vehicleId) => {
    const assignment = await fleetOwnerApi.assignVehicleToDriver(
      inviteId,
      vehicleId
    );
    setAssignedDrivers((prev) => [...prev, assignment]);
    return assignment;
  };

  const unassignVehicle = async (assignmentId) => {
    await fleetOwnerApi.unassignVehicle(assignmentId);
    setAssignedDrivers((prev) =>
      prev.filter((a) => a.assignment_id !== assignmentId)
    );
  };

  console.log("fleet data from context:", fleetOwner);
  /* ================= CONTEXT VALUE ================= */


  const value = useMemo(
    () => ({
      fleetOwner,
      documents,
      eligibleDrivers,
      invites,
      fleetDrivers,
      assignedDrivers,
      dashboardStats,
      loading,
      error,
      wallet,

      registerFleetOwner,
      selectTenant,
      fillFleetDetails,
      uploadDocument,
      updateDocument,
      deleteDocument,
      inviteDriver,
      cancelInvite,
      assignVehicleToDriver,
      unassignVehicle,
    }),
    [
      fleetOwner,
      documents,
      eligibleDrivers,
      invites,
      fleetDrivers,
      assignedDrivers,
      dashboardStats,
      loading,
      error,
      wallet,
    ]
  );

  return (
    <FleetOwnerContext.Provider value={value}>
      {children}
    </FleetOwnerContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useFleetOwner = () => {
  const ctx = useContext(FleetOwnerContext);
  if (!ctx) {
    throw new Error("useFleetOwner must be used within FleetOwnerProvider");
  }
  return ctx;
};
