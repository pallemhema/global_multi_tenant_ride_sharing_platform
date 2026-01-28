import { createContext, useContext, useEffect, useState } from "react";
import { vehicleApi } from "../services/vehicleApi";
import { useUserAuth } from "./UserAuthContext";

const VehicleContext = createContext(null);

export const VehicleProvider = ({ children }) => {
  const { role } = useUserAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- Load vehicles ---------- */
  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleApi.listVehicles();
      setVehicles(data || []);
    } catch (err) {
      setError("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load vehicles for drivers and fleet owners
    if (role === "driver" || role === "fleet-owner") {
      loadVehicles();
    } else {
      setVehicles([]);
      setLoading(false);
    }
  }, [role]);

  /* ---------- Vehicle CRUD ---------- */
  const createVehicle = async (payload) => {
    const v = await vehicleApi.createVehicle(payload);
    await loadVehicles();
    return v;
  };

  const updateVehicle = async (vehicleId, payload) => {
    await vehicleApi.updateVehicle(vehicleId, payload);
    await loadVehicles();
  };

  const deleteVehicle = async (vehicleId) => {
    await vehicleApi.deleteVehicle(vehicleId);
    await loadVehicles();
  };

  /* ---------- Documents ---------- */
  const getVehicleDocuments = async (vehicleId) =>
    vehicleApi.listVehicleDocuments(vehicleId);

  const uploadVehicleDocument = async (vehicleId, payload) =>
    vehicleApi.uploadVehicleDocument(vehicleId, payload);

  const updateVehicleDocument = async (vehicleId, documentId, payload) =>
    vehicleApi.updateVehicleDocument(vehicleId, documentId, payload);

  const deleteVehicleDocument = async (vehicleId, documentId) =>
    vehicleApi.deleteVehicleDocument(vehicleId, documentId);

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        loading,
        error,

        refresh: loadVehicles,

        createVehicle,
        updateVehicle,
        deleteVehicle,

        getVehicleDocuments,
        uploadVehicleDocument,
        deleteVehicleDocument,
        updateVehicleDocument,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicles = () => {
  const ctx = useContext(VehicleContext);
  if (!ctx) {
    throw new Error("useVehicles must be used inside VehicleProvider");
  }
  return ctx;
};
