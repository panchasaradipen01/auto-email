'use client';

import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { addAttachmentId, removeAttachmentId } from '@/store/slices/templateSlice';
import { FileUp, File, FileText, Image, X, Loader2, AlertCircle } from 'lucide-react';

interface Attachment {
  id: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

interface AttachmentManagerProps {
  initialAttachments?: Attachment[];
}

export default function AttachmentManager({ initialAttachments = [] }: AttachmentManagerProps) {
  const dispatch = useDispatch();
  const attachmentIds = useSelector((state: RootState) => state.template.attachmentIds);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSize = attachments.reduce((sum, item) => sum + item.sizeBytes, 0);
  const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-emerald-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-rose-500" />;
    return <File className="h-5 w-5 text-indigo-500" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    // 10MB individual limit check
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds individual 10MB limit.');
      return;
    }

    // 25MB total limit check
    if (totalSize + file.size > MAX_TOTAL_SIZE) {
      setError('Adding this file exceeds the 25MB total email size limit.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload file.');
      }

      const data = await res.json();
      const uploaded: Attachment = data.attachment;

      setAttachments((prev) => [...prev, uploaded]);
      dispatch(addAttachmentId(uploaded.id));
    } catch (err: any) {
      setError(err.message || 'An error occurred during file upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    dispatch(removeAttachmentId(id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Template Attachments</h3>
          <p className="text-xs text-gray-500">Add documents (PDF, DOCX, images) up to 10MB each (max 25MB total).</p>
        </div>
        
        {/* Total Size Indicator */}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          totalSize > MAX_TOTAL_SIZE ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
        }`}>
          {formatBytes(totalSize)} / 25 MB
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:bg-rose-950/10 dark:text-rose-400">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Trigger Dropzone Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/30 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/5 dark:border-gray-800 dark:bg-gray-900/20"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
            <span className="text-sm font-medium text-indigo-600">Uploading attachment...</span>
          </>
        ) : (
          <>
            <FileUp className="h-8 w-8 text-gray-400 mb-3" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload files</span>
            <span className="text-xs text-gray-450 mt-1">PDF, DOCX, JPEG, PNG</span>
          </>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white p-3 space-y-2 dark:divide-gray-900 dark:border-gray-800 dark:bg-gray-950">
          {attachments.map((file) => (
            <div key={file.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gray-50 p-2 dark:bg-gray-900">{getFileIcon(file.mimeType)}</div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{file.filename}</span>
                  <span className="text-[10px] text-gray-400">{formatBytes(file.sizeBytes)}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleRemove(file.id)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-rose-600 dark:hover:bg-gray-900"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
