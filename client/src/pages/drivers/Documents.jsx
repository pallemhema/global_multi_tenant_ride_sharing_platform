import { useState } from 'react';
import {
  FileText,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock3,
} from 'lucide-react';

import { useDriver } from '../../context/DriverContext';
import Loader from '../../components/common/Loader';

export default function Documents() {
  const {
    driver,
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
  } = useDriver();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [localError, setLocalError] = useState('');

  const [newDoc, setNewDoc] = useState({
    document_type: '',
    file: null,
  });

  /* ---------------- DERIVED ---------------- */
  const allDocsApproved =
    documents.length > 0 &&
    documents.every(d => d.verification_status === 'approved');

  /* ---------------- ACTIONS ---------------- */

  const handleUpload = async e => {
    e.preventDefault();
    setLocalError('');

    if (!newDoc.document_type || !newDoc.file) {
      setLocalError('Please select document type and file');
      return;
    }

    try {
      await uploadDocument({
        driver_id: driver.driver_id,
        document_type: newDoc.document_type,
        file: newDoc.file,
      });

      setShowUploadForm(false);
      setNewDoc({ document_type: '', file: null });
    } catch (err) {
      setLocalError(err.message || 'Failed to upload document');
    }
  };

  const handleDelete = async docId => {
    if (!window.confirm('Delete this document?')) return;

    try {
      await deleteDocument(docId);
    } catch (err) {
      setLocalError(err.message || 'Failed to delete document');
    }
  };

  const handleView = doc => {
    if (doc.document_url) {
      window.open(doc.document_url, '_blank');
    }
  };

  /* ---------------- UI HELPERS ---------------- */

  const statusBadge = status => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle size={12} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">
            <AlertCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Clock3 size={12} /> Pending
          </span>
        );
    }
  };

  if (loading && documents.length === 0) return <Loader />;

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-slate-600">
            Manage your driver documents
          </p>
        </div>

        <button
          onClick={() => setShowUploadForm(true)}
          disabled={allDocsApproved}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            allDocsApproved
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <Plus size={18} /> Upload Document
        </button>
      </div>

      {/* ERRORS */}
      {(error || localError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertCircle className="text-red-600" />
          <span className="text-sm">
            {error || localError}
          </span>
        </div>
      )}

      {/* UPLOAD FORM */}
      {showUploadForm && (
        <div className="bg-white border rounded-lg p-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <select
              value={newDoc.document_type}
              onChange={e =>
                setNewDoc({
                  ...newDoc,
                  document_type: e.target.value,
                })
              }
              required
              className="input"
            >
              <option value="">Select document type</option>
              <option value="license">Driving License</option>
              <option value="registration">Vehicle Registration</option>
              <option value="insurance">Insurance</option>
              <option value="permit">Permit</option>
            </select>

            <input
              type="file"
              accept=".pdf,.jpg,.png"
              required
              onChange={e =>
                setNewDoc({
                  ...newDoc,
                  file: e.target.files[0],
                })
              }
            />

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Upload
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DOCUMENT LIST */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded border">
            <FileText
              className="mx-auto text-slate-400 mb-3"
              size={40}
            />
            <p className="text-slate-600">
              No documents uploaded yet
            </p>
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className="bg-white border rounded-lg p-6 flex justify-between"
            >
              <div>
                <h3 className="font-semibold mb-1">
                  {doc.document_type.toUpperCase()}
                </h3>
                {statusBadge(doc.verification_status)}
              </div>

              <div className="flex gap-2">
                {doc.verification_status === 'approved' ? (
                  <button
                    onClick={() => handleView(doc)}
                    className="btn-outline"
                  >
                    View
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
