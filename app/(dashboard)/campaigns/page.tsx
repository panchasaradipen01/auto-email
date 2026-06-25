'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import { Plus, Play, Pause, Trash2, Send, FileSpreadsheet, Loader2, X, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ColumnMapper from '@/components/csv/ColumnMapper';
import CampaignStats from '@/components/campaigns/CampaignStats';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

const GET_CAMPAIGN_STATS = gql`
  query GetCampaignStats($campaignId: ID!) {
    campaignStats(campaignId: $campaignId) {
      campaignId
      total
      pending
      queued
      sent
      failed
      bounced
    }
  }
`;

function ActiveCampaignStatsViewer({ campaignId, onClose, totalRows }: { campaignId: string, onClose: () => void, totalRows: number }) {
  const { data, refetch, loading } = useQuery(GET_CAMPAIGN_STATS, {
    variables: { campaignId },
    fetchPolicy: 'network-only'
  });
  
  const queueProgress = useSelector((state: any) => state.ui.queueProgress);

  // Re-fetch stats whenever queue progress for THIS campaign arrives
  useEffect(() => {
    if (queueProgress && queueProgress.campaignId === campaignId) {
      refetch();
    }
  }, [queueProgress, campaignId, refetch]);

  const stats = data?.campaignStats || {
    pending: 0,
    queued: 0,
    sent: 0,
    failed: 0,
    bounced: 0,
  };

  return (
    <div className="border-b border-gray-100 pb-6 dark:border-gray-900">
      <div className="flex justify-between items-center mb-3">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-450">
          Active Campaign Analytics
          {loading && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
        </h4>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:underline"
        >
          Hide stats
        </button>
      </div>
      <CampaignStats
        total={totalRows}
        pending={stats.pending}
        queued={stats.queued}
        sent={stats.sent}
        failed={stats.failed}
        bounced={stats.bounced}
      />
    </div>
  );
}

const GET_CAMPAIGNS_AND_RESOURCES = gql`
  query GetCampaignsAndResources {
    campaigns {
      id
      status
      autoSend
      emailColumn
      columnMapping
      createdAt
      template {
        id
        name
        subject
        body
      }
      csvFile {
        id
        filename
        rowCount
      }
    }
    templates {
      id
      name
      subject
      body
      variables
    }
    csvFiles {
      id
      filename
      columns
      storagePath
    }
  }
`;

const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign(
    $templateId: ID!
    $csvFileId: ID!
    $columnMapping: JSON!
    $emailColumn: String!
    $autoSend: Boolean!
  ) {
    createCampaign(
      templateId: $templateId
      csvFileId: $csvFileId
      columnMapping: $columnMapping
      emailColumn: $emailColumn
      autoSend: $autoSend
    ) {
      id
      status
    }
  }
`;

const UPDATE_CAMPAIGN_STATUS = gql`
  mutation UpdateCampaignStatus($id: ID!, $status: CampaignStatus!) {
    updateCampaignStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const TRIGGER_CAMPAIGN = gql`
  mutation TriggerCampaign($id: ID!) {
    triggerCampaign(id: $id)
  }
`;

const RETRY_CAMPAIGN = gql`
  mutation RetryCampaign($id: ID!) {
    retryCampaign(id: $id)
  }
`;

const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: ID!) {
    deleteCampaign(id: $id)
  }
`;

export default function CampaignsPage() {
  const { data, loading, error, refetch } = useQuery(GET_CAMPAIGNS_AND_RESOURCES);
  const [createCampaign, { loading: creatingCampaign }] = useMutation(CREATE_CAMPAIGN);
  const [updateStatus] = useMutation(UPDATE_CAMPAIGN_STATUS);
  const [triggerCampaign, { loading: triggeringCampaignId }] = useMutation(TRIGGER_CAMPAIGN);
  const [retryCampaign, { loading: retryingCampaignId }] = useMutation(RETRY_CAMPAIGN);
  const [deleteCampaign] = useMutation(DELETE_CAMPAIGN);

  // Modal / Wizard state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedCsvId, setSelectedCsvId] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [emailColumn, setEmailColumn] = useState('');
  const [autoSend, setAutoSend] = useState(false);

  const [activeStatsCampaignId, setActiveStatsCampaignId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateStatus({
        variables: { id, status: nextStatus },
      });
      toast.success(`Campaign successfully ${nextStatus === 'ACTIVE' ? 'activated' : 'paused'}.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleTrigger = async (id: string) => {
    try {
      toast.loading('Enqueuing campaign jobs...', { id: 'trigger' });
      await triggerCampaign({
        variables: { id },
      });
      toast.success('Campaign email queue processing started!', { id: 'trigger' });
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger campaign.', { id: 'trigger' });
    }
  };

  const handleRetry = async (id: string) => {
    try {
      toast.loading('Re-enqueuing failed emails...', { id: 'retry' });
      await retryCampaign({
        variables: { id },
      });
      toast.success('Failed emails successfully re-queued!', { id: 'retry' });
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to retry campaign.', { id: 'retry' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? Associated email logs will remain.')) {
      return;
    }

    try {
      await deleteCampaign({
        variables: { id },
      });
      toast.success('Campaign deleted successfully.');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete campaign.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId || !selectedCsvId || !emailColumn) {
      toast.error('Template, CSV file, and email column selection are required.');
      return;
    }

    try {
      await createCampaign({
        variables: {
          templateId: selectedTemplateId,
          csvFileId: selectedCsvId,
          columnMapping: mapping,
          emailColumn,
          autoSend,
        },
      });

      toast.success('Campaign configured successfully in DRAFT mode!');
      setIsOpen(false);
      
      // Reset state
      setSelectedTemplateId('');
      setSelectedCsvId('');
      setMapping({});
      setEmailColumn('');
      setAutoSend(false);
      
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create campaign.');
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
        <p className="font-semibold">Failed to load campaigns</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const campaigns = data.campaigns || [];
  const templates = data.templates || [];
  const csvFiles = data.csvFiles || [];

  const selectedTemplateObj = templates.find((t: any) => t.id === selectedTemplateId);
  const selectedCsvObj = csvFiles.find((f: any) => f.id === selectedCsvId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-950 dark:text-white md:text-2xl">Campaigns Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Configure and manage personalized mail queues.</p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Build Campaign</span>
        </button>
      </div>

      {/* Analytics widget when campaign is clicked */}
      {activeStatsCampaignId && (
        <ActiveCampaignStatsViewer 
          campaignId={activeStatsCampaignId} 
          onClose={() => setActiveStatsCampaignId(null)} 
          totalRows={campaigns.find((c: any) => c.id === activeStatsCampaignId)?.csvFile?.rowCount || 0}
        />
      )}

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-150 py-20 text-center dark:border-gray-800">
          <div className="rounded-2xl bg-indigo-50/50 p-4 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <Send className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-gray-900 dark:text-gray-100">No Campaigns Configured</h3>
          <p className="mt-2 text-xs text-gray-455 max-w-xs">
            Connect a CSV and template to create campaigns, and auto-dispatch mail flows.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-6 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
          >
            Create a campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp: any) => (
            <div
              key={camp.id}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-gray-900 dark:bg-gray-950 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-3.5 dark:border-gray-900">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      camp.status === 'ACTIVE'
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                        : camp.status === 'PAUSED'
                        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20'
                        : 'text-gray-500 bg-gray-55 dark:bg-gray-800'
                    }`}>
                      {camp.status}
                    </span>
                    {camp.autoSend && (
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full dark:bg-indigo-950/20">
                        Auto-Send Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(camp.id, camp.status)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-indigo-650 dark:hover:bg-gray-900"
                      title={camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Activate Campaign'}
                    >
                      {camp.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(camp.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-rose-600 dark:hover:bg-gray-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Template Bind</span>
                    <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{camp.template?.name}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">CSV Dataset</span>
                    <div className="flex items-center justify-between mt-0.5 font-semibold text-gray-900 dark:text-white">
                      <span>{camp.csvFile?.filename}</span>
                      <span className="text-[10px] text-gray-400">({camp.csvFile?.rowCount || 0} records)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Email Column Target</span>
                    <p className="mt-0.5 font-semibold text-indigo-600 dark:text-indigo-400">{camp.emailColumn}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between gap-4 dark:border-gray-900">
                <button
                  onClick={() => setActiveStatsCampaignId(camp.id)}
                  className="text-xs font-semibold text-gray-400 hover:text-indigo-600 transition"
                >
                  View Stats
                </button>

                <button
                  onClick={() => handleTrigger(camp.id)}
                  disabled={triggeringCampaignId}
                  className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Run Dispatch</span>
                </button>
              </div>

              {/* Retry Failed Button if campaign is ACTIVE */}
              {camp.status === 'ACTIVE' && (
                <div className="mt-3 border-t border-gray-50 pt-3 flex justify-end dark:border-gray-900">
                  <button
                    onClick={() => handleRetry(camp.id)}
                    disabled={retryingCampaignId}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold transition disabled:opacity-50 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-400"
                    title="Re-enqueue failed emails for this campaign"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Failed</span>
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative z-50 flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-gray-150 bg-white p-6 shadow-2xl overflow-hidden dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 dark:border-gray-900">
              <div>
                <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">Build Email Campaign</h3>
                <p className="text-xs text-gray-500 mt-1">Bind parameters to build automated sequences.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto py-6 space-y-6">
              
              {/* Select Templates & CSV */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Select Template *</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <option value="">-- Choose Template --</option>
                    {templates.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Select CSV File *</label>
                  <select
                    value={selectedCsvId}
                    onChange={(e) => setSelectedCsvId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <option value="">-- Choose CSV File --</option>
                    {csvFiles.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.filename}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto Send Toggle */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-gray-50 p-4 dark:border-gray-900 bg-gray-50/20">
                <input
                  type="checkbox"
                  id="autoSend"
                  checked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                  className="h-4.5 w-4.5 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500"
                />
                <label htmlFor="autoSend" className="flex flex-col cursor-pointer">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Auto-Trigger on CSV Update</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Automatically diff and enqueue emails when the CSV is modified.</span>
                </label>
              </div>

              {/* Column Mapping Section */}
              {selectedTemplateObj && selectedCsvObj && (
                <div className="border-t border-gray-55 pt-6 dark:border-gray-900">
                  <ColumnMapper
                    templateVariables={selectedTemplateObj.variables || []}
                    csvColumns={selectedCsvObj.columns || []}
                    sampleRow={null}
                    mapping={mapping}
                    onChangeMapping={setMapping}
                    emailColumn={emailColumn}
                    onChangeEmailColumn={setEmailColumn}
                    subjectTemplate={selectedTemplateObj.subject}
                    bodyTemplate={selectedTemplateObj.body}
                  />
                </div>
              )}

            </form>

            <div className="flex items-center justify-end gap-3 border-t border-gray-50 pt-4 dark:border-gray-900">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-gray-250 bg-white px-5 py-2.5 text-xs font-semibold hover:bg-gray-50 dark:bg-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                disabled={creatingCampaign}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <span>Save Campaign</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
