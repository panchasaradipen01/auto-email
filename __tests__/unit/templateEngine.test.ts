import { renderTemplate, validateVariables } from '@/lib/email/templateEngine';
import { extractVariableNames, validateTemplateSyntax } from '@/utils/variableParser';

jest.mock('@/utils/sanitizer', () => ({
  sanitizeHtml: jest.fn((html: string) => {
    return html.replace(/<script>[\s\S]*?<\/script>/gi, '');
  }),
}));

describe('Template Engine Utility Tests', () => {
  describe('Variable Extraction', () => {
    it('should extract unique variables including simple, fallback, and conditional variables', () => {
      const template = 'Hi {{first_name}}, check {{ company | Acme }}. {{#if discount_code}}Code: {{discount_code}}{{/if}}';
      const extracted = extractVariableNames(template);
      
      expect(extracted).toContain('first_name');
      expect(extracted).toContain('company');
      expect(extracted).toContain('discount_code');
      expect(extracted).toHaveLength(3);
    });
  });

  describe('Template Rendering & Fallbacks', () => {
    const template = 'Hello {{name}}, welcome to {{company | Google}}!';

    it('should substitute variables correctly with case-insensitive data matching', () => {
      const result = renderTemplate(template, { NAME: 'Alice', CoMpAnY: 'Acme LLC' });
      expect(result.rendered).toBe('Hello Alice, welcome to Acme LLC!');
      expect(result.errors).toHaveLength(0);
    });

    it('should apply fallback defaults when variable values are blank or missing', () => {
      const result = renderTemplate(template, { name: 'Alice' });
      expect(result.rendered).toBe('Hello Alice, welcome to Google!');
      expect(result.errors).toHaveLength(0);
    });

    it('should register a validation error when a required variable is missing without a fallback', () => {
      const result = renderTemplate(template, { company: 'Netflix' });
      expect(result.rendered).toBe('Hello , welcome to Netflix!');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Missing value for template variable: name');
    });
  });

  describe('Conditional Blocks ({{#if}})', () => {
    const template = 'Hello{{#if is_admin}} Admin{{/if}}!';

    it('should render inner block if conditional variable is truthy', () => {
      const result = renderTemplate(template, { is_admin: true });
      expect(result.rendered).toBe('Hello Admin!');
      
      const resultString = renderTemplate(template, { is_admin: 'true' });
      expect(resultString.rendered).toBe('Hello Admin!');
    });

    it('should strip inner block if conditional variable is falsy, blank, or missing', () => {
      const resultFalse = renderTemplate(template, { is_admin: false });
      expect(resultFalse.rendered).toBe('Hello!');
      
      const resultFalsyStr = renderTemplate(template, { is_admin: 'false' });
      expect(resultFalsyStr.rendered).toBe('Hello!');

      const resultMissing = renderTemplate(template, {});
      expect(resultMissing.rendered).toBe('Hello!');
    });
  });

  describe('XSS HTML Sanitization', () => {
    it('should sanitize interpolated HTML content, blocking script tags while preserving basic formatting', () => {
      const template = '<div>{{content}}</div>';
      const xssContent = '<script>alert("malicious")</script><p>Hello <strong>World</strong></p>';
      
      const result = renderTemplate(template, { content: xssContent }, { sanitize: true });
      
      expect(result.rendered).not.toContain('<script>');
      expect(result.rendered).toContain('<p>Hello <strong>World</strong></p>');
    });

    it('should skip sanitization if explicitly bypassed (e.g. for plaintext fields like subject line)', () => {
      const template = 'Subject: {{content}}';
      const rawText = '<hello> world';
      const result = renderTemplate(template, { content: rawText }, { sanitize: false });
      expect(result.rendered).toBe('Subject: <hello> world');
    });
  });

  describe('Brace Syntax Validation', () => {
    it('should report warnings for mismatched or nested braces', () => {
      const mismatched = 'Hello {{name}';
      const nested = 'Hello {{ {{name}} }}';
      
      expect(validateTemplateSyntax(mismatched)).toHaveLength(1);
      expect(validateTemplateSyntax(nested)).toHaveLength(1);
    });
  });
});
