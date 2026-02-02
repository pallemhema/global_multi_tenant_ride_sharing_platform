import { useEffect, useState } from "react";
import { useTenant } from "../../context/TenantContext";
import DataTable from "../../components/tenant-admin/DataTable";
import EmptyState from "../../components/tenant-admin/EmptyState";
import ConfirmModal from "../../components/tenant-admin/ConfirmModal";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import { Truck, AlertCircle, Eye } from "lucide-react";

export default function FleetOwners() {
  const {
    fleetOwners,
    loading,
    error: contextError,
    loadFleetOwners,
    approveFleetOwner,
    approveFleetOwnerDocument,
    rejectFleetOwnerDocument,
    getFleetOwnerDocuments,
  } = useTenant();

  const [error, setError] = useState("");
  const [selectedFleetOwner, setSelectedFleetOwner] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [fleetOwnerDocuments, setFleetOwnerDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingFleetOwner, setApprovingFleetOwner] = useState(null);
  const [approving, setApproving] = useState(false);

  // Load fleet owners on mount
  useEffect(() => {
    loadFleetOwners();
  }, [loadFleetOwners]);

  // Fetch fleet owner documents
  const handleViewDocuments = async (fleetOwner) => {
    try {
      setDocLoading(true);
      setError("");
      const response = await getFleetOwnerDocuments(fleetOwner.id);
      setSelectedFleetOwner(fleetOwner);
      setFleetOwnerDocuments(response);
      setShowDocumentsModal(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load documents");
    } finally {
      setDocLoading(false);
    }
  };

  // Handle approve fleet owner
  const handleApproveFleetOwner = async () => {
    try {
      setApproving(true);
      setError("");
      await approveFleetOwner(approvingFleetOwner.id);
      setShowApproveModal(false);
      setApprovingFleetOwner(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to approve fleet owner");
    } finally {
      setApproving(false);
    }
  };

  // Handle approve/reject document
  const handleApproveDocument = async (docId) => {
    try {
      setDocLoading(true);
      setError("");
      await approveFleetOwnerDocument(selectedFleetOwner.id, docId);
      setFleetOwnerDocuments(
        fleetOwnerDocuments.map((doc) =>
          doc.id === docId ? { ...doc, status: "approved" } : doc,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to approve document");
    } finally {
      setDocLoading(false);
    }
  };

  const handleRejectDocument = async (docId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      setDocLoading(true);
      setError("");
      await rejectFleetOwnerDocument(selectedFleetOwner.id, docId, reason);
      setFleetOwnerDocuments(
        fleetOwnerDocuments.map((doc) =>
          doc.id === docId ? { ...doc, status: "rejected" } : doc,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reject document");
    } finally {
      setDocLoading(false);
    }
  };

  // Check if all documents are approved
  const allDocsApproved =
    fleetOwnerDocuments.length > 0 &&
    fleetOwnerDocuments.every((doc) => doc.status === "approved");

  if (loading) {
    return <Loader />;
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "phone",
      label: "Phone",
      sortable: false,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => <StatusBadge status={value} type="approval" />,
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDocuments(row);
          }}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
        >
          <Eye size={16} /> Documents
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Fleet Owners</h1>
        <p className="text-slate-600">
          Review and approve pending fleet owners
        </p>
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

      {/* Fleet Owners Table */}
      {fleetOwners.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Pending Fleet Owners"
          description="All fleet owners have been reviewed"
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <DataTable columns={columns} data={fleetOwners} />
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                Fleet Owner Documents - {selectedFleetOwner?.name}
              </h2>
            </div>

            {docLoading ? (
              <div className="p-6 text-center">
                <p className="text-slate-600">Loading documents...</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {fleetOwnerDocuments.length === 0 ? (
                  <p className="text-slate-600 text-center py-4">
                    No documents found
                  </p>
                ) : (
                  fleetOwnerDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {doc.documentType}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {doc.documentNumber}
                        </p>
                        <div className="mt-2">
                          <StatusBadge status={doc.status} type="approval" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc.status !== "approved" && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApproveDocument(doc.id)}
                              disabled={docLoading}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRejectDocument(doc.id)}
                              disabled={docLoading}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end sticky bottom-0">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDocumentsModal(false);
                  setSelectedFleetOwner(null);
                  setFleetOwnerDocuments([]);
                }}
              >
                Close
              </Button>
              {allDocsApproved && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowApproveModal(true);
                    setApprovingFleetOwner(selectedFleetOwner);
                  }}
                  disabled={!allDocsApproved}
                >
                  Approve Fleet Owner
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Fleet Owner Modal */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setApprovingFleetOwner(null);
        }}
        title="Approve Fleet Owner"
        description={`Are you sure you want to approve ${approvingFleetOwner?.name}? All documents must be reviewed first.`}
        confirmText="Approve"
        cancelText="Cancel"
        variant="success"
        loading={approving}
        onConfirm={handleApproveFleetOwner}
      />
    </div>
  );
}
