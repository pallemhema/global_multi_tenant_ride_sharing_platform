import { useEffect, useState } from "react";
import { useTenant } from "../../context/TenantContext";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import { FileText, Plus, AlertCircle, Trash2, Eye, Edit3 } from "lucide-react";

export default function Documents() {
  const {
    documents,
    documentTypes,
    loading,
    error: contextError,
    loadDocuments,
    deleteDocument,
    updateDocument,
    uploadDocument,
  } = useTenant();

  const [error, setError] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "",
    documentNumber: "",
    expiryDate: "",
    file: null,
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setError("Please select a file");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const data = new FormData();
      data.append("document_type", formData.documentType);
      data.append("document_number", formData.documentNumber);
      data.append("expiry_date", formData.expiryDate);
      data.append("file", formData.file);

      await uploadDocument(
        formData.documentType,
        formData.documentNumber,
        formData.expiryDate,
        formData.file,
      );
      setFormData({
        documentType: "",
        documentNumber: "",
        expiryDate: "",
        file: null,
      });
      setShowUploadForm(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setUploading(true);
      await deleteDocument(selectedDoc.tenant_document_id);
      setShowDeleteModal(false);
      setSelectedDoc(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete document");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }
  const handleEditDocument = async (e) => {
    e.preventDefault();

    if (!editingDoc?.tenant_document_id) {
      console.error("Missing document_id", editingDoc);
      setError("Invalid document selected");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await updateDocument(
        editingDoc.tenant_document_id,
        formData.documentNumber,
        formData.expiryDate,
        formData.file,
      );

      setShowEditForm(false);
      setEditingDoc(null);
      setFormData({
        documentType: "",
        documentNumber: "",
        expiryDate: "",
        file: null,
      });
    } catch (err) {
      setError(
        err.response?.data?.detail?.[0]?.msg ||
          err.response?.data?.detail ||
          "Failed to update document",
      );
    } finally {
      setUploading(false);
    }
  };

  console.log(editingDoc);
  const columns = [
    {
      key: "document_type",
      label: "Document Type",
      sortable: true,
    },
    {
      key: "document_number",
      label: "Document Number",
      sortable: true,
    },
    {
      key: "expiry_date",
      label: "Expiry Date",
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      key: "verification_status",
      label: "Status",
      sortable: true,
      render: (value) => <StatusBadge status={value} type="approval" />,
    },

    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_, row) => {
        const isApproved = row.verification_status === "approved";

        return (
          <div className="flex gap-3">
            {/* 👁️ View – always visible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(row.document_url, "_blank");
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                     bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              title="View Document"
            >
              <Eye size={18} />
            </button>

            {/* ✏️ Edit + 🗑️ Delete – ONLY if NOT approved */}
            {!isApproved && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingDoc({
                      ...row,
                      document_id: row.tenant_document_id,
                    });
                    setFormData({
                      documentType: row.document_type,
                      documentNumber: row.document_number || "",
                      expiryDate: row.expiry_date
                        ? row.expiry_date.split("T")[0]
                        : "",
                      file: null,
                    });
                    setShowEditForm(true);
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                         bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                  title="Edit Document"
                >
                  <Edit3 size={18} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDoc(row);
                    setShowDeleteModal(true);
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                         bg-red-50 text-red-600 hover:bg-red-100 transition"
                  title="Delete Document"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Documents</h1>
          <p className="text-slate-600">Manage and upload tenant documents</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          <Plus size={18} className="mr-2 inline" />
          Upload Document
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            Upload New Document
          </h2>
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentType: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Document Type</option>
                  {documentTypes.map((type) => (
                    <option key={type.document_code} value={type.document_code}>
                      {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentNumber: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., DOC-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiryDate: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0],
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowUploadForm(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {showEditForm && editingDoc && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            Edit Document
          </h2>
          <form onSubmit={handleEditDocument} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Type
                </label>
                <input
                  type="text"
                  value={formData.documentType}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentNumber: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., DOC-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiryDate: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0],
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingDoc(null);
                  setFormData({
                    documentType: "",
                    documentNumber: "",
                    expiryDate: "",
                    file: null,
                  });
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={uploading}>
                {uploading ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Documents Table */}
      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Documents"
          description="Start by uploading your first document"
          action={{
            label: "Upload Document",
            onClick: () => setShowUploadForm(true),
          }}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <DataTable columns={columns} data={documents} />
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={uploading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
