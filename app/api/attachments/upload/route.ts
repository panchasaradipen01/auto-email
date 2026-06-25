import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import storageInstance from '@/lib/storage';

/**
 * REST endpoint to process and store single email template file attachments.
 * Enforces a 10MB size limit and saves files using the active storage adapter.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Enforce 10MB individual file size limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds individual 10MB limit.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Save file via active storage adapter
    const storagePath = await storageInstance.upload(buffer, file.name, file.type || 'application/octet-stream');

    // Create an un-linked Attachment row in the database (will be connected on Template save)
    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        storagePath,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      },
    });

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to upload attachment.' },
      { status: 500 }
    );
  }
}
