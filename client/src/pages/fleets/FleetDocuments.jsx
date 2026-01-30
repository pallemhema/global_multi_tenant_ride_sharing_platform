import { useEffect, useState } from "react";
import { useFleetOwner } from "../../context/FleetOwnerContext";
import { lookupsAPI } from "../../services/lookups";
import FleetDocumentCard from "./FleetDocumentCard";
import { AlertCircle, Loader } from "lucide-react";

export default function FleetDocuments() {
  const {
    documents,
    uploadDocument,
    updateDocument,
    deleteDocument,
    fleetOwner,
    loading,
    error,
  } = useFleetOwner();

  const [docTypes, setDocTypes] = useState([]);
  console.log("fleet data from documents:",fleetOwner)

  useEffect(() => {
    const load = async () => {
      const res = await lookupsAPI.getFleetOwnerDocumentTypes();
      setDocTypes(res || []);
    };
    load();
  }, []);

 

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fleet Owner Documents</h1>


      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader size={20} className="animate-spin" />
          Loading documents...
        </div>
      )}

      {!loading && !fleetOwner?.fleet_owner_id && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <AlertCircle
            className="text-yellow-600 flex-shrink-0 mt-1"
            size={20}
          />
          <div className="text-yellow-800">
            <p className="font-semibold">Fleet Not Initialized</p>
            <p className="text-sm">
              No fleet owner found. Please complete registration first.
            </p>
          </div>
        </div>
      )}

      {!loading && fleetOwner?.fleet_owner_id && (
        <div className="grid gap-4">
          {docTypes.map((dt) => {
            const uploadedDoc = documents.find(
              (d) => d.document_type === dt.document_code,
            );

            return (
              <FleetDocumentCard
                key={dt.document_code}
                docType={dt}
                uploadedDoc={uploadedDoc}
                onUpload={uploadDocument}
                onUpdate={updateDocument}
                onDelete={deleteDocument}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
