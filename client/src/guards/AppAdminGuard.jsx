import { useAdmin } from '../context/AdminContext';

export default function AppAdminGuard({ children }) {
  const { role } = useAdmin();

  if (role !== 'app-admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
