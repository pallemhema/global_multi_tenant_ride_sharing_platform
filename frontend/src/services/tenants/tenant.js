import api from "../axios";
export const fetchTenantCompliance = (tenantId) =>
  api.get(`/tenant-admin/${tenantId}/compliance-status`);
export const fetchTenantDetails = (tenantId) => api.get(`/tenant-admin/${tenantId}`);

export const fetchTenantRegions = (tenantId) =>
  api.get(`/tenant-admin/${tenantId}/regions`);

export const addTenantRegion = (tenantId, payload) =>
  api.post(`/tenant-admin/${tenantId}/regions`, payload);

export const enableRegionCity = (tenantId, cityId) =>
  api.patch(`/tenant-admin/${tenantId}/regions/${cityId}/enable`);

export const disableRegionCity = (tenantId, cityId) =>
  api.patch(`/tenant-admin/${tenantId}/regions/${cityId}/disable`);

export const fetchAvailableCities = (tenantId, countryId) =>
  api.get(`/tenant-admin/${tenantId}/regions/available-cities`, {
    params: { country_id: countryId },
  });

