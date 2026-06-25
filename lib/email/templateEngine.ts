import { sanitizeHtml } from '@/utils/sanitizer';
import {
  VARIABLE_REGEX,
  CONDITIONAL_REGEX,
  extractVariableNames,
  validateTemplateSyntax,
} from '@/utils/variableParser';

interface RenderResult {
  rendered: string;
  errors: string[];
}

/**
 * Normalizes keys of data to lower-case and trimmed strings to support case-insensitive lookups.
 */
function normalizeData(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    normalized[key.trim().toLowerCase()] = data[key];
  }
  return normalized;
}

/**
 * Interpolates variables and resolves conditionals within a template.
 * @param template HTML or plain text template containing {{variable}} or {{#if var}}...{{/if}}
 * @param rawData Row data values for interpolation
 * @param options Custom rendering settings (e.g. enable XSS sanitization)
 */
export function renderTemplate(
  template: string,
  rawData: Record<string, any>,
  options: { sanitize?: boolean } = { sanitize: true }
): RenderResult {
  const errors: string[] = [];
  const normalizedData = normalizeData(rawData);

  // First, check basic brace syntax errors
  const syntaxWarnings = validateTemplateSyntax(template);
  errors.push(...syntaxWarnings);

  let result = template;

  // 1. Resolve conditional blocks: {{#if variable}}...{{/if}}
  // OPTIMIZATION: We perform a single-pass O(N) replacement using the global regex flag.
  // This avoids CPU-heavy nested while-loops on large templates. Note: Nested conditionals are not currently supported.
  result = result.replace(CONDITIONAL_REGEX, (_, varName, innerContent) => {
    const normalizedVar = varName.trim().toLowerCase();
    const value = normalizedData[normalizedVar];
    
    // Determine truthiness: defined, not null, not empty string, not false
    const isTruthy = 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      value !== false && 
      String(value).toLowerCase() !== 'false';

    return isTruthy ? innerContent : '';
  });

  // 2. Resolve simple variables and fallbacks: {{variable}} or {{variable | fallback}}
  result = result.replace(VARIABLE_REGEX, (match, varName, fallback) => {
    const trimmedVar = varName.trim();
    const normalizedVar = trimmedVar.toLowerCase();
    
    // Skip if it looks like a conditional token that got matched mistakenly
    if (trimmedVar.startsWith('#if') || trimmedVar.startsWith('/if')) {
      return match;
    }

    let value = normalizedData[normalizedVar];

    if (value === undefined || value === null || String(value).trim() === '') {
      if (fallback !== undefined) {
        value = fallback.trim();
      } else {
        errors.push(`Missing value for template variable: ${trimmedVar}`);
        value = ''; // Fallback to empty string for safety
      }
    }

    const valueStr = String(value);
    
    // Sanitize the value if requested (e.g., body contains HTML)
    return options.sanitize ? sanitizeHtml(valueStr) : valueStr;
  });

  return {
    rendered: result,
    errors,
  };
}

/**
 * Validates whether all extracted template variables are present in the dataset.
 */
export function validateVariables(
  template: string,
  rawData: Record<string, any>
): string[] {
  const requiredVars = extractVariableNames(template);
  const normalizedData = normalizeData(rawData);
  const missing: string[] = [];

  for (const reqVar of requiredVars) {
    const value = normalizedData[reqVar.toLowerCase()];
    if (value === undefined || value === null || String(value).trim() === '') {
      missing.push(reqVar);
    }
  }

  return missing;
}
