import { apiClient } from "./axios";
// Auth endpoints
export const lookupsAPI = {
  getActiveTenants: async () => {
    try {
      const res = await apiClient.get("/lookups/active-tenants");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch tenants",
      );
    }
  },

  getDriverTypes: async () => {
    try {
      const res = await apiClient.get("/lookups/driver-types");
      return res.data;
    } catch (err) {
      // Return default if lookup fails
      return [
        { code: "individual", description: "Individual Driver" },
        { code: "fleet_driver", description: "Fleet Driver" },
      ];
    }
  },

  getVehicleCategories: async () => {
    try {
      const res = await apiClient.get("/lookups/vehicle-categories");
      return res.data;
    } catch (err) {
      // Return common vehicle categories as fallback
      return [
        { category_code: "sedan", description: "Sedan (4-seater)" },
        { category_code: "suv", description: "SUV/MUV" },
        { category_code: "hatchback", description: "Hatchback (5-seater)" },
        { category_code: "auto", description: "Auto/Tuk-Tuk" },
        { category_code: "bike", description: "Motorcycle/Scooter" },
      ];
    }
  },
  getDriverDocumentTypes: async () => {
    try {
      const res = await apiClient.get("/lookups/driver-document-types");
      return res.data;
    } catch (err) {
      // Return actual document types based on user's data
      return [
        {
          code: "DRIVING_LICENSE",
          description: "Valid Driving License",
          is_mandatory: true,
        },
        {
          code: "PROFILE_PHOTO",
          description: "Driver Profile Photograph",
          is_mandatory: true,
        },
        {
          code: "ID_PROOF",
          description: "Government Issued ID Proof (Aadhaar / Passport)",
          is_mandatory: true,
        },
        {
          code: "ADDRESS_PROOF",
          description: "Residential Address Proof",
          is_mandatory: false,
        },
        {
          code: "POLICE_VERIFICATION",
          description: "Police Verification Certificate",
          is_mandatory: false,
        },
        {
          code: "BACKGROUND_CHECK",
          description: "Background Verification Report",
          is_mandatory: false,
        },
        {
          code: "MEDICAL_CERT",
          description: "Medical Fitness Certificate",
          is_mandatory: false,
        },
        {
          code: "DRIVER_BADGE",
          description: "Platform Issued Driver Badge",
          is_mandatory: false,
        },
      ];
    }
  },

  getVehicleDocumentTypes: async () => {
    try {
      const res = await apiClient.get("/lookups/vehicle-document-types");
      return res.data;
    } catch (err) {
      // 🔁 FALLBACK: Vehicle document types (frontend safety net)
      return [
        {
          document_code: "RC",
          description: "Registration Certificate",
          is_mandatory: true,
        },
        {
          document_code: "INSURANCE",
          description: "Commercial Vehicle Insurance",
          is_mandatory: true,
        },
        {
          document_code: "PUC",
          description: "Pollution Under Control Certificate",
          is_mandatory: true,
        },
        {
          document_code: "COMMERCIAL_PERMIT",
          description: "Commercial Taxi Permit",
          is_mandatory: true,
        },
        {
          document_code: "FITNESS",
          description: "Vehicle Fitness Certificate",
          is_mandatory: true,
        },

        {
          document_code: "TAXI_BADGE",
          description: "Taxi Identification Badge",
          is_mandatory: false,
        },
        {
          document_code: "ROAD_TAX",
          description: "Road Tax Payment Receipt",
          is_mandatory: false,
        },
        {
          document_code: "VEHICLE_INSPECTION",
          description: "Platform Vehicle Inspection",
          is_mandatory: false,
        },
        {
          document_code: "GPS_CERT",
          description: "GPS Installation Certificate",
          is_mandatory: false,
        },
        {
          document_code: "CNG_CERT",
          description: "CNG/LPG Safety Certificate",
          is_mandatory: false,
        },
      ];
    }
  },

  getFleetOwnerDocumentTypes: async () => {
    try {
      const res = await apiClient.get("/lookups/fleet-owner-document-types");
      return res.data;
    } catch (err) {
      // 🔁 FALLBACK: Fleet owner document types
      return [
        {
          document_code: "BUSINESS_REGISTRATION",
          document_name: "Business Registration Certificate",
          is_mandatory: true,
        },
        {
          document_code: "TAX_CERTIFICATE",
          document_name: "Tax Registration Certificate",
          is_mandatory: true,
        },
        {
          document_code: "INSURANCE",
          document_name: "Fleet Insurance Policy",
          is_mandatory: true,
        },
        {
          document_code: "OFFICE_PROOF",
          document_name: "Office Address Proof",
          is_mandatory: true,
        },
        {
          document_code: "AUTHORIZATION",
          document_name: "Authorization Documents",
          is_mandatory: false,
        },
      ];
    }
  },

  fetchAccountStatuses: () => {
    return apiClient.get("/lookups/account-status");
  },
 fetchCountries: async () => {
    const res = await apiClient.get("/lookups/countries");
    return res.data;
  },

  fetchCities: async (countryId) => {
    const res = await apiClient.get("/lookups/cities", {
      params: countryId ? { country_id: countryId } : {},
    });
    return res.data;
  },
  fetchTenantFleetDocumentTypes: () => {
    return apiClient.get("/lookups/tenant-fleet-document-types");
  },
};

