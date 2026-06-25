import { encrypt, decrypt } from '@/utils/encryption';

describe('Encryption Utility Tests', () => {
  beforeAll(() => {
    // Set a dummy encryption key for test executions
    process.env.SMTP_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  it('should correctly encrypt and decrypt a password string', () => {
    const originalText = 'my-super-secret-smtp-password-123456';
    const encrypted = encrypt(originalText);
    
    expect(encrypted).not.toBe(originalText);
    expect(encrypted.split(':')).toHaveLength(3); // Should be iv:authTag:ciphertext

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should throw an error when attempting to decrypt invalid format', () => {
    expect(() => decrypt('invalid-format')).toThrow('Invalid encrypted password format');
  });

  it('should throw an error when ciphertext is tampered with', () => {
    const originalText = 'securePass';
    const encrypted = encrypt(originalText);
    
    // Tamper with the ciphertext segment (third element in split array)
    const parts = encrypted.split(':');
    parts[2] = parts[2].replace(/[0-9a-f]/i, 'g'); // Introduce non-hex chars or alter hex values
    const tampered = parts.join(':');

    expect(() => decrypt(tampered)).toThrow();
  });
});
