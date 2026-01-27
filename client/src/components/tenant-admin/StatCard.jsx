import { ChevronRight } from 'lucide-react';

export default function StatCard({
  title,
  count,
  icon: Icon,
  onClick,
  color = 'indigo',
}) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all cursor-pointer ${
        onClick ? 'hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{count}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {onClick && (
        <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium">
          View Details
          <ChevronRight size={16} className="ml-1" />
        </div>
      )}
    </div>
  );
}
