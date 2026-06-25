import { extractVariableNames, validateTemplateSyntax } from '@/utils/variableParser';

describe('Variable Parser Utility Tests', () => {
  describe('extractVariableNames', () => {
    it('should extract simple variables', () => {
      const template = 'Hello {{name}}, welcome to {{company}}!';
      const result = extractVariableNames(template);
      expect(result).toContain('name');
      expect(result).toContain('company');
      expect(result).toHaveLength(2);
    });

    it('should extract variables with fallbacks and trim whitespaces', () => {
      const template = 'Dear {{ name | Friend }}, see you at {{ event_name | our annual gala }}';
      const result = extractVariableNames(template);
      expect(result).toContain('name');
      expect(result).toContain('event_name');
      expect(result).toHaveLength(2);
    });

    it('should extract variables from conditional blocks', () => {
      const template = '{{#if has_discount}}Discount: {{discount_percent}}%{{/if}}';
      const result = extractVariableNames(template);
      expect(result).toContain('has_discount');
      expect(result).toContain('discount_percent');
      expect(result).toHaveLength(2);
    });

    it('should handle duplicates and return only unique variable names', () => {
      const template = 'Hi {{name}}, is your name {{name}}? Yes, {{name | buddy}}.';
      const result = extractVariableNames(template);
      expect(result).toEqual(['name']);
    });
  });

  describe('validateTemplateSyntax', () => {
    it('should return no errors for perfectly valid syntax', () => {
      const template = 'Hello {{name}}, {{#if show_offer}}get {{offer_code | FREE}} now!{{/if}}';
      const result = validateTemplateSyntax(template);
      expect(result).toHaveLength(0);
    });

    it('should catch empty template variables', () => {
      const template = 'Hello {{}}, how are you?';
      const result = validateTemplateSyntax(template);
      expect(result).toContain('Found empty template variable: {{}}');
    });

    it('should catch nested braces', () => {
      const template = 'Hello {{ {{inner}} }}';
      const result = validateTemplateSyntax(template);
      expect(result).toContain('Found nested or malformed braces in template');
    });

    it('should catch mismatched brace counts', () => {
      const template1 = 'Hello {{name';
      const template2 = 'Hello name}}';
      expect(validateTemplateSyntax(template1)).toContain("Mismatched braces count: found 1 opening '{{' and 0 closing '}}'");
      expect(validateTemplateSyntax(template2)).toContain("Mismatched braces count: found 0 opening '{{' and 1 closing '}}'");
    });

    it('should catch mismatched conditional blocks', () => {
      const template1 = '{{#if condition}} Hello';
      const template2 = 'Hello {{/if}}';
      expect(validateTemplateSyntax(template1)).toContain("Mismatched conditional blocks: found 1 '{{#if}}' and 0 '{{/if}}'");
      expect(validateTemplateSyntax(template2)).toContain("Mismatched conditional blocks: found 0 '{{#if}}' and 1 '{{/if}}'");
    });
  });
});
