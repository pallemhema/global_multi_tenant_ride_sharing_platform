import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import Loader from '../components/common/Loader';

export default function TenantAdminGuard({ children }) {
  const { role, isAuthenticated, loading } = useAdmin();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'tenant-admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

