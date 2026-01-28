import { useState } from "react";
import { FileText, Plus, AlertCircle } from "lucide-react";

import { useDriver } from "../../context/DriverContext";
import Loader from "../../components/common/Loader";
import DocumentUploadField from "./DocumentUploadField";
import { lookupsAPI } from "../../services/lookups";
import { useEffect } from "react";

export default function Documents() {
  const { documents, loading, error } = useDriver();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [localError, setLocalError] = useState("");
  const [documentTypes, setDocumentTypes] = useState([]);

  /* Load document types on mount */
  useEffect(() => {
    const loadDocTypes = async () => {
      try {
        const types = await lookupsAPI.getDriverDocumentTypes();
        setDocumentTypes(types || []);
      } catch (err) {
        console.error("Failed to load document types:", err);
      }
    };
    loadDocTypes();
  }, []);

  /* Derived */
  const allDocsApproved =
    documents.length > 0 &&
    documents.every((d) => d.verification_status === "approved");

  if (loading && documents.length === 0) return <Loader />;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-slate-600">
            Upload and manage your driver documents
          </p>
        </div>
      </div>

      {/* ERRORS */}
      {(error || localError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertCircle className="text-red-600" size={20} />
          <span className="text-sm">{error || localError}</span>
        </div>
      )}

      {/* DOCUMENT LIST */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
            <FileText className="mx-auto text-slate-400 mb-3" size={40} />
            <p className="text-slate-600 font-medium">
              No documents uploaded yet
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Upload your documents to complete onboarding
            </p>
          </div>
        ) : (
          documentTypes.map((docType) => (
            <DocumentUploadField
              key={docType.document_code}
              docType={docType}
            />
          ))
        )}
      </div>
    </div>
  );
}
