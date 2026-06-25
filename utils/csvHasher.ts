import crypto from 'crypto';

/**
 * Normalizes values to string and trims any outer whitespace.
 */
export function normalizeValue(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Computes a stable SHA-256 hash of a CSV row object.
 * It sorts keys alphabetically and trims whitespace from both keys and values
 * to ensure that column reordering and extra spaces do not alter the hash.
 * OPTIMIZATION: We process the row in a single O(N) pass before sorting.
 */
export function hashRow(row: Record<string, any>): string {
  // 1. Single pass: trim keys and values
  const normalizedEntries = Object.entries(row)
    .map(([k, v]) => [k.trim(), normalizeValue(v)])
    .filter(([k]) => k !== '');

  // 2. Sort by key to ensure stability regardless of column order
  normalizedEntries.sort((a, b) => a[0].localeCompare(b[0]));

  // 3. Construct the cleaned object
  const cleanedRow: Record<string, string> = {};
  for (const [k, v] of normalizedEntries) {
    cleanedRow[k] = v;
  }

  const serialized = JSON.stringify(cleanedRow);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Generates a SHA-256 hash of the entire CSV string to identify exact duplicate uploads.
 * It removes Byte Order Marks (BOM) and standardizes line endings to LF (\n).
 */
export function hashCsvContent(content: string): string {
  const normalizedContent = content
    .replace(/^\uFEFF/, '')       // Strip UTF-8 BOM
    .replace(/\r\n/g, '\n')       // Convert CRLF to LF
    .trim();
  
  return crypto.createHash('sha256').update(normalizedContent).digest('hex');
}
