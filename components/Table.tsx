import React from 'react';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  title?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  title,
  actions,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#2d2d2d]/90 rounded-lg shadow-xl p-6 backdrop-blur-sm border border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#2d2d2d]/90 rounded-lg shadow-xl p-6 backdrop-blur-sm border border-gray-800 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-700/50 transition-colors duration-200"
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table; 