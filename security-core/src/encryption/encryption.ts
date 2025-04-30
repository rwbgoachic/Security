import CryptoJS from 'crypto-js';
import { EncryptionConfig, EncryptedData } from './types';

export class EncryptionService {
  private readonly key: string;

  constructor(config: EncryptionConfig) {
    this.key = config.key;
  }

  encrypt(data: string): EncryptedData {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(data, this.key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      data: encrypted.toString(),
      iv: iv.toString(),
    };
  }

  decrypt(encryptedData: EncryptedData): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData.data, this.key, {
      iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}