import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { fleetOwnerApi } from '../../services/fleetOwnerApi';
import RoleSwitcher from '../../components/common/RoleSwitcher';
import { AlertCircle, BarChart3, Users, Truck, DollarSign, Clock, Plus, Eye } from 'lucide-react';

export default function FleetOwnerDashboard() {
  const { user, role } = useUserAuth();
  const navigate = useNavigate();
  const [fleetData, setFleetData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch fleet data on mount
  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch fleet profile
        const profile = await fleetOwnerApi.getFleetProfile();
        setFleetData(profile);

        // Fetch drivers assigned to fleet
        const drvs = await fleetOwnerApi.getFleetDrivers();
        setDrivers(drvs || []);

        // Fetch vehicles
        const vehs = await fleetOwnerApi.getFleetVehicles();
        setVehicles(vehs || []);
      } catch (err) {
        setError(err.message || 'Failed to load fleet data');
        console.error('Fleet dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (role === 'fleet-owner') {
      fetchFleetData();
    }
  }, [role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading fleet dashboard...</p>
        </div>
      </div>
    );
  }

  if (!fleetData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-red-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-700 mb-4">{error || 'Could not load fleet data'}</p>
              <button
                onClick={() => navigate('/rider/dashboard')}
                className="text-red-600 hover:text-red-700 font-semibold underline"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = fleetData.approval_status === 'approved';
  const isPending = fleetData.approval_status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Fleet Owner Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage drivers, vehicles, and fleet operations</p>
          </div>
          <RoleSwitcher />
        </div>

        {/* Status Card */}
        {isPending && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Clock className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-yellow-900 mb-2">⏳ Pending Approval</h2>
                <p className="text-yellow-800">
                  Your fleet application is under review. You can prepare your fleet by adding vehicles.
                </p>
              </div>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <BarChart3 className="text-green-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-2">✅ Approved</h2>
                <p className="text-green-800">
                  Your fleet is approved and operational. You can start managing drivers and vehicles.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Fleet Profile Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Fleet Profile</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isApproved ? '✅ Approved' : '⏳ Pending'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Fleet Name</p>
                  <p className="text-lg font-semibold text-gray-900">{fleetData.fleet_name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Registration Number</p>
                  <p className="text-lg font-semibold text-gray-900">{fleetData.registration_number}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Approval Status</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{fleetData.approval_status}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {fleetData.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </p>
                </div>
              </div>
            </div>

            {/* Drivers Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">👥 Fleet Drivers</h2>
                {isApproved && (
                  <button
                    onClick={() => navigate('/fleet-owner/drivers/invite')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus size={16} /> Invite Driver
                  </button>
                )}
              </div>

              {drivers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-semibold mb-4">No drivers assigned yet</p>
                  {isApproved && (
                    <button
                      onClick={() => navigate('/fleet-owner/drivers/invite')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      Invite Your First Driver
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="p-4 border-2 border-gray-300 rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{driver.driver_name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          📧 {driver.email} | 📱 {driver.phone}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: <span className="font-semibold">{driver.status}</span>
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
                        <Eye size={14} /> Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicles Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">🚗 Fleet Vehicles</h2>
                {isApproved && (
                  <button
                    onClick={() => navigate('/fleet-owner/vehicles/add')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Vehicle
                  </button>
                )}
              </div>

              {vehicles.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Truck size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-semibold mb-4">No vehicles added yet</p>
                  {isApproved && (
                    <button
                      onClick={() => navigate('/fleet-owner/vehicles/add')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      Add Your First Vehicle
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-4 border-2 border-gray-300 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h4>
                        <span className="text-sm text-gray-600">
                          📋 {vehicle.registration_number}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Category: {vehicle.vehicle_category} | Assigned: {vehicle.assigned_driver || 'Unassigned'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">Drivers</span>
                  <span className="text-2xl font-bold text-purple-600">{drivers.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Vehicles</span>
                  <span className="text-2xl font-bold text-blue-600">{vehicles.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Status</span>
                  <span className="text-xl font-bold text-green-600">
                    {isApproved ? '✅' : '⏳'}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue - Only if Approved */}
            {isApproved && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} /> Revenue
                </h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total (This Month)</p>
                  <p className="text-3xl font-bold text-green-600">$0.00</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg font-semibold text-gray-700 transition">
                  📊 View Reports
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg font-semibold text-gray-700 transition">
                  ⚙️ Settings
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg font-semibold text-gray-700 transition">
                  ❓ Get Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
