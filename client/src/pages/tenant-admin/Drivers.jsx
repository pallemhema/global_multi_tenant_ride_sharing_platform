import { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { tenantAdminAPI } from '../../services/tenantAdminApi';
import DataTable from '../../components/tenant-admin/DataTable';
import EmptyState from '../../components/tenant-admin/EmptyState';
import ConfirmModal from '../../components/tenant-admin/ConfirmModal';
import Loader from '../../components/common/Loader';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Users, AlertCircle, Eye } from 'lucide-react';

export default function Drivers() {
  const { tenantId } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [driverDocuments, setDriverDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingDriver, setApprovingDriver] = useState(null);
  const [approving, setApproving] = useState(false);

  // Fetch pending drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await tenantAdminAPI.getDrivers(tenantId);
        setDrivers(response.data);
      } catch (err) {
        console.error('Failed to fetch drivers:', err);
        setError(err.response?.data?.detail || 'Failed to load drivers');
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchDrivers();
    }
  }, [tenantId]);
  console.log(drivers);

  // Fetch driver documents
const handleViewDocuments = async (driver) => {
  try {
    setDocLoading(true);
    setError('');

    const response = await tenantAdminAPI.getDriverDocuments(
      tenantId,
      driver.driver.driver_id
    );

    const normalizedDocs = response.data.map((doc) => ({
      id: doc.document_id,
      documentType: doc.document_type,
      documentNumber: doc.document_number,
      documentUrl: doc.document_url,
      status: doc.verification_status,   // 🔑 KEY FIX
      expiryDate: doc.expiry_date,
    }));

    setSelectedDriver(driver);
    setDriverDocuments(normalizedDocs);
    setShowDocumentsModal(true);
  } catch (err) {
    setError(err.response?.data?.detail || 'Failed to load documents');
  } finally {
    setDocLoading(false);
  }
};



  // Handle approve driver
  const handleApproveDriver = async () => {
    try {
      setApproving(true);
      setError('');
      await tenantAdminAPI.approveDriver(tenantId,  selectedDriver.driver.driver_id,);
      setDrivers(drivers.filter((d) => d.id !==  selectedDriver.driver.driver_id,));
      setShowApproveModal(false);
      setApprovingDriver(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve driver');
    } finally {
      setApproving(false);
    }
  };

  // Handle approve/reject document
 const handleApproveDocument = async (docId) => {
  try {
    setDocLoading(true);
    setError('');

    await tenantAdminAPI.approveDriverDocument(
      tenantId,
      selectedDriver.driver.driver_id,
      docId
    );

    setDriverDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? { ...doc, status: 'approved' }   // UI update
          : doc
      )
    );
  } catch (err) {
    setError(err.response?.data?.detail || 'Failed to approve document');
  } finally {
    setDocLoading(false);
  }
};


  const handleRejectDocument = async (docId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setDocLoading(true);
      setError('');
      await tenantAdminAPI.rejectDriverDocument(
            tenantId,
            selectedDriver.driver.driver_id,
            doc.id,
            reason
          );

      setDriverDocuments(
        driverDocuments.map((doc) =>
          doc.id === docId ? { ...doc, status: 'rejected' } : doc
        )
      );
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject document');
    } finally {
      setDocLoading(false);
    }
  };

  // Check if all documents are approved
  const allDocsApproved =
    driverDocuments.length > 0 &&
    driverDocuments.every((doc) => doc.status === 'approved');

  console.log(allDocsApproved)

  if (loading) {
    return <Loader />;
  }

  const columns = [
  {
    key: 'fullName',
    label: 'Full Name',
    sortable: true,
    render: (_, row) => row.user_profile?.full_name || '—',
  },
  {
    key: 'driverType',
    label: 'Driver Type',
    sortable: true,
    render: (_, row) => row.driver?.driver_type || '—',
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: false,
    render: (_, row) => row.user?.phone_e164 || '—',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (_, row) => (
      <StatusBadge status={row.driver.kyc_status} type="approval" />
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    render: (_, row) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewDocuments(row);
        }}
        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
      >
        <Eye size={16} /> View Documents
      </button>
    ),
  },
];


  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Drivers</h1>
        <p className="text-slate-600">Review and approve pending drivers</p>
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

      {/* Drivers Table */}
      {drivers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Pending Drivers"
          description="All drivers have been reviewed"
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <DataTable columns={columns} data={drivers} />
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                Driver Documents - {selectedDriver?.firstName} {selectedDriver?.lastName}
              </h2>
            </div>

            {docLoading ? (
              <div className="p-6 text-center">
                <p className="text-slate-600">Loading documents...</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {driverDocuments.length === 0 ? (
                  <p className="text-slate-600 text-center py-4">
                    No documents found
                  </p>
                ) : (
                  driverDocuments.map((doc) => (
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
                        {doc.status !== 'approved' && (
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
                  setSelectedDriver(null);
                  setDriverDocuments([]);
                }}
              >
                Close
              </Button>
              {allDocsApproved && selectedDriver?.driver?.kyc_status !== 'approved' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowApproveModal(true);
                    setApprovingDriver(selectedDriver);
                  }}
                >
                  Approve Driver
                </Button>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Approve Driver Modal */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setApprovingDriver(null);
        }}
        title="Approve Driver"
        description={`Are you sure you want to approve ${approvingDriver?.fullname}? All documents must be reviewed first.`}
        confirmText="Approve"
        cancelText="Cancel"
        variant="success"
        loading={approving}
        onConfirm={handleApproveDriver}
      />
    </div>
  );
}
