import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { tenantAdminAPI } from '../../services/tenantAdminApi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { User, LogOut, AlertCircle, Copy, Check } from 'lucide-react';

export default function Profile() {
  const { tenantId, user, logout } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch tenant profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await tenantAdminAPI.getTenantProfile(tenantId);
        setProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err.response?.data?.detail || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchProfile();
    }
  }, [tenantId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCopyTenantId = () => {
    navigator.clipboard.writeText(tenantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <Loader />;
  }

  const issueDate = user?.iat ? new Date(user.iat * 1000).toLocaleString() : 'N/A';
  const expiryDate = user?.exp ? new Date(user.exp * 1000).toLocaleString() : 'N/A';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile</h1>
        <p className="text-slate-600">Manage your account settings</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-indigo-50 rounded-full">
            <User size={32} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Tenant Admin</h2>
            <p className="text-slate-600">Account Details</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email */}
          <div className="pb-6 border-b border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <p className="text-lg text-slate-900">{user?.email || 'N/A'}</p>
            <p className="text-xs text-slate-500 mt-1">Your login email</p>
          </div>

          {/* Role */}
          <div className="pb-6 border-b border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Role
            </label>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              Tenant Admin
            </div>
            <p className="text-xs text-slate-500 mt-2">
              You have full access to manage your tenant operations
            </p>
          </div>

          {/* Tenant ID */}
          <div className="pb-6 border-b border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tenant ID
            </label>
            <div className="flex items-center gap-2">
              <code className="px-4 py-2 bg-slate-50 rounded-lg font-mono text-sm text-slate-900 border border-slate-200 flex-1">
                {tenantId}
              </code>
              <button
                onClick={handleCopyTenantId}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Copy Tenant ID"
              >
                {copied ? (
                  <Check size={20} className="text-emerald-600" />
                ) : (
                  <Copy size={20} className="text-slate-600" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Unique identifier for your tenant
            </p>
          </div>

          {/* Token Information */}
          <div className="pb-6 border-b border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Token Information
            </label>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Issued At</p>
                <p className="text-sm text-slate-900">{issueDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Expires At</p>
                <p className="text-sm text-slate-900">{expiryDate}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Your authentication token will be automatically refreshed upon login
            </p>
          </div>

          {/* Tenant Details */}
          {profile && (
            <>
              <div className="pb-6 border-b border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tenant Name
                </label>
                <p className="text-lg text-slate-900">{profile.tenantName || 'N/A'}</p>
              </div>

              <div className="pb-6 border-b border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Business Type
                </label>
                <p className="text-lg text-slate-900">{profile.businessType || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tenant Status
                </label>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profile.status || 'Active'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Security</h3>
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Your account is secure. To change your password, please contact the system administrator.
          </p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Keep your email and password safe. Never share your
              authentication token with anyone.
            </p>
          </div>
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Session</h3>
        <p className="text-slate-600 text-sm mb-6">
          Click the button below to logout from your account. You will need to login again
          to access the dashboard.
        </p>
        <Button
          variant="danger"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>
    </div>
  );
}
