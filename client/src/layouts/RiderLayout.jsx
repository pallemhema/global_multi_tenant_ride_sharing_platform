import { Outlet, Link } from "react-router-dom";
import { User} from "lucide-react";

export default function RiderLayout() {
 
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
          to="/rider/pickup"
          className="text-lg font-bold"
          >
            RideShare
          </Link>
          <div className="relative">
            {/* Profile Icon Toggle */}
            <Link
              // onClick={toggleProfile}
              to="/rider/profile"
              className="text-indigo-600 hover:text-indigo-700"
              title="Profile"
            >
              <User size={24} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
