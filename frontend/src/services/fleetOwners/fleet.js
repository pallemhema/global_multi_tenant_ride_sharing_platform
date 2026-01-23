import api from "../axios";

export const fetchActiveTenants = () =>
  api.get("/public/tenants/active");

export const fetchFleetCompliance = (fleet_owner_id) =>
  api.get(`/fleet-owner/${fleet_owner_id}/compliance`);


export const selectTenantForFleetOwner = (payload) => {
  return api.post("/fleet-owner/select-tenant", payload);
};

export const fetchFleetDetails = async (fleet_owner_id) => {
  return api.get(`/fleet-owner/${fleet_owner_id}`);
};