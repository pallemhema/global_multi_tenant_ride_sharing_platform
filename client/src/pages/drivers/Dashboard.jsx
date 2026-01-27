

import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Car,
  Clock,
  AlertCircle,
  CheckCircle,
  Clock3,
  Users,
} from 'lucide-react';

import { useDriver } from '../../context/DriverContext';
import StatCard from '../../components/tenant-admin/StatCard';
import Loader from '../../components/common/Loader';

export default function DriverDashboard() {
  const navigate = useNavigate();

  const {
    driver,
    documents,
    vehicles,
    activeShift,
    invites,
    loading,
    error,
  } = useDriver();

  if (loading) return <Loader />;

  /* ---------------- STATS ---------------- */
  const pendingDocuments =
    documents?.filter(d => d.verification_status === 'pending').length ?? 0;

  const approvedDocuments =
    documents?.filter(d => d.verification_status === 'approved').length ?? 0;

  const vehicleCount =
  driver?.driver_type === 'individual'
    ? vehicles?.length ?? 0
    : 0;

const inviteCount =
  driver?.driver_type === 'fleet_driver'
    ? invites?.length ?? 0
    : 0;


  const activeShiftCount = activeShift?.is_active ? 1 : 0;

  

  /* ---------------- HELPERS ---------------- */
  const verificationBadge = status => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
            <AlertCircle size={14} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
            <Clock3 size={14} /> Pending
          </span>
        );
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Welcome, Driver 👋</h1>
        <p className="text-slate-600">
          Manage your documents, vehicles and shifts
        </p>
      </div>

      {/* DRIVER STATUS */}
      {driver && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <p className="text-sm">
            <b>Driver Type:</b>{' '}
            {driver.driver_type === 'individual'
              ? 'Individual Driver'
              : 'Fleet Driver'}
          </p>

          <p className="mt-2 text-sm">
            <b>Verification:</b>{' '}
            {verificationBadge(driver.kyc_status)}
          </p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
          <AlertCircle className="text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Documents"
          count={pendingDocuments}
          icon={FileText}
          color="amber"
          onClick={() => navigate('/driver/documents')}
        />

        <StatCard
          title="Approved Documents"
          count={approvedDocuments}
          icon={CheckCircle}
          color="green"
          onClick={() => navigate('/driver/documents')}
        />

        {driver?.driver_type === 'individual' && (
          <StatCard
            title="Your Vehicles"
            count={vehicleCount}
            icon={Car}
            color="blue"
            onClick={() => navigate('/driver/vehicles')}
          />
        )}

        {driver?.driver_type === 'fleet_driver' && (
          <StatCard
            title="Fleet Invites"
            count={inviteCount}
            icon={Users}
            color="indigo"
            onClick={() => navigate('/driver/invites')}
          />
        )}

        <StatCard
          title="Active Shifts"
          count={activeShiftCount}
          icon={Clock}
          color="purple"
          onClick={() => navigate('/driver/shifts')}
        />
      </div>
    </div>
  );
}
