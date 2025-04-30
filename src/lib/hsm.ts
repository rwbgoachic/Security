import { fromByteArray, toByteArray } from 'base64-js';

export class HSM {
  private static async generateKey(key: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private static async getIV(): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  static async encrypt(data: string, key: string): Promise<string> {
    try {
      const cryptoKey = await this.generateKey(key);
      const iv = await this.getIV();
      const encodedData = new TextEncoder().encode(data);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        cryptoKey,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64 for transmission
      return fromByteArray(combined);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static async decrypt(encryptedData: string, key: string): Promise<string> {
    try {
      // Validate minimum length (12 bytes for IV + at least 1 byte of data)
      if (!encryptedData || encryptedData.length < 24) {
        throw new Error('Invalid encrypted data: too short');
      }

      const combined = toByteArray(encryptedData);
      
      // Validate decoded data length
      if (combined.length < 13) { // 12 bytes IV + at least 1 byte data
        throw new Error('Invalid encrypted data: insufficient length after decoding');
      }
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const cryptoKey = await this.generateKey(key);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        cryptoKey,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      if (error instanceof Error && error.message.startsWith('Invalid encrypted data:')) {
        throw error;
      }
      throw new Error('Failed to decrypt data');
    }
  }
}