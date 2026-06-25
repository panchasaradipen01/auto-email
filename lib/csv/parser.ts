import Papa from 'papaparse';

export interface ParseCSVResult {
  data: Record<string, string>[];
  errors: any[];
  meta: Papa.ParseMeta;
}

/**
 * Parses a CSV string into JSON objects.
 * Uses a Web Worker in the browser if the content size exceeds 500KB (to keep the UI responsive).
 * Falls back to synchronous parsing on the server or for smaller files.
 */
export function parseCSV(
  csvString: string,
  options: { header?: boolean; skipEmptyLines?: boolean | 'greedy' } = {}
): Promise<ParseCSVResult> {
  const isBrowser = typeof window !== 'undefined';
  const sizeThreshold = 500 * 1024; // 500 KB

  const config = {
    header: options.header !== false,
    skipEmptyLines: options.skipEmptyLines ?? 'greedy',
  };

  if (isBrowser && csvString.length > sizeThreshold) {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker('/workers/csvParser.worker.js');

        worker.onmessage = (e) => {
          const { success, data, errors, meta, error } = e.data;
          worker.terminate();

          if (success) {
            resolve({ data, errors, meta });
          } else {
            reject(new Error(error || 'Failed parsing CSV via Worker'));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          reject(err);
        };

        worker.postMessage({ csvString, config });
      } catch (err) {
        // Fallback if worker instantiation fails (e.g. security policy)
        parseSync(csvString, config, resolve, reject);
      }
    });
  }

  return new Promise((resolve, reject) => {
    parseSync(csvString, config, resolve, reject);
  });
}

function parseSync(
  csvString: string,
  config: any,
  resolve: (res: ParseCSVResult) => void,
  reject: (err: any) => void
) {
  const papaConfig = { ...config, header: false };
  
  Papa.parse(csvString, {
    ...papaConfig,
    complete: (results) => {
      if (config.header === false) {
        resolve({
          data: results.data as Record<string, string>[],
          errors: results.errors,
          meta: results.meta,
        });
        return;
      }

      // Smart Header Detection
      let maxCols = 0;
      let headerRowIndex = 0;
      const rows = results.data as any[][];

      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        const nonEmpties = row.filter(cell => cell && String(cell).trim() !== '').length;
        if (nonEmpties > maxCols) {
          maxCols = nonEmpties;
          headerRowIndex = i;
        }
      }

      if (rows.length === 0) {
        resolve({
          data: [],
          errors: results.errors,
          meta: results.meta,
        });
        return;
      }

      const headers = rows[headerRowIndex].map((h, idx) => {
        const val = String(h).trim();
        return val ? val : `_${idx}`;
      });
      
      const objectData: Record<string, string>[] = [];

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        
        const isRowEmpty = row.every(cell => !cell || String(cell).trim() === '');
        if (isRowEmpty) continue;

        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
        });
        objectData.push(obj);
      }

      resolve({
        data: objectData,
        errors: results.errors,
        meta: results.meta,
      });
    },
    error: (err) => {
      reject(err);
    },
  });
}
