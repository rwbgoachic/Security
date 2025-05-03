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

  private addNewKey(force = false): JWTKey {
    console.debug('[JWTRotationService] Generating new RSA key pair...');
    const key = new NodeRSA({b: 2048});
    const newKey: JWTKey = {
      id: uuidv4(),
      privateKey: key.exportKey('private'),
      publicKey: key.exportKey('public'),
      createdAt: Date.now(),
    };
    
    this.keys = [newKey, ...(this.keys ?? [])];
    this.removeExpiredKeys();
    
    console.debug('[JWTRotationService] New key generated:', { 
      keyId: newKey.id, 
      createdAt: new Date(newKey.createdAt).toISOString() 
    });
    console.log(`[Security] Keys rotated. Next: ${new Date(newKey.createdAt + this.keyLifetime).toISOString()}`);
    
    return newKey;
  }

  private removeExpiredKeys(): void {
    const now = Date.now();
    const beforeCount = this.keys?.length ?? 0;
    
    this.keys = (this.keys ?? [])
      .filter(key => key && now - key.createdAt <= this.keyLifetime)
      .slice(0, this.maxKeys);
      
    console.debug('[JWTRotationService] Removed expired keys:', { 
      beforeCount, 
      afterCount: this.keys?.length ?? 0
    });
  }

  getCurrentKey(force = false): JWTKey {
    console.debug('[JWTRotationService] Getting current key...');
    
    const currentKey = this.keys?.[0];
    if (force || !currentKey || Date.now() - currentKey.createdAt > this.keyLifetime) {
      console.debug('[JWTRotationService] Forcing new key generation or no valid keys found');
      return this.addNewKey(force);
    }
    
    return currentKey;
  }

  generateToken(payload: object): string {
    const currentKey = this.getCurrentKey();
    if (!currentKey?.privateKey) {
      throw new Error('Failed to generate token: No valid private key available');
    }
    
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
    if (!token) {
      throw new Error('Token is required');
    }
    
    console.debug('[JWTRotationService] Attempting to verify token');
    let lastError: Error | null = null;

    for (const key of (this.keys ?? [])) {
      if (!key?.publicKey) continue;
      
      try {
        console.debug('[JWTRotationService] Trying verification with key:', { keyId: key.id });
        const decoded = verify(token, key.publicKey, { algorithms: [JWT_CONFIG.algorithm] });
        console.debug('[JWTRotationService] Token verified successfully');
        return decoded;
      } catch (error) {
        console.debug('[JWTRotationService] Verification failed with key:', { 
          keyId: key.id, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }
    }

    console.debug('[JWTRotationService] Token verification failed with all keys');
    throw lastError || new Error('Invalid token');
  }
}

export const jwtRotationService = new JWTRotationService();

// Handle force flag when running directly
if (require.main === module) {
  const force = process.argv.includes('--force');
  jwtRotationService.getCurrentKey(force);
}