import storageInstance from '@/lib/storage';

export interface EmailAttachmentInput {
  filename: string;
  storagePath: string;
  mimeType: string;
}

export interface NodemailerAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

/**
 * Streams/retrieves an attachment from the active storage adapter and formats it for Nodemailer.
 */
export async function resolveAttachment(
  attachment: EmailAttachmentInput
): Promise<NodemailerAttachment> {
  try {
    const fileBuffer = await storageInstance.get(attachment.storagePath);
    return {
      filename: attachment.filename,
      content: fileBuffer,
      contentType: attachment.mimeType,
    };
  } catch (err: any) {
    throw new Error(`Failed to resolve attachment "${attachment.filename}" from storage: ${err.message}`);
  }
}

/**
 * Utility to resolve multiple attachments in parallel.
 */
export async function resolveAttachments(
  attachments: EmailAttachmentInput[]
): Promise<NodemailerAttachment[]> {
  if (!attachments || attachments.length === 0) {
    return [];
  }
  return Promise.all(attachments.map((att) => resolveAttachment(att)));
}
