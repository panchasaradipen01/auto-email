'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, gql } from '@apollo/client';
import Link from 'next/link';
import { Plus, Trash2, Edit3, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GET_TEMPLATES = gql`
  query GetTemplates {
    templates {
      id
      name
      subject
      body
      variables
      createdAt
    }
  }
`;

const DELETE_TEMPLATE = gql`
  mutation DeleteTemplate($id: ID!) {
    deleteTemplate(id: $id)
  }
`;

export default function TemplatesPage() {
  const { data, loading, error, refetch } = useQuery(GET_TEMPLATES);
  const [deleteTemplate] = useMutation(DELETE_TEMPLATE);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? Any active campaigns using it will be paused.')) {
      return;
    }

    try {
      await deleteTemplate({
        variables: { id },
      });
      toast.success('Template deleted successfully!');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template.');
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
        <p className="font-semibold">Failed to load templates</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const templates = data.templates || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-950 dark:text-white md:text-2xl">Templates Workspace</h1>
          <p className="text-xs text-gray-500 mt-1">Design rich personalized email bodies and bind files.</p>
        </div>

        <Link
          href="/templates/new"
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Template</span>
        </Link>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-150 py-20 text-center dark:border-gray-800">
          <div className="rounded-2xl bg-indigo-50/50 p-4 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-gray-900 dark:text-gray-100">No Templates Found</h3>
          <p className="mt-2 text-xs text-gray-450 max-w-xs">
            Start by creating a template with dynamic variables (e.g. {"{{first_name}}"}) to run campaigns.
          </p>
          <Link
            href="/templates/new"
            className="mt-6 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
          >
            Create first template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl: any) => (
            <div
              key={tpl.id}
              className="flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition dark:border-gray-900 dark:bg-gray-950"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {tpl.name}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link
                      href={`/templates/${tpl.id}`}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-indigo-600 dark:hover:bg-gray-900"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-rose-600 dark:hover:bg-gray-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Subject</span>
                    <p className="mt-0.5 truncate font-semibold">{tpl.subject}</p>
                  </div>
                  
                  {tpl.variables?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Detected Variables</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tpl.variables.slice(0, 3).map((v: string) => (
                          <span
                            key={v}
                            className="rounded-md bg-indigo-50/50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                          >
                            {v}
                          </span>
                        ))}
                        {tpl.variables.length > 3 && (
                          <span className="text-[9px] text-gray-400 font-semibold self-center">
                            +{tpl.variables.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-gray-50 pt-3 flex items-center justify-between text-[10px] text-gray-400 dark:border-gray-900">
                <span>Created {new Date(parseInt(tpl.createdAt || Date.now().toString())).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
