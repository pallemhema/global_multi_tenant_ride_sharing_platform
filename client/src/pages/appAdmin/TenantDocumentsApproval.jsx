import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useAppAdmin } from '../../context/AppAdminContext';

export default function TenantDocumentsApproval() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const {
    tenantDocuments: documents,
    loading,
    error,
    operationInProgress,
    getTenantDocumentsData,
    approveDocumentData,
    rejectDocumentData,
    clearError,
  } = useAppAdmin();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [tenantId]);

  const fetchDocuments = async () => {
    await getTenantDocumentsData(tenantId);
  };

  const handleApprove = async (docId) => {
    clearError();
    const res = await approveDocumentData(tenantId, docId);
    if (res.success) {
      setApprovalNote('');
      setSelectedDoc(null);
      await fetchDocuments();
      alert('Document approved successfully!');
    }
  };

  const handleReject = async (docId) => {
    if (!approvalNote.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    clearError();
    const res = await rejectDocumentData(tenantId, docId);
    if (res.success) {
      setApprovalNote('');
      setSelectedDoc(null);
      await fetchDocuments();
      alert('Document rejected successfully!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-600">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Tenant Documents Approval</h1>
          <p className="text-slate-600 mt-2">Review and approve tenant submitted documents</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 border border-slate-200 text-center">
            <FileText size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No documents found for this tenant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documents List */}
            <div className="lg:col-span-2 space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDoc?.id === doc.id
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{doc.document_type}</p>
                        <p className="text-sm text-slate-600">{doc.file_path}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.is_verified ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <XCircle size={20} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Approval Panel */}
            {selectedDoc && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 h-fit">
                <h3 className="font-semibold text-slate-900 mb-4">Document Details</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Document Type</p>
                    <p className="font-medium text-slate-900">{selectedDoc.document_type}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <p className="font-medium text-slate-900">
                      {selectedDoc.is_verified ? (
                        <span className="text-green-600">Verified</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600">File</p>
                    <p className="text-sm text-slate-900 break-all">{selectedDoc.file_path}</p>
                  </div>

                  {!selectedDoc.is_verified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Approval Notes
                        </label>
                        <textarea
                          value={approvalNote}
                          onChange={(e) => setApprovalNote(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Add notes for approval/rejection"
                          rows="4"
                        />
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => handleReject(selectedDoc.id)}
                          disabled={submitting}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {submitting ? 'Processing...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => handleApprove(selectedDoc.id)}
                          disabled={submitting}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {submitting ? 'Processing...' : 'Approve'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
