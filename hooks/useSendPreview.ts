import { useMemo } from 'react';
import { renderTemplate } from '@/lib/email/templateEngine';

/**
 * Custom hook to generate a live preview of subject and body variables substitution.
 * Maps template keys to CSV values based on the active Column Mapping settings.
 */
export function useSendPreview(
  subject: string,
  body: string,
  sampleRow: Record<string, any> | null,
  columnMapping: Record<string, string>
) {
  return useMemo(() => {
    if (!sampleRow) {
      return {
        subjectPreview: subject || '',
        bodyPreview: body || '',
        errors: [],
      };
    }

    // Map CSV header values to template variable keys
    const mappedData: Record<string, any> = {};
    for (const [templateVar, mapValue] of Object.entries(columnMapping)) {
      if (!mapValue) continue;
      
      if (mapValue.startsWith('STATIC::')) {
        mappedData[templateVar] = mapValue.replace('STATIC::', '');
      } else {
        mappedData[templateVar] = sampleRow[mapValue] ?? '';
      }
    }

    // Combine mapped values with standard fields
    const contextData = {
      ...sampleRow,
      ...mappedData,
    };

    // Subject is rendered as plaintext (no HTML sanitization)
    const subjectResult = renderTemplate(subject || '', contextData, { sanitize: false });
    // Body is rendered as HTML (DOMPurify enabled)
    const bodyResult = renderTemplate(body || '', contextData, { sanitize: true });

    return {
      subjectPreview: subjectResult.rendered,
      bodyPreview: bodyResult.rendered,
      errors: Array.from(new Set([...subjectResult.errors, ...bodyResult.errors])),
    };
  }, [subject, body, sampleRow, columnMapping]);
}
