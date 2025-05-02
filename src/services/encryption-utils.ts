import * as crypto from 'crypto';

export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 12;
  private static readonly AUTH_TAG_LENGTH = 16;

  static encrypt(text: string, secretKey: string): string {
    const key = crypto.scryptSync(secretKey, 'salt', this.KEY_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, encrypted, authTag]).toString('base64');
  }

  static decrypt(encryptedText: string, secretKey: string): string {
    const key = crypto.scryptSync(secretKey, 'salt', this.KEY_LENGTH);
    const buffer = Buffer.from(encryptedText, 'base64');
    
    const iv = buffer.subarray(0, this.IV_LENGTH);
    const authTag = buffer.subarray(buffer.length - this.AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(this.IV_LENGTH, buffer.length - this.AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}