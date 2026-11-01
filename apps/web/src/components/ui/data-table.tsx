'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Download,
  Search,
  Filter,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  bulkActions?: Array<{
    label: string;
    action: (selectedRows: T[]) => void;
    destructive?: boolean;
  }>;
  onExportCsv?: () => void;
  pageSize?: number;
  emptyState?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKey,
  bulkActions = [],
  onExportCsv,
  pageSize = 10,
  emptyState,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (searchKey) {
        const val = item[searchKey];
        return String(val).toLowerCase().includes(term);
      }
      return Object.values(item).some((v) =>
        String(v).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortKey, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection
  const allSelected = paginatedData.length > 0 && paginatedData.every((r) => selectedIds.has(r.id));
  const someSelected = paginatedData.some((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (allSelected) {
      const next = new Set(selectedIds);
      paginatedData.forEach((r) => next.delete(r.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedData.forEach((r) => next.add(r.id));
      setSelectedIds(next);
    }
  }

  function toggleRow(id: string | number) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function exportCsvDefault() {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    // Default export
    const headers = columns.map((c) => c.header).join(',');
    const rows = sortedData.map((row) =>
      columns.map((c) => JSON.stringify((row as Record<string, unknown>)[c.key] ?? '')).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const selectedRowsList = data.filter((r) => selectedIds.has(r.id));

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          {bulkActions.length > 0 && selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1">
              <span className="text-xs font-medium text-primary">
                {selectedIds.size} selected
              </span>
              <div className="h-3 w-px bg-primary/20" />
              {bulkActions.map((ba, idx) => (
                <button
                  key={idx}
                  onClick={() => ba.action(selectedRowsList)}
                  className={`text-xs px-2 py-0.5 rounded font-medium hover:bg-primary/10 transition-colors ${
                    ba.destructive ? 'text-destructive' : 'text-primary'
                  }`}
                >
                  {ba.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={exportCsvDefault}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Select all"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : someSelected ? (
                      <CheckSquare className="h-4 w-4 opacity-50" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-semibold text-foreground select-none">
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <span>{col.header}</span>
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8">
                    {emptyState || (
                      <div className="text-center text-muted-foreground">
                        No records matching filter.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const isChecked = selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        isChecked ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(row.id)}
                          className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                          aria-label={`Select row ${row.id}`}
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-foreground font-normal">
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing <strong>{sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, sortedData.length)}</strong> of{' '}
            <strong>{sortedData.length}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 disabled:opacity-40 hover:bg-muted"
            >
              <ChevronLeft className="h-3 w-3" />
              <span>Previous</span>
            </button>
            <span className="font-mono text-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 disabled:opacity-40 hover:bg-muted"
            >
              <span>Next</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;

