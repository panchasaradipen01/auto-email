'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlertCircle, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react';

interface CSVFile {
  id: string;
  filename: string;
  rowCount: number;
  columns: string[];
}

interface CSVUploaderProps {
  onUploadSuccess: (file: CSVFile, storagePath: string) => void;
}

export default function CSVUploader({ onUploadSuccess }: CSVUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError(null);
      setSuccessMsg(null);
      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/csv/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload CSV file.');
        }

        setSuccessMsg(`Successfully uploaded ${file.name} (${data.csvFile.rowCount} rows detected)`);
        onUploadSuccess(data.csvFile, data.storagePath);
      } catch (err: any) {
        setError(err.message || 'An error occurred during file upload.');
      } finally {
        setLoading(false);
      }
    },
    [onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/10 dark:text-rose-450">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/10 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 text-center transition-all ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50/10'
            : 'border-gray-200 bg-gray-50/30 hover:border-indigo-400 hover:bg-indigo-50/5 dark:border-gray-800 dark:bg-gray-900/10'
        }`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <>
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Parsing and validating CSV contents...</p>
            <p className="text-xs text-gray-400 mt-1">This may take a moment for larger spreadsheets.</p>
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-indigo-50/50 p-4 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 mb-4 animate-bounce">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV file here'}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">or click to browse from files</p>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Only CSV files up to 10MB accepted</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
