import { useUserAuth } from '../../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import RoleSwitcher from '../../components/common/RoleSwitcher';

export default function RiderDashboard() {
const { user, phone, availableRoles } = useUserAuth();
  const navigate = useNavigate();
  const isDriver = false
  const isFleetOwner = false
console.log("RiderDashboard user:",user)
console.log("RiderDashboard avialblae roles:",availableRoles)



  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-bold text-gray-900">
    Rider Dashboard
  </h1>

  <RoleSwitcher />
</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">User ID</h2>
              <p className="text-gray-600">{user?.sub}</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Role</h2>
              <p className="text-gray-600">Rider</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Phone</h2>
              <p className="text-gray-600">{phone || 'Not available'}</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Context</h2>
              <p className="text-gray-600">user</p>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg mb-8">
            <p className="text-green-800">
              ✅ Successfully logged in as Rider! This is a placeholder dashboard.
            </p>
          </div>

          {/* Registration Buttons */}
         <div className="border-t border-gray-200 pt-8">
  <h2 className="text-2xl font-bold text-gray-900 mb-6">
    Your Opportunities
  </h2>

  {/* EXISTING ROLES */}
  {(isDriver || isFleetOwner) && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {isDriver && (
        <button
          onClick={() => navigate('/driver/dashboard')}
          className="p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 transition transform hover:scale-105 active:scale-95"
        >
          <div className="text-4xl mb-3">🚗</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Go to Driver Dashboard
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Manage rides, documents and earnings
          </p>
          <span className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
            Open
          </span>
        </button>
      )}

      {isFleetOwner && (
        <button
          onClick={() => navigate('/fleet/dashboard')}
          className="p-6 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition transform hover:scale-105 active:scale-95"
        >
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Go to Fleet Dashboard
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Manage drivers, vehicles and revenue
          </p>
          <span className="inline-block bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold">
            Open
          </span>
        </button>
      )}
    </div>
  )}

  {/* REGISTRATION (ONLY IF NO OTHER ROLES) */}
  {!isDriver && !isFleetOwner && (
    <>
      <p className="text-gray-600 mb-6">
        Register as a driver or fleet owner to start earning with our platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/register/driver')}
          className="p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 transition transform hover:scale-105 active:scale-95"
        >
          <div className="text-4xl mb-3">🚗</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Register as Driver
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Drive with us and earn money on your own schedule
          </p>
          <span className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
            Get Started
          </span>
        </button>

        <button
          onClick={() => navigate('/register/fleet')}
          className="p-6 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition transform hover:scale-105 active:scale-95"
        >
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Register as Fleet Owner
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Manage a fleet and earn from multiple drivers
          </p>
          <span className="inline-block bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold">
            Get Started
          </span>
        </button>
      </div>
    </>
  )}
</div>

        </div>
      </div>
    </div>
  );
}
