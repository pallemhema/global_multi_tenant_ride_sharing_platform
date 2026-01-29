import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import Loader from "../../components/common/Loader";

export default function AdminGuard({ children }) {
  const { role, isAuthenticated, loading } = useAdminAuth();
  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Allow both app-admin and tenant-admin
  if (role !== "app-admin" && role !== "tenant-admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
