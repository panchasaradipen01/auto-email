import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import storageInstance from '@/lib/storage';
import { parseCSV } from '@/lib/csv/parser';
import { hashCsvContent } from '@/utils/csvHasher';
import { isValidMimeType, validateCSVStructure, stripBOM } from '@/lib/csv/validator';

export async function POST(req: Request) {
  try {
    // Verify session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Size check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds the 10MB limit' }, { status: 400 });
    }

    // MIME type check
    const mimeType = file.type || 'text/csv';
    if (!isValidMimeType(mimeType)) {
      return NextResponse.json(
        { error: `Invalid file format: ${mimeType}. Only CSV files are supported.` },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const rawContent = fileBuffer.toString('utf-8');
    const cleanContent = stripBOM(rawContent);

    // Parse CSV to validate structure
    const parseResult = await parseCSV(cleanContent);
    const validation = validateCSVStructure(parseResult.data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `CSV validation failed: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if duplicate file already uploaded (via file content hash)
    const fileHash = hashCsvContent(cleanContent);
    const existingFile = await prisma.csvFile.findFirst({
      where: { userId, rowHash: fileHash },
    });

    if (existingFile) {
      return NextResponse.json(
        {
          error: 'No new rows found. This exact CSV has already been uploaded.',
          file: existingFile,
          isDuplicate: true,
        },
        { status: 409 }
      );
    }

    // Upload CSV file via active storage adapter
    const storagePath = await storageInstance.upload(fileBuffer, file.name, mimeType);

    // Save metadata in database
    const csvFile = await prisma.csvFile.create({
      data: {
        userId,
        filename: file.name,
        storagePath,
        columns: JSON.stringify(validation.columns),
        rowCount: parseResult.data.length,
        rowHash: fileHash,
        processedRows: JSON.stringify([]), // Will be filled as campaign sends emails
      },
    });

    return NextResponse.json({
      success: true,
      csvFile,
      storagePath,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'An error occurred during file upload.' },
      { status: 500 }
    );
  }
}
