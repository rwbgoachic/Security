import * as crypto from 'crypto';

export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 12;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 16;

  static encrypt(text: string, secretKey: string): string {
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const key = crypto.pbkdf2Sync(secretKey, salt, 100000, this.KEY_LENGTH, 'sha512');
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([salt, iv, encrypted, authTag]).toString('base64');
  }

  static decrypt(encryptedText: string, secretKey: string): string {
    const buffer = Buffer.from(encryptedText, 'base64');
    
    const salt = buffer.subarray(0, this.SALT_LENGTH);
    const iv = buffer.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
    const authTag = buffer.subarray(buffer.length - this.AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(this.SALT_LENGTH + this.IV_LENGTH, buffer.length - this.AUTH_TAG_LENGTH);
    
    const key = crypto.pbkdf2Sync(secretKey, salt, 100000, this.KEY_LENGTH, 'sha512');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}