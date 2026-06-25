import { Worker, Job } from 'bullmq';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';
import { decrypt } from '@/utils/encryption';
import { renderTemplate } from '@/lib/email/templateEngine';
import { resolveAttachments } from '@/lib/email/attachmentHandler';
import nodemailer from 'nodemailer';
import { rateLimit } from '@/utils/rateLimiter';
import { EMAIL_QUEUE_NAME, EmailJobData } from './emailQueue';
import { captureException } from '@/lib/monitoring/sentry';

/**
 * Publishes real-time queue events to the Redis channel for SSE consumption.
 */
function publishSSEEvent(data: {
  logId: string;
  campaignId: string;
  recipientEmail: string;
  status: string;
  errorMessage?: string | null;
}) {
  redis.publish(
    'email-queue-events',
    JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    })
  );
}

// Instantiate the BullMQ Worker
const worker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    const { logId, campaignId, userId, recipientEmail, rowData } = job.data;

    try {
      // 1. Fetch EmailLog details
      const emailLog = await prisma.emailLog.findUnique({
        where: { id: logId },
        include: { campaign: { include: { template: { include: { attachments: true } } } } },
      });

      if (!emailLog) {
        throw new Error(`EmailLog with ID ${logId} not found.`);
      }

      const campaign = emailLog.campaign;
      if (!campaign) {
        throw new Error('Campaign not found.');
      }

      // Check if campaign is active
      if (campaign.status === 'PAUSED' || campaign.status === 'DRAFT') {
        throw new Error(`Campaign is currently ${campaign.status}. Send postponed.`);
      }

      const template = campaign.template;
      if (!template) {
        throw new Error('Template not found.');
      }

      // 2. Fetch User SMTP settings
      const smtpConfig = await prisma.smtpConfig.findUnique({
        where: { userId },
      });

      if (!smtpConfig) {
        throw new Error('SMTP Configuration is missing for this user.');
      }

      // 3. Sliding window Rate Limiter check (Max 100 emails/hour per user)
      const rateLimitCheck = await rateLimit(`email-send-limit:${userId}`, 100, 3600);
      if (!rateLimitCheck.allowed) {
        // Delay job if rate limited (retry after 2 minutes)
        throw new Error('Email rate limit reached (100 emails/hour). Job postponed.');
      }

      // Update log to QUEUED
      await prisma.emailLog.update({
        where: { id: logId },
        data: { status: 'QUEUED' },
      });
      publishSSEEvent({ logId, campaignId, recipientEmail, status: 'QUEUED' });

      // 4. Decrypt SMTP password
      let decryptedPassword = '';
      try {
        decryptedPassword = decrypt(smtpConfig.password);
      } catch (err: any) {
        throw new Error(`Failed to decrypt SMTP credentials password: ${err.message}`);
      }

      // 5. Render email template (subject + body)
      const renderSubject = renderTemplate(template.subject, rowData, { sanitize: false });
      const renderBody = renderTemplate(template.body, rowData, { sanitize: true });

      if (renderSubject.errors.length > 0 || renderBody.errors.length > 0) {
        const allErrors = [...renderSubject.errors, ...renderBody.errors].join(', ');
        throw new Error(`Template rendering errors: ${allErrors}`);
      }

      // 6. Resolve attachments from storage adapter
      const resolvedAttachments = await resolveAttachments(
        template.attachments.map((att) => ({
          filename: att.filename,
          storagePath: att.storagePath,
          mimeType: att.mimeType,
        }))
      );

      // 7. Setup Nodemailer Transporter
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465, // Use SSL/TLS for port 465
        auth: {
          user: smtpConfig.username,
          pass: decryptedPassword,
        },
        // Fast timeouts to avoid blocking worker slots
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      // 8. Execute Email Dispatch
      const info = await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
        to: recipientEmail,
        subject: renderSubject.rendered,
        html: renderBody.rendered,
        attachments: resolvedAttachments,
      });

      // 9. Update EmailLog on success
      await prisma.emailLog.update({
        where: { id: logId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          messageId: info.messageId || null,
        },
      });

      // 10. Update row hash in CsvFile to prevent future sending
      const csvFile = await prisma.csvFile.findUnique({
        where: { id: campaign.csvFileId },
      });
      if (csvFile) {
        // Calculate hash of the row
        const { hashRow } = await import('@/utils/csvHasher');
        const rHash = hashRow(rowData);
        
        const currentProcessed = (typeof csvFile.processedRows === 'string' ? JSON.parse(csvFile.processedRows) : csvFile.processedRows || []) as string[];
        const updatedProcessed = [...currentProcessed, rHash];

        await prisma.csvFile.update({
          where: { id: csvFile.id },
          data: {
            processedRows: JSON.stringify(updatedProcessed),
          },
        });
      }

      publishSSEEvent({ logId, campaignId, recipientEmail, status: 'SENT' });
    } catch (err: any) {
      const isSmtpAuthError =
        err.code === 'EAUTH' ||
        err.message.includes('Authentication') ||
        err.message.includes('Credentials');

      const isPermanentError =
        err.message.includes('Template') ||
        err.message.includes('missing') ||
        err.message.includes('not found') ||
        isSmtpAuthError;

      const currentAttempts = job.attemptsMade + 1;
      const willRetry = currentAttempts < (job.opts.attempts || 3) && !isPermanentError;

      // Update log database record
      await prisma.emailLog.update({
        where: { id: logId },
        data: {
          status: willRetry ? 'QUEUED' : 'FAILED',
          errorMessage: err.message || 'Unknown send error',
          retryCount: job.attemptsMade,
        },
      });

      publishSSEEvent({
        logId,
        campaignId,
        recipientEmail,
        status: willRetry ? 'QUEUED' : 'FAILED',
        errorMessage: err.message,
      });

      if (isPermanentError) {
        // Prevent retries for credential or missing resource issues
        await job.discard();
      }

      throw err; // Propagate error for BullMQ retry logic
    }
  },
  {
    connection: redis as any,
    concurrency: 5, // Concurrent jobs per worker
    settings: {
      backoffStrategy: (attemptsMade: number, type?: string) => {
        if (type === 'exponential-backoff-custom') {
          if (attemptsMade === 1) return 120000;  // 2 minutes
          if (attemptsMade === 2) return 600000;  // 10 minutes
          return 1800000;                         // 30 minutes
        }
        return 1000;
      },
    },
  }
);

// Worker error listeners
worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err.message);
  captureException(err, { jobId: job?.id, data: job?.data });
});

export default worker;
