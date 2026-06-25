import { hashRow, hashCsvContent } from '@/utils/csvHasher';

describe('CSV Hashing Utility Tests', () => {
  it('should generate the same hash for rows with different column ordering', () => {
    const rowA = {
      first_name: 'John',
      email: 'john@example.com',
      company: 'Acme Corp',
    };
    
    const rowB = {
      email: 'john@example.com',
      company: 'Acme Corp',
      first_name: 'John',
    };

    expect(hashRow(rowA)).toBe(hashRow(rowB));
  });

  it('should trim surrounding whitespace from keys and values before hashing', () => {
    const rowA = {
      ' first_name  ': 'John  ',
      'email': ' john@example.com ',
      '  company ': 'Acme Corp',
    };

    const rowB = {
      first_name: 'John',
      email: 'john@example.com',
      company: 'Acme Corp',
    };

    expect(hashRow(rowA)).toBe(hashRow(rowB));
  });

  it('should normalize file strings including stripping BOM and converting CRLF -> LF', () => {
    const csvContentA = '\uFEFFname,email\r\nJohn,john@example.com\r\n';
    const csvContentB = 'name,email\nJohn,john@example.com';

    expect(hashCsvContent(csvContentA)).toBe(hashCsvContent(csvContentB));
  });
});
