import React from 'react';
import { CheckCircle, Bell, Search, ChevronDown } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            SwiftRide Logistics Inc.
          </h1>
          <div className="flex items-center space-x-1 mt-0.5">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Verified Tenant
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center relative">
          <Search size={18} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search fleets, drivers, regions..."
            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 w-64 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <button className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded-lg transition-colors">
          <img
            src="https://picsum.photos/32/32?random=2"
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
