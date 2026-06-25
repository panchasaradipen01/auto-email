/**
 * Helper to remove any Byte Order Mark (BOM) from the start of a CSV file string.
 */
export function stripBOM(content: string): string {
  if (content.startsWith('\uFEFF')) {
    return content.substring(1);
  }
  return content;
}

/**
 * Validates if the file's reported MIME type is a valid CSV.
 */
export function isValidMimeType(mimeType: string): boolean {
  const allowed = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'text/x-csv',
    'text/plain', // Sometimes plain text is reported
  ];
  return allowed.includes(mimeType.toLowerCase());
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  columns: string[];
}

/**
 * Validates the parsed CSV array rows structure.
 */
export function validateCSVStructure(rows: Record<string, any>[]): CSVValidationResult {
  const errors: string[] = [];

  if (!rows || rows.length === 0) {
    return {
      isValid: false,
      errors: ['CSV file is empty or contains no rows.'],
      columns: [],
    };
  }

  // Retrieve columns from the first row and trim whitespace
  const columns = Object.keys(rows[0])
    .map((col) => col.trim())
    .filter((col) => col !== '');

  if (columns.length === 0) {
    errors.push('No valid header columns found in CSV file.');
  }

  // Count empty rows
  let emptyRowsCount = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const isRowEmpty = Object.values(row).every((val) => {
      return val === null || val === undefined || String(val).trim() === '';
    });
    if (isRowEmpty) {
      emptyRowsCount++;
    }
  }

  if (emptyRowsCount === rows.length) {
    errors.push('CSV contains only empty data rows.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    columns,
  };
}
