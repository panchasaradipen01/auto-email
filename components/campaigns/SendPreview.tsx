'use client';

import { X, Eye, Code, AlertCircle } from 'lucide-react';
import { useSendPreview } from '@/hooks/useSendPreview';

interface SendPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  subjectTemplate: string;
  bodyTemplate: string;
  sampleRow: Record<string, any> | null;
  columnMapping: Record<string, string>;
}

export default function SendPreview({
  isOpen,
  onClose,
  subjectTemplate,
  bodyTemplate,
  sampleRow,
  columnMapping,
}: SendPreviewProps) {
  const { subjectPreview, bodyPreview, errors } = useSendPreview(
    subjectTemplate,
    bodyTemplate,
    sampleRow,
    columnMapping
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-50 flex h-[90vh] w-full max-w-6xl flex-col rounded-3xl border border-gray-150 bg-white shadow-2xl overflow-hidden dark:border-gray-800 dark:bg-gray-950">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5 dark:border-gray-900">
          <div>
            <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">Template Integration Preview</h3>
            <p className="text-xs text-gray-500 mt-1">Verify substitution blocks and html markup side-by-side.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-900 dark:hover:text-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning messages if any */}
        {errors.length > 0 && (
          <div className="flex items-start gap-2 bg-rose-50 px-6 py-3 text-xs text-rose-600 dark:bg-rose-950/10 dark:text-rose-450">
            <AlertCircle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Substitution Warning Flags:</span>
              <ul className="list-disc list-inside">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Side-by-Side Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-y-auto dark:divide-gray-900">
          
          {/* Left Column: Raw Template */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Code className="h-4 w-4 text-indigo-500" />
              <span>Raw Template Source</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-450 uppercase">Subject Block</span>
              <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-900 select-all">
                {subjectTemplate || <span className="text-gray-450 italic">No subject</span>}
              </p>
            </div>

            <div className="flex-1">
              <span className="text-[10px] font-bold text-gray-450 uppercase">Body Markup</span>
              <div className="mt-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 font-mono text-xs text-gray-600 dark:border-gray-900 dark:bg-gray-900/40 dark:text-gray-400 overflow-auto max-h-[350px]">
                {bodyTemplate || <span className="text-gray-450 italic">No body text</span>}
              </div>
            </div>
          </div>

          {/* Right Column: Rendered Preview */}
          <div className="p-6 overflow-y-auto bg-gray-50/20 space-y-4 dark:bg-gray-950/20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Eye className="h-4 w-4 text-indigo-500" />
              <span>Substituted Live Preview</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-450 uppercase">Subject</span>
              <p className="mt-1 text-sm font-semibold text-gray-950 dark:text-white bg-white dark:bg-gray-950 p-3 rounded-xl border border-gray-100 dark:border-gray-900 shadow-sm">
                {subjectPreview || <span className="text-gray-400 italic">Unresolved</span>}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-450 uppercase">Body Rendered</span>
              <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-900 dark:bg-gray-950 overflow-y-auto max-h-[350px]">
                {bodyPreview ? (
                  <div
                    className="prose prose-sm max-w-none text-sm text-gray-700 dark:text-gray-300 dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: bodyPreview }}
                  />
                ) : (
                  <span className="text-gray-400 italic text-sm">Unresolved template body</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-900 dark:bg-gray-950/20">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-250 bg-white px-5 py-2 text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}
