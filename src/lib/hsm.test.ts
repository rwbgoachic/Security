import { describe, it, expect } from 'vitest';
import { HSM } from './hsm';

describe('HSM Encryption', () => {
  const testKey = 'd41d8cd98f00b204e9800998ecf8427e';
  
  it('should encrypt and decrypt data correctly', async () => {
    const testData = 'Hello, World!';
    
    const encrypted = await HSM.encrypt(testData, testKey);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    
    const decrypted = await HSM.decrypt(encrypted, testKey);
    expect(decrypted).toBe(testData);
  });

  it('should handle empty strings', async () => {
    const testData = '';
    
    const encrypted = await HSM.encrypt(testData, testKey);
    const decrypted = await HSM.decrypt(encrypted, testKey);
    expect(decrypted).toBe(testData);
  });

  it('should handle JSON data', async () => {
    const testData = JSON.stringify({ test: 'data', number: 123 });
    
    const encrypted = await HSM.encrypt(testData, testKey);
    const decrypted = await HSM.decrypt(encrypted, testKey);
    expect(decrypted).toBe(testData);
    
    const parsed = JSON.parse(decrypted);
    expect(parsed).toEqual({ test: 'data', number: 123 });
  });

  it('should throw error on invalid encrypted data', async () => {
    await expect(HSM.decrypt('invalid-data', testKey))
      .rejects
      .toThrow('Invalid encrypted data: too short');
  });

  it('should throw error on empty encrypted data', async () => {
    await expect(HSM.decrypt('', testKey))
      .rejects
      .toThrow('Invalid encrypted data: too short');
  });

  it('should throw error on null encrypted data', async () => {
    await expect(HSM.decrypt(null as unknown as string, testKey))
      .rejects
      .toThrow('Invalid encrypted data: too short');
  });
});