import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';

import { useDriver } from '../../context/DriverContext';
import { lookupsAPI } from '../../services/appAdminApi';
import DocumentUploadField from './DocumentUploadField';

export default function DriverRegistration() {
  const navigate = useNavigate();

  const {
    driver,
    documents,
    loading,
    selectTenant,
  } = useDriver();

  const [currentStep, setCurrentStep] = useState('tenant-selection');
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
      setDocumentTypes(d.filter(doc => doc.is_mandatory));
    };

    load();
  }, []);

  /* ---------------- HANDLERS ---------------- */

  const handleSelectTenant = async tenantId => {
    await selectTenant(tenantId);
    setCurrentStep('documents');
  };

  const handleSubmit = async () => {
    const mandatoryDocsUploaded = documentTypes.every(doc =>
      documents.some(d => d.document_type === doc.document_code)
    );

    if (!mandatoryDocsUploaded) {
      alert('Please upload all mandatory documents');
      return;
    }

    alert('Driver registration completed! Waiting for admin approval.');
    navigate('/driver/dashboard');
  };

  /* ---------------- STEP 1: TENANT ---------------- */

  if (currentStep === 'tenant-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/rider/dashboard')}
            className="flex items-center gap-2 text-green-600 mb-6 font-semibold"
          >
            <ArrowLeft size={20} /> Back
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Register as Driver</h1>
            <p className="text-gray-600 mb-8">
              Step 1 of 2: Select Tenant
            </p>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="animate-spin" size={40} />
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map(t => (
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

  /* ---------------- STEP 2: DOCUMENTS ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setCurrentStep('tenant-selection')}
          className="flex items-center gap-2 text-green-600 mb-6 font-semibold"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
          <p className="text-gray-600 mb-6">
            Step 2 of 2: Mandatory documents
          </p>

          <div className="space-y-6">
            {documentTypes.map(docType => (
              <DocumentUploadField
                key={docType.document_code}
                docType={docType}
              />
            ))}
          </div>

          <div className="mt-8 flex gap-4 pt-6 border-t">
            <button
              onClick={() => navigate('/rider/dashboard')}
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
