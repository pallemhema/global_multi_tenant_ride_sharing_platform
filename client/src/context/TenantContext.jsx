import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAdminAuth } from "./AdminAuthContext";
import { tenantAdminAPI } from "../services/tenantAdminApi";

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const { user } = useAdminAuth();

  // Tenant State
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard
  const [dashboardStats, setDashboardStats] = useState(null);

  // Documents
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  // Regions
  const [regions, setRegions] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  // Vehicles
  const [vehicles, setVehicles] = useState([]);

  // Fleet Owners
  const [fleetOwners, setFleetOwners] = useState([]);

  // Drivers
  const [drivers, setDrivers] = useState([]);

  const [wallet,setWallet] = useState(null);

  // Get tenant ID from user context
  const tenantId = user?.tenant_id;

  useEffect(() => {
    setTenant(null);
    setDashboardStats(null);
    setDocuments([]);
    setDocumentTypes([]);
    setRegions([]);
    setAvailableCities([]);
    setVehicles([]);
    setFleetOwners([]);
    setDrivers([]);
    setWallet(null);
  }, [user]);

  // ========================================
  // LOAD TENANT DATA
  // ========================================
  const loadTenantProfile = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const res = await tenantAdminAPI.getTenantProfile(tenantId);
      setTenant(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load tenant profile:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // ========================================
  // DASHBOARD ACTIONS
  // ========================================
  const loadDashboardStats = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await tenantAdminAPI.getDashboardStats(tenantId);
      setDashboardStats(res.data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    }
  }, [tenantId]);

  // ========================================
  // DOCUMENT ACTIONS
  // ========================================
  const loadDocuments = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await tenantAdminAPI.getDocuments(tenantId);
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [tenantId]);

  const loadDocumentTypes = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await tenantAdminAPI.getDocumentTypes(tenantId);
      setDocumentTypes(res.data);
    } catch (err) {
      console.error("Failed to load document types:", err);
    }
  }, [tenantId]);

  const uploadDocument = useCallback(
    async (formData) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.uploadDocument(tenantId, formData);
      await loadDocuments();
      return res.data;
    },
    [tenantId, loadDocuments],
  );

  const updateDocument = useCallback(
    async (docId, formData) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.updateDocument(
        tenantId,
        docId,
        formData,
      );
      await loadDocuments();
      return res.data;
    },
    [tenantId, loadDocuments],
  );

  const deleteDocument = useCallback(
    async (docId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      await tenantAdminAPI.deleteDocument(tenantId, docId);
      await loadDocuments();
    },
    [tenantId, loadDocuments],
  );

  // ========================================
  // REGION ACTIONS
  // ========================================
  const loadRegions = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await tenantAdminAPI.getRegions(tenantId);
      setRegions(res.data);
    } catch (err) {
      console.error("Failed to load regions:", err);
    }
  }, [tenantId]);

  const loadAvailableCities = useCallback(
    async (countryId) => {
      if (!tenantId) return;
      try {
        const res = await tenantAdminAPI.getAvailableCities(
          tenantId,
          countryId,
        );
        setAvailableCities(res.data);
      } catch (err) {
        console.error("Failed to load available cities:", err);
      }
    },
    [tenantId],
  );

  const addRegion = useCallback(
    
    async (data) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.addRegion(tenantId, data);
      await loadRegions();
      return res.data;
    },
    [tenantId, loadRegions],
  );

  const updateRegionCity = useCallback(
    async (regionId, data) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.updateRegionCity(
        tenantId,
        regionId,
        data,
      );
      await loadRegions();
      return res.data;
    },
    [tenantId, loadRegions],
  );

  const enableRegionCity = useCallback(
    async (cityId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.enableRegionCity(tenantId, cityId);
      await loadRegions();
      return res.data;
    },
    [tenantId, loadRegions],
  );

  const disableRegionCity = useCallback(
    async (cityId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.disableRegionCity(tenantId, cityId);
      await loadRegions();
      return res.data;
    },
    [tenantId, loadRegions],
  );

  // ========================================
  // VEHICLE ACTIONS
  // ========================================
  const loadVehicles = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await tenantAdminAPI.getVehicles(tenantId);
      setVehicles(res.data);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    }
  }, [tenantId]);

  const getVehicleDocuments = useCallback(
    async (vehicleId) => {
      if (!tenantId) return [];
      try {
        const res = await tenantAdminAPI.getVehicleDocuments(
          tenantId,
          vehicleId,
        );
        return res.data;
      } catch (err) {
        console.error("Failed to load vehicle documents:", err);
        return [];
      }
    },
    [tenantId],
  );

  const approveVehicleDocument = useCallback(
    async (vehicleId, docId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.approveVehicleDocument(
        tenantId,
        vehicleId,
        docId,
      );
      await loadVehicles();
      return res.data;
    },
    [tenantId, loadVehicles],
  );

  const rejectVehicleDocument = useCallback(
    async (vehicleId, docId, reason) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.rejectVehicleDocument(
        tenantId,
        vehicleId,
        docId,
        reason,
      );
      await loadVehicles();
      return res.data;
    },
    [tenantId, loadVehicles],
  );

  const approveVehicle = useCallback(
    async (vehicleId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.approveVehicle(tenantId, vehicleId);
      await loadVehicles();
      return res.data;
    },
    [tenantId, loadVehicles],
  );

  // ========================================
  // FLEET OWNER ACTIONS
  // ========================================
  const loadFleetOwners = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await tenantAdminAPI.getFleetOwners(tenantId);
      setFleetOwners(res.data);
    } catch (err) {
      console.error("Failed to load fleet owners:", err);
    }
  }, [tenantId]);

  const getFleetOwnerDocuments = useCallback(
    async (fleetOwnerId) => {
      if (!tenantId) return [];
      try {
        const res = await tenantAdminAPI.getFleetOwnerDocuments(
          tenantId,
          fleetOwnerId,
        );
        return res.data;
      } catch (err) {
        console.error("Failed to load fleet owner documents:", err);
        return [];
      }
    },
    [tenantId],
  );

  const approveFleetOwnerDocument = useCallback(
    async (fleetOwnerId, docId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.approveFleetOwnerDocument(
        tenantId,
        fleetOwnerId,
        docId,
      );
      await loadFleetOwners();
      return res.data;
    },
    [tenantId, loadFleetOwners],
  );

  const rejectFleetOwnerDocument = useCallback(
    async (fleetOwnerId, docId, reason) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.rejectFleetOwnerDocument(
        tenantId,
        fleetOwnerId,
        docId,
        reason,
      );
      await loadFleetOwners();
      return res.data;
    },
    [tenantId, loadFleetOwners],
  );

  const approveFleetOwner = useCallback(
    async (fleetOwnerId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.approveFleetOwner(
        tenantId,
        fleetOwnerId,
      );
      await loadFleetOwners();
      return res.data;
    },
    [tenantId, loadFleetOwners],
  );

  // ========================================
  // DRIVER ACTIONS
  // ========================================
  const loadDrivers = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await tenantAdminAPI.getDrivers(tenantId);
      setDrivers(res.data);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    }
  }, [tenantId]);

  const getDriverDocuments = useCallback(
    async (driverId) => {
      if (!tenantId) return [];
      try {
        const res = await tenantAdminAPI.getDriverDocuments(tenantId, driverId);
        return res.data;
      } catch (err) {
        console.error("Failed to load driver documents:", err);
        return [];
      }
    },
    [tenantId],
  );

  const approveDriverDocument = useCallback(
    async (driverId, docId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.approveDriverDocument(
        tenantId,
        driverId,
        docId,
      );
      await loadDrivers();
      return res.data;
    },
    [tenantId, loadDrivers],
  );

  const rejectDriverDocument = useCallback(
    async (driverId, docId, reason) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.rejectDriverDocument(
        tenantId,
        driverId,
        docId,
        reason,
      );
      await loadDrivers();
      return res.data;
    },
    [tenantId, loadDrivers],
  );

  const approveDriver = useCallback(
    async (driverId) => {
      if (!tenantId) throw new Error("Tenant ID not found");
      const res = await tenantAdminAPI.approveDriver(tenantId, driverId);
      await loadDrivers();
      return res.data;
    },
    [tenantId, loadDrivers],
  );

  const loadWallet = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await tenantAdminAPI.getWallet();
      console.log("Wallet data fetched:", res);
      setWallet(res.data);
    } catch (err) {
      console.error("Failed to load wallet:", err);
    }
  }, [tenantId]);

  console.log("wallet in context:", wallet);

  // ========================================
  // INITIAL LOAD
  // ========================================
  useEffect(() => {
    if (tenantId) {
      loadTenantProfile();
      loadDashboardStats();
      loadDocumentTypes();
      loadDocuments();
      loadRegions();
      loadVehicles();
      loadFleetOwners();
      loadDrivers();
      loadWallet();
    }
  }, [
    tenantId,
    loadTenantProfile,
    loadDashboardStats,
    loadDocumentTypes,
    loadDocuments,
    loadRegions,
    loadVehicles,
    loadFleetOwners,
    loadDrivers,
    loadWallet,
  ]);

  // ========================================
  // CONTEXT VALUE
  // ========================================
  const value = useMemo(
    () => ({
      // Tenant State
      tenant,
      loading,
      error,

      // Dashboard
      dashboardStats,
      loadDashboardStats,

      // Documents
      documents,
      documentTypes,
      loadDocuments,
      loadDocumentTypes,
      uploadDocument,
      updateDocument,
      deleteDocument,

      // Regions
      regions,
      availableCities,
      wallet,
      loadRegions,
      loadAvailableCities,
      addRegion,
      updateRegionCity,
      enableRegionCity,
      disableRegionCity,

      // Vehicles
      vehicles,
      loadVehicles,
      getVehicleDocuments,
      approveVehicleDocument,
      rejectVehicleDocument,
      approveVehicle,

      // Fleet Owners
      fleetOwners,
      loadFleetOwners,
      getFleetOwnerDocuments,
      approveFleetOwnerDocument,
      rejectFleetOwnerDocument,
      approveFleetOwner,

      // Drivers
      drivers,
      loadDrivers,
      getDriverDocuments,
      approveDriverDocument,
      rejectDriverDocument,
      approveDriver,
    }),
    [
      tenant,
      loading,
      error,
      dashboardStats,
      loadDashboardStats,
      documents,
      documentTypes,
      loadDocuments,
      loadDocumentTypes,
      uploadDocument,
      updateDocument,
      deleteDocument,
      regions,
      availableCities,
      wallet,
      loadRegions,
      loadAvailableCities,
      addRegion,
      updateRegionCity,
      enableRegionCity,
      disableRegionCity,
      vehicles,
      loadVehicles,
      getVehicleDocuments,
      approveVehicleDocument,
      rejectVehicleDocument,
      approveVehicle,
      fleetOwners,
      loadFleetOwners,
      getFleetOwnerDocuments,
      approveFleetOwnerDocument,
      rejectFleetOwnerDocument,
      approveFleetOwner,
      drivers,
      loadDrivers,
      getDriverDocuments,
      approveDriverDocument,
      rejectDriverDocument,
      approveDriver,
    ],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
};
