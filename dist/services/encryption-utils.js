"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionUtils = void 0;
const crypto = __importStar(require("crypto"));
class EncryptionUtils {
    static encrypt(text, secretKey) {
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
    static decrypt(encryptedText, secretKey) {
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
exports.EncryptionUtils = EncryptionUtils;
EncryptionUtils.ALGORITHM = 'aes-256-gcm';
EncryptionUtils.KEY_LENGTH = 32;
EncryptionUtils.IV_LENGTH = 12;
EncryptionUtils.AUTH_TAG_LENGTH = 16;
