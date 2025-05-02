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
        var _a;
        console.debug('[JWTRotationService] Generating new RSA key pair...');
        const key = new node_rsa_1.default({ b: 2048 });
        const newKey = {
            id: (0, uuid_1.v4)(),
            privateKey: key.exportKey('private'),
            publicKey: key.exportKey('public'),
            createdAt: Date.now(),
        };
        this.keys = [newKey, ...((_a = this.keys) !== null && _a !== void 0 ? _a : [])];
        this.removeExpiredKeys();
        console.debug('[JWTRotationService] New key generated:', {
            keyId: newKey.id,
            createdAt: new Date(newKey.createdAt).toISOString()
        });
        console.log(`JWT keys rotated successfully. Next rotation: ${new Date(newKey.createdAt + this.keyLifetime).toISOString()}`);
        return newKey;
    }
    removeExpiredKeys() {
        var _a, _b, _c, _d, _e;
        const now = Date.now();
        const beforeCount = (_b = (_a = this.keys) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
        this.keys = ((_c = this.keys) !== null && _c !== void 0 ? _c : [])
            .filter(key => key && now - key.createdAt <= this.keyLifetime)
            .slice(0, this.maxKeys);
        console.debug('[JWTRotationService] Removed expired keys:', {
            beforeCount,
            afterCount: (_e = (_d = this.keys) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0
        });
    }
    getCurrentKey() {
        var _a;
        console.debug('[JWTRotationService] Getting current key...');
        const currentKey = (_a = this.keys) === null || _a === void 0 ? void 0 : _a[0];
        if (!currentKey || Date.now() - currentKey.createdAt > this.keyLifetime) {
            console.debug('[JWTRotationService] No valid keys found or current key expired, generating new key');
            return this.addNewKey();
        }
        return currentKey;
    }
    generateToken(payload) {
        const currentKey = this.getCurrentKey();
        if (!(currentKey === null || currentKey === void 0 ? void 0 : currentKey.privateKey)) {
            throw new Error('Failed to generate token: No valid private key available');
        }
        console.debug('[JWTRotationService] Generating token with key:', { keyId: currentKey.id });
        return (0, jsonwebtoken_1.sign)({ ...payload, keyId: currentKey.id }, currentKey.privateKey, {
            expiresIn: '1h',
            algorithm: jwt_1.JWT_CONFIG.algorithm
        });
    }
    verifyToken(token) {
        var _a;
        if (!token) {
            throw new Error('Token is required');
        }
        console.debug('[JWTRotationService] Attempting to verify token');
        let lastError = null;
        for (const key of ((_a = this.keys) !== null && _a !== void 0 ? _a : [])) {
            if (!(key === null || key === void 0 ? void 0 : key.publicKey))
                continue;
            try {
                console.debug('[JWTRotationService] Trying verification with key:', { keyId: key.id });
                const decoded = (0, jsonwebtoken_1.verify)(token, key.publicKey, { algorithms: [jwt_1.JWT_CONFIG.algorithm] });
                console.debug('[JWTRotationService] Token verified successfully');
                return decoded;
            }
            catch (error) {
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
exports.jwtRotationService = new JWTRotationService();
// Add this line to execute key rotation when this file is run directly
if (require.main === module) {
    exports.jwtRotationService.getCurrentKey();
}
