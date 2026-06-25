'use client';

import { CheckCircle2, XCircle, Clock, Percent, ShieldAlert } from 'lucide-react';

interface CampaignStatsProps {
  total: number;
  pending: number;
  queued: number;
  sent: number;
  failed: number;
  bounced: number;
}

export default function CampaignStats({
  total = 0,
  pending = 0,
  queued = 0,
  sent = 0,
  failed = 0,
  bounced = 0,
}: CampaignStatsProps) {
  const processed = sent + failed + bounced;
  const progressPercent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const successPercent = processed > 0 ? Math.round((sent / processed) * 100) : 0;

  // Calculate SVG stroke offset for progress ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">Campaign Execution Analytics</h3>
          <p className="text-xs text-gray-500 mt-1">Real-time status overview of mail dispatch logs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Ring Chart */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative h-32 w-32">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                className="text-gray-100 dark:text-gray-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="50"
                cy="50"
              />
              {/* Progress Ring */}
              <circle
                className="text-indigo-600 transition-all duration-500 dark:text-indigo-400"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {progressPercent}%
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Processed
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-500 mt-3 font-semibold">
            {processed} of {total} rows completed
          </span>
        </div>

        {/* Stats breakdown grid */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {/* Sent stats */}
          <div className="rounded-2xl border border-emerald-50 bg-emerald-50/10 p-4 dark:border-emerald-950/20 dark:bg-emerald-950/5">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-450">Sent</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1.5">{sent}</p>
          </div>

          {/* Failed stats */}
          <div className="rounded-2xl border border-rose-50 bg-rose-50/10 p-4 dark:border-rose-950/20 dark:bg-rose-950/5">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-450">Failed</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1.5">{failed}</p>
          </div>

          {/* Pending stats */}
          <div className="rounded-2xl border border-amber-50 bg-amber-50/10 p-4 dark:border-amber-950/20 dark:bg-amber-950/5">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-450">Pending / Queued</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1.5">{pending + queued}</p>
          </div>

          {/* Success rate stats */}
          <div className="rounded-2xl border border-indigo-50 bg-indigo-50/10 p-4 dark:border-indigo-950/20 dark:bg-indigo-950/5">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <Percent className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-450">Success Rate</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1.5">{successPercent}%</p>
          </div>
        </div>
      </div>

      {/* Warning message if bounces detected */}
      {bounced > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 p-4 rounded-2xl text-xs text-amber-700 dark:bg-amber-950/10 dark:text-amber-450 border border-amber-100/50">
          <ShieldAlert className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold block mb-0.5">Bounce Rate Attention:</span>
            <span>{bounced} emails bounced back from recipient servers. This might harm your sender reputation. Please clean your list.</span>
          </div>
        </div>
      )}
    </div>
  );
}
