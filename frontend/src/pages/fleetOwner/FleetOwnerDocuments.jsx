import { useAuth } from "../../context/AuthContext";
import DocumentManager from "../../components/documents/DocumentManager";

import {
  fetchFleetDocumentTypes,
  fetchFleetDocuments,
  uploadFleetDocument,
  updateFleetDocument,
} from "../../services/fleetOwners/fleet";

const FleetOwnerDocuments = () => {
  const { user } = useAuth();

  return (
    <DocumentManager
      title="Fleet Owner Documents"
      entityId={user.fleet_owner_id}
      fetchDocumentTypes={fetchFleetDocumentTypes}
      fetchDocuments={fetchFleetDocuments}
      uploadDocument={uploadFleetDocument}
      updateDocument={updateFleetDocument}
    />
  );
};

export default FleetOwnerDocuments;
