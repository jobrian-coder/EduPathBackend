import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckSquare,
  Square
} from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  searchable?: boolean;
  searchFields?: (keyof T)[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onBulkDelete?: (ids: string[]) => void;
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  itemsPerPage?: number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  loading = false,
  searchable = true,
  searchFields,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onEdit,
  onDelete,
  onBulkDelete,
  actions,
  emptyMessage = 'No data found',
  itemsPerPage = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set(selectedIds));

  useEffect(() => {
    setSelectedRows(new Set(selectedIds));
  }, [selectedIds]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchable) return data;

    return data.filter((row) => {
      const fields = searchFields || columns.map((c) => c.key as keyof T);
      return fields.some((field) => {
        const value = row[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, searchable, searchFields, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort
  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null; // Reset sort
      }
      return { key, direction: 'asc' };
    });
  };

  // Handle selection
  const handleSelectAll = () => {
    const newSelected = new Set(selectedRows);
    const allPageIds = paginatedData.map(keyExtractor);
    
    const allSelected = allPageIds.every((id) => newSelected.has(id));
    
    if (allSelected) {
      allPageIds.forEach((id) => newSelected.delete(id));
    } else {
      allPageIds.forEach((id) => newSelected.add(id));
    }
    
    setSelectedRows(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedRows);
    if (ids.length > 0 && confirm(`Delete ${ids.length} selected items?`)) {
      onBulkDelete?.(ids);
      setSelectedRows(new Set());
    }
  };

  // Get sort icon
  const getSortIcon = (key: string, sortable?: boolean) => {
    if (!sortable) return null;
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4 text-slate-500" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-teal-400" />
      : <ArrowDown className="w-4 h-4 text-teal-400" />;
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && onBulkDelete && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete ({selectedRows.size})</span>
            </button>
          )}
          
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-800 rounded-lg text-slate-400 text-sm">
            <Filter className="w-4 h-4" />
            <span>{filteredData.length} items</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>
                {selectable && (
                  <th className="p-4 w-12">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-teal-400 transition-colors"
                    >
                      {paginatedData.every((row) => selectedRows.has(keyExtractor(row))) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`p-4 text-left text-sm font-medium text-slate-400 ${
                      column.sortable ? 'cursor-pointer hover:text-white' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => handleSort(String(column.key), column.sortable)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {getSortIcon(String(column.key), column.sortable)}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete || actions) && (
                  <th className="p-4 text-right text-sm font-medium text-slate-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (onEdit || onDelete || actions ? 1 : 0)}
                    className="p-8 text-center text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const id = keyExtractor(row);
                  return (
                    <tr
                      key={id}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                        selectedRows.has(id) ? 'bg-teal-500/10' : ''
                      }`}
                    >
                      {selectable && (
                        <td className="p-4">
                          <button
                            onClick={() => handleSelectRow(id)}
                            className="text-slate-400 hover:text-teal-400 transition-colors"
                          >
                            {selectedRows.has(id) ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={`${id}-${String(column.key)}`} className="p-4 text-sm">
                          {column.render
                            ? column.render(row)
                            : String(row[column.key as keyof T] ?? '—')}
                        </td>
                      ))}
                      {(onEdit || onDelete || actions) && (
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            {actions?.(row)}
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(row)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-slate-400">
                Page <span className="text-white font-medium">{currentPage}</span> of{' '}
                <span className="text-white font-medium">{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
