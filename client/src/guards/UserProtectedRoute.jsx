import { Navigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { Loader } from "lucide-react";

/**
 * ProtectedRoute - Requires authenticated user
 * Can optionally require specific roles/contexts
 */
export const UserProtectedRoute = ({ 
  children, 
  requiredRoles = null,
  requiredContext = null 
}) => {
  const { isAuthenticated, loading, role, context } = useUserAuth();

  // Still loading auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/user-login" replace />;
  }

  // Check required roles
  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to="/auth/user-login" replace />;
  }

  // Check required context
  if (requiredContext && context !== requiredContext) {
    return <Navigate to="/auth/user-login" replace />;
  }

  return children;
};

/**
 * RiderRoute - Requires rider role
 */
export const RiderRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredRoles={["rider"]} requiredContext="user">
      {children}
    </UserProtectedRoute>
  );
};

/**
 * DriverRoute - Requires driver role
 */
export const DriverRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredRoles={["driver"]} requiredContext="user">
      {children}
    </UserProtectedRoute>
  );
};

/**
 * FleetOwnerRoute - Requires fleet-owner role
 */
export const FleetOwnerRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredRoles={["fleet-owner"]} requiredContext="user">
      {children}
    </UserProtectedRoute>
  );
};

/**
 * TenantAdminRoute - Requires tenant-admin role
 */
export const TenantAdminRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredRoles={["tenant-admin"]} requiredContext="tenant">
      {children}
    </UserProtectedRoute>
  );
};

/**
 * UserContextRoute - Requires user context (rider/driver/fleet-owner)
 */
export const UserContextRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredContext="user">
      {children}
    </UserProtectedRoute>
  );
};
