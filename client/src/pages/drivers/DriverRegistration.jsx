import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader } from "lucide-react";

import { useDriver } from "../../context/DriverContext";
import { lookupsAPI } from "../../services/lookups";
import DocumentUploadField from "./DocumentUploadField";

export default function DriverRegistration() {
  const navigate = useNavigate();

  const {
    driver,
    documents,
    tenantLocations,
    selectTenant,
    selectLocation,
    updateDriverType,
    submitDocuments,
  } = useDriver();

  const [currentStep, setCurrentStep] = useState("tenant-selection");
  const [tenants, setTenants] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD LOOKUPS ================= */
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
        alert("Failed to load lookup data");
      }
    };

    load();
  }, []);

  /* ================= RESUME LOGIC ================= */
  useEffect(() => {
    if (!driver) return;

    switch (driver.onboarding_status) {
      case "not_started":
      case null:
        setCurrentStep("tenant-selection");
        break;

      case "tenant_selected":
        setCurrentStep("country-selection");
        break;

      case "location_selected":
        setCurrentStep("driver-type");
        break;

      case "driver_type_selected":
        setCurrentStep("document-upload");
        break;

      case "completed":
        navigate("/driver/dashboard");
        break;

      default:
        setCurrentStep("tenant-selection");
    }
  }, [driver]);
  const handleBack = () => {
  switch (currentStep) {
    case "country-selection":
      setCurrentStep("tenant-selection");
      break;

    case "city-selection":
      setCurrentStep("country-selection");
      break;

    case "driver-type":
      setCurrentStep("city-selection");
      break;

    case "document-upload":
      setCurrentStep("driver-type");
      break;

    default:
      navigate(-1); // if at first step, go back to profile
  }
};


  /* ================= HANDLERS ================= */

  const handleTenant = async (id) => {
    try {
      setLoading(true);
      await selectTenant(id);
      setCurrentStep("country-selection");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCountry = (country) => {
    setSelectedCountry(country);
    setCurrentStep("city-selection");
  };

  const handleCity = async (city) => {
    try {
      setLoading(true);
      await selectLocation({
        country_id: selectedCountry.country_id,
        city_id: city.city_id,
      });
      setCurrentStep("driver-type");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverType = async (type) => {
    try {
      setLoading(true);
      await updateDriverType(type);
      setCurrentStep("document-upload");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const mandatoryDocsUploaded = documentTypes.every((doc) =>
      documents.some((d) => d.document_type === doc.document_code)
    );

    if (!mandatoryDocsUploaded) {
      alert("Upload all mandatory documents");
      return;
    }

    try {
      setLoading(true);
      await submitDocuments();
      navigate("/driver/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STEP 1: TENANT
  ========================================================= */
  if (currentStep === "tenant-selection") {
    return (
      <Container title="Step 1 of 5: Select Tenant" onBack={handleBack}>
        {tenants.length === 0 ? (
          <Loader className="animate-spin" size={40} />
        ) : (
          tenants.map((t) => (
            <StepButton
              key={t.tenant_id}
              onClick={() => handleTenant(t.tenant_id)}
              disabled={loading}
              title={t.tenant_name}
              subtitle={t.legal_name}
            />
          ))
        )}
      </Container>
    );
  }

  /* =========================================================
     STEP 2: COUNTRY
  ========================================================= */
  if (currentStep === "country-selection") {
    return (
      <Container title="Step 2 of 5: Select Country" onBack={handleBack}>
        {tenantLocations.map((country) => (
          <StepButton
            key={country.country_id}
            onClick={() => handleCountry(country)}
            disabled={loading}
            title={country.country_name}
          />
        ))}
      </Container>
    );
  }

  /* =========================================================
     STEP 3: CITY
  ========================================================= */
  if (currentStep === "city-selection") {
    return (
      <Container title="Step 3 of 5: Select City" onBack={handleBack}>
        {selectedCountry?.cities?.map((city) => (
          <StepButton
            key={city.city_id}
            onClick={() => handleCity(city)}
            disabled={loading}
            title={city.city_name}
          />
        ))}
      </Container>
    );
  }

  /* =========================================================
     STEP 4: DRIVER TYPE
  ========================================================= */
  if (currentStep === "driver-type") {
    return (
      <Container title="Step 4 of 5: Select Driver Type" onBack={handleBack}>
        <StepButton
          onClick={() => handleDriverType("individual")}
          disabled={loading}
          title="Individual Driver"
          subtitle="Drive your own vehicle"
        />
        <StepButton
          onClick={() => handleDriverType("fleet_driver")}
          disabled={loading}
          title="Fleet Driver"
          subtitle="Drive fleet-owned vehicles"
        />
      </Container>
    );
  }

  /* =========================================================
     STEP 5: DOCUMENTS
  ========================================================= */
  return (
    <Container title="Step 5 of 5: Upload Documents" onBack={handleBack}>
      {documentTypes.map((docType) => (
        <DocumentUploadField
          key={docType.document_code}
          docType={docType}
        />
      ))}

      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-6 py-3 bg-green-500 text-white rounded-lg disabled:bg-gray-400"
        >
          {loading ? "Submitting..." : "Complete Registration"}
        </button>
      </div>
    </Container>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */
function Container({ title, children, onBack }) {

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}

          className="flex items-center gap-2 text-green-600 mb-6 font-semibold"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">{title}</h1>
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function StepButton({ title, subtitle, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full p-4 border rounded-lg text-left hover:bg-green-50 disabled:opacity-50"
    >
      <h3 className="font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </button>
  );
}
