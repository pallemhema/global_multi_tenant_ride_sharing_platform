import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import Loader from '../components/common/Loader';

export default function RoleRedirect() {
  const { isAuthenticated, role, loading } = useAdmin();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Route based on role
  if (role === 'tenant-admin') {
    return <Navigate to="/tenant-admin/dashboard" replace />;
  }

  // Default to app-admin dashboard
  return <Navigate to="/dashboard" replace />;
}
