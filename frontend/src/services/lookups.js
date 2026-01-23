import api from "./axios";

/* -------- Lookup APIs -------- */

export const fetchAccountStatuses = () =>
  api.get("/lookups/account-status");

export const fetchApprovalStatuses = () =>
  api.get("/lookups/approval-status");

export const fetchCountries = () =>
  api.get("/lookups/countries");

export const fetchCities = (countryId) =>
  api.get("/lookups/cities", {
    params: countryId ? { country_id: countryId } : {},
  });

  export const fetchTenantDocumentTypes = () =>
  api.get("/lookups/tenant-document-types");