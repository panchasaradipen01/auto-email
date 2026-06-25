import { Context } from '../context';
import { encrypt } from '@/utils/encryption';
import { extractVariableNames } from '@/utils/variableParser';
import { addEmailJob } from '@/lib/queue/emailQueue';
import { parseCSV } from '@/lib/csv/parser';
import { diffCsvRows } from '@/lib/csv/differ';
import storageInstance from '@/lib/storage';

export const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: Context) => {
      if (!context.userId) return null;
      return context.prisma.user.findUnique({
        where: { id: context.userId },
      });
    },

    templates: async (_parent: any, _args: any, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      return context.prisma.template.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    template: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      return context.prisma.template.findFirst({
        where: { id, userId: context.userId },
      });
    },

    campaigns: async (_parent: any, _args: any, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      return context.prisma.campaign.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    campaign: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      return context.prisma.campaign.findFirst({
        where: { id, userId: context.userId },
      });
    },

    csvFiles: async (_parent: any, _args: any, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      return context.prisma.csvFile.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    csvFile: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      return context.prisma.csvFile.findFirst({
        where: { id, userId: context.userId },
      });
    },

    emailLogs: async (
      _parent: any,
      { campaignId, offset, limit, status, sortBy, sortOrder }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Unauthorized');
      
      const whereClause: any = {
        campaignId,
        campaign: { userId: context.userId },
      };
      
      if (status) {
        whereClause.status = status;
      }
      
      const orderByClause: any = {};
      if (sortBy) {
        orderByClause[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
      } else {
        orderByClause.createdAt = 'desc';
      }

      const [items, totalCount] = await context.prisma.$transaction([
        context.prisma.emailLog.findMany({
          where: whereClause,
          skip: offset || 0,
          take: limit || 100,
          orderBy: orderByClause,
        }),
        context.prisma.emailLog.count({
          where: whereClause,
        }),
      ]);

      return { items, totalCount };
    },

    campaignStats: async (_parent: any, { campaignId }: { campaignId: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      const counts = await context.prisma.emailLog.groupBy({
        by: ['status'],
        where: {
          campaignId,
          campaign: { userId: context.userId },
        },
        _count: {
          id: true,
        },
      });

      const stats = {
        campaignId,
        total: 0,
        pending: 0,
        queued: 0,
        sent: 0,
        failed: 0,
        bounced: 0,
      };

      for (const count of counts) {
        const value = count._count.id;
        stats.total += value;
        if (count.status === 'PENDING') stats.pending = value;
        else if (count.status === 'QUEUED') stats.queued = value;
        else if (count.status === 'SENT') stats.sent = value;
        else if (count.status === 'FAILED') stats.failed = value;
        else if (count.status === 'BOUNCED') stats.bounced = value;
      }

      return stats;
    },
  },

  Mutation: {
    saveSmtpConfig: async (
      _parent: any,
      { host, port, username, password, fromName, fromEmail }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Unauthorized');
      const encryptedPassword = encrypt(password);

      return context.prisma.smtpConfig.upsert({
        where: { userId: context.userId },
        update: { host, port, username, password: encryptedPassword, fromName, fromEmail },
        create: { userId: context.userId, host, port, username, password: encryptedPassword, fromName, fromEmail },
      });
    },

    createTemplate: async (
      _parent: any,
      { name, subject, body, attachmentIds }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Unauthorized');
      const variables = extractVariableNames(subject + ' ' + body);

      return context.prisma.template.create({
        data: {
          userId: context.userId,
          name,
          subject,
          body,
          variables: JSON.stringify(variables),
          attachments: attachmentIds
            ? {
                connect: attachmentIds.map((id: string) => ({ id })),
              }
            : undefined,
        },
      });
    },

    updateTemplate: async (
      _parent: any,
      { id, name, subject, body, attachmentIds }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Unauthorized');
      const variables = extractVariableNames((subject || '') + ' ' + (body || ''));

      return context.prisma.template.update({
        where: { id },
        data: {
          name: name ?? undefined,
          subject: subject ?? undefined,
          body: body ?? undefined,
          variables: (subject || body) ? JSON.stringify(variables) : undefined,
          attachments: attachmentIds
            ? {
                set: attachmentIds.map((attId: string) => ({ id: attId })),
              }
            : undefined,
        },
      });
    },

    deleteTemplate: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      
      // Auto-pause active campaigns depending on deleted template
      await context.prisma.campaign.updateMany({
        where: { templateId: id, status: 'ACTIVE' },
        data: { status: 'PAUSED' },
      });

      await context.prisma.template.delete({
        where: { id },
      });
      return true;
    },

    createCampaign: async (
      _parent: any,
      { templateId, csvFileId, columnMapping, emailColumn, autoSend }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Unauthorized');

      return context.prisma.campaign.create({
        data: {
          userId: context.userId,
          templateId,
          csvFileId,
          columnMapping: typeof columnMapping === 'string' ? columnMapping : JSON.stringify(columnMapping),
          emailColumn,
          status: 'DRAFT',
          autoSend,
        },
      });
    },

    updateCampaignStatus: async (
      _parent: any,
      { id, status }: { id: string; status: any },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Unauthorized');

      return context.prisma.campaign.update({
        where: { id, userId: context.userId },
        data: { status },
      });
    },

    deleteCampaign: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      await context.prisma.campaign.delete({
        where: { id, userId: context.userId },
      });
      return true;
    },

    deleteCsvFile: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');
      const file = await context.prisma.csvFile.findFirst({
        where: { id, userId: context.userId },
      });

      if (!file) throw new Error('File not found');

      // Delete from storage
      try {
        await storageInstance.delete(file.storagePath);
      } catch {
        // Ignore storage failures
      }

      await context.prisma.csvFile.delete({
        where: { id },
      });
      return true;
    },

    triggerCampaign: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');

      const campaign = await context.prisma.campaign.findFirst({
        where: { id, userId: context.userId },
        include: { csvFile: true, template: true },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update status to ACTIVE
      await context.prisma.campaign.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });

      // Fetch CSV content from storage
      const fileBuffer = await storageInstance.get(campaign.csvFile.storagePath);
      const csvText = fileBuffer.toString('utf-8');
      
      const parsed = await parseCSV(csvText);
      
      // Filter out rows already sent
      const processedRows = typeof campaign.csvFile.processedRows === 'string' 
        ? JSON.parse(campaign.csvFile.processedRows) 
        : (campaign.csvFile.processedRows || []);
      const diff = diffCsvRows(parsed.data, processedRows as string[]);

      if (diff.newRows.length === 0) {
        return true;
      }

      for (const row of diff.newRows) {
        const recipientEmail = String(row[campaign.emailColumn] || '').trim();

        if (!recipientEmail || !recipientEmail.includes('@')) {
          // Immediately fail email logs with invalid recipient emails
          await context.prisma.emailLog.create({
            data: {
              campaignId: campaign.id,
              recipientEmail: recipientEmail || 'invalid-or-blank',
              rowData: JSON.stringify(row),
              status: 'FAILED',
              errorMessage: 'invalid_email',
            },
          });
          continue;
        }

        const log = await context.prisma.emailLog.create({
          data: {
            campaignId: campaign.id,
            recipientEmail,
            rowData: JSON.stringify(row),
            status: 'PENDING',
          },
        });

        // Resolve Column Mappings for the job worker
        const mapping = (typeof campaign.columnMapping === 'string' ? JSON.parse(campaign.columnMapping) : campaign.columnMapping) as Record<string, string>;
        const mappedRowData: Record<string, any> = { ...row };
        
        for (const [templateVar, mapValue] of Object.entries(mapping || {})) {
          if (!mapValue) continue;
          if (mapValue.startsWith('STATIC::')) {
            mappedRowData[templateVar.toLowerCase()] = mapValue.replace('STATIC::', '');
          } else {
            // Include both original casing and lower casing for safety with template engine
            mappedRowData[templateVar.toLowerCase()] = row[mapValue] ?? '';
            mappedRowData[templateVar] = row[mapValue] ?? '';
          }
        }

        // Enqueue sending job to worker
        await addEmailJob({
          logId: log.id,
          campaignId: campaign.id,
          userId: context.userId,
          recipientEmail,
          rowData: mappedRowData,
        });
      }

      return true;
    },

    retryCampaign: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Unauthorized');

      const campaign = await context.prisma.campaign.findFirst({
        where: { id, userId: context.userId },
        include: { csvFile: true, template: true },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Fetch all FAILED email logs
      const failedLogs = await context.prisma.emailLog.findMany({
        where: { campaignId: id, status: 'FAILED' },
      });

      if (failedLogs.length === 0) {
        return true;
      }

      // Update their status to PENDING
      await context.prisma.emailLog.updateMany({
        where: { campaignId: id, status: 'FAILED' },
        data: { status: 'PENDING', errorMessage: null },
      });

      // Update campaign status to ACTIVE if it isn't
      if (campaign.status !== 'ACTIVE') {
        await context.prisma.campaign.update({
          where: { id },
          data: { status: 'ACTIVE' },
        });
      }

      // Resolve Column Mappings for the job worker
      const mapping = (typeof campaign.columnMapping === 'string' ? JSON.parse(campaign.columnMapping) : campaign.columnMapping) as Record<string, string>;

      // Re-enqueue all failed logs
      for (const log of failedLogs) {
        const row = typeof log.rowData === 'string' ? JSON.parse(log.rowData) : log.rowData;
        const recipientEmail = log.recipientEmail;
        const mappedRowData: Record<string, any> = { ...row };
        
        for (const [templateVar, mapValue] of Object.entries(mapping || {})) {
          if (!mapValue) continue;
          if (mapValue.startsWith('STATIC::')) {
            mappedRowData[templateVar.toLowerCase()] = mapValue.replace('STATIC::', '');
          } else {
            mappedRowData[templateVar.toLowerCase()] = row[mapValue] ?? '';
            mappedRowData[templateVar] = row[mapValue] ?? '';
          }
        }

        await addEmailJob({
          logId: log.id,
          campaignId: campaign.id,
          userId: context.userId,
          recipientEmail,
          rowData: mappedRowData,
        });
      }

      return true;
    },

    createAttachment: async (
      _parent: any,
      { filename, storagePath, mimeType, sizeBytes }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Unauthorized');
      return context.prisma.attachment.create({
        data: {
          filename,
          storagePath,
          mimeType,
          sizeBytes,
        },
      });
    }
  },

  User: {
    smtpConfig: async (user: any, _args: any, context: Context) => {
      return context.prisma.smtpConfig.findUnique({
        where: { userId: user.id },
      });
    },
    templates: async (user: any, _args: any, context: Context) => {
      return context.prisma.template.findMany({
        where: { userId: user.id },
      });
    },
    campaigns: async (user: any, _args: any, context: Context) => {
      return context.prisma.campaign.findMany({
        where: { userId: user.id },
      });
    },
    csvFiles: async (user: any, _args: any, context: Context) => {
      return context.prisma.csvFile.findMany({
        where: { userId: user.id },
      });
    },
  },

  Campaign: {
    template: async (campaign: any, _args: any, context: Context) => {
      return context.loaders.template.load(campaign.templateId);
    },
    csvFile: async (campaign: any, _args: any, context: Context) => {
      return context.loaders.csvFile.load(campaign.csvFileId);
    },
    emailLogs: async (campaign: any, _args: any, context: Context) => {
      return context.prisma.emailLog.findMany({
        where: { campaignId: campaign.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Template: {
    variables: (template: any) => {
      try {
        return typeof template.variables === 'string'
          ? JSON.parse(template.variables)
          : template.variables || [];
      } catch {
        return [];
      }
    },
    attachments: async (template: any, _args: any, context: Context) => {
      return context.prisma.attachment.findMany({
        where: { templateId: template.id },
      });
    },
  },

  CsvFile: {
    columns: (csvFile: any) => {
      try {
        return typeof csvFile.columns === 'string'
          ? JSON.parse(csvFile.columns)
          : csvFile.columns || [];
      } catch {
        return [];
      }
    },
    processedRows: (csvFile: any) => {
      try {
        return typeof csvFile.processedRows === 'string'
          ? JSON.parse(csvFile.processedRows)
          : csvFile.processedRows || [];
      } catch {
        return [];
      }
    },
  },
};
