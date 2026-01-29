import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useUserAuth } from "./UserAuthContext";
import { fleetOwnerApi } from "../services/fleetOwnerApi";

const FleetOwnerContext = createContext(null);

export const FleetOwnerProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useUserAuth();

  const [fleetOwner, setFleetOwner] = useState(null);
  const fleetOwnerId = fleetOwner?.fleet_owner_id ?? null;

  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [invites, setInvites] = useState([]);
  const [assignedDrivers, setAssignedDrivers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Reset fleet-scoped state when fleet owner changes */
  useEffect(() => {
    setDocuments([]);
    setVehicles([]);
    setInvites([]);
    setAssignedDrivers([]);
    setDashboardStats(null);
  }, [fleetOwnerId]);

  const loadFleetOwnerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const status = await fleetOwnerApi.getFleetOnboardingStatus();
      setFleetOwner(status);

      if (!status?.fleet_owner_id) {
        setDocuments([]);
        setVehicles([]);
        setInvites([]);
        return;
      }

      try {
        const docs = await fleetOwnerApi.getFleetDocuments();
        console.log("docs:", docs);
        setDocuments(docs || []);
      } catch (docErr) {
        console.error("Failed to fetch documents:", docErr);
        setDocuments([]);
      }

      try {
        const vehcls = await fleetOwnerApi.getFleetVehicles();
        setVehicles(vehcls || []);
      } catch (vehErr) {
        console.error("Failed to fetch vehicles:", vehErr);
        setVehicles([]);
      }

      try {
        const invts = await fleetOwnerApi.getDriverInvites();
        setInvites(invts || []);
      } catch (invErr) {
        console.error("Failed to fetch invites:", invErr);
        setInvites([]);
      }

      try {
        const stats = await fleetOwnerApi.getDashboardStats();
        setDashboardStats(stats || null);
      } catch (statsErr) {
        console.error("Failed to fetch stats:", statsErr);
        setDashboardStats(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load fleet owner data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadFleetOwnerData();
    } else if (!authLoading && !isAuthenticated) {
      setFleetOwner(null);
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  /* ================= ACTIONS ================= */

  const registerFleetOwner = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fleetOwnerApi.registerFleetOwner();
      await loadFleetOwnerData();
      return res;
    } catch (err) {
      setError(err.message || "Failed to register as fleet owner");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = async (tenantId) => {
    const res = await fleetOwnerApi.selectTenantForFleetOwner(tenantId);
    await loadFleetOwnerData();
    return res;
  };

  const uploadDocument = async (payload) => {
    const res = await fleetOwnerApi.uploadFleetDocument(payload);
    await loadFleetOwnerData();
    return res;
  };

  const updateDocument = async (documentId, payload) => {
    const res = await fleetOwnerApi.updateFleetDocument(documentId, payload);
    await loadFleetOwnerData();
    return res;
  };

  const deleteDocument = async (documentId) => {
    await fleetOwnerApi.deleteFleetDocument(documentId);
    await loadFleetOwnerData();
  };

  const fillFleetDetails = async (payload) => {
    const res = await fleetOwnerApi.fillFleetDetails(payload);
    await loadFleetOwnerData();
    return res;
  };

  const addVehicle = async (payload) => {
    const res = await fleetOwnerApi.addFleetVehicle(payload);
    await loadFleetOwnerData();
    return res;
  };

  const updateVehicle = async (vehicleId, payload) => {
    const res = await fleetOwnerApi.updateFleetVehicle(vehicleId, payload);
    await loadFleetOwnerData();
    return res;
  };

  const deleteVehicle = async (vehicleId) => {
    await fleetOwnerApi.deleteFleetVehicle(vehicleId);
    await loadFleetOwnerData();
  };

  const inviteDriver = async (driverId) => {
    const res = await fleetOwnerApi.inviteDriver(driverId);
    await loadFleetOwnerData();
    return res;
  };

  const assignVehicleToDriver = async (inviteId, vehicleId) => {
    const res = await fleetOwnerApi.assignVehicleToDriver(inviteId, vehicleId);
    await loadFleetOwnerData();
    return res;
  };

  const unassignVehicle = async (assignmentId) => {
    const res = await fleetOwnerApi.unassignVehicle(assignmentId);
    await loadFleetOwnerData();
    return res;
  };

  const value = useMemo(
    () => ({
      fleetOwner,
      fleetOwnerId,
      documents,
      vehicles,
      invites,
      assignedDrivers,
      dashboardStats,
      loading,
      error,

      registerFleetOwner,
      selectTenant,
      uploadDocument,
      updateDocument,
      deleteDocument,
      fillFleetDetails,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      inviteDriver,
      assignVehicleToDriver,
      unassignVehicle,
      loadFleetOwnerData,
    }),
    [
      fleetOwner,
      fleetOwnerId,
      documents,
      vehicles,
      invites,
      assignedDrivers,
      dashboardStats,
      loading,
      error,
    ],
  );

  return (
    <FleetOwnerContext.Provider value={value}>
      {children}
    </FleetOwnerContext.Provider>
  );
};

export const useFleetOwner = () => {
  const ctx = useContext(FleetOwnerContext);
  if (!ctx) {
    throw new Error("useFleetOwner must be used inside FleetOwnerProvider");
  }
  return ctx;
};
