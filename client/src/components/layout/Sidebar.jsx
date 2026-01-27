import { LayoutDashboard, Building2, User, LogOut, Plus, FileText, CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function Sidebar() {
  const { logout } = useAdmin();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      path: '/dashboard/tenants',
      label: 'Tenants',
      icon: Building2,
    },
    {
      path: '/dashboard/profile',
      label: 'Profile',
      icon: User,
    },
  ];

  const actionItems = [
    {
      path: '/dashboard/tenants/create',
      label: 'Create Tenant',
      icon: Plus,
    },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">RideShare</h1>
        <p className="text-sm text-slate-400">Admin Dashboard</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="mb-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  active
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Actions Section */}
        <div className="border-t border-slate-700 pt-4">
          <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">Actions</p>
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
