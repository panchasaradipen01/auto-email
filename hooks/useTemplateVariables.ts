import { useMemo } from 'react';
import { extractVariableNames, validateTemplateSyntax } from '@/utils/variableParser';

/**
 * Custom hook to extract unique variables and syntax errors from raw template subject and body.
 */
export function useTemplateVariables(subject: string, body: string) {
  return useMemo(() => {
    const combinedTemplate = `${subject || ''} ${body || ''}`;
    const variables = extractVariableNames(combinedTemplate);
    const syntaxErrors = validateTemplateSyntax(combinedTemplate);
    
    return {
      variables,
      syntaxErrors,
      isValid: syntaxErrors.length === 0,
    };
  }, [subject, body]);
}
