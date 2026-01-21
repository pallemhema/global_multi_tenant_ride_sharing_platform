import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // While restoring auth from storage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-500 font-medium">Checking authentication…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
