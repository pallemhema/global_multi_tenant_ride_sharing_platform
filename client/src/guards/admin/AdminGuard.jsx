import { Navigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import Loader from "../../components/common/Loader";

export default function AdminGuard({ children }) {
  const { role, isAuthenticated, loading } = useAdmin();

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
