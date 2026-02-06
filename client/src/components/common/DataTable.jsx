import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function DataTable({
  columns,
  data,
  onRowClick,
  emptyState,
  loading = false,
  sortable = true,
  defaultSort = null,
}) {
  const [sortConfig, setSortConfig] = useState(defaultSort);

  const handleSort = (columnKey) => {
    if (!sortable) return;

    if (sortConfig?.key === columnKey) {
      setSortConfig({
        key: columnKey,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({ key: columnKey, direction: 'asc' });
    }
  };

  const getSortedData = () => {
    if (!sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });

    return sorted;
  };

  const sortedData = getSortedData();

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return emptyState || (
      <div className="text-center py-8">
        <p className="text-slate-600">No data found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => handleSort(column.key)}
                className={`px-6 py-3 text-left text-sm font-semibold text-slate-900 ${
                  column.sortable !== false && sortable
                    ? 'cursor-pointer hover:bg-slate-100'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable !== false && sortable && (
                    <div className="flex flex-col gap-0">
                      <ChevronUp
                        size={12}
                        className={
                          sortConfig?.key === column.key &&
                          sortConfig.direction === 'asc'
                            ? 'text-indigo-600'
                            : 'text-slate-300'
                        }
                      />
                      <ChevronDown
                        size={12}
                        className={
                          sortConfig?.key === column.key &&
                          sortConfig.direction === 'desc'
                            ? 'text-indigo-600'
                            : 'text-slate-300'
                        }
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-200 ${
                onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''
              }`}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 text-sm text-slate-700">
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
