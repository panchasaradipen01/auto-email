import { parseCSV } from '@/lib/csv/parser';
import { validateCSVStructure, isValidMimeType, stripBOM } from '@/lib/csv/validator';
import { diffCsvRows } from '@/lib/csv/differ';

describe('CSV Parser Utility Tests', () => {
  it('should successfully parse a valid CSV string into JSON rows', async () => {
    const csv = 'name,email,company\nAlice,alice@example.com,Google\nBob,bob@example.com,Microsoft';
    const result = await parseCSV(csv);

    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      company: 'Google',
    });
    expect(result.data[1]).toEqual({
      name: 'Bob',
      email: 'bob@example.com',
      company: 'Microsoft',
    });
    expect(result.errors).toHaveLength(0);
    expect(result.meta.fields).toEqual(['name', 'email', 'company']);
  });

  it('should handle skipEmptyLines option correctly', async () => {
    const csv = 'name,email\nAlice,alice@example.com\n\n\nBob,bob@example.com';
    const result = await parseCSV(csv, { skipEmptyLines: 'greedy' });

    expect(result.data).toHaveLength(2);
    expect(result.data[1].name).toBe('Bob');
  });
});

describe('CSV Validator Utility Tests', () => {
  describe('stripBOM', () => {
    it('should remove Byte Order Mark from the beginning of string', () => {
      const input = '\uFEFFname,email\nAlice,alice@example.com';
      expect(stripBOM(input)).toBe('name,email\nAlice,alice@example.com');
    });

    it('should return the original string if no BOM is present', () => {
      const input = 'name,email\nAlice,alice@example.com';
      expect(stripBOM(input)).toBe(input);
    });
  });

  describe('isValidMimeType', () => {
    it('should return true for valid CSV and plain text MIME types', () => {
      expect(isValidMimeType('text/csv')).toBe(true);
      expect(isValidMimeType('application/csv')).toBe(true);
      expect(isValidMimeType('text/plain')).toBe(true);
    });

    it('should return false for invalid MIME types', () => {
      expect(isValidMimeType('application/pdf')).toBe(false);
      expect(isValidMimeType('image/png')).toBe(false);
    });
  });

  describe('validateCSVStructure', () => {
    it('should return isValid: false if rows are empty', () => {
      const result = validateCSVStructure([]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('empty or contains no rows');
    });

    it('should return isValid: false if CSV contains only empty rows', () => {
      const result = validateCSVStructure([
        { name: '', email: '' },
        { name: '  ', email: null },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('contains only empty data rows');
    });

    it('should return isValid: true and list headers for valid rows', () => {
      const result = validateCSVStructure([
        { name: 'Alice', email: 'alice@example.com' },
      ]);
      expect(result.isValid).toBe(true);
      expect(result.columns).toEqual(['name', 'email']);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('CSV Differ Utility Tests', () => {
  it('should identify new rows versus already processed rows', () => {
    const incomingRows = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' },
    ];

    const crypto = require('crypto');
    const hashFn = (val: any) => crypto.createHash('sha256').update(JSON.stringify(val)).digest('hex');

    const aliceHash = hashFn({ email: 'alice@example.com', name: 'Alice' });
    const bobHash = hashFn({ email: 'bob@example.com', name: 'Bob' });

    const diff = diffCsvRows(incomingRows, [aliceHash, bobHash]);

    expect(diff.newRows).toHaveLength(1);
    expect(diff.newRows[0].name).toBe('Charlie');
    expect(diff.unchangedRows).toHaveLength(2);
    expect(diff.unchangedRows[0].name).toBe('Alice');
    expect(diff.unchangedRows[1].name).toBe('Bob');
    expect(diff.totalRows).toBe(3);
  });
});
