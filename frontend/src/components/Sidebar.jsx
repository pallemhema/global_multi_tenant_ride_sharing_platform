import { NavLink } from "react-router-dom";

import { NAV_ITEMS } from "../constants/constants.jsx";

const Sidebar = ({ role }) => {
  const items = NAV_ITEMS[role] || [];


  return (
    <aside className="w-64 bg-white border-r h-screen hidden md:flex flex-col">
      <div className="p-6 font-bold text-lg">FleetStream</div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
