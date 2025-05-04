import { Transform } from 'stream';
import { createHash } from 'crypto';

interface DetectionRule {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export class IntrusionDetection extends Transform {
  private static readonly rules: DetectionRule[] = [
    {
      pattern: /SELECT.*FROM|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM/i,
      severity: 'high',
      description: 'Potential SQL injection attempt'
    },
    {
      pattern: /<script>|javascript:/i,
      severity: 'high',
      description: 'Potential XSS attempt'
    },
    {
      pattern: /\.\.|\/etc\/passwd|\/etc\/shadow/i,
      severity: 'high',
      description: 'Path traversal attempt'
    },
    {
      pattern: /eval\(|setTimeout\(|setInterval\(/i,
      severity: 'medium',
      description: 'Dangerous code execution attempt'
    }
  ];

  private buffer = '';
  private readonly requestThreshold = 100;
  private readonly timeWindow = 60000; // 1 minute
  private readonly requestCounts = new Map<string, number>();
  private readonly lastReset = new Map<string, number>();

  constructor() {
    super({ objectMode: true });
  }

  private checkRateLimiting(ip: string): boolean {
    const now = Date.now();
    const lastResetTime = this.lastReset.get(ip) || 0;
    
    if (now - lastResetTime >= this.timeWindow) {
      this.requestCounts.set(ip, 1);
      this.lastReset.set(ip, now);
      return true;
    }

    const currentCount = (this.requestCounts.get(ip) || 0) + 1;
    this.requestCounts.set(ip, currentCount);
    
    return currentCount <= this.requestThreshold;
  }

  private detectThreats(data: string): { detected: boolean; threat?: DetectionRule } {
    for (const rule of IntrusionDetection.rules) {
      if (rule.pattern.test(data)) {
        return { detected: true, threat: rule };
      }
    }
    return { detected: false };
  }

  private generateRequestHash(data: any): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  _transform(chunk: any, encoding: string, callback: Function): void {
    try {
      const requestData = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
      const requestHash = this.generateRequestHash(chunk);
      
      // Rate limiting check
      const clientIp = chunk.ip || 'unknown';
      if (!this.checkRateLimiting(clientIp)) {
        callback(new Error('Rate limit exceeded'));
        return;
      }

      // Threat detection
      const threatCheck = this.detectThreats(requestData);
      if (threatCheck.detected) {
        console.error('Security threat detected:', {
          type: threatCheck.threat?.description,
          severity: threatCheck.threat?.severity,
          requestHash,
          clientIp
        });
        callback(new Error('Security threat detected'));
        return;
      }

      this.push(chunk);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback: Function): void {
    if (this.buffer) {
      try {
        const data = JSON.parse(this.buffer);
        this.push(data);
      } catch (error) {
        callback(error);
        return;
      }
    }
    callback();
  }
}