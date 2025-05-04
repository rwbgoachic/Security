import { Transform, TransformCallback } from 'stream';
import { EncryptionUtils } from './encryption-utils';

interface AuditEvent {
  timestamp: string;
  action: string;
  userId?: string;
  details: object;
  severity: 'info' | 'warning' | 'error';
  source: string;
  correlationId?: string;
}

export class AuditStream extends Transform {
  private buffer: string = '';
  private readonly secretKey: string;
  private readonly source: string;

  constructor(options: { secretKey: string; source: string }) {
    super({ objectMode: true });
    this.secretKey = options.secretKey;
    this.source = options.source;
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    try {
      const event: AuditEvent = {
        timestamp: new Date().toISOString(),
        action: chunk.action,
        userId: chunk.userId,
        details: chunk.details || {},
        severity: chunk.severity || 'info',
        source: this.source,
        correlationId: chunk.correlationId
      };

      const encryptedEvent = EncryptionUtils.encrypt(
        JSON.stringify(event),
        this.secretKey
      );

      this.push({
        log: encryptedEvent,
        severity: event.severity,
        source: this.source,
        correlationId: event.correlationId
      });

      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error('Unknown error in audit stream'));
    }
  }

  _flush(callback: TransformCallback): void {
    if (this.buffer) {
      try {
        const event: AuditEvent = JSON.parse(this.buffer);
        const encryptedEvent = EncryptionUtils.encrypt(
          JSON.stringify(event),
          this.secretKey
        );

        this.push({
          log: encryptedEvent,
          severity: event.severity,
          source: this.source,
          correlationId: event.correlationId
        });
      } catch (error) {
        callback(error instanceof Error ? error : new Error('Error flushing audit stream'));
        return;
      }
    }
    callback();
  }
}