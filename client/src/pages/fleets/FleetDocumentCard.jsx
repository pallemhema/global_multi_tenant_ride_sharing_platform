import { useState, useEffect } from "react";
import {
  Upload,
  Eye,
  Edit2,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

/* helpers */
const isImage = (name = "") => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

const isPdf = (name = "") => /\.pdf$/i.test(name);

export default function FleetDocumentCard({
  docType,
  uploadedDoc,
  onUpload,
  onUpdate,
  onDelete,
  hidePreview = false,
}) {
  const [showForm, setShowForm] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ===============================
     SYNC STATE WHEN DOC CHANGES
  =============================== */
  useEffect(() => {
    if (uploadedDoc) {
      setDocumentNumber(uploadedDoc.document_number || "");
      setExpiryDate(uploadedDoc.expiry_date || "");
    } else {
      setDocumentNumber("");
      setExpiryDate("");
    }
    setFile(null);
  }, [uploadedDoc]);

  const isApproved = uploadedDoc?.verification_status === "approved";
  const isPending = uploadedDoc?.verification_status === "pending";
  const isRejected = uploadedDoc?.verification_status === "rejected";

  /* ===============================
     HANDLERS
  =============================== */
  const handleSubmit = async () => {
    if (!uploadedDoc && !file) {
      alert("File is required");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("document_type", docType.document_code);

      if (documentNumber) formData.append("document_number", documentNumber);

      if (expiryDate) formData.append("expiry_date", expiryDate);

      if (file) formData.append("file", file);

      if (uploadedDoc) {
        await onUpdate(uploadedDoc.fleet_owner_document_id, formData);
      } else {
        await onUpload(formData);
      }

      // Close form after successful upload - parent will refresh documents
      setShowForm(false);
      setFile(null);
    } catch (err) {
      console.error("Document save error:", err);

      // Provide specific error messages based on error type
      let errorMsg = "Failed to save document";
      if (err.message.includes("Tenant must be selected")) {
        errorMsg = "Please select a tenant before uploading documents";
      } else if (err.message.includes("already uploaded")) {
        errorMsg = "This document type is already uploaded";
      } else if (err.message) {
        errorMsg = err.message;
      }

      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedDoc) return;
    if (!window.confirm("Delete this document?")) return;
    await onDelete(uploadedDoc.fleet_owner_document_id);
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="bg-white rounded-xl border shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-start p-5 border-b">
        <div>
          <h3 className="font-semibold text-gray-900">
            {docType.description}
            {docType.is_mandatory && (
              <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                Required
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500">{docType.document_code}</p>
        </div>

        {/* STATUS / UPLOAD BUTTON */}
        {!uploadedDoc && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg"
          >
            <Upload size={16} /> Upload
          </button>
        )}

        {showForm && !uploadedDoc && (
          <button
            onClick={() => setShowForm(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
          >
            <X size={16} /> Cancel
          </button>
        )}

        {isApproved && (
          <span className="flex items-center gap-2 text-green-600">
            <CheckCircle size={16} /> Approved
          </span>
        )}
        {isPending && (
          <span className="flex items-center gap-2 text-yellow-600">
            <Clock size={16} /> Pending
          </span>
        )}
        {isRejected && (
          <span className="flex items-center gap-2 text-red-600">
            <AlertCircle size={16} /> Rejected
          </span>
        )}
      </div>

      {/* PREVIEW */}
      {uploadedDoc && !hidePreview && (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
            <FileText size={18} />
            <span className="text-sm truncate">
              {uploadedDoc.file_name ||
                uploadedDoc.document_url?.split("/").pop() ||
                "Document"}
            </span>
          </div>

          {isImage(uploadedDoc.document_url) && (
            <img
              src={uploadedDoc.document_url}
              alt="preview"
              className="rounded max-h-60"
            />
          )}

          {isPdf(uploadedDoc.document_url) && (
            <div className="text-sm text-gray-600">PDF document</div>
          )}

          {/* ACTION ICONS */}
          <div className="flex gap-2">
            <a
              href={uploadedDoc.document_url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
              title="View document"
            >
              <Eye size={16} />
            </a>

            {!isApproved && (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  className="p-2 rounded bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                  title="Edit document"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={handleDelete}
                  className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100"
                  title="Delete document"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* FORM */}
      {showForm && !isApproved && (
        <div className="p-5 bg-gray-50 border-t space-y-4">
          <input
            type="text"
            placeholder="Document Number"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            className="input"
          />

          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="input"
          />

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0])}
          />

          <button
            onClick={handleSubmit}
            disabled={saving || (!uploadedDoc && !file)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {saving ? "Saving..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}
