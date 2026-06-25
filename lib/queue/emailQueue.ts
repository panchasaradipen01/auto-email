import { Queue } from 'bullmq';
import redis from '@/lib/redis';

export interface EmailJobData {
  logId: string;
  campaignId: string;
  userId: string;
  recipientEmail: string;
  rowData: Record<string, any>;
}

export const EMAIL_QUEUE_NAME = 'email-dispatch-queue';

// BullMQ Queue setup with Redis connection
export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential-backoff-custom',
      delay: 120000, // Starting at 2 minutes
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/**
 * Enqueues an email sending job.
 */
export async function addEmailJob(data: EmailJobData) {
  return await emailQueue.add(`job-${data.logId}` as any, data, {
    // Unique jobId to prevent scheduling the same log twice
    jobId: data.logId,
  });
}
