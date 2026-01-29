import { useAdminAuth } from "../../../context/AdminContext";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Admin Profile
        </h2>
        <p className="text-slate-600">View your admin account information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-xl font-bold text-slate-900 mb-6">
            Account Information
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-600 mb-2">Email</p>
              <p className="text-lg font-semibold text-slate-900">
                {user?.email || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Role</p>
              <p className="text-lg text-slate-900">App Admin</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Account Status</p>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                Active
              </span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-4">
              Account Actions
            </h4>
            <div className="space-y-3">
              <Button
                variant="danger"
                onClick={handleLogout}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Help & Support
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900">
                Documentation
              </p>
              <p className="text-xs text-slate-600 mt-1">
                View admin documentation and guides
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900">Support</p>
              <p className="text-xs text-slate-600 mt-1">
                Contact support team for help
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
