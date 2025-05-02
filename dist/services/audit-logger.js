"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
const encryption_utils_1 = require("./encryption-utils");
class AuditLogger {
    static async log(action, userId, details) {
        const auditLog = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            details,
        };
        const encryptedLog = encryption_utils_1.EncryptionUtils.encrypt(JSON.stringify(auditLog), this.secretKey);
        try {
            const response = await fetch(`${process.env.AUDIT_SERVICE_URL}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.AUDIT_SERVICE_TOKEN}`,
                },
                body: JSON.stringify({ log: encryptedLog }),
            });
            if (!response.ok) {
                throw new Error(`Audit log failed: ${response.statusText}`);
            }
        }
        catch (error) {
            console.error('Failed to send audit log:', error instanceof Error ? error.message : 'Unknown error');
            // Don't throw - we don't want audit logging to break the main flow
        }
    }
}
exports.AuditLogger = AuditLogger;
AuditLogger.secretKey = process.env.AUDIT_ENCRYPTION_KEY || 'default-key';
