import { sign, verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWT_CONFIG } from '../config/jwt';
import NodeRSA from 'node-rsa';

interface JWTKey {
  id: string;
  privateKey: string;
  publicKey: string;
  createdAt: number;
}

class JWTRotationService {
  private keys: JWTKey[] = [];
  private readonly keyLifetime: number;
  private readonly maxKeys: number;

  constructor(keyLifetime = JWT_CONFIG.rotationHours * 60 * 60 * 1000, maxKeys = 2) {
    this.keyLifetime = keyLifetime;
    this.maxKeys = maxKeys;
    console.debug('[JWTRotationService] Initializing with settings:', { keyLifetime, maxKeys });
    this.addNewKey();
  }

  private addNewKey(): void {
    console.debug('[JWTRotationService] Generating new RSA key pair...');
    const key = new NodeRSA({b: 2048});
    const newKey: JWTKey = {
      id: uuidv4(),
      privateKey: key.exportKey('private'),
      publicKey: key.exportKey('public'),
      createdAt: Date.now(),
    };
    this.keys.unshift(newKey);
    this.removeExpiredKeys();
    console.debug('[JWTRotationService] New key generated:', { 
      keyId: newKey.id, 
      createdAt: new Date(newKey.createdAt).toISOString() 
    });
    console.log(`JWT keys rotated successfully. Next rotation: ${new Date(newKey.createdAt + this.keyLifetime).toISOString()}`);
  }

  private removeExpiredKeys(): void {
    const now = Date.now();
    const beforeCount = this.keys.length;
    this.keys = this.keys
      .filter(key => now - key.createdAt <= this.keyLifetime)
      .slice(0, this.maxKeys);
    console.debug('[JWTRotationService] Removed expired keys:', { 
      beforeCount, 
      afterCount: this.keys.length 
    });
  }

  private getCurrentKey(): JWTKey {
    console.debug('[JWTRotationService] Getting current key...');
    if (this.keys.length === 0 || Date.now() - this.keys[0].createdAt > this.keyLifetime) {
      console.debug('[JWTRotationService] No valid keys found or current key expired, generating new key');
      this.addNewKey();
    }
    return this.keys[0];
  }

  generateToken(payload: object): string {
    const currentKey = this.getCurrentKey();
    console.debug('[JWTRotationService] Generating token with key:', { keyId: currentKey.id });
    return sign(
      { ...payload, keyId: currentKey.id },
      currentKey.privateKey,
      { 
        expiresIn: '1h',
        algorithm: JWT_CONFIG.algorithm
      }
    );
  }

  verifyToken(token: string): any {
    console.debug('[JWTRotationService] Attempting to verify token');
    let lastError = null;

    for (const key of this.keys) {
      try {
        console.debug('[JWTRotationService] Trying verification with key:', { keyId: key.id });
        const decoded = verify(token, key.publicKey, { algorithms: [JWT_CONFIG.algorithm] });
        console.debug('[JWTRotationService] Token verified successfully');
        return decoded;
      } catch (error) {
        console.debug('[JWTRotationService] Verification failed with key:', { 
          keyId: key.id, 
          error: error.message 
        });
        lastError = error;
      }
    }

    console.debug('[JWTRotationService] Token verification failed with all keys');
    throw lastError || new Error('Invalid token');
  }
}

export const jwtRotationService = new JWTRotationService();

// Add this line to execute key rotation when this file is run directly
if (require.main === module) {
  jwtRotationService.getCurrentKey();
}