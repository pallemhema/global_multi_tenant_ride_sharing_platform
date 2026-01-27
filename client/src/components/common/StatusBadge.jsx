export default function StatusBadge({ status, type = 'approval' }) {
  const statusConfig = {
    approval: {
      pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        label: 'Pending',
      },
      approved: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        label: 'Approved',
      },
      rejected: {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        label: 'Rejected',
      },
      active: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        label: 'Approved',
      }
    },
    tenant: {
      active: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        label: 'Active',
      },
      inactive: {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        label: 'Inactive',
      },
      suspended: {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        label: 'Suspended',
      },
    },
  };

  const config = statusConfig[type]?.[status] || {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200',
    label: status,
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} border ${config.border}`}
    >
      {config.label}
    </span>
  );
}
