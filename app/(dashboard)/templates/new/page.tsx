'use client';

import { useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  setTemplateName,
  setTemplateSubject,
  resetTemplateForm,
} from '@/store/slices/templateSlice';
import TemplateEditor from '@/components/templates/TemplateEditor';
import AttachmentManager from '@/components/templates/AttachmentManager';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

const CREATE_TEMPLATE = gql`
  mutation CreateTemplate($name: String!, $subject: String!, $body: String!, $attachmentIds: [ID!]) {
    createTemplate(name: $name, subject: $subject, body: $body, attachmentIds: $attachmentIds) {
      id
      name
    }
  }
`;

export default function NewTemplatePage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { name, subject, body, attachmentIds } = useSelector(
    (state: RootState) => state.template
  );

  const [createTemplate, { loading }] = useMutation(CREATE_TEMPLATE);
  const [error, setError] = useState<string | null>(null);

  // Reset form state on mount
  useEffect(() => {
    dispatch(resetTemplateForm());
  }, [dispatch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !body) {
      setError('Please fill in the template name, subject, and body.');
      return;
    }

    setError(null);

    try {
      await createTemplate({
        variables: {
          name,
          subject,
          body,
          attachmentIds,
        },
      });

      toast.success('Template created successfully!');
      router.push('/templates');
    } catch (err: any) {
      setError(err.message || 'Failed to create template.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Create New Template</h1>
            <p className="text-xs text-gray-500 mt-0.5">Design a dynamic template with insertable variable blocks.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Template</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-600 dark:bg-rose-950/10 dark:text-rose-455">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Forms Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Info panel */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Template Name *</label>
            <input
              type="text"
              placeholder="e.g. Job Application Response"
              value={name}
              onChange={(e) => dispatch(setTemplateName(e.target.value))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Email Subject Line * (Supports variables like {"{{company_name}}"})</label>
            <input
              type="text"
              placeholder="e.g. Application Status at {{company_name}}"
              value={subject}
              onChange={(e) => dispatch(setTemplateSubject(e.target.value))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>
        </div>

        {/* TipTap Rich Text Editor Container */}
        <div>
          <TemplateEditor />
        </div>

        {/* Attachment Manager */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950">
          <AttachmentManager />
        </div>

      </div>
    </div>
  );
}
