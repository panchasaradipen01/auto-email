self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js');

self.onmessage = function (e) {
  const { csvString, config } = e.data;
  
  if (!self.Papa) {
    self.postMessage({ error: 'PapaParse library failed to load in Web Worker.' });
    return;
  }
  
  // Force header to false so we can manually detect the true header row
  const papaConfig = { ...config, header: false };
  
  self.Papa.parse(csvString, {
    ...papaConfig,
    complete: function (results) {
      if (config.header === false) {
        self.postMessage({ success: true, data: results.data, errors: results.errors, meta: results.meta });
        return;
      }

      // Smart Header Detection
      let maxCols = 0;
      let headerRowIndex = 0;
      const rows = results.data;

      // Scan first 20 rows to find the row with the most non-empty columns
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
        self.postMessage({ success: true, data: [], errors: results.errors, meta: results.meta });
        return;
      }

      const headers = rows[headerRowIndex].map((h, idx) => {
        const val = String(h).trim();
        return val ? val : `_${idx}`;
      });
      
      const objectData = [];

      // Map remaining rows to objects
      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        
        // Skip completely empty rows
        const isRowEmpty = row.every(cell => !cell || String(cell).trim() === '');
        if (isRowEmpty) continue;

        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
        });
        objectData.push(obj);
      }

      self.postMessage({ success: true, data: objectData, errors: results.errors, meta: results.meta });
    },
    error: function (error) {
      self.postMessage({ success: false, error: error.message || error });
    }
  });
};
