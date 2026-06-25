'use client';

// @ts-ignore
import { FixedSizeList } from 'react-window';
import { Check, AlertCircle, Play } from 'lucide-react';

interface CSVTableProps {
  columns: string[];
  rows: Record<string, any>[];
  processedHashes?: string[];
  failedHashes?: Record<string, string>; // maps hash -> error string
}

export default function CSVTable({
  columns,
  rows,
  processedHashes = [],
  failedHashes = {},
}: CSVTableProps) {
  const { hashRow } = require('@/utils/csvHasher'); // dynamic import or require is fine for helper

  const getRowStatus = (row: Record<string, any>) => {
    try {
      const { hashRow } = require('@/utils/csvHasher');
      const hash = hashRow(row);
      if (failedHashes[hash]) return 'FAILED';
      if (processedHashes.includes(hash)) return 'SENT';
      return 'NEW';
    } catch {
      return 'NEW';
    }
  };

  const getStatusBadge = (status: 'SENT' | 'FAILED' | 'NEW', row: Record<string, any>) => {
    const { hashRow } = require('@/utils/csvHasher');
    const hash = hashRow(row);
    switch (status) {
      case 'SENT':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/20">
            <Check className="h-3 w-3" />
            <span>Sent</span>
          </span>
        );
      case 'FAILED':
        return (
          <span
            title={failedHashes[hash] || 'Sending failed'}
            className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full dark:bg-rose-950/20 cursor-help"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full dark:bg-amber-950/20">
            <Play className="h-3 w-3 rotate-90" />
            <span>New</span>
          </span>
        );
    }
  };

  const getRowBgColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-emerald-50/10 hover:bg-emerald-50/20 dark:bg-emerald-950/5';
      case 'FAILED':
        return 'bg-rose-50/10 hover:bg-rose-50/20 dark:bg-rose-950/5';
      default:
        return 'bg-amber-50/10 hover:bg-amber-50/20 dark:bg-amber-950/5';
    }
  };

  // Define column width and calculate total width
  const cellWidth = 160;
  const statusColWidth = 100;
  const totalWidth = columns.length * cellWidth + statusColWidth;

  const Row = ({ index, style }: { index: number; style: any }) => {
    const row = rows[index];
    const status = getRowStatus(row);
    const bgColor = getRowBgColor(status);

    return (
      <div
        style={style}
        className={`flex items-center border-b border-gray-100 dark:border-gray-900 transition ${bgColor}`}
      >
        {/* Index Column */}
        <div className="flex h-full w-12 items-center justify-center border-r border-gray-100 dark:border-gray-900 text-xs text-gray-400 font-medium">
          {index + 1}
        </div>

        {/* Status Column */}
        <div
          style={{ width: statusColWidth }}
          className="flex h-full items-center px-4 border-r border-gray-100 dark:border-gray-900"
        >
          {getStatusBadge(status, row)}
        </div>

        {/* Data Cells */}
        {columns.map((col) => (
          <div
            key={col}
            style={{ width: cellWidth }}
            className="flex h-full items-center px-4 border-r border-gray-100 dark:border-gray-900 text-xs text-gray-600 dark:text-gray-300 truncate"
          >
            {String(row[col] ?? '')}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-150 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-950">
      {/* Table Outer Container for Horizontal Scroll */}
      <div className="overflow-x-auto">
        <div style={{ width: totalWidth + 48 }}>
          
          {/* Header Row */}
          <div className="flex h-11 items-center border-b border-gray-100 bg-gray-50/50 dark:border-gray-900 dark:bg-gray-950/20">
            {/* Index Header */}
            <div className="flex h-full w-12 items-center justify-center border-r border-gray-100 dark:border-gray-900 text-xs font-bold text-gray-450 uppercase tracking-wider">
              #
            </div>
            
            {/* Status Header */}
            <div
              style={{ width: statusColWidth }}
              className="flex h-full items-center px-4 border-r border-gray-100 dark:border-gray-900 text-xs font-bold text-gray-450 uppercase tracking-wider"
            >
              Status
            </div>
            
            {/* Dynamic Headers */}
            {columns.map((col) => (
              <div
                key={col}
                style={{ width: cellWidth }}
                className="flex h-full items-center px-4 border-r border-gray-100 dark:border-gray-900 text-xs font-bold text-gray-450 uppercase tracking-wider truncate"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Virtualized Rows List */}
          <FixedSizeList
            height={400}
            itemCount={rows.length}
            itemSize={44}
            width={totalWidth + 48}
          >
            {Row}
          </FixedSizeList>
        </div>
      </div>
    </div>
  );
}
