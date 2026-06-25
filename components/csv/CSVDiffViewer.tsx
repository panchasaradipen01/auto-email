'use client';

import { Layers, CheckCircle2, Play, AlertCircle } from 'lucide-react';

interface CSVDiffViewerProps {
  newRows: Record<string, any>[];
  unchangedRows: Record<string, any>[];
  columns: string[];
}

export default function CSVDiffViewer({
  newRows,
  unchangedRows,
  columns,
}: CSVDiffViewerProps) {
  const previewLimit = 5;

  return (
    <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950">
      <div>
        <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">CSV Update Diffs</h3>
        <p className="text-xs text-gray-500 mt-1">Comparison snapshot of newly added spreadsheet rows vs already sent.</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* New Rows Card */}
        <div className="flex items-center gap-4 rounded-2xl bg-amber-50/30 p-4 border border-amber-100/50 dark:bg-amber-950/10 dark:border-amber-950/20">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Play className="h-5 w-5 rotate-90" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">New Rows Found</span>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{newRows.length}</p>
          </div>
        </div>

        {/* Processed/Unchanged Card */}
        <div className="flex items-center gap-4 rounded-2xl bg-emerald-50/30 p-4 border border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-950/20">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Unchanged Rows</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{unchangedRows.length}</p>
          </div>
        </div>
      </div>

      {/* Diff Table Preview */}
      {newRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-450">
            <Layers className="h-4 w-4 text-indigo-500" />
            <span>New Rows Preview (showing first {Math.min(previewLimit, newRows.length)})</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-900">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-900/30 dark:border-gray-900">
                  <th className="py-2.5 px-4 w-12 border-r border-gray-100 dark:border-gray-900">#</th>
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-4 border-r border-gray-100 dark:border-gray-900 truncate max-w-[150px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-600 dark:divide-gray-900 dark:text-gray-300">
                {newRows.slice(0, previewLimit).map((row, index) => (
                  <tr key={index} className="bg-amber-50/5 hover:bg-amber-50/10 transition">
                    <td className="py-2.5 px-4 font-semibold text-gray-400 border-r border-gray-100 dark:border-gray-900">
                      {index + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="py-2.5 px-4 border-r border-gray-100 dark:border-gray-900 truncate max-w-[150px]" title={String(row[col] ?? '')}>
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
