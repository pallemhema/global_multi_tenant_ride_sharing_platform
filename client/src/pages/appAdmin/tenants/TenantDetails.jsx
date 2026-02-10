import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Plus, Eye } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import Loader from '../../../components/common/Loader';
import Modal from '../../../components/common/Modal';
import { appAdminAPI } from '../../../services/appAdminApi';
import { lookupsAPI } from '../../../services/lookups';

export default function TenantDetails() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [mandatoryDocTypes, setMandatoryDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [approveModal, setApproveModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const [tenantRes, docsRes, adminRes, docTypesRes] = await Promise.all([
        appAdminAPI.getTenantDetails(tenantId),
        appAdminAPI.getTenantDocuments(tenantId),
        appAdminAPI.getTenantAdmin(tenantId),
        lookupsAPI.fetchTenantFleetDocumentTypes(),
      ]);
      setTenant(tenantRes.data);
      setDocuments(docsRes.data);
      setAdmin(adminRes.data);
      // Filter only mandatory documents
      const mandatory = docTypesRes.data.filter(dt => dt.is_mandatory === true);
      setMandatoryDocTypes(mandatory);
    } catch (err) {
      setError('Failed to fetch tenant details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = (doc) => {
    setVerifyModal(doc);
    setVerifyError('');
  };

  const handleVerifyConfirm = async () => {
    if (!verifyModal) return;

    try {
      setVerifying(true);
      await appAdminAPI.verifyDocument(tenantId, verifyModal.tenant_document_id);
      setDocuments(
        documents.map((d) =>
          d.tenant_document_id === verifyModal.tenant_document_id
            ? { ...d, verification_status: 'approved' }
            : d
        )
      );
      setVerifyModal(null);
    } catch (err) {
      const errorMessage = 
        typeof err.response?.data?.detail === 'string' 
          ? err.response.data.detail 
          : typeof err.response?.data?.detail === 'object'
          ? err.response.data.detail.msg || JSON.stringify(err.response.data.detail)
          : 'Failed to verify document';
      setVerifyError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleApproveClick = () => {
    setApproveModal(true);
    setApproveError('');
  };

  const handleApproveConfirm = async () => {
    try {
      setApproving(true);
      await appAdminAPI.approveTenant(tenantId);
      setTenant({ ...tenant, approval_status: 'approved' });
      setApproveModal(false);
    } catch (err) {
      const errorMessage = 
        typeof err.response?.data?.detail === 'string' 
          ? err.response.data.detail 
          : typeof err.response?.data?.detail === 'object'
          ? err.response.data.detail.msg || JSON.stringify(err.response.data.detail)
          : 'Failed to approve tenant';
      setApproveError(errorMessage);
    } finally {
      setApproving(false);
    }
  };



  if (loading) {
    return <Loader />;
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Tenant not found</p>
      </div>
    );
  }

  const pendingDocs = documents.filter((d) => d.verification_status !== 'approved');

  // Check if all mandatory documents are uploaded and approved
  const missingMandatoryDocs = mandatoryDocTypes.filter(mandatoryType => 
    !documents.some(doc => 
      doc.document_type === mandatoryType.document_code && 
      ( doc.verification_status === 'approved')
    )
  );

  return (
    <div>
      <Link
        to="/dashboard/tenants"
        className="inline-flex items-center gap-2 mb-6 text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft size={20} />
        Back to Tenants
      </Link>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Tenant Info</h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-600 mb-2">Name</p>
              <p className="text-lg font-semibold text-slate-900">
                {tenant.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Email</p>
              <p className="text-lg text-slate-900">{tenant.business_email}</p>
            </div>
            {tenant.legal_name && (
              <div>
                <p className="text-sm text-slate-600 mb-2">Legal Name</p>
                <p className="text-slate-900">{tenant.legal_name}</p>
              </div>
            )}
            
  
            {tenant.city && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">City</p>
                  <p className="text-slate-900">{tenant.city}</p>
                </div>
                {tenant.country && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Country</p>
                    <p className="text-slate-900">{tenant.country}</p>
                  </div>
                )}
              </div>
            )}
            {tenant.business_registration_number && (
              <div>
                <p className="text-sm text-slate-600 mb-2">Registration Number</p>
                <p className="text-slate-900">{tenant.business_registration_number}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600 mb-2">Status</p>
              <StatusBadge status={tenant.status} type="tenant" />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Approval Status</p>
              <StatusBadge
                status={tenant.approval_status}
                type="approval"
              />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Created</p>
              <p className="text-slate-900">
                {new Date(tenant.created_at_utc).toLocaleDateString()}
              </p>
            </div>
          </div>

        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Tenant Admin
          </h3>
          {admin?.has_admin ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">Admin Email</p>
                  <p className="font-semibold text-slate-900">{admin.admin.email}</p>
                </div>
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
              <div className="text-xs text-slate-500 p-2">
                Created: {new Date(admin.admin.created_at).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-amber-900">No Admin Assigned</p>
                  <p className="text-sm text-amber-800">
                    Create an admin account for this tenant
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/dashboard/tenants/${tenantId}/admin/create`)}
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Tenant Admin
              </Button>
            </div>
          )}

          {tenant.approval_status === 'pending' && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              {missingMandatoryDocs.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">
                      Mandatory Documents Missing
                    </p>
                    <p className="text-sm text-red-800">
                      {missingMandatoryDocs.map(d => d.document_code).join(', ')} - must be approved before tenant approval
                    </p>
                  </div>
                </div>
              )}
              {documents.length === 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">
                      No Documents Uploaded
                    </p>
                    <p className="text-sm text-red-800">
                      Documents must be uploaded before tenant approval
                    </p>
                  </div>
                </div>
              )}
              {documents.length > 0 && pendingDocs.length > 0 && missingMandatoryDocs.length === 0 && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900">
                      Documents Pending Approval
                    </p>
                    <p className="text-sm text-amber-800">
                      {pendingDocs.length} document(s) need approval before tenant can be approved
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant={documents.length === 0 || pendingDocs.length > 0 || missingMandatoryDocs.length > 0 ? 'secondary' : 'success'}
                onClick={handleApproveClick}
                disabled={documents.length === 0 || pendingDocs.length > 0 || missingMandatoryDocs.length > 0}
                className="w-full"
              >
                {documents.length === 0
                  ? 'Approve Tenant (No Documents)'
                  : missingMandatoryDocs.length > 0
                  ? `Approve Tenant (Missing: ${missingMandatoryDocs.map(d => d.document_code).join(', ')})`
                  : pendingDocs.length > 0
                  ? `Approve Tenant (${pendingDocs.length} Documents Pending)`
                  : 'Approve Tenant'}
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Documents Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Total</span>
              <span className="font-bold text-slate-900">{documents.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Approved</span>
              <span className="font-bold text-emerald-600">
                {documents.filter((d) => d.verification_status === 'approved')
                  .length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Pending</span>
              <span className="font-bold text-amber-600">{pendingDocs.length}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-bold text-slate-900 mb-6">Documents</h3>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">No documents uploaded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Type
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Uploaded
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4 px-4 text-slate-900 font-medium capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge
                        status={doc.verification_status}
                        type="approval"
                      />
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">
                      {new Date(doc.created_at_utc).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <a
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Eye size={16} />
                          View
                        </a>
                        {doc.verification_status !== 'approved' && (
                          <button
                            onClick={() => handleVerifyClick(doc)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                          >
                            <CheckCircle size={16} />
                            Approve Document
                          </button>
                        )}
                     
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!verifyModal}
        onClose={() => setVerifyModal(null)}
        title="Approve Document"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setVerifyModal(null),
          },
          {
            label: verifying ? 'Approving...' : 'Approve',
            variant: 'success',
            onClick: handleVerifyConfirm,
          },
        ]}
      >
        {verifyError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{verifyError}</p>
          </div>
        )}
        <div>
          <p className="text-slate-600 mb-4">
            Approve the <strong>{verifyModal?.document_type}</strong> document?
          </p>
          {verifyModal?.document_number && (
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
              <p>
                <strong>Document Number:</strong> {verifyModal.document_number}
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={approveModal}
        onClose={() => setApproveModal(false)}
        title="Approve Tenant"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setApproveModal(false),
          },
          {
            label: approving ? 'Approving...' : 'Approve',
            variant: 'success',
            onClick: handleApproveConfirm,
          },
        ]}
      >
        {approveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{approveError}</p>
          </div>
        )}
        <div>
          <p className="text-slate-600">
            Are you sure you want to approve <strong>{tenant.name}</strong>?
          </p>
          <p className="text-slate-600 mt-2">
            All documents have been verified.
          </p>
        </div>
      </Modal>
    </div>
  );
}


