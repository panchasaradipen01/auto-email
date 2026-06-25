import fs from 'fs/promises';
import path from 'path';
import { StorageAdapter } from './index';

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir = path.join(process.cwd(), 'uploads');

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(fileBuffer: Buffer, filename: string, _mimeType: string): Promise<string> {
    await this.ensureDir();
    
    // Create a safe, unique filename using timestamp and random string
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${sanitizedFilename}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    
    await fs.writeFile(filePath, fileBuffer);
    return uniqueName;
  }

  async get(storagePath: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, storagePath);
    return await fs.readFile(filePath);
  }

  async delete(storagePath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, storagePath);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    // Generates a local dashboard API endpoint to fetch/download files
    return `/api/csv/download?file=${encodeURIComponent(storagePath)}`;
  }
}
