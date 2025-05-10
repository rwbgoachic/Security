import { EncryptionUtils } from './encryption-utils';
import { createHash } from 'crypto';

interface AuditLog {
  timestamp: string;
  action: string;
  userId?: string;
  details: object;
  severity: 'info' | 'warning' | 'error';
  source: string;
  correlationId?: string;
  hash?: string;
  previousHash?: string;
}

export class AuditLogger {
  private static readonly secretKey = process.env.AUDIT_ENCRYPTION_KEY || 'default-key';
  private static readonly source = 'payment-service';
  private static readonly PII_FIELDS = ['email', 'phone', 'address', 'name', 'ssn', 'creditCard'];
  private static lastHash: string | null = null;

  private static hashLog(log: AuditLog): string {
    const hash = createHash('sha256');
    const dataToHash = JSON.stringify({
      timestamp: log.timestamp,
      action: log.action,
      userId: log.userId,
      details: log.details,
      severity: log.severity,
      source: log.source,
      correlationId: log.correlationId,
      previousHash: log.previousHash
    });
    hash.update(dataToHash);
    return hash.digest('hex');
  }

  private static redactPII(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactPII(item));
    }

    const redacted = { ...obj };
    for (const key in redacted) {
      if (this.PII_FIELDS.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'string') {
        // Redact credit card numbers
        redacted[key] = redacted[key].replace(/(\d{4}-\d{4}-\d{4})-\d{4}/g, '$1-****');
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = this.redactPII(redacted[key]);
      }
    }
    return redacted;
  }

  static async log(
    action: string, 
    userId: string | undefined, 
    details: object,
    severity: 'info' | 'warning' | 'error' = 'info',
    correlationId?: string
  ): Promise<void> {
    const auditLog: AuditLog = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details: this.redactPII(details),
      severity,
      source: this.source,
      correlationId,
      previousHash: this.lastHash
    };

    // Generate hash including the previous hash for chain linking
    auditLog.hash = this.hashLog(auditLog);
    this.lastHash = auditLog.hash;

    const encryptedLog = EncryptionUtils.encrypt(
      JSON.stringify(auditLog),
      this.secretKey
    );

    try {
      const response = await fetch(`${process.env.AUDIT_SERVICE_URL}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUDIT_SERVICE_TOKEN}`,
          'X-Correlation-ID': correlationId || '',
          'X-Log-Hash': auditLog.hash,
          'X-Previous-Hash': auditLog.previousHash || '',
        },
        body: JSON.stringify({ 
          log: encryptedLog,
          severity,
          source: this.source
        }),
      });

      if (!response.ok) {
        throw new Error(`Audit log failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send audit log:', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw - we don't want audit logging to break the main flow
    }
  }
}