export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface AuditConfig {
  storageType: 'memory' | 'file' | 'database';
  storagePath?: string;
}