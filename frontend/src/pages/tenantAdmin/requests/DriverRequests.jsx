import { useEffect, useState } from "react";
import {
  fetchPendingDrivers,
  approveDriver,
  fetchDriverDocuments,
  approveDriverDocument,
  rejectDriverDocument,
} from "../../../services/tenants/tenantAdmin";
import EmptyState from "../../../components/EmptyState";
const DriverRequests = ({ tenantId }) => {
  const [drivers, setDrivers] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [documents, setDocuments] = useState({});

  useEffect(() => {
    fetchPendingDrivers(tenantId).then((res) =>
      setDrivers(res.data)
    );
  }, [tenantId]);

  const loadDocuments = async (driverId) => {
    if (documents[driverId]) return;

    const res = await fetchDriverDocuments(tenantId, driverId);
    setDocuments((prev) => ({
      ...prev,
      [driverId]: res.data,
    }));
  };

  const handleApproveDoc = async (docId, driverId) => {
    await approveDriverDocument(docId);
    loadDocuments(driverId);
  };

  const handleRejectDoc = async (docId, driverId) => {
    await rejectDriverDocument(docId);
    loadDocuments(driverId);
  };

  const allDocsApproved = (docs) =>
    docs.every((d) => d.verification_status === "approved");
  if (drivers.length === 0) {
  return (
    <section>
      <h2 className="font-semibold mb-3">
        Driver Requests
      </h2>

      <EmptyState
        icon="🚗"
        title="No driver requests"
        description="There are no drivers waiting for approval right now."
      />
    </section>
  );
}

  return (
    <section>
      <h2 className="font-semibold mb-3">
        Driver Requests ({drivers.length})
      </h2>

      {drivers.length === 0 && <p>No requests</p>}

      {drivers.map((d) => {
        const docs = documents[d.driver_id] || [];

        return (
          <div
            key={d.driver_id}
            className="border rounded p-4 mb-4"
          >
            <div className="flex justify-between items-center">
              <p className="font-medium">{d.name}</p>

              <button
                onClick={() => {
                  setExpanded(
                    expanded === d.driver_id ? null : d.driver_id
                  );
                  loadDocuments(d.driver_id);
                }}
                className="text-blue-600 text-sm"
              >
                {expanded === d.driver_id
                  ? "Hide Documents"
                  : "Review Documents"}
              </button>
            </div>

            {/* DOCUMENTS */}
            {expanded === d.driver_id && (
              <div className="mt-4 space-y-3">
                {docs.map((doc) => (
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
                                d.driver_id
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
                                d.driver_id
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
                    docs.length === 0 ||
                    !allDocsApproved(docs)
                  }
                  onClick={() =>
                    approveDriver(tenantId, d.driver_id)
                  }
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Approve Driver
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default DriverRequests;
