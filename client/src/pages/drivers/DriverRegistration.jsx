import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader } from "lucide-react";
import { toast } from "react-toastify";

import { useDriver } from "../../context/DriverContext";
import { lookupsAPI } from "../../services/lookups";
import { driverApi } from "../../services/driverApi";
import DocumentUploadField from "./DocumentUploadField";

export default function DriverRegistration() {
  const navigate = useNavigate();

  const { documents, loading: driverLoading } = useDriver();

  /* ---------------- STATE ---------------- */
  const [currentStep, setCurrentStep] = useState("tenant-selection");
  const [tenants, setTenants] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedDriverType, setSelectedDriverType] = useState(null);
  const [loading, setLoading] = useState(false);
 
  /* ---------------- LOOKUPS ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const [t, d] = await Promise.all([
          lookupsAPI.getActiveTenants(),
          lookupsAPI.getDriverDocumentTypes(),
        ]);

        setTenants(t || []);
        setDocumentTypes(d.filter((doc) => doc.is_mandatory));
      } catch (err) {
        toast.error("Failed to load data. Please refresh.");
        console.error(err);
      }
    };

    load();
  }, []);

  /* ---------------- HANDLERS ---------------- */

  const handleSelectTenant = async (tenantId) => {
    try {
      setLoading(true);
      // Call backend API to select tenant
      await driverApi.selectTenantForDriver(tenantId);
      setSelectedTenant(tenantId);
      setCurrentStep("driver-type");
      toast.success("Tenant selected");
    } catch (err) {
      toast.error(err.message || "Failed to select tenant");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDriverType = async (type) => {
    try {
      setLoading(true);
      // Call backend API to update driver type
      await driverApi.updateDriverType(type);
      setSelectedDriverType(type);
      setCurrentStep("document-upload");
      toast.success("Driver type selected");
    } catch (err) {
      toast.error(err.message || "Failed to select driver type");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const mandatoryDocsUploaded = documentTypes.every((doc) =>
      documents.some((d) => d.document_type === doc.document_code),
    );

    if (!mandatoryDocsUploaded) {
      toast.error("Please upload all mandatory documents");
      return;
    }

    try {
      setLoading(true);
      // Call backend API to submit documents and complete registration
      await driverApi.submitDocuments();
      toast.success("Driver registration completed! Waiting for admin approval.");
      navigate("/driver/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to complete registration");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STEP 1: TENANT SELECTION
  ========================================================= */

  if (currentStep === "tenant-selection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/rider/dashboard")}
            className="flex items-center gap-2 text-green-600 mb-6 font-semibold"
          >
            <ArrowLeft size={20} /> Back
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Register as Driver</h1>
            <p className="text-gray-600 mb-8">Step 1 of 3: Select Tenant</p>

            {tenants.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader className="animate-spin" size={40} />
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((t) => (
                  <button
                    key={t.tenant_id}
                    onClick={() => handleSelectTenant(t.tenant_id)}
                    disabled={loading}
                    className="w-full p-4 border rounded-lg text-left hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <h3 className="font-bold">{t.tenant_name}</h3>
                    <p className="text-sm text-gray-600">{t.legal_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     STEP 2: DRIVER TYPE SELECTION
  ========================================================= */

  if (currentStep === "driver-type") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setCurrentStep("tenant-selection")}
            className="flex items-center gap-2 text-green-600 mb-6 font-semibold"
          >
            <ArrowLeft size={20} /> Back
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Select Driver Type</h1>
            <p className="text-gray-600 mb-8">
              Step 2 of 3: Choose how you want to operate
            </p>

            <div className="space-y-4">
              {/* Individual Driver */}
              <button
                onClick={() => handleSelectDriverType("individual")}
                disabled={loading}
                className="w-full p-6 border rounded-lg text-left hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <h3 className="font-bold text-lg">Individual Driver</h3>
                <p className="text-sm text-gray-600">
                  Drive your own vehicle and manage trips yourself
                </p>
              </button>

              {/* Fleet Driver */}
              <button
                onClick={() => handleSelectDriverType("fleet_driver")}
                disabled={loading}
                className="w-full p-6 border rounded-lg text-left hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <h3 className="font-bold text-lg">Fleet Driver</h3>
                <p className="text-sm text-gray-600">
                  Drive vehicles owned by a fleet operator
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     STEP 3: DOCUMENT UPLOAD
  ========================================================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setCurrentStep("driver-type")}
          className="flex items-center gap-2 text-green-600 mb-6 font-semibold"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
          <p className="text-gray-600 mb-6">
            Step 3 of 3: Mandatory documents
          </p>

          <div className="space-y-6">
            {documentTypes.map((docType) => (
              <DocumentUploadField
                key={docType.document_code}
                docType={docType}
              />
            ))}
          </div>

          <div className="mt-8 flex gap-4 pt-6 border-t">
            <button
            
              className="px-6 py-3 border rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg disabled:bg-gray-400"
            >
              {loading ? "Submitting..." : "Complete Registration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}