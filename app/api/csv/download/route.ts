import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import storageInstance from '@/lib/storage';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileKey = searchParams.get('file');

    if (!fileKey) {
      return NextResponse.json({ error: 'File path key is required' }, { status: 400 });
    }

    const buffer = await storageInstance.get(fileKey);
    const downloadName = fileKey.includes('-') ? fileKey.substring(fileKey.lastIndexOf('-') + 1) : fileKey;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve file from storage.' }, { status: 500 });
  }
}
