import { AuditLog, AuditConfig } from './types';

export class AuditService {
  private logs: AuditLog[] = [];

  constructor(private readonly config: AuditConfig) {}

  async log(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      userId,
      action,
      resource,
      details,
      timestamp: new Date(),
    };

    this.logs.push(auditLog);

    // In a real implementation, this would persist to the configured storage
    if (this.config.storageType === 'file' && this.config.storagePath) {
      // Implementation for file storage
    }
  }

  async getLogs(userId?: string): Promise<AuditLog[]> {
    if (userId) {
      return this.logs.filter(log => log.userId === userId);
    }
    return this.logs;
  }
}