import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader } from "lucide-react";

import { useDriver } from "../../context/DriverContext";
import { lookupsAPI } from "../../services/lookups";
import DocumentUploadField from "./DocumentUploadField";

export default function DriverRegistration() {
  const navigate = useNavigate();

  const { driver, documents, loading, selectTenant, submitDocuments,selectDiverType } =
    useDriver();

  /* ---------------- STATE ---------------- */
  const [currentStep, setCurrentStep] = useState("tenant-selection");
  const [tenants, setTenants] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
 
  /* ---------------- LOOKUPS ---------------- */
  useEffect(() => {
    const load = async () => {
      const [t, d] = await Promise.all([
        lookupsAPI.getActiveTenants(),
        lookupsAPI.getDriverDocumentTypes(),
      ]);

      setTenants(t || []);
      setDocumentTypes(d.filter((doc) => doc.is_mandatory));
    };

    load();
  }, []);

  /* ---------------- HANDLERS ---------------- */

  const handleSelectTenant = async (tenantId) => {
    await selectTenant(tenantId);
    setCurrentStep("driver-type");
  };

  const handleSelectDriverType = async (type) => {
    const driver_type = await selectDiverType(type);
 
    setCurrentStep("document-upload");
    console.log(driver_type)
  };


  const handleSubmit = async () => {
    const mandatoryDocsUploaded = documentTypes.every((doc) =>
      documents.some((d) => d.document_type === doc.document_code),
    );

    if (!mandatoryDocsUploaded) {
      alert("Please upload all mandatory documents");
      return;
    }

    try {
      await submitDocuments();
      alert("Driver registration completed! Waiting for admin approval.");
      navigate("/driver/dashboard");
    } catch (err) {
      alert(err.message || "Failed to complete registration");
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

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="animate-spin" size={40} />
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((t) => (
                  <button
                    key={t.tenant_id}
                    onClick={() => handleSelectTenant(t.tenant_id)}
                    className="w-full p-4 border rounded-lg text-left hover:bg-green-50"
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
                className="w-full p-6 border rounded-lg text-left hover:bg-green-50"
              >
                <h3 className="font-bold text-lg">Individual Driver</h3>
                <p className="text-sm text-gray-600">
                  Drive your own vehicle and manage trips yourself
                </p>
              </button>

              {/* Fleet Driver */}
              <button
                onClick={() => handleSelectDriverType("fleet_driver")}
                className="w-full p-6 border rounded-lg text-left hover:bg-green-50"
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
              onClick={() => navigate("/rider/dashboard")}
              className="px-6 py-3 border rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg"
            >
              Complete Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}