const FleetOwnerApprovals = () => {
  const { user } = useAuth();
  const tenantId = user.tenant_id;
  const [fleets, setFleets] = useState([]);
  const [docs, setDocs] = useState({});

  useEffect(() => {
    fetchPendingFleetOwners(tenantId).then(res => setFleets(res.data));
  }, []);

  const loadDocs = async (fleetOwnerId) => {
    const res = await fetchFleetOwnerDocuments(tenantId, fleetOwnerId);
    setDocs(prev => ({ ...prev, [fleetOwnerId]: res.data }));
  };

  const approve = async (fleetOwnerId) => {
    await approveFleetOwner(tenantId, fleetOwnerId);
    setFleets(prev => prev.filter(f => f.fleet_owner_id !== fleetOwnerId));
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Fleet Owner Approvals</h2>

      {fleets.map(fleet => (
        <div key={fleet.fleet_owner_id} className="border rounded p-4">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{fleet.company_name}</p>
              <p className="text-sm text-gray-500">
                Status: {fleet.approval_status}
              </p>
            </div>

            <button
              onClick={() => loadDocs(fleet.fleet_owner_id)}
              className="text-blue-600 text-sm"
            >
              View Documents
            </button>
          </div>

          {docs[fleet.fleet_owner_id] && (
            <div className="mt-3 space-y-2">
              {docs[fleet.fleet_owner_id].map(doc => (
                <div key={doc.document_type} className="flex justify-between">
                  <span>{doc.document_type}</span>
                  <a
                    href={doc.document_url}
                    target="_blank"
                    className="text-blue-500"
                  >
                    View
                  </a>
                </div>
              ))}

              <button
                onClick={() => approve(fleet.fleet_owner_id)}
                className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded"
              >
                Approve Fleet Owner
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
