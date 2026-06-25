import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML input using DOMPurify (isomorphic) to prevent XSS.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'span', 'div', 'a', 'img', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'blockquote', 'code', 'pre', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'style', 'class', 'id', 'align', 'valign']
  });
}
