import { Navigate } from "react-router-dom";
import {useAuth} from '../context/AuthContext'

const ProtectedRoutes = ({ allow, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoutes;
