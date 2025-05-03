import { EncryptionUtils } from './encryption-utils';

interface AuditLog {
  timestamp: string;
  action: string;
  userId?: string;
  details: object;
  severity: 'info' | 'warning' | 'error';
  source: string;
  correlationId?: string;
}

export class AuditLogger {
  private static readonly secretKey = process.env.AUDIT_ENCRYPTION_KEY || 'default-key';
  private static readonly source = 'payment-service';

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
      details,
      severity,
      source: this.source,
      correlationId
    };

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