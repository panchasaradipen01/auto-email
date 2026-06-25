import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageAdapter } from './index';

export class S3StorageAdapter implements StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_BUCKET_NAME || '';
    
    // Instantiates client using environment credentials or default fallback
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret',
      },
    });
  }

  async upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${sanitizedFilename}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueKey,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    );

    return uniqueKey;
  }

  async get(storagePath: string): Promise<Buffer> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
      })
    );

    if (!response.Body) {
      throw new Error(`Empty body returned from S3 for key: ${storagePath}`);
    }

    const chunks: Buffer[] = [];
    const bodyStream = response.Body as any;
    
    for await (const chunk of bodyStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  }

  async delete(storagePath: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
      })
    );
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storagePath,
    });
    
    // Generate S3 presigned URL expiring in 60 minutes
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
