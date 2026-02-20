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
    tenantLocations,
    selectTenant,
    selectLocation,
    fillFleetDetails,
    uploadDocument,
    updateDocument,
    deleteDocument,
    documents,
    submitDocuments,
  } = useFleetOwner();

  const [currentStep, setCurrentStep] = useState("tenant-selection");
  const [tenants, setTenants] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(null);

  const [fleetDetails, setFleetDetails] = useState({
    business_name: "",
    contact_email: "",
  });


  console.log(tenantLocations)

  /* ============================================
     RESUME LOGIC
  ============================================ */
  useEffect(() => {
    if (!fleetOwner) return;

    switch (fleetOwner.onboarding_status) {
      case "not_started":
      case null:
        setCurrentStep("tenant-selection");
        break;

      case "tenant_selected":
        setCurrentStep("country-selection");
        break;

      case "location_selected":
        setCurrentStep("fleet-details");
        break;

      case "fleet_details_filled":
        setCurrentStep("documents");
        break;

      case "completed":
        navigate("/fleet/dashboard");
        break;

      default:
        setCurrentStep("tenant-selection");
    }
  }, [fleetOwner]);

  /* ============================================
     LOAD LOOKUPS
  ============================================ */
  useEffect(() => {
    const load = async () => {
      try {
        const [tenantsRes, docsRes] = await Promise.all([
          lookupsAPI.getActiveTenants(),
          lookupsAPI.getFleetOwnerDocumentTypes(),
        ]);

        setTenants(tenantsRes || []);
        setDocumentTypes(
          (docsRes || []).filter((d) => d.is_mandatory)
        );
      } catch (err) {
        console.error("Lookup load failed", err);
      }
    };
    load();
  }, []);

  /* ============================================
     HANDLERS
  ============================================ */

  const handleBack = () => {
    switch (currentStep) {
      case "country-selection":
        setCurrentStep("tenant-selection");
        break;

      case "city-selection":
        setCurrentStep("country-selection");
        break;

      case "fleet-details":
        setCurrentStep("city-selection");
        break;

      case "documents":
        setCurrentStep("fleet-details");
        break;

      default:
        navigate(-1);
    }
  };

  const handleTenant = async (tenantId) => {
    try {
      setSubmitting(true);
      await selectTenant(tenantId);
      setCurrentStep("country-selection");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCountry = (country) => {
    setSelectedCountry(country);
    setCurrentStep("city-selection");
  };

  const handleCity = async (city) => {
    try {
      setSubmitting(true);
      await selectLocation({
        country_id: selectedCountry.country_id,
        city_id: city.city_id,
      });
      setCurrentStep("fleet-details");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!fleetDetails.business_name.trim()) {
      alert("Business name is required");
      return;
    }

    try {
      setSubmitting(true);
      await fillFleetDetails(fleetDetails);
      setCurrentStep("documents");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

const handleCompleteRegistration = async () => {
  const mandatoryDocsUploaded = documentTypes.every((doc) =>
    documents.some((d) => d.document_type === doc.document_code)
  );

  if (!mandatoryDocsUploaded) {
    alert("Upload all mandatory documents");
    return;
  }

  try {
    setSubmitting(true);
    await submitDocuments();
    alert('Registratin completed')
    navigate("/fleet/dashboard");
  } catch (err) {
    alert(err.message);
  } finally {
    setSubmitting(false);
  }
};

  /* ============================================
     STEP 1: TENANT SELECTION
  ============================================ */
  if (currentStep === "tenant-selection") {
    return (
      <StepContainer title="Step 1 of 5: Select Tenant">
        {tenants.length === 0 ? (
          <Loader className="animate-spin" size={40} />
        ) : (
          tenants.map((t) => (
            <StepButton
              key={t.tenant_id}
              onClick={() => handleTenant(t.tenant_id)}
              disabled={submitting}
              title={t.tenant_name}
              subtitle={t.legal_name}
            />
          ))
        )}
      </StepContainer>
    );
  }

  /* ============================================
     STEP 2: COUNTRY
  ============================================ */
  if (currentStep === "country-selection") {
    return (
      <StepContainer title="Step 2 of 5: Select Country" onBack={handleBack}>
        {tenantLocations?.map((country) => (
          <StepButton
            key={country.country_id}
            onClick={() => handleCountry(country)}
            title={country.country_name}
          />
        ))}
      </StepContainer>
    );
  }

  /* ============================================
     STEP 3: CITY
  ============================================ */
  if (currentStep === "city-selection") {
    return (
      <StepContainer title="Step 3 of 5: Select City" onBack={handleBack}>
        {selectedCountry?.cities?.map((city) => (
          <StepButton
            key={city.city_id}
            onClick={() => handleCity(city)}
            disabled={submitting}
            title={city.city_name}
          />
        ))}
      </StepContainer>
    );
  }

  /* ============================================
     STEP 4: FLEET DETAILS
  ============================================ */
  if (currentStep === "fleet-details") {
    return (
      <StepContainer title="Step 4 of 5: Fleet Details" onBack={handleBack}>
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
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </StepContainer>
    );
  }

  /* ============================================
     STEP 5: DOCUMENTS
  ============================================ */
  if (currentStep === "documents") {
    const mandatoryUploaded = documentTypes.every((doc) =>
      documents.some((d) => d.document_type === doc.document_code)
    );

    return (
      <StepContainer title="Step 5 of 5: Upload Documents" onBack={handleBack}>
        {documentTypes.map((docType) => {
          const uploadedDoc = documents.find(
            (d) => d.document_type === docType.document_code
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
        disabled={!mandatoryUploaded || submitting}
        onClick={handleCompleteRegistration}
        className={`btn-complete ${
          mandatoryUploaded
            ? "bg-green-600 text-white"
            : "bg-gray-300 text-gray-600"
        }`}
      >
        {submitting ? "Completing..." : "Complete Registration"}
    </button>


        {!mandatoryUploaded && (
          <p className="text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            Upload all mandatory documents
          </p>
        )}
      </StepContainer>
    );
  }

  return null;
}

/* ============================================
   REUSABLE COMPONENTS
============================================ */

function StepContainer({ title, children, onBack }) {
  return (
    <div className="min-h-screen bg-purple-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-purple-600 font-semibold"
          >
            <ArrowLeft size={18} /> Back
          </button>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function StepButton({ onClick, title, subtitle, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-4 border rounded-lg hover:bg-purple-50 transition disabled:opacity-50"
    >
      <div className="font-semibold">{title}</div>
      {subtitle && (
        <div className="text-sm text-gray-500">{subtitle}</div>
      )}
    </button>
  );
}
