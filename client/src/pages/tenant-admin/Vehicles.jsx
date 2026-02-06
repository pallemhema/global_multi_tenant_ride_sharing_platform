import { useEffect, useState, useMemo } from "react";
import { useTenant } from "../../context/TenantContext";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import {
  Car,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

/* ---------------- Owner Badge ---------------- */
const OwnerBadge = ({ type }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium
      ${
        type === "driver"
          ? "bg-blue-100 text-blue-800"
          : "bg-purple-100 text-purple-800"
      }`}
  >
    {type === "driver" ? "Driver-owned" : "Fleet-owned"}
  </span>
);

export default function Vehicles() {
  const {
    vehicles,
    loading,
    error: contextError,
    loadVehicles,
    approveVehicle,
    rejectVehicleDocument,
    approveVehicleDocument,
    getVehicleDocuments,
  } = useTenant();

  const [error, setError] = useState("");

  /* ----- Documents modal state ----- */
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  /* ----- Approve vehicle ----- */
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approving, setApproving] = useState(false);

  const [showApprovedDriver, setShowApprovedDriver] = useState(false);
  const [showApprovedFleet, setShowApprovedFleet] = useState(false);

  /* ---------------- Fetch vehicles on mount ---------------- */
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  /* ---------------- Normalize data ---------------- */
  const normalizedVehicles = useMemo(
    () =>
      vehicles.map((v) => ({
        id: v.vehicle_id,
        registrationNumber: v.license_plate,
        ownerType: v.owner.type,
        ownerName:
          v.owner.type === "driver" ? v.owner.name : v.owner.business_name,
        status: v.status,
      })),
    [vehicles],
  );

  const isApproved = (v) => v.status === "active";

  const splitVehicles = (type) => {
    const list = normalizedVehicles.filter((v) => v.ownerType === type);
    return {
      pending: list.filter((v) => !isApproved(v)),
      approved: list.filter(isApproved),
    };
  };

  const driverSplit = splitVehicles("driver");
  const fleetSplit = splitVehicles("fleet_owner");

  /* ---------------- Table columns ---------------- */
  const columns = [
    {
      key: "registrationNumber",
      label: "Registration Number",
    },
    {
      key: "ownerType",
      label: "Owner Type",
      render: (_, row) => <OwnerBadge type={row.ownerType} />,
    },
    {
      key: "ownerName",
      label: "Owner",
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} type="approval" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <button
          onClick={() => openDocuments(row)}
          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <Eye size={16} /> Documents
        </button>
      ),
    },
  ];

  /* ---------------- Row highlight ---------------- */
  const getRowClassName = (row) =>
    row.status !== "active" ? "bg-yellow-50" : "";

  /* ---------------- Documents logic ---------------- */
  const openDocuments = async (vehicle) => {
    try {
      setDocLoading(true);
      const res = await getVehicleDocuments(vehicle.id);
      setSelectedVehicle(vehicle);
      setDocuments(res);
      setShowDocsModal(true);
    } catch {
      setError("Failed to load documents");
    } finally {
      setDocLoading(false);
    }
  };

  const approveDocument = async (docId) => {
    try {
      await approveVehicleDocument(selectedVehicle.id, docId);

      // Update documents list
      setDocuments((docs) =>
        docs.map((d) =>
          d.document_id === docId
            ? { ...d, verification_status: "approved" }
            : d,
        ),
      );
    } catch (err) {
      console.error("Approve failed", err);
      setError("Failed to approve document");
    }
  };

  const rejectDocument = async (docId) => {
    try {
      const reason = prompt("Enter rejection reason");
      if (!reason) return;

      await rejectVehicleDocument(selectedVehicle.id, docId, reason);

      setDocuments((docs) =>
        docs.map((d) =>
          d.document_id === docId
            ? { ...d, verification_status: "rejected" }
            : d,
        ),
      );
    } catch (err) {
      console.error("rejection failed", err);
      setError("Failed to reject document");
    }
  };

  const allDocsApproved =
    documents.length > 0 &&
    documents.every((d) => d.verification_status === "approved");

  /* ---------------- Approve vehicle ---------------- */
  const handleApproveVehicle = async () => {
    try {
      setApproving(true);
      await approveVehicle(selectedVehicle.id);

      setShowApproveModal(false);
      setShowDocsModal(false);
    } catch (err) {
      setError("Failed to approve vehicle");
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <Loader />;

  /* ======================= RENDER ======================= */
  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Vehicles</h1>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex gap-2">
          <AlertCircle className="text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* DRIVER VEHICLES */}
      <Section
        title={`Driver Vehicles (${driverSplit.pending.length} pending)`}
        pending={driverSplit.pending}
        approved={driverSplit.approved}
        showApproved={showApprovedDriver}
        toggleApproved={() => setShowApprovedDriver(!showApprovedDriver)}
        columns={columns}
        getRowClassName={getRowClassName}
      />

      {/* FLEET VEHICLES */}
      <Section
        title={`Fleet Vehicles (${fleetSplit.pending.length} pending)`}
        pending={fleetSplit.pending}
        approved={fleetSplit.approved}
        showApproved={showApprovedFleet}
        toggleApproved={() => setShowApprovedFleet(!showApprovedFleet)}
        columns={columns}
        getRowClassName={getRowClassName}
      />

      {/* DOCUMENTS MODAL */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b font-bold">
              Vehicle Documents – {selectedVehicle.ownerName}
            </div>

            <div className="p-6 space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  className="border rounded-lg p-4 flex justify-between"
                >
                  <div>
                    <h4 className="font-semibold">{doc.document_type}</h4>
                    <p className="text-sm">{doc.document_number}</p>
                    <StatusBadge
                      status={doc.verification_status}
                      type="approval"
                    />
                  </div>

                  <div className="flex gap-2">
                    <a href={doc.document_url} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm">
                        <ExternalLink size={14} /> View
                      </Button>
                    </a>

                    {doc.verification_status !== "approved" && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => approveDocument(doc.document_id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => rejectDocument(doc.document_id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDocsModal(false)}
              >
                Close
              </Button>

              <Button
                variant="primary"
                disabled={
                  !allDocsApproved || selectedVehicle.status === "active"
                }
                onClick={() => setShowApproveModal(true)}
              >
                Approve Vehicle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE VEHICLE CONFIRM */}
      <ConfirmModal
        isOpen={showApproveModal}
        title="Approve Vehicle"
        description="All documents are approved. Confirm vehicle approval?"
        confirmText="Approve"
        variant="success"
        loading={approving}
        onConfirm={handleApproveVehicle}
        onClose={() => setShowApproveModal(false)}
      />
    </div>
  );
}

/* ---------------- Section Component ---------------- */
function Section({
  title,
  pending,
  approved,
  showApproved,
  toggleApproved,
  columns,
  getRowClassName,
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>

      {pending.length === 0 ? (
        <EmptyState icon={Car} title="No pending vehicles" />
      ) : (
        <DataTable
          columns={columns}
          data={pending}
          getRowClassName={getRowClassName}
        />
      )}

      {approved.length > 0 && (
        <>
          <button
            onClick={toggleApproved}
            className="text-sm text-indigo-600 flex gap-1 items-center"
          >
            {showApproved ? <ChevronUp /> : <ChevronDown />}
            {showApproved ? "Hide" : "Show"} Approved ({approved.length})
          </button>

          {showApproved && (
            <DataTable
              columns={columns}
              data={approved}
              getRowClassName={getRowClassName}
            />
          )}
        </>
      )}
    </section>
  );
}
