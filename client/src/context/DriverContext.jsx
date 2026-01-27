// src/context/DriverContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { driverApi } from '../services/driverApi';

const DriverContext = createContext(null);

export const DriverProvider = ({ children }) => {
  /* ---------- STATE ---------- */
  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [vehicleSummary, setVehicleSummary] = useState(null);
  const [invites, setInvites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitesLoading, setInvitesLoading] = useState(false);

  /* ---------- CORE LOADER ---------- */
  const loadDriverData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await driverApi.getDriverProfile();
      setDriver(profile.driver);

      setDocuments(await driverApi.getDriverDocuments());
      setActiveShift(await driverApi.getShiftStatus());
      setRuntimeStatus(await driverApi.getRuntimeStatus());
      setVehicleSummary(await driverApi.getVehicleSummary());

    } catch (err) {
      console.error(err);
      setError('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- INVITES ---------- */
  const loadDriverInvites = async () => {
    if (driver?.driver_type !== 'fleet_driver') return;
    try {
      setInvitesLoading(true);
      setInvites(await driverApi.getDriverInvites());
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, []);

  useEffect(() => {
    if (driver?.driver_type === 'fleet_driver') {
      loadDriverInvites();
    }
  }, [driver?.driver_type]);

  /* ---------- DERIVED ---------- */
  const can_start_shift =
    driver?.kyc_status === 'approved' &&
    activeShift?.shift_status === 'offline' &&
    vehicleSummary?.can_start_shift === true;

  console.log(driver?.kyc_status, activeShift?.shift_status, vehicleSummary?.can_start_shift); 


  /* ---------- ACTION WRAPPERS ---------- */
  const startShift = async payload => {
    await driverApi.startShift(payload);
    await loadDriverData();
  };

  const endShift = async () => {
    await driverApi.endShift();
    await loadDriverData();
  };

  const setRuntimeStatusAction = async status => {
    await driverApi.updateRuntimeStatus(status);
    await loadDriverData();
  };

  const sendHeartbeat = async payload =>
    driverApi.sendLocationHeartbeat(payload);

  /* ---------- CONTEXT VALUE ---------- */
  return (
    <DriverContext.Provider
      value={{
        // state
        driver,
        documents,
        activeShift,
        runtimeStatus,
        vehicleSummary,
        invites,

        loading,
        error,
        invitesLoading,

        // derived
        can_start_shift,

        // actions
        refresh: loadDriverData,
        refreshInvites: loadDriverInvites,

        startShift,
        endShift,
        setRuntimeStatus: setRuntimeStatusAction,
        sendHeartbeat,

        uploadDocument: driverApi.uploadDriverDocument,
        deleteDocument: driverApi.deleteDriverDocument,
        updateProfile: driverApi.updateDriverProfile,
        selectTenant: driverApi.selectTenantForDriver,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver must be used inside DriverProvider');
  return ctx;
};
