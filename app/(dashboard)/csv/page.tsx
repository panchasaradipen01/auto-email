'use client';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import CSVUploader from '@/components/csv/CSVUploader';
import CSVTable from '@/components/csv/CSVTable';
import { Database, FileSpreadsheet, Trash2, Layers, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const GET_CSV_FILES = gql`
  query GetCsvFiles {
    csvFiles {
      id
      filename
      rowCount
      columns
      processedRows
      createdAt
      storagePath
    }
  }
`;

const DELETE_CSV_FILE = gql`
  mutation DeleteCsvFile($id: ID!) {
    deleteCsvFile(id: $id)
  }
`;

export default function CSVPage() {
  const { data, loading, error, refetch } = useQuery(GET_CSV_FILES);
  const [deleteCsv] = useMutation(DELETE_CSV_FILE);

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileRows, setFileRows] = useState<Record<string, any>[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [loadingFileContent, setLoadingFileContent] = useState(false);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Active campaigns using this file might break.`)) {
      return;
    }

    try {
      await deleteCsv({
        variables: { id },
      });
      toast.success('CSV dataset deleted successfully.');
      if (selectedFileId === id) {
        setSelectedFileId(null);
        setFileRows([]);
        setFileHeaders([]);
      }
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete CSV file.');
    }
  };

  const handleSelectFile = async (id: string, storagePath: string) => {
    setLoadingFileContent(true);
    setSelectedFileId(id);
    
    try {
      // Fetch local file content or S3 signed url.
      // Since localAdapter/s3Adapter returns relative path `/api/csv/download?file=...` or signed S3 url,
      // we can fetch the URL directly to read the CSV content and parse it!
      const downloadUrl = `/api/csv/download?file=${encodeURIComponent(storagePath)}`;
      const res = await fetch(downloadUrl);
      
      if (!res.ok) {
        throw new Error('Failed to retrieve file contents.');
      }
      
      const csvText = await res.text();
      const { parseCSV } = await import('@/lib/csv/parser');
      const results = await parseCSV(csvText);

      setFileRows(results.data);
      setFileHeaders(results.meta.fields || Object.keys(results.data[0] || {}));
    } catch (err: any) {
      toast.error(err.message || 'Failed to read CSV content.');
      setSelectedFileId(null);
    } finally {
      setLoadingFileContent(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-6 text-rose-600 dark:border-rose-950/20">
        <p className="font-semibold">Failed to load CSV logs</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const csvFiles = data.csvFiles || [];
  const selectedFile = csvFiles.find((f: any) => f.id === selectedFileId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-950 dark:text-white md:text-2xl">CSV Datasets</h1>
          <p className="text-xs text-gray-500 mt-1">Upload list datasets, map parameters, and inspect rows.</p>
        </div>
      </div>

      {selectedFileId && selectedFile ? (
        <div className="space-y-6">
          {/* Virtualized sheet preview view */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedFileId(null);
                setFileRows([]);
                setFileHeaders([]);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-150"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
              <span>Back to CSV Manager</span>
            </button>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Previewing: {selectedFile.filename} ({selectedFile.rowCount} total rows)
            </span>
          </div>

          {loadingFileContent ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <CSVTable
              columns={fileHeaders}
              rows={fileRows}
              processedHashes={selectedFile.processedRows || []}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Uploader Box */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Upload Spreadsheet</h3>
              <CSVUploader onUploadSuccess={() => refetch()} />
            </div>
          </div>

          {/* Previous CSV List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 pb-4 dark:border-gray-900">
                Uploaded CSV Files
              </h3>

              <div className="mt-4 space-y-4">
                {csvFiles.length === 0 ? (
                  <div className="py-16 text-center text-xs text-gray-400">
                    No spreadsheet files have been uploaded yet.
                  </div>
                ) : (
                  csvFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between border border-gray-50 hover:border-indigo-100 rounded-2xl p-4 transition shadow-sm dark:border-gray-900 hover:shadow-md cursor-pointer"
                      onClick={() => handleSelectFile(file.id, file.storagePath)}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-none">
                            {file.filename}
                          </h4>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {file.rowCount} rows • {file.columns?.length || 0} headers • Uploaded {new Date(parseInt(file.createdAt)).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectFile(file.id, file.storagePath);
                          }}
                          className="flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold px-3 py-1.5 rounded-xl dark:bg-indigo-950/40 dark:text-indigo-400"
                        >
                          <Layers className="h-3 w-3" />
                          <span>View Sheet</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file.id, file.filename);
                          }}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-rose-600 dark:hover:bg-gray-900"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
