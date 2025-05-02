"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtRotationService = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const uuid_1 = require("uuid");
const jwt_1 = require("../config/jwt");
const node_rsa_1 = __importDefault(require("node-rsa"));
class JWTRotationService {
    constructor(keyLifetime = jwt_1.JWT_CONFIG.rotationHours * 60 * 60 * 1000, maxKeys = 2) {
        this.keys = [];
        this.keyLifetime = keyLifetime;
        this.maxKeys = maxKeys;
        console.debug('[JWTRotationService] Initializing with settings:', { keyLifetime, maxKeys });
        this.addNewKey();
    }
    addNewKey() {
        console.debug('[JWTRotationService] Generating new RSA key pair...');
        const key = new node_rsa_1.default({ b: 2048 });
        const newKey = {
            id: (0, uuid_1.v4)(),
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
    removeExpiredKeys() {
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
    getCurrentKey() {
        console.debug('[JWTRotationService] Getting current key...');
        if (this.keys.length === 0 || Date.now() - this.keys[0].createdAt > this.keyLifetime) {
            console.debug('[JWTRotationService] No valid keys found or current key expired, generating new key');
            this.addNewKey();
        }
        return this.keys[0];
    }
    generateToken(payload) {
        const currentKey = this.getCurrentKey();
        console.debug('[JWTRotationService] Generating token with key:', { keyId: currentKey.id });
        return (0, jsonwebtoken_1.sign)({ ...payload, keyId: currentKey.id }, currentKey.privateKey, {
            expiresIn: '1h',
            algorithm: jwt_1.JWT_CONFIG.algorithm
        });
    }
    verifyToken(token) {
        console.debug('[JWTRotationService] Attempting to verify token');
        let lastError = null;
        for (const key of this.keys) {
            try {
                console.debug('[JWTRotationService] Trying verification with key:', { keyId: key.id });
                const decoded = (0, jsonwebtoken_1.verify)(token, key.publicKey, { algorithms: [jwt_1.JWT_CONFIG.algorithm] });
                console.debug('[JWTRotationService] Token verified successfully');
                return decoded;
            }
            catch (error) {
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
exports.jwtRotationService = new JWTRotationService();
// Add this line to execute key rotation when this file is run directly
if (require.main === module) {
    exports.jwtRotationService.getCurrentKey();
}
