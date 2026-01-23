import { CheckCircle, Bell, Search, ChevronDown } from "lucide-react";

const Header = ({ title, subtitle }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {title}
          </h1>

          {subtitle && (
            <div className="flex items-center space-x-1 mt-0.5">
              <CheckCircle size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {subtitle}
              </span>
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center relative">
          <Search size={18} className="absolute left-3 text-gray-400" />
          <input
            placeholder="Search…"
            className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-sm w-64 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full">
          <Bell size={20} />
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <button className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded-lg">
          <img
            src="https://ui-avatars.com/api/?name=U"
            className="w-8 h-8 rounded-full"
            alt="User"
          />
          <ChevronDown size={16} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
};

export default Header;
