import { useState, useEffect } from "react";
import {
  Upload,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { useDriver } from "../../context/DriverContext";
import { driverApi } from "../../services/driverApi";

const DocumentUploadField = ({ docType, hidePreview = false }) => {
  const { driver, documents } = useDriver();

  const uploadedDoc = documents.find(
    (d) => d.document_type === docType.document_code,
  );

  const [showForm, setShowForm] = useState(false);
  const [docNumber, setDocNumber] = useState(
    uploadedDoc?.document_number || "",
  );
  const [expiryDate, setExpiryDate] = useState(uploadedDoc?.expiry_date || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const isApproved = uploadedDoc?.verification_status === "approved";
  const isPending = uploadedDoc?.verification_status === "pending";
  const isRejected = uploadedDoc?.verification_status === "rejected";

  /* Reset form when uploadedDoc changes */
  useEffect(() => {
    setDocNumber(uploadedDoc?.document_number || "");
    setExpiryDate(uploadedDoc?.expiry_date || "");
    setSelectedFile(null);
  }, [
    uploadedDoc?.document_id,
    uploadedDoc?.document_number,
    uploadedDoc?.expiry_date,
  ]);

  /* Auto-show form when in edit mode (hidePreview=true) */
  useEffect(() => {
    if (hidePreview && uploadedDoc) {
      setShowForm(true);
    }
  }, [hidePreview, uploadedDoc?.document_id]);

  /* Reset form when closing */
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedFile(null);
  };

  /* ---------------- ACTIONS ---------------- */

  const handleSubmit = async () => {
    if (!selectedFile && !uploadedDoc) {
      toast.error("Please select a file");
      return;
    }

    try {
      setIsUploading(true);

      // If editing existing document
      if (uploadedDoc) {
        await driverApi.updateDriverDocument(uploadedDoc.document_id, {
          document_number: docNumber || null,
          expiry_date: expiryDate || null,
          file: selectedFile,
        });
        toast.success("Document updated successfully");
      } else {
        // New document upload
        await driverApi.uploadDriverDocument({
          document_type: docType.document_code,
          document_number: docNumber || null,
          expiry_date: expiryDate || null,
          file: selectedFile,
        });
        toast.success("Document uploaded successfully");
      }

      setSelectedFile(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedDoc) return;
    if (!window.confirm("Delete this document?")) return;

    try {
      await driverApi.deleteDriverDocument(uploadedDoc.document_id);
      toast.success("Document deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete document");
    }
  };

  /* ---------------- HELPERS ---------------- */

  const isImage = (name) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  const isPdf = (name) => /\.pdf$/i.test(name);

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* HEADER */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {docType.description}
            </h3>
            {docType.is_mandatory && (
              <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                Required
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{docType.document_code}</p>
        </div>

        {/* STATUS BADGE */}
        <div>
          {isApproved && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
              <CheckCircle size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Approved
              </span>
            </div>
          )}
          {isPending && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
              <Clock size={18} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                Pending
              </span>
            </div>
          )}
          {isRejected && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
              <AlertCircle size={18} className="text-red-600" />
              <span className="text-sm font-medium text-red-700">Rejected</span>
            </div>
          )}
          {!uploadedDoc && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
            >
              <Upload size={16} /> Upload
            </button>
          )}
          {showForm && !uploadedDoc && (
            <button
              onClick={handleCloseForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* UPLOADED DOCUMENT PREVIEW - Hide if hidePreview prop is true */}
      {uploadedDoc && !hidePreview && (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FileText size={20} className="text-gray-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadedDoc.file_name}
              </p>
            </div>
          </div>

          {isImage(uploadedDoc.file_name) && (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <img
                src={uploadedDoc.document_url}
                alt="document preview"
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}

          {isPdf(uploadedDoc.file_name) && (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="text-center">
                <FileText size={40} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">PDF Document</p>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={uploadedDoc.document_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm flex-1"
            >
              <Eye size={16} /> View
            </a>

            {!isApproved && (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors font-medium text-sm flex-1"
                >
                  <Edit2 size={16} /> Edit
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm flex-1"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* UPLOAD / EDIT FORM */}
      {showForm && !isApproved && (
        <div className="p-5 space-y-4 border-t border-gray-100 bg-gray-50">
          {!["PROFILE_PHOTO", "DRIVER_BADGE"].includes(
            docType.document_code,
          ) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Number
              </label>
              <input
                type="text"
                placeholder="Enter document number"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {["DRIVING_LICENSE", "ID_PROOF"].includes(docType.document_code) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <Upload size={18} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {selectedFile
                    ? selectedFile.name
                    : "Choose file or drag here"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isUploading || !selectedFile}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} /> Submit Document
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadField;
