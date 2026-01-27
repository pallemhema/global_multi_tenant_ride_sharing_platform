import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/common/StatusBadge';
import Loader from '../../../components/common/Loader';
import { appAdminAPI } from '../../../services/appAdminApi';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await appAdminAPI.getTenants();
      setTenants(response.data);
    } catch (err) {
      setError('Failed to fetch tenants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Manage Tenants
        </h2>
        <p className="text-slate-600">
          View and manage all registered tenants on the platform.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <Card>
        {tenants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No tenants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Tenant Name
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Approval Status
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Created
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-slate-900 font-medium">
                      {tenant.name}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {tenant.business_email}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge
                        status={tenant.approval_status}
                        type="approval"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={tenant.status} type="tenant" />
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">
                      {new Date(tenant.created_at_utc).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/dashboard/tenants/${tenant.id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

