import { Navigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import Loader from "../../components/common/Loader";


export const UserProtectedRoute = ({
  children,
  requiredRoles = null,
  requiredContext = null,
}) => {
  const { isAuthenticated, loading, role, context } = useUserAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace />;
  }

  // Check required roles
  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to="/user/login" replace />;
  }

  // Check required context
  if (requiredContext && context !== requiredContext) {
    return <Navigate to="/user/login" replace />;
  }

  return children;
};


export const RiderRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredRoles={["rider"]} requiredContext="user">
      {children}
    </UserProtectedRoute>
  );
};

export const DriverRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredRoles={["driver"]} requiredContext="user">
      {children}
    </UserProtectedRoute>
  );
};


export const FleetOwnerRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredRoles={["fleet-owner"]} requiredContext="user">
      {children}
    </UserProtectedRoute>
  );
};


export const UserContextRoute = ({ children }) => {
  return (
    <UserProtectedRoute requiredContext="user">{children}</UserProtectedRoute>
  );
};
