import { hashRow } from '@/utils/csvHasher';

export interface DiffResult {
  newRows: Record<string, any>[];
  unchangedRows: Record<string, any>[];
  totalRows: number;
}

/**
 * Compares incoming CSV rows against a collection of already processed row hashes
 * to detect newly added rows.
 * @param rows Incoming parsed CSV rows
 * @param processedRowHashes Array of hashes representing already sent email rows
 */
export function diffCsvRows(
  rows: Record<string, any>[],
  processedRowHashes: string[]
): DiffResult {
  const processedSet = new Set(processedRowHashes);
  const newRows: Record<string, any>[] = [];
  const unchangedRows: Record<string, any>[] = [];

  for (const row of rows) {
    const rowHash = hashRow(row);
    if (processedSet.has(rowHash)) {
      unchangedRows.push(row);
    } else {
      newRows.push(row);
    }
  }

  return {
    newRows,
    unchangedRows,
    totalRows: rows.length,
  };
}
