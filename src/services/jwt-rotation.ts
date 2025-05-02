import { sign, verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWT_CONFIG } from '../config/jwt';

interface JWTKey {
  id: string;
  secret: string;
  createdAt: number;
}

class JWTRotationService {
  private keys: JWTKey[] = [];
  private readonly keyLifetime: number;
  private readonly maxKeys: number;

  constructor(keyLifetime = JWT_CONFIG.rotationHours * 60 * 60 * 1000, maxKeys = 2) {
    this.keyLifetime = keyLifetime;
    this.maxKeys = maxKeys;
    this.addNewKey();
  }

  private addNewKey(): void {
    const newKey: JWTKey = {
      id: uuidv4(),
      secret: uuidv4(),
      createdAt: Date.now(),
    };
    this.keys.unshift(newKey);
    this.removeExpiredKeys();
  }

  private removeExpiredKeys(): void {
    const now = Date.now();
    this.keys = this.keys
      .filter(key => now - key.createdAt <= this.keyLifetime)
      .slice(0, this.maxKeys);
  }

  private getCurrentKey(): JWTKey {
    if (this.keys.length === 0 || Date.now() - this.keys[0].createdAt > this.keyLifetime) {
      this.addNewKey();
    }
    return this.keys[0];
  }

  generateToken(payload: object): string {
    const currentKey = this.getCurrentKey();
    return sign(
      { ...payload, keyId: currentKey.id },
      currentKey.secret,
      { 
        expiresIn: '1h',
        algorithm: JWT_CONFIG.algorithm as "RS256"
      }
    );
  }

  verifyToken(token: string): any {
    let lastError = null;

    for (const key of this.keys) {
      try {
        const decoded = verify(token, key.secret, { algorithms: [JWT_CONFIG.algorithm as "RS256"] });
        return decoded;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Invalid token');
  }
}

export const jwtRotationService = new JWTRotationService();