import { useEffect, useState } from "react";
import {
  fetchPendingFleetOwners,
  fetchFleetOwnerDocuments,
  approveFleetOwner,
  approveFleetOwnerDocument,
  rejectFleetOwnerDocument,
} from "../../../services/tenants/tenantAdmin";
import EmptyState from "../../../components/EmptyState";

const FleetOwnerRequests = ({ tenantId }) => {
  const [items, setItems] = useState([]);
  const [docs, setDocs] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchPendingFleetOwners(tenantId).then((res) =>
      setItems(res.data)
    );
  }, [tenantId]);

  const loadDocs = async (fleetOwnerId) => {
    if (docs[fleetOwnerId]) return;

    const res = await fetchFleetOwnerDocuments(
      tenantId,
      fleetOwnerId
    );
    setDocs((prev) => ({ ...prev, [fleetOwnerId]: res.data }));
  };

  const handleApproveDoc = async (docId, fleetOwnerId) => {
    await approveFleetOwnerDocument(docId);
    loadDocs(fleetOwnerId);
  };

  const handleRejectDoc = async (docId, fleetOwnerId) => {
    await rejectFleetOwnerDocument(docId);
    loadDocs(fleetOwnerId);
  };

  const allDocsApproved = (docs = []) =>
    docs.every((d) => d.verification_status === "approved");

if (items.length === 0) {
  return (
    <section>
      <h2 className="font-semibold mb-3">
        Fleet Owner Requests
      </h2>

      <EmptyState
        icon="🏢"
        title="No fleet owner requests"
        description="All fleet owners have been reviewed and approved."
      />
    </section>
  );
}

  return (
    <section>
      <h2 className="font-semibold mb-3">
        Fleet Owner Requests ({items.length})
      </h2>

      {items.length === 0 && <p>No requests</p>}

      {items.map((fleet) => {
        const fleetDocs = docs[fleet.fleet_owner_id] || [];

        return (
          <div
            key={fleet.fleet_owner_id}
            className="border rounded p-4 mb-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {fleet.company_name}
                </p>
                <p className="text-xs text-gray-500">
                  Pending approval
                </p>
              </div>

              <button
                onClick={() => {
                  setExpanded(
                    expanded === fleet.fleet_owner_id
                      ? null
                      : fleet.fleet_owner_id
                  );
                  loadDocs(fleet.fleet_owner_id);
                }}
                className="text-blue-600 text-sm"
              >
                {expanded === fleet.fleet_owner_id
                  ? "Hide Documents"
                  : "Review Documents"}
              </button>
            </div>

            {/* DOCUMENT REVIEW */}
            {expanded === fleet.fleet_owner_id && (
              <div className="mt-4 space-y-3">
                {fleetDocs.map((doc) => (
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
                                fleet.fleet_owner_id
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
                                fleet.fleet_owner_id
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

                {/* FINAL APPROVAL */}
                <button
                  disabled={
                    fleetDocs.length === 0 ||
                    !allDocsApproved(fleetDocs)
                  }
                  onClick={() =>
                    approveFleetOwner(
                      tenantId,
                      fleet.fleet_owner_id
                    )
                  }
                  className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Approve Fleet Owner
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default FleetOwnerRequests;
