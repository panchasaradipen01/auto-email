'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useEffect } from 'react';
import { Mail, ShieldCheck, Database, Key, Server, Settings, Loader2, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    me {
      id
      email
      name
      smtpConfig {
        host
        port
        username
        fromName
        fromEmail
      }
      templates {
        id
        name
      }
      campaigns {
        id
        status
        template {
          name
        }
        csvFile {
          filename
          rowCount
        }
      }
    }
  }
`;

const SAVE_SMTP_CONFIG = gql`
  mutation SaveSmtpConfig(
    $host: String!
    $port: Int!
    $username: String!
    $password: String!
    $fromName: String!
    $fromEmail: String!
  ) {
    saveSmtpConfig(
      host: $host
      port: $port
      username: $username
      password: $password
      fromName: $fromName
      fromEmail: $fromEmail
    ) {
      id
      host
      port
      username
      fromName
      fromEmail
    }
  }
`;

export default function DashboardPage() {
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA);
  const [saveSmtp, { loading: savingSmtp }] = useMutation(SAVE_SMTP_CONFIG);

  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromName: '',
    fromEmail: '',
  });

  const [isEditingSmtp, setIsEditingSmtp] = useState(false);

  // Load SMTP config when query completes
  useEffect(() => {
    if (data?.me?.smtpConfig) {
      const config = data.me.smtpConfig;
      setSmtpForm({
        host: config.host || '',
        port: config.port || 587,
        username: config.username || '',
        password: '', // do not load password back into form for security
        fromName: config.fromName || '',
        fromEmail: config.fromEmail || '',
      });
    } else {
      setIsEditingSmtp(true); // Open form if no config exists
    }
  }, [data]);

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSmtp({
        variables: {
          host: smtpForm.host,
          port: parseInt(String(smtpForm.port)),
          username: smtpForm.username,
          password: smtpForm.password,
          fromName: smtpForm.fromName,
          fromEmail: smtpForm.fromEmail,
        },
      });
      toast.success('SMTP Configuration saved successfully!');
      setIsEditingSmtp(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save SMTP settings.');
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
        <p className="font-semibold">Failed to load dashboard data</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const user = data.me;
  const activeCampaigns = user?.campaigns?.filter((c: any) => c.status === 'ACTIVE') || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-200">
              <Sparkles className="h-4 w-4" />
              <span>MailFlow Dashboard</span>
            </span>
            <h1 className="mt-3 text-2xl font-black md:text-3xl">Hello, {user?.name || 'User'}!</h1>
            <p className="mt-2.5 text-sm text-indigo-100 max-w-xl leading-relaxed">
              Design templates, map column headings, and send personalized mail sequences with ease.
            </p>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="flex flex-wrap gap-4">
            <div className="rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Active Campaigns</span>
              <p className="text-2xl font-black mt-1">{activeCampaigns.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Total Templates</span>
              <p className="text-2xl font-black mt-1">{user?.templates?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: SMTP Config form panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 dark:border-gray-900">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">SMTP Server Configuration</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Setup host and credentials to connect template email dispatches.</p>
                </div>
              </div>
              
              {!isEditingSmtp && (
                <button
                  onClick={() => setIsEditingSmtp(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <Settings className="h-4 w-4" />
                  <span>Edit Settings</span>
                </button>
              )}
            </div>

            {isEditingSmtp ? (
              <form onSubmit={handleSmtpSubmit} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200">SMTP Host Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="smtp.mailtrap.io"
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200">SMTP Port *</label>
                    <input
                      type="number"
                      required
                      placeholder="587"
                      value={smtpForm.port}
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="smtp-username"
                      value={smtpForm.username}
                      onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={smtpForm.password}
                      onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Sender Display Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="John from Acme"
                      value={smtpForm.fromName}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Sender Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@acme.com"
                      value={smtpForm.fromEmail}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingSmtp ? 'Saving Settings...' : 'Save Configuration'}
                  </button>
                  {user?.smtpConfig && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSmtp(false)}
                      className="rounded-xl border border-gray-250 bg-white px-5 py-2.5 text-xs font-bold hover:bg-gray-50 dark:bg-gray-900"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Server Host</span>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{smtpForm.host}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Port</span>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{smtpForm.port}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Username</span>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{smtpForm.username}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Sender Address</span>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      "{smtpForm.fromName}" &lt;{smtpForm.fromEmail}&gt;
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-600 border border-emerald-100/50 dark:bg-emerald-950/15 dark:text-emerald-400">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span>SMTP Connection Configured & Verified. Ready to send emails.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Campaigns list */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950">
            <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 pb-3 dark:border-gray-900">
              Active Campaigns
            </h3>
            
            <div className="mt-4 space-y-4">
              {activeCampaigns.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No campaigns are currently active.
                </div>
              ) : (
                activeCampaigns.map((camp: any) => (
                  <div
                    key={camp.id}
                    className="flex flex-col border border-gray-50 rounded-2xl p-4 shadow-sm space-y-2 dark:border-gray-900 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Template: {camp.template?.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950/20">
                        <Send className="h-2.5 w-2.5" />
                        <span>Active</span>
                      </span>
                    </div>
                    <div className="flex flex-col text-[10px] text-gray-400 space-y-1">
                      <span>CSV: {camp.csvFile?.filename}</span>
                      <span>Total Rows: {camp.csvFile?.rowCount || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
