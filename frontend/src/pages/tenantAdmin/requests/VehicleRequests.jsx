import { useEffect, useState } from "react";
import {
  fetchPendingVehicles,
  fetchVehicleDocuments,
  approveVehicle,
  approveVehicleDocument,
  rejectVehicleDocument,
} from "../../../services/tenants/tenantAdmin";
import EmptyState from "../../../components/EmptyState";
const VehicleRequests = ({ tenantId }) => {
  const [vehicles, setVehicles] = useState([]);
  const [docs, setDocs] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchPendingVehicles(tenantId).then((res) =>
      setVehicles(res.data)
    );
  }, [tenantId]);

  const loadDocs = async (vehicleId) => {
    if (docs[vehicleId]) return;

    const res = await fetchVehicleDocuments(
      tenantId,
      vehicleId
    );
    setDocs((prev) => ({ ...prev, [vehicleId]: res.data }));
  };

  const handleApproveDoc = async (docId, vehicleId) => {
    await approveVehicleDocument(docId);
    loadDocs(vehicleId);
  };

  const handleRejectDoc = async (docId, vehicleId) => {
    await rejectVehicleDocument(docId);
    loadDocs(vehicleId);
  };

  const allDocsApproved = (docs = []) =>
    docs.every((d) => d.verification_status === "approved");


if (vehicles.length === 0) {
  return (
    <section>
      <h2 className="font-semibold mb-3">
        Vehicle Requests
      </h2>

      <EmptyState
        icon="🚙"
        title="No vehicle requests"
        description="There are no vehicles pending approval."
      />
    </section>
  );
}

  return (
    <section>
      <h2 className="font-semibold mb-3">
        Vehicle Requests ({vehicles.length})
      </h2>

      {vehicles.map((v) => {
        const vehicleDocs = docs[v.vehicle_id] || [];

        return (
          <div
            key={v.vehicle_id}
            className="border rounded p-4 mb-4"
          >
            <div className="flex justify-between items-center">
              <p className="font-medium">
                {v.registration_number}
              </p>

              <button
                onClick={() => {
                  setExpanded(
                    expanded === v.vehicle_id
                      ? null
                      : v.vehicle_id
                  );
                  loadDocs(v.vehicle_id);
                }}
                className="text-blue-600 text-sm"
              >
                {expanded === v.vehicle_id
                  ? "Hide Documents"
                  : "Review Documents"}
              </button>
            </div>

            {/* DOCUMENT REVIEW */}
            {expanded === v.vehicle_id && (
              <div className="mt-4 space-y-3">
                {vehicleDocs.map((doc) => (
                  <div
                    key={doc.document_id}
                    className="flex justify-between items-center border rounded p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {doc.document_type}
                      </p>
                      <a
                        href={doc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm"
                      >
                        View Document
                      </a>
                    </div>

                    <div className="flex gap-2">
                      {doc.verification_status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleApproveDoc(
                                doc.document_id,
                                v.vehicle_id
                              )
                            }
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleRejectDoc(
                                doc.document_id,
                                v.vehicle_id
                              )
                            }
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {doc.verification_status === "approved" && (
                        <span className="text-emerald-600 text-sm">
                          Approved
                        </span>
                      )}

                      {doc.verification_status === "rejected" && (
                        <span className="text-red-600 text-sm">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* FINAL VEHICLE APPROVAL */}
                <button
                  disabled={
                    vehicleDocs.length === 0 ||
                    !allDocsApproved(vehicleDocs)
                  }
                  onClick={() =>
                    approveVehicle(tenantId, v.vehicle_id)
                  }
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Approve Vehicle
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default VehicleRequests;
