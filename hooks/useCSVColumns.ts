import { useState, useEffect } from 'react';
import { parseCSV } from '@/lib/csv/parser';

/**
 * Custom hook to dynamically parse headers/columns from raw CSV contents.
 */
export function useCSVColumns(csvContent: string | null) {
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!csvContent) {
      setColumns([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    parseCSV(csvContent, { header: true })
      .then((results) => {
        if (results.meta && results.meta.fields) {
          // Filter out empty headers
          const fields = results.meta.fields.map((f) => f.trim()).filter((f) => f !== '');
          setColumns(fields);
        } else if (results.data && results.data.length > 0) {
          const keys = Object.keys(results.data[0]).map((k) => k.trim()).filter((k) => k !== '');
          setColumns(keys);
        } else {
          setError('No columns or headers could be detected in the CSV content.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Error parsing CSV headers.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [csvContent]);

  return { columns, error, loading };
}
