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
    const [tenantLocations, setTenantLocations] = useState([]);

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

      if (
        fleet &&
        ["tenant_selected", "location_selected"].includes(
          fleet.onboarding_status
        )
      ) {
        await loadTenantLocations();
      }

    
    } catch (err) {
      setFleetOwner(null);
    }

    // 2️⃣ Documents (ALWAYS allowed)
    try {
      const docs = await fleetOwnerApi.getFleetDocuments();
      console.log("docuemnts:",docs);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    }

     // 2️⃣ show drivers to sent invite 
    try {
      const drivers = await fleetOwnerApi.getAvaialibleDrivers();
      setEligibleDrivers(drivers || []);
    } catch {
      setEligibleDrivers([]);
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
      setWallet(null)
    }
  }, [authLoading, isAuthenticated,fleetOwnerId]);

  /* ================= ACTIONS ================= */

  const loadTenantLocations = async () => {
    const res = await fleetOwnerApi.getTenantLocations();
    console.log(
      "loadTenantLocations:",res);
    setTenantLocations(res.countries || []);
    return res;
  };

  const selectTenant = async (tenantId) => {
    const res = await fleetOwnerApi.selectTenantForFleetOwner(tenantId);
    setFleetOwner((prev) => ({
      ...prev,
      tenant_id: tenantId,
      onboarding_status: res.onboarding_status,
    }));
    setTenantLocations(res.countries || []);
    hasLoadedRef.current = false;
    await loadInitialFleetData();
    return res;
  };

 
  const selectLocation = async (payload) => {
    const res = await fleetOwnerApi.selectLocation(payload);

    setFleetOwner((prev) => ({
      ...prev,
      country_id: payload.country_id,
      city_id: payload.city_id,
      onboarding_status: res.onboarding_status,
    }));

    return res;
  };
  

  const fillFleetDetails = async (detailsData) => {
  const res = await fleetOwnerApi.uploadFleetDetails(detailsData);

  setFleetOwner((prev) => ({
    ...prev,
    business_name: detailsData.business_name,
    contact_email: detailsData.contact_email,
    onboarding_status: res.onboarding_status,
  }));

  return res;
};


    const submitDocuments = async () => {
      const res = await fleetOwnerApi.submitDocuments();
  
      setFleetOwner((prev) => ({
        ...prev,
        onboarding_status: res.onboarding_status,
      }));
  
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

  const refreshInvitesAndEligible = async () => {
  const [invs, drivers] = await Promise.all([
    fleetOwnerApi.getDriverInvites(),
    fleetOwnerApi.getAvaialibleDrivers(),
  ]);

  setInvites(invs || []);
  setEligibleDrivers(drivers || []);
};


const inviteDriver = async (driverId) => {
  await fleetOwnerApi.inviteDriver(driverId);
  await refreshInvitesAndEligible();
};

const cancelInvite = async (inviteId) => {
  await fleetOwnerApi.cancelInvite(inviteId);
  await refreshInvitesAndEligible();
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

  console.log("fleet data from documents:", documents);
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
      tenantLocations,

      
      fillFleetDetails,
      uploadDocument,
      updateDocument,
      deleteDocument,
      inviteDriver,
      cancelInvite,
      assignVehicleToDriver,
      unassignVehicle,
      selectTenant,
      selectLocation,
      loadTenantLocations,
      submitDocuments,
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
