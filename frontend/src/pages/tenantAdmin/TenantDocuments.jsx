import { useAuth } from "../../context/AuthContext";

import DocumentManager from "../../components/documents/DocumentManger";

import {
  fetchTenantDocuments,
  uploadTenantDocument,
  updateTenantDocument,
} from "../../services/tenants/tenantAdmin";

import { fetchTenantDocumentTypes } from "../../services/lookups";

const TenantDocuments = () => {
  const { user } = useAuth();

  return (
    <DocumentManager
      title="Company Documents"
      entityId={user.tenant_id}
      fetchDocumentTypes={fetchTenantDocumentTypes}
      fetchDocuments={fetchTenantDocuments}
      uploadDocument={uploadTenantDocument}
      updateDocument={updateTenantDocument}
    />
  );
};

export default TenantDocuments;
