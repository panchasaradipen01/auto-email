/**
 * Regular expression to match simple variable tokens, with optional fallback value.
 * Group 1: variable name
 * Group 2: optional fallback content (after the '|')
 * Example: {{ company_name | Google }}
 */
export const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_-]+)(?:\s*\|\s*([^}]+))?\s*\}\}/gi;

/**
 * Regular expression to match conditional blocks.
 * Group 1: conditional variable name
 * Group 2: content block to render if truthy
 * Example: {{#if discount}}Get 20% off!{{/if}}
 */
export const CONDITIONAL_REGEX = /\{\{#if\s+([a-zA-Z0-9_-]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/gi;

/**
 * Extracts all unique variable names from a template string (subject or body).
 * Captures variables from simple tokens, fallbacks, and conditional block checks.
 */
export function extractVariableNames(template: string): string[] {
  const variables = new Set<string>();

  // Extract from simple variables and fallbacks
  let match;
  // Reset regex state since it's global
  VARIABLE_REGEX.lastIndex = 0;
  while ((match = VARIABLE_REGEX.exec(template)) !== null) {
    const varName = match[1].trim();
    if (varName && !varName.startsWith('#if') && !varName.startsWith('/if')) {
      variables.add(varName);
    }
  }

  // Extract from conditional blocks
  CONDITIONAL_REGEX.lastIndex = 0;
  while ((match = CONDITIONAL_REGEX.exec(template)) !== null) {
    const varName = match[1].trim();
    if (varName) {
      variables.add(varName);
    }
  }

  return Array.from(variables);
}

/**
 * Checks for syntax issues like nested braces (e.g. {{ {{var}} }}) or empty double braces {{}}.
 * Returns a list of validation/syntax warning strings.
 */
export function validateTemplateSyntax(template: string): string[] {
  const errors: string[] = [];

  // Check for empty braces
  if (/\{\{\s*\}\}/.test(template)) {
    errors.push('Found empty template variable: {{}}');
  }

  // Check for nested braces
  if (/\{\{[^{}]*\{\{/.test(template) || /\}\}[^{}]*\}\}/.test(template)) {
    errors.push('Found nested or malformed braces in template');
  }

  // Check for unclosed braces or single braces
  // If there are mismatched {{ or }}
  const openCount = (template.match(/\{\{/g) || []).length;
  const closeCount = (template.match(/\}\}/g) || []).length;
  if (openCount !== closeCount) {
    errors.push(`Mismatched braces count: found ${openCount} opening '{{' and ${closeCount} closing '}}'`);
  }

  // Check for unclosed #if blocks
  const ifMatches = template.match(/\{\{#if/gi) || [];
  const endIfMatches = template.match(/\{\{\/if/gi) || [];
  if (ifMatches.length !== endIfMatches.length) {
    errors.push(`Mismatched conditional blocks: found ${ifMatches.length} '{{#if}}' and ${endIfMatches.length} '{{/if}}'`);
  }

  return errors;
}
