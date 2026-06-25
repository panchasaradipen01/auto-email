export interface StorageAdapter {
  /**
   * Uploads a file to the storage system and returns a unique key or path.
   */
  upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string>;

  /**
   * Retrieves the raw file buffer from storage.
   */
  get(storagePath: string): Promise<Buffer>;

  /**
   * Deletes a file from storage.
   */
  delete(storagePath: string): Promise<void>;

  /**
   * Returns a publicly accessible signed URL or a direct relative local URL path.
   */
  getSignedUrl(storagePath: string): Promise<string>;
}

import { LocalStorageAdapter } from './localAdapter';
import { S3StorageAdapter } from './s3Adapter';

const adapterType = process.env.STORAGE_ADAPTER || 'local';

let storageInstance: StorageAdapter;

if (adapterType === 's3') {
  storageInstance = new S3StorageAdapter();
} else {
  storageInstance = new LocalStorageAdapter();
}

export default storageInstance;
