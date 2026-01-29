import { useEffect, useState } from "react";
import { useFleetOwner } from "../../context/FleetOwnerContext";
import { lookupsAPI } from "../../services/lookups";
import FleetDocumentCard from "./FleetDocumentCard";

export default function FleetDocuments() {
  const {
    documents,
    uploadDocument,
    updateDocument,
    deleteDocument,
  } = useFleetOwner();

  const [docTypes, setDocTypes] = useState([]);

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

      <div className="grid gap-4">
        {docTypes.map((dt) => {
          const uploadedDoc = documents.find(
            (d) => d.document_type === dt.document_code
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
    </div>
  );
}
