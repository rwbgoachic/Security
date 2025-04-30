export interface EncryptionConfig {
  key: string;
  iv?: string;
}

export interface EncryptedData {
  data: string;
  iv: string;
}