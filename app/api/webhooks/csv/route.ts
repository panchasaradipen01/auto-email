import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseCSV } from '@/lib/csv/parser';
import { diffCsvRows } from '@/lib/csv/differ';
import { hashCsvContent } from '@/utils/csvHasher';
import { addEmailJob } from '@/lib/queue/emailQueue';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { csvFileId, csvContent } = body;

    if (!csvFileId || !csvContent) {
      return NextResponse.json(
        { error: 'csvFileId and csvContent are required' },
        { status: 400 }
      );
    }

    const csvFile = await prisma.csvFile.findUnique({
      where: { id: csvFileId },
    });

    if (!csvFile) {
      return NextResponse.json({ error: 'CsvFile not found' }, { status: 404 });
    }

    // Parse the updated CSV text
    const parseResult = await parseCSV(csvContent);
    const diff = diffCsvRows(parseResult.data, (csvFile.processedRows as string[]) || []);

    if (diff.newRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new rows detected. No emails will be scheduled.',
        newRowsCount: 0,
        unchangedRowsCount: diff.unchangedRows.length,
      });
    }

    // Identify campaigns linked to this file that are ACTIVE and have autoSend enabled
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        csvFileId,
        status: 'ACTIVE',
        autoSend: true,
      },
    });

    let enqueuedCount = 0;

    for (const campaign of activeCampaigns) {
      for (const row of diff.newRows) {
        const recipientEmail = String(row[campaign.emailColumn] || '').trim();

        if (!recipientEmail || !recipientEmail.includes('@')) {
          // Immediately log as failed for invalid emails
          await prisma.emailLog.create({
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

        // Create log record in PENDING state
        const log = await prisma.emailLog.create({
          data: {
            campaignId: campaign.id,
            recipientEmail,
            rowData: JSON.stringify(row),
            status: 'PENDING',
          },
        });

        // Enqueue sending job to BullMQ
        await addEmailJob({
          logId: log.id,
          campaignId: campaign.id,
          userId: campaign.userId,
          recipientEmail,
          rowData: row,
        });

        enqueuedCount++;
      }
    }

    // Update CsvFile rowCount and rowHash in DB
    const newHash = hashCsvContent(csvContent);
    await prisma.csvFile.update({
      where: { id: csvFileId },
      data: {
        rowCount: parseResult.data.length,
        rowHash: newHash,
      },
    });

    return NextResponse.json({
      success: true,
      newRowsCount: diff.newRows.length,
      triggeredCampaignsCount: activeCampaigns.length,
      enqueuedJobsCount: enqueuedCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
