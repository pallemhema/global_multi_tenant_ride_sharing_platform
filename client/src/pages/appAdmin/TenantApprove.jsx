import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '../../services/appAdminApi';

export default function TenantApprove() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [action, setAction] = useState(null);

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      const response = await apiClient.get(`/app-admin/tenants/${tenantId}`);
      setTenant(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await apiClient.post(`/app-admin/tenants/${tenantId}/approve`, {
        status: 'approved',
        notes: approvalNote,
      });
      alert('Tenant approved successfully!');
      navigate('/dashboard/tenants');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!approvalNote.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/app-admin/tenants/${tenantId}/approve`, {
        status: 'rejected',
        notes: approvalNote,
      });
      alert('Tenant rejected successfully!');
      navigate('/dashboard/tenants');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject tenant');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-600">Loading tenant details...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Tenant not found</div>
      </div>
    );
  }

  const isPending = tenant.approval_status === 'pending';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Tenant Approval</h1>
          <p className="text-slate-600 mt-2">Review and approve/reject tenant application</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenant Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Application Status</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {tenant.approval_status === 'approved' ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : tenant.approval_status === 'rejected' ? (
                    <AlertCircle size={20} className="text-red-600" />
                  ) : (
                    <AlertCircle size={20} className="text-yellow-600" />
                  )}
                  <div>
                    <p className="text-sm text-slate-600">Approval Status</p>
                    <p className="font-medium text-slate-900 capitalize">
                      {tenant.approval_status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Details Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Business Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Business Name</p>
                    <p className="font-medium text-slate-900">{tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Business Email</p>
                    <p className="font-medium text-slate-900">{tenant.business_email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="font-medium text-slate-900 capitalize">{tenant.status}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Created</p>
                    <p className="text-slate-900">
                      {new Date(tenant.created_at_utc).toLocaleDateString()}
                    </p>
                  </div>
                  {tenant.approved_at_utc && (
                    <div>
                      <p className="text-slate-600">Approved</p>
                      <p className="text-slate-900">
                        {new Date(tenant.approved_at_utc).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Approval Panel */}
          {isPending && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200 h-fit">
              <h3 className="font-semibold text-slate-900 mb-4">Make a Decision</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Approval Notes *
                  </label>
                  <textarea
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add notes for approval/rejection..."
                    rows="6"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Notes are required for rejection
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setAction('reject');
                      handleReject();
                    }}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting && action === 'reject' ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => {
                      setAction('approve');
                      handleApprove();
                    }}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting && action === 'approve' ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Approved Status */}
          {!isPending && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <div className="text-center">
                {tenant.approval_status === 'approved' ? (
                  <>
                    <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
                    <p className="text-sm text-slate-600">This tenant has been approved</p>
                  </>
                ) : (
                  <>
                    <AlertCircle size={48} className="mx-auto text-red-600 mb-3" />
                    <p className="text-sm text-slate-600">This tenant has been rejected</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
