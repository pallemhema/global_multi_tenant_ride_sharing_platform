import React from 'react';

const MetricCard = ({ title, value, icon, trend, trendUp, subtitle }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-xl text-blue-600">
          {icon}
        </div>

        {trend && (
          <div
            className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
              trendUp
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-gray-900">
          {value}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
