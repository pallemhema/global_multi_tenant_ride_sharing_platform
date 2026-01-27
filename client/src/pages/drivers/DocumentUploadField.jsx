import { useState } from 'react';
import { Upload, Eye, Edit2, Trash2, CheckCircle } from 'lucide-react';

import { useDriver } from '../../context/DriverContext';

const DocumentUploadField = ({ docType }) => {
  const {
    driver,
    documents,
    uploadDocument,
    deleteDocument,
  } = useDriver();

  const uploadedDoc = documents.find(
    d => d.document_type === docType.document_code
  );

  const [showForm, setShowForm] = useState(false);
  const [docNumber, setDocNumber] = useState(
    uploadedDoc?.document_number || ''
  );
  const [expiryDate, setExpiryDate] = useState(
    uploadedDoc?.expiry_date || ''
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const isApproved = uploadedDoc?.verification_status === 'approved';
  const isPending = uploadedDoc?.verification_status === 'pending';
  const isRejected = uploadedDoc?.verification_status === 'rejected';

  /* ---------------- ACTIONS ---------------- */

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    try {
      setIsUploading(true);

      await uploadDocument({
        driver_id: driver.driver_id,
        document_type: docType.document_code,
        document_number: docNumber || null,
        expiry_date: expiryDate || null,
        file: selectedFile,
      });

      setSelectedFile(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedDoc) return;
    if (!window.confirm('Delete this document?')) return;

    try {
      await deleteDocument(uploadedDoc.id);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete document');
    }
  };

  /* ---------------- HELPERS ---------------- */

  const isImage = name => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  const isPdf = name => /\.pdf$/i.test(name);

  /* ---------------- UI ---------------- */

  return (
    <div className="p-4 border rounded-lg bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">
            {docType.description}
            {docType.is_mandatory && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </h3>
          <p className="text-xs text-gray-500">
            Code: {docType.document_code}
          </p>
        </div>

        {!uploadedDoc && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-blue-600 font-semibold"
          >
            {showForm ? 'Cancel' : 'Upload'}
          </button>
        )}

        {isApproved && (
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircle size={16} /> Approved
          </span>
        )}
        {isPending && (
          <span className="text-yellow-600">⏳ Pending</span>
        )}
        {isRejected && (
          <span className="text-red-600">❌ Rejected</span>
        )}
      </div>

      {/* UPLOADED DOCUMENT */}
      {uploadedDoc && (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            <b>File:</b> {uploadedDoc.file_name}
          </p>

          {isImage(uploadedDoc.file_name) && (
            <img
              src={uploadedDoc.document_url}
              alt="document"
              className="rounded max-h-60"
            />
          )}

          {isPdf(uploadedDoc.file_name) && (
            <div className="p-3 bg-gray-100 rounded">
              📄 PDF Document
            </div>
          )}

          <div className="flex gap-2">
            <a
              href={uploadedDoc.document_url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              <Eye size={16} /> View
            </a>

            {!isApproved && (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-warning"
                >
                  <Edit2 size={16} /> Edit
                </button>

                <button
                  onClick={handleDelete}
                  className="btn-danger"
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
        <div className="mt-4 space-y-4 border-t pt-4">
          {!['PROFILE_PHOTO', 'DRIVER_BADGE'].includes(
            docType.document_code
          ) && (
            <input
              type="text"
              placeholder="Document Number"
              value={docNumber}
              onChange={e => setDocNumber(e.target.value)}
              className="input"
            />
          )}

          {['DRIVING_LICENSE', 'ID_PROOF'].includes(
            docType.document_code
          ) && (
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="input"
            />
          )}

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setSelectedFile(e.target.files[0])}
          />

          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="btn-primary w-full"
          >
            {isUploading ? 'Uploading...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadField;
