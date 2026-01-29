import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader, AlertCircle } from "lucide-react";

import { useFleetOwner } from "../../context/FleetOwnerContext";
import { lookupsAPI } from "../../services/lookups";
import FleetDocumentCard from "../fleets/FleetDocumentCard";

export default function FleetRegistration() {
  const navigate = useNavigate();

  const {
    fleetOwner,
    loading,
    registerFleetOwner,
    selectTenant,
    fillFleetDetails,
    uploadDocument,
    updateDocument,
    deleteDocument,
    documents,
  } = useFleetOwner();

  const [currentStep, setCurrentStep] = useState("register");
  const [tenants, setTenants] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [registering, setRegistering] = useState(false);

  const [fleetDetails, setFleetDetails] = useState({
    business_name: "",
    contact_email: "",
  });

  /* ===============================
     INIT REGISTRATION
  =============================== */
  useEffect(() => {
    const init = async () => {
      if (!fleetOwner) {
        try {
          setRegistering(true);
          await registerFleetOwner();
          setCurrentStep("tenant-selection");
        } catch (err) {
          alert(err.message || "Failed to register fleet owner");
          navigate("/rider/dashboard");
        } finally {
          setRegistering(false);
        }
      } else {
        setCurrentStep("tenant-selection");
      }
    };

    init();
  }, []);

  /* ===============================
     LOAD LOOKUPS
  =============================== */
  useEffect(() => {
    const load = async () => {
      try {
        const [tenantsRes, docsRes] = await Promise.all([
          lookupsAPI.getActiveTenants(),
          lookupsAPI.getFleetOwnerDocumentTypes(),
        ]);

        setTenants(tenantsRes || []);
        setDocumentTypes((docsRes || []).filter((d) => d.is_mandatory));
      } catch (err) {
        console.error("Failed to load lookups", err);
      }
    };

    load();
  }, []);

  /* ===============================
     HANDLERS
  =============================== */
  const handleSelectTenant = async (tenantId) => {
    try {
      await selectTenant(tenantId);
      setFleetDetails({
        business_name: fleetOwner?.business_name || "",
        contact_email: fleetOwner?.contact_email || "",
      });
      setCurrentStep("details");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveDetails = async () => {
    if (!fleetDetails.business_name.trim()) {
      alert("Business name is required");
      return;
    }

    try {
      await fillFleetDetails(fleetDetails);
      setCurrentStep("documents");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteRegistration = async () => {
    alert("Fleet registration completed. Awaiting approval.");
    navigate("/fleet/dashboard");
  };

  /* ===============================
     STEP 0: CREATING FLEET
  =============================== */
  if (currentStep === "register" || registering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <h2 className="text-xl font-bold">Creating Fleet Account…</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  /* ===============================
     STEP 1: TENANT SELECTION
  =============================== */
  if (currentStep === "tenant-selection") {
    return (
      <div className="min-h-screen bg-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/rider/dashboard")}
            className="flex items-center gap-2 text-purple-600 mb-6 font-semibold"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="bg-white p-8 rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-2">Select Tenant</h1>
            <p className="text-gray-600 mb-6">
              Step 1 of 3: Choose your operating tenant
            </p>

            {loading ? (
              <Loader className="animate-spin mx-auto" />
            ) : (
              <div className="space-y-4">
                {tenants.map((t) => (
                  <button
                    key={t.tenant_id}
                    onClick={() => handleSelectTenant(t.tenant_id)}
                    className="w-full border p-4 rounded-lg hover:bg-purple-50 hover:border-purple-400 text-left"
                  >
                    <h3 className="font-semibold">{t.tenant_name}</h3>
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

  /* ===============================
     STEP 2: FLEET DETAILS
  =============================== */
  if (currentStep === "details") {
    return (
      <div className="min-h-screen bg-purple-50 p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentStep("tenant-selection")}
            className="flex items-center gap-2 text-purple-600 mb-6 font-semibold"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="bg-white p-8 rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-2">Fleet Details</h1>
            <p className="text-gray-600 mb-6">
              Step 2 of 3: Business information
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Business Name *"
                value={fleetDetails.business_name}
                onChange={(e) =>
                  setFleetDetails({
                    ...fleetDetails,
                    business_name: e.target.value,
                  })
                }
                className="input"
              />

              <input
                type="email"
                placeholder="Contact Email"
                value={fleetDetails.contact_email}
                onChange={(e) =>
                  setFleetDetails({
                    ...fleetDetails,
                    contact_email: e.target.value,
                  })
                }
                className="input"
              />

              <button
                onClick={handleSaveDetails}
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===============================
     STEP 3: DOCUMENTS (REUSED CARD)
  =============================== */
  if (currentStep === "documents") {
    const mandatoryUploaded = documentTypes.every((doc) =>
      documents.some((d) => d.document_type === doc.document_code),
    );

    console.log("Document status:", {
      totalDocumentTypes: documentTypes.length,
      totalDocuments: documents.length,
      mandatoryDocs: documentTypes.map((d) => d.document_code),
      uploadedDocs: documents.map((d) => d.document_type),
      mandatoryUploaded,
    });

    return (
      <div className="min-h-screen bg-purple-50 p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setCurrentStep("details")}
            className="flex items-center gap-2 text-purple-600 mb-6 font-semibold"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="bg-white p-8 rounded-lg shadow space-y-6">
            <h1 className="text-3xl font-bold">Upload Documents</h1>
            <p className="text-gray-600">Step 3 of 3: Mandatory documents</p>

            {documentTypes.map((docType) => {
              const uploadedDoc = documents.find(
                (d) => d.document_type === docType.document_code,
              );

              return (
                <FleetDocumentCard
                  key={docType.document_code}
                  docType={docType}
                  uploadedDoc={uploadedDoc}
                  onUpload={uploadDocument}
                  onUpdate={updateDocument}
                  onDelete={deleteDocument}
                />
              );
            })}

            <button
              disabled={!mandatoryUploaded}
              onClick={handleCompleteRegistration}
              className={`w-full py-3 rounded-lg font-semibold ${
                mandatoryUploaded
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              Complete Registration
            </button>

            {!mandatoryUploaded && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                Upload all mandatory documents to continue
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}
