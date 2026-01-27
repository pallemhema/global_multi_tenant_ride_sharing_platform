import { useState, useEffect } from 'react';
import { Building2, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Card from '../../../components/common/Card';
import Loader from '../../../components/common/Loader';
import { appAdminAPI } from '../../../services/appAdminApi';

export default function DashboardHome() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await appAdminAPI.getTenantsSummary();
      setSummary(response.data);
    } catch (err) {
      setError('Failed to fetch summary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const stats = [
    {
      icon: Building2,
      label: 'Total Tenants',
      value: summary?.total_tenants || 0,
      color: 'indigo',
    },
    {
      icon: CheckCircle,
      label: 'Approved',
      value: summary?.approved || 0,
      color: 'emerald',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: summary?.pending || 0,
      color: 'amber',
    },
    {
      icon: TrendingUp,
      label: 'Active',
      value: summary?.active || 0,
      color: 'indigo',
    },
  ];

  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome back!
        </h2>
        <p className="text-slate-600">
          Here's an overview of your platform metrics.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];

          return (
            <Card key={idx}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-2">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`${colors.bg} p-3 rounded-lg`}>
                  <Icon className={`${colors.text}`} size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-12">
        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <span className="text-slate-600">Total Tenants</span>
              <span className="font-bold text-slate-900">
                {summary?.total_tenants || 0}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <span className="text-slate-600">Inactive Tenants</span>
              <span className="font-bold text-slate-900">
                {summary?.inactive || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Approval Rate</span>
              <span className="font-bold text-emerald-600">
                {summary?.total_tenants > 0
                  ? Math.round(
                      ((summary?.approved || 0) /
                        (summary?.total_tenants || 1)) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
