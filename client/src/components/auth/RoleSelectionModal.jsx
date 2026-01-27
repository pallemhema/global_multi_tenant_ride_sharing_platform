import { useState } from "react";
import { Loader, Car, Users, ShieldCheck, Building2 } from "lucide-react";

const ROLE_CONFIG = {
  rider: {
    icon: Car,
    label: "Rider",
    description: "Book and ride",
    color: "blue",
  },
  driver: {
    icon: Car,
    label: "Driver",
    description: "Drive and earn",
    color: "green",
  },
  "fleet-owner": {
    icon: Users,
    label: "Fleet Owner",
    description: "Manage your fleet",
    color: "purple",
  }

};

const colorClasses = {
  blue: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100",
  green: "bg-green-50 border-green-200 text-green-600 hover:bg-green-100",
  purple: "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100",
  orange: "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100",
  red: "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
};

export const RoleSelectionModal = ({
  isOpen,
  roles,
  currentRole,
  onSelectRole,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState(null);

  if (!isOpen) return null;

  const handleSelect = async (role) => {
    setSelectedRole(role);
    await onSelectRole(role);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-6">
          <h2 className="text-2xl font-bold text-gray-900">Select Your Role</h2>
          <p className="text-gray-600 mt-2">
            Choose how you'd like to use the platform
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {roles && roles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((roleObj) => {
                const roleKey = roleObj.role;
                const config = ROLE_CONFIG[roleKey];
                const Icon = config?.icon;
                const colorClass = colorClasses[config?.color];
                const isSelected = selectedRole === roleKey;

                return (
                  <button
                    key={roleKey}
                    onClick={() => handleSelect(roleKey)}
                    disabled={isLoading}
                    className={`p-6 border-2 rounded-lg transition transform ${
                      isSelected
                        ? `${colorClass} ring-2 ring-offset-2 ring-${config?.color}-400 scale-105`
                        : colorClass
                    } ${isLoading && selectedRole !== roleKey ? "opacity-50 cursor-not-allowed" : ""} ${
                      !isLoading ? "cursor-pointer active:scale-95" : ""
                    }`}
                  >
                    {isLoading && selectedRole === roleKey ? (
                      <div className="flex justify-center mb-3">
                        <Loader className="animate-spin" size={24} />
                      </div>
                    ) : Icon ? (
                      <Icon size={32} className="mx-auto mb-3" />
                    ) : null}

                    <div className="font-semibold text-lg">
                      {config?.label || roleKey}
                    </div>
                    <div className="text-sm opacity-75 mt-1">
                      {config?.description}
                    </div>

                    {/* Additional Info for specific roles */}
                    {roleObj.driver_id && (
                      <div className="text-xs mt-2 opacity-60">
                        Driver ID: {roleObj.driver_id}
                      </div>
                    )}
                    {roleObj.fleet_owner_id && (
                      <div className="text-xs mt-2 opacity-60">
                        Fleet: {roleObj.fleet_owner_id}
                      </div>
                    )}
                    {roleObj.tenant_id && (
                      <div className="text-xs mt-2 opacity-60">
                        Tenant: {roleObj.tenant_id}
                      </div>
                    )}

                    {/* Current role indicator */}
                    {roleKey === currentRole && (
                      <div className="text-xs font-semibold mt-2 p-1 bg-white bg-opacity-50 rounded">
                        Current Role
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No roles available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <p className="text-sm text-gray-600">
            You can always switch roles later from settings
          </p>
        </div>
      </div>
    </div>
  );
};
