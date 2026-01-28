import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { useUserAuth } from '../context/UserAuthContext';
import Loader from '../components/common/Loader';

export default function RoleRedirect() {
  const { isAuthenticated: adminAuth, role: adminRole, loading: adminLoading } = useAdmin();
  const { isAuthenticated: userAuth, role: userRole, loading: userLoading } = useUserAuth();

  const loading = adminLoading || userLoading;

  if (loading) {
    return <Loader />;
  }

  // Check admin authentication first
  if (adminAuth && adminRole) {
    if (adminRole === 'tenant-admin') {
      return <Navigate to="/tenant-admin/dashboard" replace />;
    }
    // Default to app-admin dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Check user authentication
  if (userAuth && userRole) {
    if (userRole === 'driver') {
      return <Navigate to="/driver/dashboard" replace />;
    } else if (userRole === 'rider') {
      return <Navigate to="/rider/dashboard" replace />;
    } else if (userRole === 'fleet-owner') {
      return <Navigate to="/fleet-owner/dashboard" replace />;
    }
  }

  // Not authenticated - redirect to login
  return <Navigate to="/user/login" replace />;
}
