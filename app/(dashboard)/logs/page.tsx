'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ScrollText, Filter, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GET_CAMPAIGNS_AND_LOGS = gql`
  query GetCampaignsAndLogs(
    $campaignId: ID!
    $limit: Int
    $offset: Int
    $status: EmailStatus
    $sortBy: String
    $sortOrder: String
  ) {
    campaigns {
      id
      template {
        name
      }
    }
    emailLogs(
      campaignId: $campaignId
      limit: $limit
      offset: $offset
      status: $status
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      items {
        id
        recipientEmail
        rowData
        status
        sentAt
        errorMessage
        retryCount
        createdAt
      }
      totalCount
    }
  }
`;

// Custom Select Component for better UI consistency
function CustomSelect({
  value,
  onChange,
  options,
  icon: Icon,
  placeholder = 'Select...',
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  icon?: any;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2.5 bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl shadow-sm dark:border-gray-800 dark:bg-gray-950 hover:border-indigo-500 transition-colors w-48"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg dark:bg-gray-900 dark:border-gray-800 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                  value === opt.value
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LogsPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // Pagination & Sorting & Filtering State
  const [page, setPage] = useState(1);
  const limit = 20;
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data, loading, error, refetch } = useQuery(GET_CAMPAIGNS_AND_LOGS, {
    variables: {
      campaignId: selectedCampaignId || 'all-dummy', // default mock ID to prevent GQL error if none selected
      limit,
      offset: (page - 1) * limit,
      status: statusFilter || undefined,
      sortBy,
      sortOrder,
    },
    fetchPolicy: 'cache-and-network',
  });

  const campaigns = data?.campaigns || [];
  const logs = data?.emailLogs?.items || [];
  const totalCount = data?.emailLogs?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Reset page when filters or sorting change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, sortBy, sortOrder, selectedCampaignId]);

  // If no campaign selected, auto-select first campaign once loaded
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  // Subscribe to real-time SSE progress events from Redux uiSlice
  const queueProgress = useSelector((state: RootState) => state.ui.queueProgress);

  // Trigger refetch whenever a queue event arrives to keep log tables dynamically in-sync!
  useEffect(() => {
    if (queueProgress && selectedCampaignId === queueProgress.campaignId) {
      refetch();
    }
  }, [queueProgress, selectedCampaignId, refetch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Sent</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full dark:bg-rose-950/20">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full dark:bg-indigo-950/20 animate-pulse">
            <Clock className="h-3 w-3" />
            <span>Queued</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full dark:bg-amber-950/20 animate-bounce">
            <AlertTriangle className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const toggleRow = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
  };

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-6 text-rose-600 dark:border-rose-950/20">
        <p className="font-semibold">Failed to load email logs</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-950 dark:text-white md:text-2xl">Email Dispatch Logs</h1>
          <p className="text-xs text-gray-500 mt-1">Real-time Server-Sent Events (SSE) tracking audit trail.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            icon={Filter}
            placeholder="All Statuses"
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Queued', value: 'QUEUED' },
              { label: 'Sent', value: 'SENT' },
              { label: 'Failed', value: 'FAILED' },
              { label: 'Bounced', value: 'BOUNCED' },
            ]}
          />

          {/* Campaign Filter Select */}
          {campaigns.length > 0 && (
            <CustomSelect
              value={selectedCampaignId}
              onChange={setSelectedCampaignId}
              icon={ScrollText}
              placeholder="Select Campaign"
              options={campaigns.map((camp: any) => ({
                label: camp.template?.name || 'Unnamed',
                value: camp.id,
              }))}
            />
          )}
        </div>
      </div>

      {/* Main logs list */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-150 py-20 text-center dark:border-gray-800">
          <div className="rounded-2xl bg-indigo-50/50 p-4 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <ScrollText className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-gray-900 dark:text-gray-100">No Campaigns Configured</h3>
          <p className="mt-2 text-xs text-gray-455">
            Configure a campaign and trigger dispatches to inspect audit logs.
          </p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-20 text-center text-xs text-gray-400 rounded-3xl border border-dashed border-gray-150 dark:border-gray-800">
          No email logs found for this campaign. Trigger a send run to start tracking.
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden dark:border-gray-900 dark:bg-gray-950">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-900/30 dark:border-gray-900 select-none">
                  <th className="py-3.5 px-6 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50" onClick={() => handleSort('recipientEmail')}>
                    Recipient Address {renderSortIcon('recipientEmail')}
                  </th>
                  <th className="py-3.5 px-6 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50" onClick={() => handleSort('status')}>
                    Dispatch Status {renderSortIcon('status')}
                  </th>
                  <th className="py-3.5 px-6 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50" onClick={() => handleSort('retryCount')}>
                    Retries {renderSortIcon('retryCount')}
                  </th>
                  <th className="py-3.5 px-6 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50" onClick={() => handleSort('createdAt')}>
                    Timestamp {renderSortIcon('createdAt')}
                  </th>
                  <th className="py-3.5 px-6 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700 dark:divide-gray-900 dark:text-gray-300">
                {logs.map((log: any) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <>
                      <tr
                        key={log.id}
                        onClick={() => toggleRow(log.id)}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-6 font-semibold text-gray-950 dark:text-white select-all">
                          {log.recipientEmail}
                        </td>
                        <td className="py-3.5 px-6">{getStatusBadge(log.status)}</td>
                        <td className="py-3.5 px-6 text-gray-400 font-semibold">{log.retryCount} / 3</td>
                        <td className="py-3.5 px-6 text-gray-400">
                          {log.sentAt
                            ? new Date(parseInt(log.sentAt)).toLocaleString()
                            : new Date(parseInt(log.createdAt)).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-6">
                          {isExpanded ? <ChevronUp className="h-4.5 w-4.5 text-gray-400" /> : <ChevronDown className="h-4.5 w-4.5 text-gray-400" />}
                        </td>
                      </tr>

                      {/* Expandable row showing cell JSON and errors */}
                      {isExpanded && (
                        <tr className="bg-gray-50/20 dark:bg-gray-900/5">
                          <td colSpan={5} className="p-6 border-b border-gray-50 dark:border-gray-900">
                            <div className="space-y-4">
                              {log.errorMessage && (
                                <div className="flex items-start gap-2.5 bg-rose-50 p-3.5 rounded-2xl text-xs text-rose-600 dark:bg-rose-950/15 dark:text-rose-400 border border-rose-100/50">
                                  <AlertTriangle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-semibold block mb-0.5">Error Message Details:</span>
                                    <span>{log.errorMessage}</span>
                                  </div>
                                </div>
                              )}

                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                  Spreadsheet Cell Data Row Snapshot
                                </span>
                                <pre className="mt-2 rounded-2xl border border-gray-100 bg-white p-4 font-mono text-[10px] text-gray-650 dark:border-gray-900 dark:bg-gray-950 dark:text-gray-400 overflow-x-auto shadow-inner select-all">
                                  {JSON.stringify(log.rowData, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 p-4 dark:border-gray-900 bg-gray-50/30 dark:bg-gray-950/50">
              <span className="text-xs text-gray-500 font-semibold">
                Showing {Math.min((page - 1) * limit + 1, totalCount)} to {Math.min(page * limit, totalCount)} of {totalCount} logs
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 mx-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
